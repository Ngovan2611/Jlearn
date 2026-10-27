import { useEffect, useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faRotate,
    faMagnifyingGlass,
    faXmark,
    faPenToSquare,
    faTrash,
    faCode,
    faVial,
    faFolderOpen,
    faChevronLeft,
    faChevronRight,
    faEye,
    faEyeSlash
} from "@fortawesome/free-solid-svg-icons";

import adminCourseService from "../../../services/admin/adminCourseService";
import adminExerciseService from "../../../services/admin/adminExerciseService";
import Loading from "../../../components/common/Loading/Loading";
import "./LessonManagementPage.css";

const PAGE_SIZE = 10;

export default function LessonManagementPage() {
    // State Danh sách Bài học & Phân trang từ Server
    const [lessons, setLessons] = useState([]);
    const [coursesMap, setCoursesMap] = useState({}); // 👈 Lưu cặp { [courseId]: courseTitle }
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const [keywordInput, setKeywordInput] = useState("");
    const [activeKeyword, setActiveKeyword] = useState("");
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    // State Modals
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [editingLesson, setEditingLesson] = useState(null);
    const [lessonForm, setLessonForm] = useState({
        title: "",
        description: "",
        content: "",
        videoUrl: "",
        lessonOrder: 1,
        courseId: ""
    });
    const [savingLesson, setSavingLesson] = useState(false);

    const [selectedLessonForExercises, setSelectedLessonForExercises] = useState(null);
    const [exercises, setExercises] = useState([]);
    const [loadingExercises, setLoadingExercises] = useState(false);

    const [showExerciseFormModal, setShowExerciseFormModal] = useState(false);
    const [editingExercise, setEditingExercise] = useState(null);
    const [exerciseForm, setExerciseForm] = useState({
        title: "",
        description: "",
        difficulty: "EASY",
        language: "JAVA",
        timeLimit: 1000,
        memoryLimit: 256,
        published: true
    });
    const [savingExercise, setSavingExercise] = useState(false);

    const [selectedExerciseForTestCases, setSelectedExerciseForTestCases] = useState(null);
    const [testCases, setTestCases] = useState([]);
    const [loadingTestCases, setLoadingTestCases] = useState(false);

    const [showTestCaseFormModal, setShowTestCaseFormModal] = useState(false);
    const [editingTestCase, setEditingTestCase] = useState(null);
    const [testCaseForm, setTestCaseForm] = useState({
        input: "",
        expectedOutput: "",
        points: 10,
        hidden: false
    });

    // 1. Tải danh sách Khóa học để Map tên Khóa học
    const fetchCoursesMap = useCallback(async () => {
        try {
            const res = await adminCourseService.getAllCourses({ page: 0, size: 100 });
            const pageResult = res.data?.result || res.result;
            const courseList = pageResult?.data || pageResult || [];
            if (Array.isArray(courseList)) {
                const map = {};
                courseList.forEach((c) => {
                    map[c.id] = c.title;
                });
                setCoursesMap(map);
            }
        } catch (err) {
            console.error("Lỗi tải danh sách khóa học:", err);
        }
    }, []);

    // 2. Tải danh sách Bài học
    const fetchLessons = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const response = await adminCourseService.getAllLessonsPaging({
                page,
                size: PAGE_SIZE,
                keyword: activeKeyword.trim()
            });

            const pageResult = response.data?.result || response.result;
            if (pageResult) {
                setLessons(pageResult.data || []);
                setTotalPages(Math.max(1, pageResult.totalPages || 1));
                setTotalElements(pageResult.totalElements || 0);
            }
        } catch (err) {
            console.error("Lỗi khi tải bài học:", err);
            setError(err.response?.data?.message || "Không thể tải danh sách bài học.");
        } finally {
            setLoading(false);
        }
    }, [page, activeKeyword]);

    useEffect(() => {
        let isMounted = true;
        (async () => {
            if (isMounted) {
                await fetchCoursesMap();
                await fetchLessons();
            }
        })();
        return () => { isMounted = false; };
    }, [fetchCoursesMap, fetchLessons]);

    // Tìm kiếm bài học
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(0);
        setActiveKeyword(keywordInput);
    };

    const handleResetSearch = () => {
        setKeywordInput("");
        setActiveKeyword("");
        setPage(0);
    };

    // Thao tác Bài học
    const handleOpenLessonModal = (lesson = null) => {
        if (lesson) {
            setEditingLesson(lesson);
            setLessonForm({
                title: lesson.title || "",
                description: lesson.description || "",
                content: lesson.content || "",
                videoUrl: lesson.videoUrl || "",
                lessonOrder: lesson.lessonOrder || 1,
                courseId: lesson.courseId || ""
            });
        } else {
            setEditingLesson(null);
            setLessonForm({
                title: "",
                description: "",
                content: "",
                videoUrl: "",
                lessonOrder: 1,
                courseId: ""
            });
        }
        setShowLessonModal(true);
    };

    const handleSaveLesson = async (e) => {
        e.preventDefault();
        setSavingLesson(true);
        try {
            if (editingLesson) {
                await adminCourseService.updateLesson(editingLesson.id, lessonForm);
                setNotice("Cập nhật bài học thành công!");
            } else {
                await adminCourseService.createLesson(lessonForm);
                setNotice("Tạo mới bài học thành công!");
            }
            setShowLessonModal(false);
            fetchLessons();
        } catch (err) {
            setError(err.response?.data?.message || "Lỗi khi lưu bài học!");
        } finally {
            setSavingLesson(false);
        }
    };

    const handleToggleLessonStatus = async (lessonId) => {
        try {
            const res = await adminCourseService.toggleLessonStatus(lessonId);
            const updated = res.data?.result || res.result;
            setLessons((prev) =>
                prev.map((l) => (l.id === lessonId ? { ...l, published: updated?.published ?? !l.published } : l))
            );
            setNotice("Đã chuyển đổi trạng thái bài học!");
        } catch (err) {
            setError(err.response?.data?.message || "Không thể chuyển trạng thái bài học.");
        }
    };

    // Thao tác Bài tập
    const handleOpenExercisesModal = async (lesson) => {
        setSelectedLessonForExercises(lesson);
        setLoadingExercises(true);
        setExercises([]);
        try {
            const res = await adminExerciseService.getExercisesByLesson(lesson.id);
            const data = res.data?.result || res.result || [];
            setExercises(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Lỗi tải bài tập:", err);
            setExercises([]);
        } finally {
            setLoadingExercises(false);
        }
    };

    const handleOpenExerciseForm = (exercise = null) => {
        if (exercise) {
            setEditingExercise(exercise);
            setExerciseForm({
                title: exercise.title || "",
                description: exercise.description || "",
                difficulty: exercise.difficulty || "EASY",
                language: exercise.language || "JAVA",
                timeLimit: exercise.timeLimit || 1000,
                memoryLimit: exercise.memoryLimit || 256,
                published: exercise.published ?? true
            });
        } else {
            setEditingExercise(null);
            setExerciseForm({
                title: "",
                description: "",
                difficulty: "EASY",
                language: "JAVA",
                timeLimit: 1000,
                memoryLimit: 256,
                published: true
            });
        }
        setShowExerciseFormModal(true);
    };

    const handleSaveExercise = async (e) => {
        e.preventDefault();
        if (!selectedLessonForExercises) return;
        setSavingExercise(true);

        const payload = {
            ...exerciseForm,
            courseId: selectedLessonForExercises.courseId,
            lessonId: selectedLessonForExercises.id,
            timeLimit: Number(exerciseForm.timeLimit),
            memoryLimit: Number(exerciseForm.memoryLimit)
        };

        try {
            if (editingExercise) {
                await adminExerciseService.updateExercise(editingExercise.id, payload);
            } else {
                await adminExerciseService.createExercise(payload);
            }
            setShowExerciseFormModal(false);
            handleOpenExercisesModal(selectedLessonForExercises);
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi khi lưu bài tập!");
        } finally {
            setSavingExercise(false);
        }
    };

    const handleDeleteExercise = async (exerciseId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa bài tập này?")) return;
        try {
            await adminExerciseService.deleteExercise(exerciseId);
            setExercises((prev) => prev.filter((e) => e.id !== exerciseId));
        } catch (err) {
            alert(err.response?.data?.message || "Không thể xóa bài tập.");
        }
    };

    // Thao tác TestCases
    const handleOpenTestCasesModal = async (exercise) => {
        setSelectedExerciseForTestCases(exercise);
        setLoadingTestCases(true);
        try {
            const res = await adminExerciseService.getTestCases(exercise.id);
            const data = res.data?.result || res.data || [];
            setTestCases(Array.isArray(data) ? data : []);
        } catch  {
            setTestCases([]);
        } finally {
            setLoadingTestCases(false);
        }
    };

    const handleOpenTestCaseForm = (testCase = null) => {
        if (testCase) {
            setEditingTestCase(testCase);
            setTestCaseForm({
                input: testCase.input || "",
                expectedOutput: testCase.expectedOutput || "",
                points: testCase.points || 10,
                hidden: testCase.hidden ?? false
            });
        } else {
            setEditingTestCase(null);
            setTestCaseForm({
                input: "",
                expectedOutput: "",
                points: 10,
                hidden: false
            });
        }
        setShowTestCaseFormModal(true);
    };

    const handleSaveTestCase = async (e) => {
        e.preventDefault();
        if (!selectedExerciseForTestCases) return;

        const payload = {
            ...testCaseForm,
            points: Number(testCaseForm.points)
        };

        try {
            if (editingTestCase) {
                await adminExerciseService.updateTestCase(selectedExerciseForTestCases.id, editingTestCase.id, payload);
            } else {
                await adminExerciseService.addTestCase(selectedExerciseForTestCases.id, payload);
            }
            setShowTestCaseFormModal(false);
            handleOpenTestCasesModal(selectedExerciseForTestCases);
        } catch (err) {
            alert(err.response?.data?.message || "Không thể lưu TestCase.");
        }
    };

    const handleDeleteTestCase = async (testCaseId) => {
        if (!window.confirm("Xóa TestCase này?")) return;
        try {
            await adminExerciseService.deleteTestCase(selectedExerciseForTestCases.id, testCaseId);
            setTestCases((prev) => prev.filter((tc) => tc.id !== testCaseId));
        } catch {
            alert("Lỗi khi xóa TestCase.");
        }
    };

    return (
        <div className="lm-container">
            {/* Header */}
            <div className="lm-header">
                <div>
                    <span className="lm-eyebrow">QUẢN TRỊ NỘI DUNG</span>
                    <h2 className="lm-title">Quản lý bài học & Bài tập lập trình</h2>
                    <p className="lm-subtitle">
                        Xem danh sách bài học toàn hệ thống, tùy chỉnh chi tiết và quản lý các bài tập lập trình tương ứng.
                    </p>
                </div>
                <div className="lm-header__actions">
                    <button type="button" className="lm-btn lm-btn--primary" onClick={() => handleOpenLessonModal()}>
                        <FontAwesomeIcon icon={faPlus} /> Thêm bài học
                    </button>
                    <button type="button" className="lm-btn lm-btn--outline" onClick={fetchLessons} disabled={loading}>
                        <FontAwesomeIcon icon={faRotate} /> Làm mới
                    </button>
                </div>
            </div>

            {/* Notification Alert */}
            {error && <div className="lm-alert lm-alert--error"><span>{error}</span><button type="button" onClick={() => setError("")}><FontAwesomeIcon icon={faXmark} /></button></div>}
            {notice && <div className="lm-alert lm-alert--success"><span>{notice}</span><button type="button" onClick={() => setNotice("")}><FontAwesomeIcon icon={faXmark} /></button></div>}

            {/* Bảng Dữ Liệu Bài Học */}
            <section className="lm-panel">
                <div className="lm-toolbar">
                    <form className="lm-search-form" onSubmit={handleSearchSubmit}>
                        <div className="lm-search-input">
                            <FontAwesomeIcon icon={faMagnifyingGlass} className="lm-search-icon" />
                            <input
                                type="search"
                                value={keywordInput}
                                onChange={(e) => setKeywordInput(e.target.value)}
                                placeholder="Nhập tên bài học hoặc tên khóa học..."
                            />
                        </div>
                        <button type="submit" className="lm-btn lm-btn--primary">Tìm kiếm</button>
                        {activeKeyword && (
                            <button type="button" className="lm-btn lm-btn--ghost" onClick={handleResetSearch}>Xóa lọc</button>
                        )}
                    </form>
                </div>

                <div className="lm-table-wrapper">
                    <table className="lm-table">
                        <thead>
                            <tr>
                                <th>STT</th>
                                <th>TÊN BÀI HỌC</th>
                                <th>THỨ TỰ</th>
                                <th>KHÓA HỌC</th> {/* 👈 Đổi tiêu đề cột thành TÊN KHÓA HỌC */}
                                <th>TRẠNG THÁI</th>
                                <th style={{ textAlign: "right", paddingRight: "24px" }}>THAO TÁC</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: "center", padding: "40px" }}>
                                        <Loading text="Đang tải danh sách bài học..." />
                                    </td>
                                </tr>
                            ) : lessons.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: "center", padding: "40px" }}>
                                        <div style={{ color: "#64748b" }}>
                                            <FontAwesomeIcon icon={faFolderOpen} style={{ fontSize: "32px", marginBottom: "8px" }} />
                                            <p>Không tìm thấy bài học nào.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                lessons.map((lesson, index) => {
                                    // 👈 Tra cứu tên khóa học dựa trên courseId từ coursesMap
                                    const courseTitle = coursesMap[lesson.courseId] || lesson.courseId || "Chưa gắn";

                                    return (
                                        <tr key={lesson.id}>
                                            <td>{page * PAGE_SIZE + index + 1}</td>
                                            <td><strong>{lesson.title}</strong></td>
                                            <td><span className="lm-badge">#{lesson.lessonOrder || 1}</span></td>
                                            <td>
                                                <span className="lm-course-name" title={courseTitle}>
                                                    {courseTitle}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`lm-status-badge ${lesson.published ? "published" : "draft"}`}>
                                                    {lesson.published ? "Đã xuất bản" : "Đang ẩn"}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="lm-actions">
                                                    <button
                                                        type="button"
                                                        className={`lm-btn-action ${lesson.published ? "lm-btn-action--hide" : "lm-btn-action--show"}`}
                                                        onClick={() => handleToggleLessonStatus(lesson.id)}
                                                    >
                                                        <FontAwesomeIcon icon={lesson.published ? faEyeSlash : faEye} />
                                                        {lesson.published ? " Ẩn" : " Hiện"}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="lm-btn-action lm-btn-action--edit"
                                                        onClick={() => handleOpenLessonModal(lesson)}
                                                    >
                                                        <FontAwesomeIcon icon={faPenToSquare} /> Sửa
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="lm-btn-action lm-btn-action--exercise"
                                                        onClick={() => handleOpenExercisesModal(lesson)}
                                                    >
                                                        <FontAwesomeIcon icon={faCode} /> Bài tập
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Phân Trang */}
                {totalPages > 1 && (
                    <div className="lm-pagination">
                        <span style={{ fontSize: "14px", color: "#64748b" }}>
                            Trang <strong>{page + 1}</strong> / {totalPages} (Tổng {totalElements} bài học)
                        </span>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <button
                                type="button"
                                className="lm-btn lm-btn--outline"
                                disabled={page === 0}
                                onClick={() => setPage((p) => p - 1)}
                            >
                                <FontAwesomeIcon icon={faChevronLeft} /> Trước
                            </button>
                            <button
                                type="button"
                                className="lm-btn lm-btn--outline"
                                disabled={page + 1 >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Sau <FontAwesomeIcon icon={faChevronRight} />
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {/* MODAL 1: TẠO / SỬA BÀI HỌC */}
            {showLessonModal && (
                <div className="lm-modal-backdrop" onClick={() => setShowLessonModal(false)}>
                    <div className="lm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="lm-modal__header">
                            <h3>{editingLesson ? "Sửa Bài Học" : "Thêm Bài Học Mới"}</h3>
                            <button type="button" className="lm-modal__close" onClick={() => setShowLessonModal(false)}>
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveLesson} className="lm-modal__body">
                            <div className="lm-form-group">
                                <label>Tiêu đề bài học *</label>
                                <input
                                    type="text"
                                    required
                                    value={lessonForm.title}
                                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                                />
                            </div>
                            <div className="lm-form-row">
                                <div className="lm-form-group">
                                    <label>Khóa học *</label>
                                    {/* 👈 Chuyển sang thẻ Select chọn Khóa học theo Tên */}
                                    <select
                                        required
                                        value={lessonForm.courseId}
                                        onChange={(e) => setLessonForm({ ...lessonForm, courseId: e.target.value })}
                                    >
                                        <option value="">-- Chọn khóa học --</option>
                                        {Object.entries(coursesMap).map(([id, title]) => (
                                            <option key={id} value={id}>
                                                {title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="lm-form-group">
                                    <label>Thứ tự bài học</label>
                                    <input
                                        type="number"
                                        value={lessonForm.lessonOrder}
                                        onChange={(e) => setLessonForm({ ...lessonForm, lessonOrder: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="lm-form-group">
                                <label>Video URL</label>
                                <input
                                    type="text"
                                    value={lessonForm.videoUrl}
                                    onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                                />
                            </div>
                            <div className="lm-form-group">
                                <label>Mô tả ngắn</label>
                                <input
                                    type="text"
                                    value={lessonForm.description}
                                    onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                                />
                            </div>
                            <div className="lm-form-group">
                                <label>Nội dung chi tiết</label>
                                <textarea
                                    rows="4"
                                    value={lessonForm.content}
                                    onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                                />
                            </div>
                            <div className="lm-modal__footer">
                                <button type="button" className="lm-btn lm-btn--ghost" onClick={() => setShowLessonModal(false)}>Hủy</button>
                                <button type="submit" className="lm-btn lm-btn--primary" disabled={savingLesson}>
                                    {savingLesson ? "Đang lưu..." : "Lưu bài học"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: POPUP QUẢN LÝ BÀI TẬP CỦA BÀI HỌC */}
            {selectedLessonForExercises && (
                <div className="lm-modal-backdrop" onClick={() => setSelectedLessonForExercises(null)}>
                    <div className="lm-modal lm-modal--lg" onClick={(e) => e.stopPropagation()}>
                        <div className="lm-modal__header">
                            <div>
                                <h3>Bài tập trong bài học: {selectedLessonForExercises.title}</h3>
                                <span style={{ fontSize: "12px", color: "#64748b" }}>
                                    Khóa học: {coursesMap[selectedLessonForExercises.courseId] || selectedLessonForExercises.courseId}
                                </span>
                            </div>
                            <button type="button" className="lm-modal__close" onClick={() => setSelectedLessonForExercises(null)}>
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>
                        <div className="lm-modal__body">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                <strong>Tổng số: {exercises.length} bài tập</strong>
                                <button
                                    type="button"
                                    className="lm-btn lm-btn--primary lm-btn--sm"
                                    onClick={() => handleOpenExerciseForm()}
                                >
                                    <FontAwesomeIcon icon={faPlus} /> Thêm bài tập mới
                                </button>
                            </div>

                            {loadingExercises ? (
                                <Loading text="Đang tải danh sách bài tập..." />
                            ) : exercises.length === 0 ? (
                                <p style={{ textAlign: "center", color: "#64748b", padding: "20px" }}>Bài học này chưa có bài tập nào.</p>
                            ) : (
                                <div>
                                    {exercises.map((ex) => (
                                        <div key={ex.id} className="lm-exercise-item">
                                            <div>
                                                <h4 style={{ margin: "0 0 4px 0", fontSize: "15px" }}>{ex.title}</h4>
                                                <small style={{ color: "#64748b" }}>
                                                    Độ khó: <strong>{ex.difficulty}</strong> | Giới hạn: {ex.timeLimit}ms - {ex.memoryLimit}MB
                                                </small>
                                            </div>
                                            <div style={{ display: "flex", gap: "6px" }}>
                                                <button
                                                    type="button"
                                                    className="lm-btn-action lm-btn-action--exercise"
                                                    onClick={() => handleOpenTestCasesModal(ex)}
                                                >
                                                    <FontAwesomeIcon icon={faVial} /> TestCases
                                                </button>
                                                <button
                                                    type="button"
                                                    className="lm-icon-btn"
                                                    onClick={() => handleOpenExerciseForm(ex)}
                                                >
                                                    <FontAwesomeIcon icon={faPenToSquare} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="lm-icon-btn lm-icon-btn--danger"
                                                    onClick={() => handleDeleteExercise(ex.id)}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: FORM THÊM / SỬA BÀI TẬP */}
            {showExerciseFormModal && (
                <div className="lm-modal-backdrop" onClick={() => setShowExerciseFormModal(false)}>
                    <div className="lm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="lm-modal__header">
                            <h3>{editingExercise ? "Sửa bài tập" : "Thêm bài tập mới"}</h3>
                            <button type="button" className="lm-modal__close" onClick={() => setShowExerciseFormModal(false)}>
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveExercise} className="lm-modal__body">
                            <div className="lm-form-group">
                                <label>Tiêu đề bài tập *</label>
                                <input
                                    type="text"
                                    required
                                    value={exerciseForm.title}
                                    onChange={(e) => setExerciseForm({ ...exerciseForm, title: e.target.value })}
                                />
                            </div>
                            <div className="lm-form-row">
                                <div className="lm-form-group">
                                    <label>Độ khó</label>
                                    <select
                                        value={exerciseForm.difficulty}
                                        onChange={(e) => setExerciseForm({ ...exerciseForm, difficulty: e.target.value })}
                                    >
                                        <option value="EASY">Dễ (EASY)</option>
                                        <option value="MEDIUM">Trung bình (MEDIUM)</option>
                                        <option value="HARD">Khó (HARD)</option>
                                    </select>
                                </div>
                                <div className="lm-form-group">
                                    <label>Ngôn ngữ</label>
                                    <input type="text" value={exerciseForm.language} disabled />
                                </div>
                            </div>
                            <div className="lm-form-group">
                                <label>Mô tả / Đề bài</label>
                                <textarea
                                    rows="3"
                                    value={exerciseForm.description}
                                    onChange={(e) => setExerciseForm({ ...exerciseForm, description: e.target.value })}
                                />
                            </div>
                            <div className="lm-modal__footer">
                                <button type="button" className="lm-btn cm-btn--ghost" onClick={() => setShowExerciseFormModal(false)}>Hủy</button>
                                <button type="submit" className="lm-btn lm-btn--primary" disabled={savingExercise}>
                                    {savingExercise ? "Đang lưu..." : "Lưu bài tập"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 4: POPUP QUẢN LÝ TESTCASES */}
            {selectedExerciseForTestCases && (
                <div className="lm-modal-backdrop" onClick={() => setSelectedExerciseForTestCases(null)}>
                    <div className="lm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="lm-modal__header">
                            <h3>TestCases: {selectedExerciseForTestCases.title}</h3>
                            <button type="button" className="lm-modal__close" onClick={() => setSelectedExerciseForTestCases(null)}>
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>
                        <div className="lm-modal__body">
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                                <strong>Tổng số: {testCases.length} TestCases</strong>
                                <button
                                    type="button"
                                    className="lm-btn lm-btn--primary lm-btn--sm"
                                    onClick={() => handleOpenTestCaseForm()}
                                >
                                    <FontAwesomeIcon icon={faPlus} /> Thêm TestCase
                                </button>
                            </div>
                            {loadingTestCases ? (
                                <Loading text="Đang tải TestCases..." />
                            ) : testCases.length === 0 ? (
                                <p style={{ textAlign: "center", color: "#64748b" }}>Bài tập này chưa có TestCase nào.</p>
                            ) : (
                                testCases.map((tc) => (
                                    <div key={tc.id} className="lm-exercise-item">
                                        <div>
                                            <div><strong>Input:</strong> {tc.input || "(Trống)"}</div>
                                            <div><strong>Expected:</strong> {tc.expectedOutput}</div>
                                            <small style={{ color: "#64748b" }}>Điểm: {tc.points} | {tc.hidden ? "Ẩn" : "Hiện"}</small>
                                        </div>
                                        <div style={{ display: "flex", gap: "4px" }}>
                                            <button type="button" className="lm-icon-btn" onClick={() => handleOpenTestCaseForm(tc)}>
                                                <FontAwesomeIcon icon={faPenToSquare} />
                                            </button>
                                            <button type="button" className="lm-icon-btn lm-icon-btn--danger" onClick={() => handleDeleteTestCase(tc.id)}>
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 5: FORM THÊM / SỬA TESTCASE */}
            {showTestCaseFormModal && (
                <div className="lm-modal-backdrop" onClick={() => setShowTestCaseFormModal(false)}>
                    <div className="lm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="lm-modal__header">
                            <h3>{editingTestCase ? "Sửa TestCase" : "Thêm TestCase"}</h3>
                            <button type="button" className="lm-modal__close" onClick={() => setShowTestCaseFormModal(false)}>
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveTestCase} className="lm-modal__body">
                            <div className="lm-form-group">
                                <label>Input</label>
                                <textarea
                                    rows="2"
                                    value={testCaseForm.input}
                                    onChange={(e) => setTestCaseForm({ ...testCaseForm, input: e.target.value })}
                                />
                            </div>
                            <div className="lm-form-group">
                                <label>Expected Output *</label>
                                <textarea
                                    rows="2"
                                    required
                                    value={testCaseForm.expectedOutput}
                                    onChange={(e) => setTestCaseForm({ ...testCaseForm, expectedOutput: e.target.value })}
                                />
                            </div>
                            <div className="lm-form-row">
                                <div className="lm-form-group">
                                    <label>Điểm số *</label>
                                    <input
                                        type="number"
                                        required
                                        value={testCaseForm.points}
                                        onChange={(e) => setTestCaseForm({ ...testCaseForm, points: e.target.value })}
                                    />
                                </div>
                                <div className="lm-form-group">
                                    <label>Loại TestCase</label>
                                    <select
                                        value={testCaseForm.hidden}
                                        onChange={(e) => setTestCaseForm({ ...testCaseForm, hidden: e.target.value === "true" })}
                                    >
                                        <option value="false">Công khai (Public)</option>
                                        <option value="true">Ẩn (Hidden)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="lm-modal__footer">
                                <button type="button" className="lm-btn lm-btn--ghost" onClick={() => setShowTestCaseFormModal(false)}>Hủy</button>
                                <button type="submit" className="lm-btn lm-btn--primary">Lưu TestCase</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}