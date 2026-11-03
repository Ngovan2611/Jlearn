
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faPlay,
    faSpinner,
    faCircleExclamation,
    faCheck,
    faXmark,
    faClock,
    faCircleQuestion,
    faRobot,
    faBug,
} from "@fortawesome/free-solid-svg-icons";

import submissionService from "../../services/submissionService";
import exerciseService from "../../services/exerciseService";
import codeExecutionService from "../../services/codeExecutionService";
import "./Exercise.css";

/* =========================================================
   CONSTANTS
========================================================= */

const DEFAULT_CODE = `public class Main {
    public static void main(String[] args) {

    }
}`;

const SNIPPETS = {
    sout: "System.out.println();",
    psvm: `public static void main(String[] args) {

}`,
    fori: `for (int i = 0; i < ; i++) {

}`,
};

const STATUS_LABELS = {
    PASSED: "Đạt",
    WRONG_ANSWER: "Sai kết quả",
    TIME_LIMIT_EXCEEDED: "Quá thời gian",
    COMPILATION_ERROR: "Lỗi biên dịch",
    RUNTIME_ERROR: "Lỗi khi chạy",
    FAILED: "Thất bại",
    ERROR: "Lỗi",
    PENDING: "Chưa chạy",
};

const GRADING_STATUS_LABELS = {
    ACCEPTED: "Đạt",
    ACCEPT: "Đạt",
    PASSED: "Đạt",
    PENDING: "Đang chờ chấm",
    PROCESSING: "Đang xử lý",
    RUNNING: "Đang chấm",
    WAITING: "Đang chờ",
    FAILED: "Thất bại",
    REJECTED: "Không đạt",
    WRONG_ANSWER: "Sai kết quả",
    ERROR: "Lỗi",
    TIME_LIMIT_EXCEEDED: "Quá thời gian",
    MEMORY_LIMIT_EXCEEDED: "Vượt giới hạn bộ nhớ",
};

/* =========================================================
   RESPONSE HELPERS
========================================================= */

const unwrapResponse = (response) =>
    response?.data?.result ?? response?.data ?? response ?? null;

const getExerciseId = (exercise) =>
    exercise?.id ?? exercise?.exerciseId ?? exercise?._id ?? null;

const getExecutionId = (result) =>
    result?.executionId ??
    result?.execution_id ??
    result?.execution?.executionId ??
    null;

const getErrorMessage = (error, fallback) =>
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback;

const isHiddenTest = (testCase) => {
    const hidden = testCase?.hidden ?? testCase?.isHidden;

    return (
        hidden === true ||
        hidden === 1 ||
        String(hidden).toLowerCase() === "true"
    );
};

const normalizeStatus = (status) => {
    const value = String(status ?? "").trim().toUpperCase();

    if (["PASSED", "ACCEPTED", "SUCCESS"].includes(value)) {
        return "PASSED";
    }

    if (["WRONG_ANSWER", "WRONG ANSWER"].includes(value)) {
        return "WRONG_ANSWER";
    }

    if (
        ["TIME_LIMIT_EXCEEDED", "TIME LIMIT EXCEEDED", "TLE"].includes(value)
    ) {
        return "TIME_LIMIT_EXCEEDED";
    }

    if (
        ["COMPILATION_ERROR", "COMPILE_ERROR", "CE"].includes(value)
    ) {
        return "COMPILATION_ERROR";
    }

    if (
        ["RUNTIME_ERROR", "RUNTIME_EXCEPTION", "RE"].includes(value)
    ) {
        return "RUNTIME_ERROR";
    }

    if (["FAILED", "ERROR"].includes(value)) {
        return value;
    }

    return "PENDING";
};

const getStatusClass = (status) =>
    `status-${String(status || "PENDING")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")}`;

const getGradingStatusLabel = (status) => {
    const value = String(status ?? "").trim().toUpperCase();

    return GRADING_STATUS_LABELS[value] || status || "Chưa xác định";
};

const formatDateTime = (value) => {
    if (!value) return "Chưa có thông tin";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString("vi-VN");
};

const formatScore = (score) => {
    if (score === null || score === undefined || score === "") {
        return "Chưa có điểm";
    }

    return score;
};

const getResultArray = (result) => {
    if (Array.isArray(result?.testCaseResults)) {
        return result.testCaseResults;
    }

    if (Array.isArray(result?.results)) {
        return result.results;
    }

    if (Array.isArray(result?.testResults)) {
        return result.testResults;
    }

    if (Array.isArray(result?.testcases)) {
        return result.testcases;
    }

    return [];
};

const getResultNumber = (result) => {
    const value =
        result?.testCaseNumber ??
        result?.caseNumber ??
        result?.testNumber ??
        result?.testCaseIndex ??
        result?.order;

    if (value === undefined || value === null || value === "") {
        return null;
    }

    const number = Number(value);

    return Number.isFinite(number) ? number : null;
};

const getResultForTestCase = (testCase, index, results) => {
    const testCaseId =
        testCase?.testCaseId ??
        testCase?.id ??
        testCase?._id;

    if (testCaseId != null) {
        const resultById = results.find((result) => {
            const resultId =
                result?.testCaseId ??
                result?.id ??
                result?._id;

            return (
                resultId != null &&
                String(resultId) === String(testCaseId)
            );
        });

        if (resultById) {
            return resultById;
        }
    }

    const targetNumber = getResultNumber(testCase) ?? index + 1;

    const resultByNumber = results.find(
        (result) => getResultNumber(result) === targetNumber
    );

    if (resultByNumber) {
        return resultByNumber;
    }

    return results[index] ?? null;
};

/* =========================================================
   SUBMISSION HELPERS
========================================================= */

// Lấy bài nộp mới nhất từ nhiều dạng response.
const getLatestSubmission = (data) => {
    if (!data) return null;

    let submissions;

    if (Array.isArray(data)) {
        submissions = data;
    } else if (Array.isArray(data.content)) {
        submissions = data.content;
    } else if (Array.isArray(data.submissions)) {
        submissions = data.submissions;
    } else if (data.latestSubmission) {
        return data.latestSubmission;
    } else if (data.submission) {
        return data.submission;
    } else {
        return data;
    }

    if (submissions.length === 0) {
        return null;
    }

    return submissions
        .slice()
        .sort((a, b) =>
            new Date(b.submittedAt || 0) -
            new Date(a.submittedAt || 0)
        )[0];
};

// Tạo nội dung hiển thị thông tin bài nộp.
const buildSubmissionOutput = (
    submission,
    exerciseId,
    prefix = "Thông tin bài nộp"
) => {
    const submissionId =
        submission?.id ??
        submission?.submissionId ??
        submission?._id ??
        "N/A";

    const actualExerciseId =
        submission?.exerciseId ?? exerciseId ?? "N/A";

    const score = formatScore(submission?.score);

    const gradingStatus = getGradingStatusLabel(
        submission?.gradingStatus
    );


    const submittedAt = formatDateTime(submission?.submittedAt);

    const feedback =
        submission?.feedback || "Chưa có nhận xét từ hệ thống.";

    return [
        `========== ${prefix.toUpperCase()} ==========`,
        `Mã bài nộp (ID): ${submissionId}`,
        `Mã bài tập: ${actualExerciseId}`,
        `Điểm: ${score}`,
        `Trạng thái chấm: ${gradingStatus}`,
        `Thời gian nộp: ${submittedAt}`,
        "",
        "Nhận xét:",
        feedback,
        "======================================",
    ].join("\n");
};

/* =========================================================
   COMPONENT
========================================================= */

function PracticeCode() {
    const { exerciseId } = useParams();

    // Ngăn response cũ ghi đè dữ liệu mới.
    const loadRequestRef = useRef(0);

    /* =====================================================
       STATE
    ===================================================== */

    const [exercise, setExercise] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [reloadKey, setReloadKey] = useState(0);

    const [code, setCode] = useState(DEFAULT_CODE);
    const [input, setInput] = useState("");

    const [running, setRunning] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [output, setOutput] = useState("");
    const [executionResult, setExecutionResult] = useState(null);
    const [executionId, setExecutionId] = useState(null);

    /* =====================================================
       DERIVED DATA
    ===================================================== */

    const testCases = useMemo(
        () =>
            Array.isArray(exercise?.testCases)
                ? exercise.testCases
                : [],
        [exercise]
    );

    const publicTestCases = useMemo(
        () => testCases.filter((testCase) => !isHiddenTest(testCase)),
        [testCases]
    );

    const testResults = useMemo(
        () => getResultArray(executionResult),
        [executionResult]
    );

    const knownTotal = Math.max(
        testCases.length,
        Number(executionResult?.totalTestCases) || 0,
        testResults.length
    );

    const passedCount = testResults.filter(
        (result) => normalizeStatus(result?.status) === "PASSED"
    ).length;

    const allTestsPassed =
        knownTotal > 0 &&
        testResults.length >= knownTotal &&
        testResults.every(
            (result) => normalizeStatus(result?.status) === "PASSED"
        );

    // Không bắt buộc tất cả testcase phải PASS.
    // Chỉ cần lần Run hiện tại có executionId và executionResult.
    const canSubmit =
        !loading &&
        !running &&
        !submitting &&
        Boolean(executionId) &&
        Boolean(executionResult);

    /* =====================================================
       EXECUTION STATE
    ===================================================== */

    const clearExecutionResult = () => {
        setExecutionResult(null);
        setExecutionId(null);
        setOutput("");
    };

    const getFirstPublicInput = (currentExercise) => {
        const cases = Array.isArray(currentExercise?.testCases)
            ? currentExercise.testCases
            : [];

        return (
            cases.find((testCase) => !isHiddenTest(testCase))?.input ?? ""
        );
    };

    /* =====================================================
       LOAD EXERCISE + PREVIOUS SUBMISSION
    ===================================================== */

    useEffect(() => {
        let cancelled = false;

        const requestId = ++loadRequestRef.current;

        const isCurrentRequest = () =>
            !cancelled && requestId === loadRequestRef.current;

        const fetchExercise = async () => {
            setLoading(true);
            setError("");
            setExercise(null);
            setExecutionResult(null);
            setExecutionId(null);
            setOutput("");

            try {
                const response =
                    await exerciseService.getExerciseById(exerciseId);

                if (!isCurrentRequest()) return;

                const exerciseData = unwrapResponse(response);

                if (!exerciseData) {
                    throw new Error("Không tìm thấy bài tập.");
                }

                setExercise(exerciseData);

                const defaultCode =
                    exerciseData.starterCode || DEFAULT_CODE;

                setInput(getFirstPublicInput(exerciseData));

                // Lấy bài nộp gần nhất của người dùng.
                try {
                    const submissionResponse =
                        await submissionService.getMySubmissionByExercise(
                            exerciseId
                        );

                    if (!isCurrentRequest()) return;

                    const submissionData =
                        unwrapResponse(submissionResponse);

                    const submission =
                        getLatestSubmission(submissionData);

                    if (submission?.sourceCode) {
                        setCode(submission.sourceCode);

                        setOutput(
                            buildSubmissionOutput(
                                submission,
                                exerciseId,
                                "Đã khôi phục bài làm gần nhất"
                            ) 
                            
                        );
                    } else {
                        setCode(defaultCode);
                    }
                } catch (submissionError) {
                    if (!isCurrentRequest()) return;

                    console.error(
                        "Get previous submission error:",
                        submissionError
                    );

                    // Chưa có bài nộp trước đó.
                    setCode(defaultCode);
                }
            } catch (err) {
                if (!isCurrentRequest()) return;

                console.error("Load practice exercise error:", err);

                setExercise(null);

                setError(
                    getErrorMessage(err, "Không thể tải bài tập.")
                );
            } finally {
                if (isCurrentRequest()) {
                    setLoading(false);
                }
            }
        };

        fetchExercise();

        return () => {
            cancelled = true;
            loadRequestRef.current += 1;
        };
    }, [exerciseId, reloadKey]);

    /* =====================================================
       CODE EDITOR
    ===================================================== */

    const getCurrentWord = (textarea) => {
        const cursor = textarea.selectionStart;

        const beforeCursor = textarea.value.substring(0, cursor);
        const match = beforeCursor.match(/[a-zA-Z]+$/);

        if (!match) return null;

        return {
            word: match[0],
            start: cursor - match[0].length,
            end: cursor,
        };
    };

    const insertSnippet = (textarea, snippet) => {
        const currentWord = getCurrentWord(textarea);

        if (!currentWord) return false;

        textarea.setRangeText(
            snippet,
            currentWord.start,
            currentWord.end,
            "end"
        );

        setCode(textarea.value);
        clearExecutionResult();

        return true;
    };

    const handleCodeChange = (event) => {
        setCode(event.target.value);
        clearExecutionResult();
    };

    const handleInputChange = (event) => {
        setInput(event.target.value);
        clearExecutionResult();
    };

    const handleCodeKeyDown = (event) => {
        const textarea = event.currentTarget;

        if (running || submitting) {
            return;
        }

        if (event.key === "Tab") {
            event.preventDefault();

            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const tab = "    ";

            if (start === end) {
                if (!event.shiftKey) {
                    textarea.setRangeText(tab, start, end, "end");

                    setCode(textarea.value);
                    clearExecutionResult();
                    return;
                }

                const lineStart =
                    textarea.value.lastIndexOf("\n", start - 1) + 1;

                const linePrefix = textarea.value.substring(
                    lineStart,
                    start
                );

                const removeLength = linePrefix.startsWith(tab)
                    ? tab.length
                    : linePrefix.startsWith("\t")
                        ? 1
                        : 0;

                if (removeLength > 0) {
                    textarea.setRangeText(
                        "",
                        lineStart,
                        lineStart + removeLength,
                        "start"
                    );

                    setCode(textarea.value);
                    clearExecutionResult();
                }

                return;
            }

            const selectedText = textarea.value.substring(start, end);
            const lines = selectedText.split("\n");

            const updatedLines = event.shiftKey
                ? lines.map((line) =>
                    line.startsWith(tab)
                        ? line.substring(tab.length)
                        : line.startsWith("\t")
                            ? line.substring(1)
                            : line
                )
                : lines.map((line) => tab + line);

            textarea.setRangeText(
                updatedLines.join("\n"),
                start,
                end,
                "select"
            );

            setCode(textarea.value);
            clearExecutionResult();

            return;
        }

        if (event.key === " " || event.key === "Enter") {
            const currentWord = getCurrentWord(textarea);

            if (currentWord && SNIPPETS[currentWord.word]) {
                event.preventDefault();

                insertSnippet(
                    textarea,
                    SNIPPETS[currentWord.word]
                );
            }
        }
    };

    /* =====================================================
       RUN CODE
    ===================================================== */

    const handleRunCode = async () => {
        if (!exercise || running || submitting) return;

        if (!code.trim()) {
            setOutput("Vui lòng nhập code trước khi chạy.");
            clearExecutionResult();
            return;
        }

        const id = getExerciseId(exercise);

        if (id == null) {
            setOutput("Không xác định được ID bài tập.");
            clearExecutionResult();
            return;
        }

        // Xóa kết quả cũ, không cho Submit bằng lần Run trước.
        setExecutionResult(null);
        setExecutionId(null);

        setRunning(true);
        setOutput("Đang chạy chương trình...");

        try {
            /*
             * API 1:
             * Chạy code với input do người dùng nhập.
             */
            const consoleResponse =
                await codeExecutionService.execute({
                    sourceCode: code,
                    language: exercise.language || "JAVA",
                    stdin: input,
                    timeoutMs: Math.max(
                        Number(exercise.timeLimit) || 5000,
                        10000
                    ),
                });

            const consoleResult = unwrapResponse(consoleResponse);

            const lines = [];

            if (consoleResult?.stdout) {
                lines.push(consoleResult.stdout);
            }

            if (consoleResult?.stderr) {
                lines.push("----- ERROR -----", consoleResult.stderr);
            }

            if (!consoleResult?.stdout && !consoleResult?.stderr) {
                lines.push("Chương trình không có output.");
            }

            setOutput(lines.join("\n"));

            /*
             * API 2:
             * Chạy toàn bộ testcase.
             * Execution Service trả executionId để Submit tái sử dụng.
             */
            const testResponse =
                await codeExecutionService.runExercise({
                    exerciseId: id,
                    sourceCode: code,
                    language: exercise.language || "JAVA",
                });

            const testResult = unwrapResponse(testResponse);

            if (!testResult || typeof testResult !== "object") {
                throw new Error(
                    "API chạy test case không trả về kết quả hợp lệ."
                );
            }

            const returnedExecutionId = getExecutionId(testResult);

            if (!returnedExecutionId) {
                throw new Error(
                    "Execution Service chưa trả về executionId. " +
                    "Không thể nộp kết quả Run này."
                );
            }

            setExecutionResult(testResult);
            setExecutionId(String(returnedExecutionId));
        } catch (err) {
            console.error("Run code error:", err);

            setOutput(
                getErrorMessage(err, "Không thể chạy chương trình.")
            );

            setExecutionResult(null);
            setExecutionId(null);
        } finally {
            setRunning(false);
        }
    };

    /* =====================================================
       RESET CODE
    ===================================================== */

    const handleReset = () => {
        if (running || submitting) return;

        setCode(exercise?.starterCode || DEFAULT_CODE);
        setInput(getFirstPublicInput(exercise));

        clearExecutionResult();
    };

    /* =====================================================
       SUBMIT CODE
    ===================================================== */

    const handleSubmit = async () => {
        if (!canSubmit || submitting) return;

        const id = getExerciseId(exercise);

        if (!id) {
            setOutput("Không tìm thấy ID bài tập để nộp.");
            return;
        }

        if (!executionId) {
            setOutput(
                "Không tìm thấy executionId. Vui lòng chạy code lại trước khi nộp."
            );
            return;
        }

        setSubmitting(true);
        setOutput("Đang gửi bài nộp lên hệ thống...");

        try {
            const payload = {
                exerciseId: id,
                executionId,
                sourceCode: code,
                language: exercise.language || "JAVA",
            };

            const response =
                await submissionService.submit(payload);

            const result = unwrapResponse(response);

            if (result && typeof result === "object") {
                setOutput(
                    buildSubmissionOutput(
                        result,
                        id,
                        "Nộp bài thành công"
                    )
                );
            } else {
                setOutput(
                    "Nộp bài thành công nhưng hệ thống chưa trả về thông tin chi tiết."
                );
            }
        } catch (err) {
            console.error("Submit error:", err);

            setOutput(
                "Lỗi khi nộp bài: " +
                getErrorMessage(
                    err,
                    "Không thể kết nối đến Submission Service."
                )
            );
        } finally {
            setSubmitting(false);
        }
    };

    /* =====================================================
       RETRY LOAD EXERCISE
    ===================================================== */

    const handleRetry = () => {
        setError("");
        setExercise(null);
        setLoading(true);

        setCode(DEFAULT_CODE);
        setInput("");

        setExecutionResult(null);
        setExecutionId(null);
        setOutput("");

        setReloadKey((previous) => previous + 1);
    };

    /* =====================================================
       UI HELPERS
    ===================================================== */

    const getDifficultyClass = (difficulty) => {
        switch (String(difficulty ?? "").toUpperCase()) {
            case "EASY":
                return "easy";
            case "MEDIUM":
                return "medium";
            case "HARD":
                return "hard";
            default:
                return "";
        }
    };

    const renderTestCase = (testCase, index) => {
        const result = getResultForTestCase(
            testCase,
            index,
            testResults
        );

        const hidden =
            isHiddenTest(testCase) || isHiddenTest(result);

        const status = normalizeStatus(result?.status);
        const hasResult = Boolean(result);

        return (
            <article
                className={`testcase-card ${
                    hasResult
                        ? `has-result ${getStatusClass(status)}`
                        : ""
                }`}
                key={
                    testCase?.testCaseId ??
                    testCase?.id ??
                    testCase?._id ??
                    `test-${index + 1}`
                }
            >
                <div className="testcase-card-header">
                    <div className="testcase-name">
                        <span>
                            Test case{" "}
                            {getResultNumber(testCase) ?? index + 1}
                        </span>

                        {hidden && (
                            <span className="hidden-badge">
                                Test ẩn
                            </span>
                        )}
                    </div>

                    <span
                        className={`testcase-status ${getStatusClass(status)}`}
                    >
                        <FontAwesomeIcon
                            icon={
                                status === "PASSED"
                                    ? faCheck
                                    : status === "PENDING"
                                        ? faCircleQuestion
                                        : faXmark
                            }
                        />

                        {STATUS_LABELS[status] ||
                            STATUS_LABELS.PENDING}
                    </span>
                </div>

                {!hidden && (
                    <div className="testcase-details">
                        <div>
                            <strong>Input</strong>
                            <pre>
                                {testCase?.input ?? "(Không có dữ liệu)"}
                            </pre>
                        </div>

                        <div>
                            <strong>Output mong đợi</strong>
                            <pre>
                                {testCase?.expectedOutput ??
                                    testCase?.expectedOutputText ??
                                    "(Không có dữ liệu)"}
                            </pre>
                        </div>

                        {result && (
                            <div className="testcase-actual-output">
                                <strong>Output thực tế</strong>
                                <pre>
                                    {result?.actualOutput ??
                                        result?.actualOutputText ??
                                        result?.stdout ??
                                        "(Không có output)"}
                                </pre>
                            </div>
                        )}
                    </div>
                )}
            </article>
        );
    };

    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return (
            <div className="exercise-page">
                <div className="exercise-loading">
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <span>Đang tải bài tập...</span>
                </div>
            </div>
        );
    }

    /* =====================================================
       ERROR
    ===================================================== */

    if (error || !exercise) {
        return (
            <div className="exercise-page">
                <div className="exercise-error">
                    <FontAwesomeIcon icon={faCircleExclamation} />

                    <span>
                        {error || "Không tìm thấy bài tập."}
                    </span>

                    <Link
                        to="/practice"
                        className="exercise-back"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        <span>Quay lại luyện tập</span>
                    </Link>

                    <button
                        type="button"
                        className="reset-button"
                        onClick={handleRetry}
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    /* =====================================================
       MAIN UI
    ===================================================== */

    return (
        <div className="exercise-page">
            <main className="exercise-main practice-code-main">
                <div className="exercise-topbar">
                    <Link
                        to="/practice"
                        className="exercise-back"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        <span>Quay lại luyện tập</span>
                    </Link>
                </div>

                <div className="exercise-layout">
                    {/* ================= ĐỀ BÀI ================= */}

                    <section className="problem-panel">
                        <div className="problem-header">
                            <div className="problem-badges">
                                <span
                                    className={`difficulty ${getDifficultyClass(
                                        exercise.difficulty
                                    )}`}
                                >
                                    {exercise.difficulty || "N/A"}
                                </span>

                                <span className="problem-language">
                                    {exercise.language || "JAVA"}
                                </span>

                                {exercise.timeLimit != null && (
                                    <span className="problem-language">
                                        <FontAwesomeIcon icon={faClock} />{" "}
                                        {exercise.timeLimit} ms
                                    </span>
                                )}

                                {exercise.memoryLimit != null && (
                                    <span className="problem-language">
                                        {exercise.memoryLimit} MB
                                    </span>
                                )}
                            </div>

                            <h1>{exercise.title}</h1>
                        </div>

                        <div className="problem-block">
                            <h2>Đề bài</h2>
                            <p>
                                {exercise.description ||
                                    "Không có mô tả cho bài tập này."}
                            </p>
                        </div>

                        {exercise.explanation && (
                            <div className="problem-block">
                                <h2>Giải thích</h2>
                                <p>{exercise.explanation}</p>
                            </div>
                        )}

                        {exercise.example && (
                            <div className="problem-block">
                                <h2>Bài mẫu</h2>
                                <div className="example-box">
                                    <pre>{exercise.example}</pre>
                                </div>
                            </div>
                        )}

                        <div className="problem-block">
                            <h2>Ví dụ công khai</h2>

                            {publicTestCases.length === 0 ? (
                                <p className="no-testcase">
                                    Không có ví dụ công khai.
                                </p>
                            ) : (
                                publicTestCases.map((testCase, index) => (
                                    <div
                                        className="problem-testcase"
                                        key={
                                            testCase?.testCaseId ??
                                            testCase?.id ??
                                            testCase?._id ??
                                            index
                                        }
                                    >
                                        <div className="testcase-title">
                                            Ví dụ {index + 1}
                                        </div>

                                        <div className="testcase-row">
                                            <div>
                                                <strong>Input</strong>
                                                <pre>
                                                    {testCase?.input ?? ""}
                                                </pre>
                                            </div>

                                            <div>
                                                <strong>Output</strong>
                                                <pre>
                                                    {testCase?.expectedOutput ??
                                                        testCase?.expectedOutputText ??
                                                        ""}
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* ================= CODE EDITOR ================= */}

                    <section className="code-panel">
                        <div className="code-card">
                            <div className="code-header">
                                <div>
                                    <FontAwesomeIcon icon={faPlay} />
                                    <span>Main.java</span>
                                </div>

                                <span>Java 21</span>
                            </div>

                            <textarea
                                className="code-editor"
                                value={code}
                                onChange={handleCodeChange}
                                onKeyDown={handleCodeKeyDown}
                                disabled={running || submitting}
                                spellCheck={false}
                                autoCorrect="off"
                                autoCapitalize="off"
                                autoComplete="off"
                                aria-label="Trình soạn thảo mã nguồn"
                            />

                            {/* INPUT */}

                            <div className="input-section">
                                <div className="input-header">
                                    <h3>Input</h3>
                                    <span>
                                        Dữ liệu đầu vào khi chạy thử
                                    </span>
                                </div>

                                <textarea
                                    className="program-input"
                                    value={input}
                                    onChange={handleInputChange}
                                    disabled={running || submitting}
                                    placeholder="Nhập dữ liệu đầu vào..."
                                    spellCheck={false}
                                    autoCorrect="off"
                                    autoCapitalize="off"
                                    autoComplete="off"
                                />
                            </div>

                            {/* ACTIONS */}

                            <div className="code-actions">
                                <button
                                    type="button"
                                    className="run-button"
                                    onClick={handleRunCode}
                                    disabled={running || submitting}
                                >
                                    <FontAwesomeIcon
                                        icon={running ? faSpinner : faPlay}
                                        spin={running}
                                    />

                                    <span>
                                        {running ? "Đang chạy..." : "Chạy thử"}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    className="reset-button"
                                    onClick={handleReset}
                                    disabled={running || submitting}
                                >
                                    Đặt lại
                                </button>

                                <button
                                    type="button"
                                    className="submit-button"
                                    onClick={handleSubmit}
                                    disabled={!canSubmit}
                                    title={
                                        canSubmit
                                            ? "Nộp bài để hệ thống chấm điểm"
                                            : "Hãy chạy code trước khi nộp"
                                    }
                                >
                                    {submitting ? "Đang nộp..." : "Nộp bài"}
                                </button>
                            </div>
                        </div>

                        {/* CONSOLE OUTPUT */}

                        <section className="output-section">
                            <div className="output-section-header">
                                <h2>Kết quả chạy chương trình</h2>
                                {output && output !== "Đang chạy chương trình..." && (
                                    <button
                                        type="button"
                                        className="btn-ai-analyze-error"
                                        onClick={() => {
                                            window.dispatchEvent(
                                                new CustomEvent(
                                                    "jlearn:open-error-analysis",
                                                    {
                                                        detail: {
                                                            sourceCode: code,
                                                            errorMessage: output,
                                                        },
                                                    }
                                                )
                                            );
                                        }}
                                        title="Mở AI Tutor để phân tích nguyên nhân lỗi và nhận gợi ý"
                                    >
                                        <FontAwesomeIcon icon={faRobot} />
                                        <span>Nhờ AI phân tích lỗi</span>
                                    </button>
                                )}
                            </div>

                            <pre>
                                {output ||
                                    "Kết quả thực thi sẽ hiển thị tại đây."}
                            </pre>
                        </section>

                        {/* TESTCASE RESULTS */}

                        <section className="testcases-section">
                            <div className="testcases-header">
                                <div>
                                    <h2>Kết quả test case</h2>
                                    <p>
                                        Test ẩn chỉ hiển thị trạng thái,
                                        không hiển thị dữ liệu kiểm thử.
                                    </p>
                                </div>

                                <span
                                    className={`testcases-overall ${
                                        allTestsPassed ? "passed" : "failed"
                                    }`}
                                >
                                    {allTestsPassed
                                        ? "Tất cả đã đạt"
                                        : `${passedCount}/${knownTotal} test đạt`}
                                </span>
                            </div>

                            {knownTotal === 0 ? (
                                <p className="no-testcase">
                                    Chưa có thông tin test case từ API.
                                </p>
                            ) : (
                                <div className="testcase-list">
                                    {Array.from(
                                        { length: knownTotal },
                                        (_, index) => {
                                            const testCase =
                                                testCases[index] ?? {
                                                    testCaseNumber: index + 1,
                                                    hidden: true,
                                                };

                                            return renderTestCase(
                                                testCase,
                                                index
                                            );
                                        }
                                    )}
                                </div>
                            )}

                            {executionResult && (
                                <div
                                    className={`test-summary ${
                                        allTestsPassed
                                            ? "summary-success"
                                            : "summary-failed"
                                    }`}
                                >
                                    <strong>
                                        {allTestsPassed
                                            ? "Hoàn thành: tất cả test case đã đạt."
                                            : "Chưa đạt: bạn vẫn có thể nộp bài để AI phân tích source code."}
                                    </strong>

                                    <span>
                                        Số test đã đạt: {passedCount}/{knownTotal}
                                    </span>

                                    <span>
                                        {executionId
                                            ? "Đã lưu kết quả thực thi, có thể Submit."
                                            : "Không có executionId hợp lệ. Vui lòng chạy lại code."}
                                    </span>
                                </div>
                            )}
                        </section>
                    </section>
                </div>
            </main>
        </div>
    );
}

export default PracticeCode;
