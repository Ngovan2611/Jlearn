package execution.service;

import execution.model.CodeExecutionCommand;
import execution.model.CodeExecutionResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;

@Service
@Slf4j
public class CodeExecutionService {

    private static final String DOCKER_IMAGE =
            "jlearn-java-runner:21";

    private static final int MAX_OUTPUT_SIZE =
            1024 * 1024; // 1 MB

    public CodeExecutionResult execute(
            CodeExecutionCommand command
    ) {

        if (!"JAVA".equalsIgnoreCase(command.getLanguage())) {

            return CodeExecutionResult.builder()
                    .status("SYSTEM_ERROR")
                    .stdout("")
                    .stderr("Currently only JAVA is supported.")
                    .executionTime(0)
                    .exitCode(null)
                    .build();
        }

        Path tempDirectory = null;

        long startTime =
                System.currentTimeMillis();

        ExecutorService executor =
                Executors.newFixedThreadPool(2);

        try {

            /*
             * 1. Create temporary directory
             */
            tempDirectory =
                    Files.createTempDirectory(
                            "jlearn-code-"
                    );

            /*
             * 2. Create Main.java
             */
            Path sourceFile =
                    tempDirectory.resolve(
                            "Main.java"
                    );

            Files.writeString(
                    sourceFile,
                    command.getSourceCode(),
                    StandardCharsets.UTF_8
            );

            /*
             * 3. Build Docker command
             */
            List<String> dockerCommand =
                    buildDockerCommand(
                            tempDirectory
                    );

            log.info(
                    "Executing Java code using Docker image: {}",
                    DOCKER_IMAGE
            );

            /*
             * 4. Start Docker process
             */
            ProcessBuilder processBuilder =
                    new ProcessBuilder(
                            dockerCommand
                    );

            Process process =
                    processBuilder.start();

            /*
             * 5. Send stdin
             */
            writeStdin(
                    process,
                    command.getStdin()
            );

            /*
             * 6. Read stdout/stderr concurrently
             */
            Future<String> stdoutFuture =
                    executor.submit(
                            () -> readStream(
                                    process.getInputStream()
                            )
                    );

            Future<String> stderrFuture =
                    executor.submit(
                            () -> readStream(
                                    process.getErrorStream()
                            )
                    );

            /*
             * 7. Wait for Docker process
             */
            boolean finished =
                    process.waitFor(
                            command.getTimeoutMs(),
                            TimeUnit.MILLISECONDS
                    );

            long executionTime =
                    System.currentTimeMillis()
                            - startTime;

            /*
             * 8. Timeout
             */
            if (!finished) {

                log.warn(
                        "Java execution timeout after {} ms",
                        command.getTimeoutMs()
                );

                process.destroyForcibly();

                cancelFuture(stdoutFuture);
                cancelFuture(stderrFuture);

                return CodeExecutionResult.builder()
                        .status("TIME_LIMIT_EXCEEDED")
                        .stdout("")
                        .stderr(
                                "Execution time exceeded."
                        )
                        .executionTime(
                                executionTime
                        )
                        .exitCode(null)
                        .build();
            }

            /*
             * 9. Get output
             */
            String stdout =
                    getFutureResult(
                            stdoutFuture
                    );

            String stderr =
                    getFutureResult(
                            stderrFuture
                    );

            /*
             * 10. Exit code
             */
            int exitCode =
                    process.exitValue();

            /*
             * 11. Determine status
             */
            String status =
                    determineStatus(
                            exitCode,
                            stderr
                    );

            return CodeExecutionResult.builder()
                    .status(status)
                    .stdout(stdout)
                    .stderr(stderr)
                    .executionTime(executionTime)
                    .exitCode(exitCode)
                    .build();

        } catch (Exception e) {

            log.error(
                    "Code execution failed",
                    e
            );

            return CodeExecutionResult.builder()
                    .status("SYSTEM_ERROR")
                    .stdout("")
                    .stderr(
                            e.getMessage() != null
                                    ? e.getMessage()
                                    : "Unknown system error."
                    )
                    .executionTime(
                            System.currentTimeMillis()
                                    - startTime
                    )
                    .exitCode(null)
                    .build();

        } finally {

            executor.shutdownNow();

            deleteDirectory(
                    tempDirectory
            );
        }
    }

    /**
     * Build Docker sandbox command.
     */
    /**
     * Build Docker sandbox command.
     */
    private List<String> buildDockerCommand(
            Path tempDirectory
    ) {

        List<String> command =
                new ArrayList<>();

        command.add("docker");
        command.add("run");

        /*
         * Keep STDIN open.
         *
         * Quan trọng:
         * Cho phép Java Process bên ngoài truyền
         * stdin vào Docker container.
         *
         * Nếu thiếu -i:
         *
         * React
         *   ↓
         * stdin = "5 10"
         *   ↓
         * Code Execution Service
         *   ↓
         * Docker
         *   ↓
         * ❌ Java không nhận được input
         */
        command.add("-i");

        /*
         * Automatically remove container
         */
        command.add("--rm");

        /*
         * Disable network
         */
        command.add("--network");
        command.add("none");

        /*
         * CPU limit
         */
        command.add("--cpus");
        command.add("0.5");

        /*
         * Memory limit
         */
        command.add("--memory");
        command.add("128m");

        /*
         * Process/thread limit
         */
        command.add("--pids-limit");
        command.add("64");

        /*
         * Mount source code directory
         */
        command.add("-v");

        command.add(
                tempDirectory
                        .toAbsolutePath()
                        + ":/workspace"
        );

        /*
         * Working directory
         */
        command.add("-w");
        command.add("/workspace");

        /*
         * Docker image
         */
        command.add(DOCKER_IMAGE);

        /*
         * Compile + execute
         */
        command.add("sh");
        command.add("-c");

        command.add(
                "javac Main.java && java Main"
        );

        return command;
    }
    /**
     * Send stdin to Java program.
     */
    private void writeStdin(
            Process process,
            String stdin
    ) throws IOException {

        if (stdin == null) {

            process.getOutputStream().close();

            return;
        }

        try (
                OutputStream outputStream =
                        process.getOutputStream()
        ) {

            outputStream.write(
                    stdin.getBytes(
                            StandardCharsets.UTF_8
                    )
            );

            outputStream.flush();
        }
    }

    /**
     * Read stdout/stderr.
     *
     * Output is limited to 1 MB.
     */
    private String readStream(
            InputStream inputStream
    ) throws IOException {

        byte[] buffer =
                new byte[8192];

        StringBuilder output =
                new StringBuilder();

        int totalSize = 0;

        int bytesRead;

        while (
                (bytesRead =
                        inputStream.read(buffer)) != -1
        ) {

            int remaining =
                    MAX_OUTPUT_SIZE - totalSize;

            if (remaining <= 0) {

                break;
            }

            int bytesToAppend =
                    Math.min(
                            bytesRead,
                            remaining
                    );

            output.append(
                    new String(
                            buffer,
                            0,
                            bytesToAppend,
                            StandardCharsets.UTF_8
                    )
            );

            totalSize += bytesToAppend;

            if (
                    totalSize >=
                            MAX_OUTPUT_SIZE
            ) {

                output.append(
                        "\n[Output truncated: maximum 1 MB]"
                );

                break;
            }
        }

        return output.toString();
    }

    /**
     * Get result from asynchronous output reader.
     */
    private String getFutureResult(
            Future<String> future
    ) throws ExecutionException,
            InterruptedException {

        return future.get();
    }

    /**
     * Cancel asynchronous reader.
     */
    private void cancelFuture(
            Future<String> future
    ) {

        future.cancel(true);
    }

    /**
     * Determine execution status.
     */
    private String determineStatus(
            int exitCode,
            String stderr
    ) {

        if (exitCode == 0) {

            return "SUCCESS";
        }

        if (
                stderr != null &&
                        stderr.contains("error:")
        ) {

            return "COMPILATION_ERROR";
        }

        return "RUNTIME_ERROR";
    }

    /**
     * Delete temporary directory.
     */
    private void deleteDirectory(
            Path directory
    ) {

        if (directory == null) {

            return;
        }

        try {

            Files.walk(directory)
                    .sorted(
                            (a, b) ->
                                    b.compareTo(a)
                    )
                    .forEach(path -> {

                        try {

                            Files.deleteIfExists(
                                    path
                            );

                        } catch (IOException ignored) {
                        }

                    });

        } catch (IOException ignored) {

            log.warn(
                    "Could not delete temporary directory: {}",
                    directory
            );
        }
    }
}