import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faPlay,
    faSpinner,
    faCircleExclamation,
    faChevronLeft,
    faChevronRight,
    faCheck,
    faXmark,
    faClock,
    faCircleQuestion,
} from "@fortawesome/free-solid-svg-icons";
import submissionService from "../../services/submissionService";
import exerciseService from "../../services/exerciseService";
import codeExecutionService from "../../services/codeExecutionService";
import "./Exercise.css";

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

const unwrapResponse = (response) =>
    response?.data?.result ?? response?.data ?? response ?? null;

const getExerciseId = (exercise) =>
    exercise?.id ?? exercise?.exerciseId ?? exercise?._id ?? null;

const isHiddenTest = (testCase) =>
    testCase?.hidden === true ||
    testCase?.hidden === 1 ||
    String(testCase?.hidden).toLowerCase() === "true" ||
    testCase?.isHidden === true ||
    testCase?.isHidden === 1 ||
    String(testCase?.isHidden).toLowerCase() === "true";

const normalizeStatus = (status) => {
    const value = String(status ?? "").trim().toUpperCase();

    if (["PASSED", "ACCEPTED", "SUCCESS"].includes(value)) {
        return "PASSED";
    }

    if (["WRONG_ANSWER", "WRONG ANSWER"].includes(value)) {
        return "WRONG_ANSWER";
    }

    if (["TIME_LIMIT_EXCEEDED", "TIME LIMIT EXCEEDED", "TLE"].includes(value)) {
        return "TIME_LIMIT_EXCEEDED";
    }

    if (["COMPILATION_ERROR", "COMPILE_ERROR", "CE"].includes(value)) {
        return "COMPILATION_ERROR";
    }

    if (["RUNTIME_ERROR", "RUNTIME_EXCEPTION", "RE"].includes(value)) {
        return "RUNTIME_ERROR";
    }

    if (["FAILED", "ERROR"].includes(value)) {
        return value;
    }

    return "PENDING";
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

const getStatusClass = (status) =>
    `status-${String(status || "PENDING")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")}`;

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
        testCase?.testCaseId ?? testCase?.id ?? testCase?._id;

    if (testCaseId != null) {
        const byId = results.find((result) => {
            const resultId =
                result?.testCaseId ?? result?.id ?? result?._id;

            return (
                resultId != null &&
                String(resultId) === String(testCaseId)
            );
        });

        if (byId) return byId;
    }

    const targetNumber =
        getResultNumber(testCase) ?? index + 1;

    const byNumber = results.find(
        (result) => getResultNumber(result) === targetNumber
    );

    if (byNumber) return byNumber;

    return results[index] ?? null;
};

function Exercise() {
    const { lessonId } = useParams();

    const [exercises, setExercises] = useState([]);
    const [selectedExercise, setSelectedExercise] = useState(null);

    const [loading, setLoading] = useState(true);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [error, setError] = useState("");

    const [code, setCode] = useState(DEFAULT_CODE);
    const [input, setInput] = useState("");

    const [running, setRunning] = useState(false);
    const [output, setOutput] = useState("");
    const [executionResult, setExecutionResult] = useState(null);

    const [sidebarOpen, setSidebarOpen] = useState(true);

    const testCases = useMemo(
        () =>
            Array.isArray(selectedExercise?.testCases)
                ? selectedExercise.testCases
                : [],
        [selectedExercise]
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

    const canSubmit = !running && allTestsPassed;

    const clearExecutionResult = () => {
        setExecutionResult(null);
        setOutput("");
    };

    const getFirstPublicInput = (exercise) => {
        const cases = Array.isArray(exercise?.testCases)
            ? exercise.testCases
            : [];

        return cases.find((item) => !isHiddenTest(item))?.input ?? "";
    };

    // Hàm kiểm tra và nạp lại mã nguồn bài nộp gần nhất của user
    const fetchAndSetUserCode = async (exerciseId, fallbackCode) => {
        try {
            const subRes = await submissionService.getMySubmissionByExercise(exerciseId);
            const subData = unwrapResponse(subRes);

            if (subData?.sourceCode) {
                setCode(subData.sourceCode);
                setOutput(
                    `[Thông báo] Đã tải bài làm gần nhất của bạn (Nộp ngày: ${
                        subData.submittedAt
                            ? new Date(subData.submittedAt).toLocaleString("vi-VN")
                            : "N/A"
                    })`
                );
                return;
            }
        } catch {
            // Chưa nộp bài hoặc chưa từng lưu -> dùng starterCode
        }
        setCode(fallbackCode);
    };

    const loadExerciseDetail = async (exercise) => {
        const exerciseId = getExerciseId(exercise);

        setLoadingDetail(true);
        setError("");
        clearExecutionResult();

        try {
            if (exerciseId == null) {
                setSelectedExercise(exercise);
                setInput(getFirstPublicInput(exercise));
                setCode(exercise?.starterCode || DEFAULT_CODE);
                return;
            }

            const response =
                await exerciseService.getExerciseById(exerciseId);

            const detail = unwrapResponse(response) ?? exercise;

            setSelectedExercise(detail);
            setInput(getFirstPublicInput(detail));

            // Kiểm tra xem user đã từng nộp bài này chưa để nạp lại sourceCode
            const defaultCode = detail?.starterCode || DEFAULT_CODE;
            await fetchAndSetUserCode(exerciseId, defaultCode);

        } catch (err) {
            console.error("Get exercise detail error:", err);

            setSelectedExercise(exercise);
            setInput(getFirstPublicInput(exercise));
            setCode(exercise?.starterCode || DEFAULT_CODE);
        } finally {
            setLoadingDetail(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        const loadExercises = async () => {
            setLoading(true);
            setError("");
            setExercises([]);
            setSelectedExercise(null);
            setExecutionResult(null);
            setOutput("");

            try {
                const response =
                    await exerciseService.getExercisesByLesson(lessonId);

                const data = unwrapResponse(response);

                const list = Array.isArray(data)
                    ? data
                    : data?.content ??
                    data?.exercises ??
                    data?.items ??
                    [];

                if (cancelled) return;

                setExercises(list);

                if (list.length === 0) {
                    setSelectedExercise(null);
                    setCode(DEFAULT_CODE);
                    setInput("");
                    return;
                }

                const firstExercise = list[0];
                const firstId = getExerciseId(firstExercise);

                try {
                    if (firstId == null) {
                        throw new Error("Exercise ID is missing");
                    }

                    const detailResponse =
                        await exerciseService.getExerciseById(firstId);

                    if (cancelled) return;

                    const detail =
                        unwrapResponse(detailResponse) ?? firstExercise;

                    setSelectedExercise(detail);
                    setInput(getFirstPublicInput(detail));

                    const defaultCode = detail?.starterCode || DEFAULT_CODE;
                    await fetchAndSetUserCode(firstId, defaultCode);

                } catch (detailError) {
                    console.error(
                        "Get first exercise detail error:",
                        detailError
                    );

                    if (cancelled) return;

                    setSelectedExercise(firstExercise);
                    setCode(firstExercise?.starterCode || DEFAULT_CODE);
                    setInput(getFirstPublicInput(firstExercise));
                }
            } catch (err) {
                if (cancelled) return;

                console.error("Load exercises error:", err);

                setError(
                    err.response?.data?.message ||
                    "Không thể tải danh sách bài tập."
                );
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadExercises();

        return () => {
            cancelled = true;
        };
    }, [lessonId]);

    const handleSelectExercise = async (exercise) => {
        if (running || loadingDetail) return;

        if (
            String(getExerciseId(exercise)) ===
            String(getExerciseId(selectedExercise))
        ) {
            setSidebarOpen(false);
            return;
        }

        await loadExerciseDetail(exercise);
    };

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

    const handleCodeKeyDown = (event) => {
        const textarea = event.currentTarget;

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
                insertSnippet(textarea, SNIPPETS[currentWord.word]);
            }
        }
    };

    const handleRunCode = async () => {
        if (!selectedExercise || running) return;

        if (!code.trim()) {
            setOutput("Vui lòng nhập code trước khi chạy.");
            setExecutionResult(null);
            return;
        }

        const exerciseId = getExerciseId(selectedExercise);

        if (exerciseId == null) {
            setOutput("Không xác định được ID bài tập.");
            return;
        }

        setRunning(true);
        setExecutionResult(null);
        setOutput("Đang chạy chương trình...");

        try {
            // API 1: Chạy code với input do người dùng nhập.
            const consoleResponse = await codeExecutionService.execute({
                sourceCode: code,
                language: selectedExercise.language || "JAVA",
                stdin: input,
                timeoutMs: Math.max(
                    Number(selectedExercise.timeLimit) || 5000,
                    10000
                ),
            });

            const consoleResult = unwrapResponse(consoleResponse);

            if (consoleResult) {
                const lines = [];

                if (consoleResult.stdout) {
                    lines.push(consoleResult.stdout);
                }

                if (consoleResult.stderr) {
                    lines.push(
                        "----- ERROR -----",
                        consoleResult.stderr
                    );
                }

                if (!consoleResult.stdout && !consoleResult.stderr) {
                    lines.push("Chương trình không có output.");
                }

                setOutput(lines.join("\n"));
            } else {
                setOutput("Không nhận được output từ chương trình.");
            }

            // API 2: Chấm toàn bộ test case để xác định có được nộp bài không.
            const testResponse = await codeExecutionService.runExercise({
                exerciseId,
                sourceCode: code,
                language: selectedExercise.language || "JAVA",
            });

            const testResult = unwrapResponse(testResponse);

            setExecutionResult(testResult);

        } catch (err) {
            console.error("Run code error:", err);

            setOutput(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Không thể chạy chương trình."
            );

            setExecutionResult(null);
        } finally {
            setRunning(false);
        }
    };

    const handleReset = () => {
        if (running) return;

        setCode(selectedExercise?.starterCode || DEFAULT_CODE);
        setInput(getFirstPublicInput(selectedExercise));
        clearExecutionResult();
    };

    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!canSubmit || submitting) return;

        const exerciseId = getExerciseId(selectedExercise);
        if (!exerciseId) {
            setOutput("Không tìm thấy ID bài tập để nộp.");
            return;
        }

        setSubmitting(true);
        setOutput("Đang gửi bài nộp lên hệ thống...");

        try {
            const payload = {
                exerciseId: exerciseId,
                sourceCode: code,
                language: selectedExercise?.language || "JAVA"
            };

            const response = await submissionService.submit(payload);
            const result = unwrapResponse(response);

            setOutput(
                ` Nộp bài thành công!\n` +
                `Mã bài nộp (ID): ${result?.id || "N/A"}\n` +
                `Trạng thái: ${result?.gradingStatus || "PENDING"}\n` +
                `Thời gian nộp: ${new Date(result?.submittedAt).toLocaleString("vi-VN")}`
            );
        } catch (err) {
            console.error("Submit error:", err);
            setOutput(
                " Lỗi khi nộp bài: " +
                (err.response?.data?.message || err.message || "Không thể kết nối đến Submission Service.")
            );
        } finally {
            setSubmitting(false);
        }
    };

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
                className={`testcase-card ${hasResult
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
                            Test case {getResultNumber(testCase) ?? index + 1}
                        </span>

                        {hidden && (
                            <span className="hidden-badge">Test ẩn</span>
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

                        {STATUS_LABELS[status] || STATUS_LABELS.PENDING}
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

    if (error) {
        return (
            <div className="exercise-page">
                <div className="exercise-error">
                    <FontAwesomeIcon icon={faCircleExclamation} />
                    <span>{error}</span>

                    <Link
                        to={`/lessons/${lessonId}`}
                        className="exercise-back"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        Quay lại bài học
                    </Link>
                </div>
            </div>
        );
    }

    if (exercises.length === 0) {
        return (
            <div className="exercise-page">
                <div className="exercise-empty">
                    <h2>Chưa có bài tập</h2>
                    <p>Bài học này hiện chưa có bài tập.</p>

                    <Link
                        to={`/lessons/${lessonId}`}
                        className="exercise-back"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        Quay lại bài học
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="exercise-page">
            <div className="exercise-workspace">
                <aside
                    className={`exercise-sidebar ${sidebarOpen ? "sidebar-open" : "sidebar-closed"
                        }`}
                >
                    <div className="sidebar-inner">
                        <div className="sidebar-header">
                            <div className="sidebar-title">
                                <h2>Bài tập</h2>
                                <span>{exercises.length} bài</span>
                            </div>

                            <button
                                type="button"
                                className="sidebar-toggle-button"
                                onClick={() => setSidebarOpen(false)}
                                aria-label="Đóng danh sách bài tập"
                            >
                                <FontAwesomeIcon icon={faChevronLeft} />
                            </button>
                        </div>

                        <div className="exercise-list">
                            {exercises.map((exercise, index) => {
                                const active =
                                    String(getExerciseId(selectedExercise)) ===
                                    String(getExerciseId(exercise));

                                return (
                                    <button
                                        key={getExerciseId(exercise) ?? index}
                                        type="button"
                                        className={`exercise-item ${active ? "active" : ""
                                            }`}
                                        onClick={() =>
                                            handleSelectExercise(exercise)
                                        }
                                        disabled={loadingDetail || running}
                                    >
                                        <div className="exercise-number">
                                            {index + 1}
                                        </div>

                                        <div className="exercise-item-content">
                                            <div className="exercise-item-title">
                                                {exercise.title ||
                                                    `Bài tập ${index + 1}`}
                                            </div>

                                            <span
                                                className={`difficulty ${getDifficultyClass(
                                                    exercise.difficulty
                                                )}`}
                                            >
                                                {exercise.difficulty || "N/A"}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </aside>

                <main className="exercise-main">
                    <div className="exercise-topbar">
                        {!sidebarOpen && (
                            <button
                                type="button"
                                className="sidebar-open-button"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <FontAwesomeIcon icon={faChevronRight} />
                                <span>Bài tập</span>
                            </button>
                        )}

                        <Link
                            to={`/lessons/${lessonId}`}
                            className="exercise-back"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} />
                            <span>Quay lại bài học</span>
                        </Link>
                    </div>

                    {loadingDetail ? (
                        <div className="detail-loading">
                            <FontAwesomeIcon icon={faSpinner} spin />
                            Đang tải nội dung bài tập...
                        </div>
                    ) : selectedExercise ? (
                        <div className="exercise-layout">
                            <section className="problem-panel">
                                <div className="problem-header">
                                    <div className="problem-badges">
                                        <span
                                            className={`difficulty ${getDifficultyClass(
                                                selectedExercise.difficulty
                                            )}`}
                                        >
                                            {selectedExercise.difficulty ||
                                                "N/A"}
                                        </span>

                                        <span className="problem-language">
                                            {selectedExercise.language ||
                                                "JAVA"}
                                        </span>

                                        {selectedExercise.timeLimit != null && (
                                            <span className="problem-language">
                                                <FontAwesomeIcon icon={faClock} />{" "}
                                                {selectedExercise.timeLimit} ms
                                            </span>
                                        )}

                                        {selectedExercise.memoryLimit != null && (
                                            <span className="problem-language">
                                                {selectedExercise.memoryLimit} MB
                                            </span>
                                        )}
                                    </div>

                                    <h1>{selectedExercise.title}</h1>
                                </div>

                                <div className="problem-block">
                                    <h2>Đề bài</h2>
                                    <p>
                                        {selectedExercise.description ||
                                            "Không có mô tả cho bài tập này."}
                                    </p>
                                </div>

                                {selectedExercise.explanation && (
                                    <div className="problem-block">
                                        <h2>Giải thích</h2>
                                        <p>{selectedExercise.explanation}</p>
                                    </div>
                                )}

                                {selectedExercise.example && (
                                    <div className="problem-block">
                                        <h2>Bài mẫu</h2>
                                        <div className="example-box">
                                            <pre>
                                                {selectedExercise.example}
                                            </pre>
                                        </div>
                                    </div>
                                )}

                                <div className="problem-block">
                                    <h2>Ví dụ công khai</h2>

                                    {testCases.filter(
                                        (item) => !isHiddenTest(item)
                                    ).length === 0 ? (
                                        <p className="no-testcase">
                                            Không có ví dụ công khai.
                                        </p>
                                    ) : (
                                        testCases
                                            .filter(
                                                (item) => !isHiddenTest(item)
                                            )
                                            .map((testCase, index) => (
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
                                                                {testCase?.input ??
                                                                    ""}
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
                                        onChange={(event) => {
                                            setCode(event.target.value);
                                            clearExecutionResult();
                                        }}
                                        onKeyDown={handleCodeKeyDown}
                                        spellCheck={false}
                                        autoCorrect="off"
                                        autoCapitalize="off"
                                        autoComplete="off"
                                        aria-label="Trình soạn thảo mã nguồn"
                                    />

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
                                            onChange={(event) => {
                                                setInput(event.target.value);
                                                clearExecutionResult();
                                            }}
                                            placeholder="Nhập dữ liệu đầu vào..."
                                            spellCheck={false}
                                            autoCorrect="off"
                                            autoCapitalize="off"
                                            autoComplete="off"
                                        />
                                    </div>

                                    <div className="code-actions">
                                        <button
                                            type="button"
                                            className="run-button"
                                            onClick={handleRunCode}
                                            disabled={
                                                running || loadingDetail
                                            }
                                        >
                                            <FontAwesomeIcon
                                                icon={
                                                    running
                                                        ? faSpinner
                                                        : faPlay
                                                }
                                                spin={running}
                                            />

                                            {running
                                                ? "Đang chạy..."
                                                : "Chạy thử"}
                                        </button>

                                        <button
                                            type="button"
                                            className="reset-button"
                                            onClick={handleReset}
                                            disabled={running}
                                        >
                                            Đặt lại
                                        </button>

                                        <button
                                            type="button"
                                            className="submit-button"
                                            onClick={handleSubmit}
                                            disabled={!canSubmit || submitting}
                                            title={
                                                canSubmit
                                                    ? "Tất cả test case đã đạt"
                                                    : "Chạy và vượt qua tất cả test case trước khi nộp"
                                            }
                                        >
                                            {submitting ? "Đang nộp..." : "Nộp bài"}
                                        </button>
                                    </div>
                                </div>

                                <section className="output-section">
                                    <h2>Kết quả chạy chương trình</h2>
                                    <pre>
                                        {output ||
                                            "Kết quả thực thi sẽ hiển thị tại đây."}
                                    </pre>
                                </section>

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
                                            className={`testcases-overall ${allTestsPassed
                                                    ? "passed"
                                                    : "failed"
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
                                                            testCaseNumber:
                                                                index + 1,
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
                                            className={`test-summary ${allTestsPassed
                                                    ? "summary-success"
                                                    : "summary-failed"
                                                }`}
                                        >
                                            <strong>
                                                {allTestsPassed
                                                    ? "Hoàn thành: tất cả test case đã đạt."
                                                    : "Chưa đạt: hãy kiểm tra lại code và chạy lại."}
                                            </strong>

                                            <span>
                                                Số test đã đạt: {passedCount}/
                                                {knownTotal}
                                            </span>

                                            {!allTestsPassed && (
                                                <span>
                                                    Nút Nộp bài chỉ bật khi API
                                                    trả về đủ kết quả và tất cả
                                                    test case đều đạt.
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </section>
                            </section>
                        </div>
                    ) : (
                        <div className="exercise-empty">
                            <h2>Không tìm thấy bài tập</h2>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default Exercise;