package execution.service;

import execution.dto.response.ExerciseResponse;
import execution.exception.AppException;
import execution.exception.ErrorCode;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ExecutionFingerprintService {

    private static final String HASH_ALGORITHM = "SHA-256";

    /**
     * Tạo SHA-256 hash cho source code.
     */
    public String generateSourceCodeHash(String sourceCode) {
        if (sourceCode == null) {
            throw new AppException(ErrorCode.SOURCE_CODE_REQUIRED);
        }

        MessageDigest digest = createDigest();

        digest.update(sourceCode.getBytes(StandardCharsets.UTF_8));

        return HexFormat.of().formatHex(digest.digest());
    }

    /**
     * Tạo fingerprint cho toàn bộ testcase của bài tập.
     */
    public String generateTestcaseFingerprint(ExerciseResponse exercise) {
        if (exercise == null || exercise.getTestCases() == null || exercise.getTestCases().isEmpty()) {
            throw new AppException(ErrorCode.EXERCISE_NO_TEST_CASES);
        }

        MessageDigest digest = createDigest();

        exercise.getTestCases().forEach(testCase -> {
            updateDigest(digest, testCase.getInput());
            updateDigest(digest, testCase.getExpectedOutput());
            updateDigest(digest, Boolean.toString(testCase.isHidden()));
        });

        return HexFormat.of().formatHex(digest.digest());
    }

    private void updateDigest(MessageDigest digest, String value) {
        byte[] bytes = value == null
                ? new byte[0]
                : value.getBytes(StandardCharsets.UTF_8);

        digest.update((byte) (bytes.length >>> 24));
        digest.update((byte) (bytes.length >>> 16));
        digest.update((byte) (bytes.length >>> 8));
        digest.update((byte) bytes.length);

        digest.update(bytes);
    }

    private MessageDigest createDigest() {
        try {
            return MessageDigest.getInstance(HASH_ALGORITHM);
        } catch (NoSuchAlgorithmException e) {
            throw new AppException(ErrorCode.HASH_ALGORITHM_NOT_FOUND);
        }
    }
}