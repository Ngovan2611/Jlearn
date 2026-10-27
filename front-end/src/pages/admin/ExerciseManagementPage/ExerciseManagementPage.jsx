import { useEffect, useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faRotate,
    faMagnifyingGlass,
    faXmark,
    faPenToSquare,
    faTrash,
    faVial,
    faFolderOpen,
    faChevronLeft,
    faChevronRight
} from "@fortawesome/free-solid-svg-icons";

import adminExerciseService from "../../../services/admin/adminExerciseService";
import adminCourseService from "../../../services/admin/adminCourseService";
import Loading from "../../../components/common/Loading/Loading";
import "./ExerciseManagementPage.css";

const PAGE_SIZE = 10;

export default function ExerciseManagementPage() {
    const [exercises, setExercises] = useState([]);
    const [lessonsList, setLessonsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    // Bộ lọc & Phân trang từ Server
    const [keywordInput, setKeywordInput] = useState("");
    const [activeKeyword, setActiveKeyword] = useState("");
    const [selectedLessonId, setSelectedLessonId] = useState("");
    const [difficultyFilter, setDifficultyFilter] = useState("ALL");
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    // Modal Form Bài tập
    const [showExerciseModal, setShowExerciseModal] = useState(false);
    const [editingExercise, setEditingExercise] = useState(null);
    const [exerciseForm, setExerciseForm] = useState({
        title: "",
        description: "",
        difficulty: "EASY",
        language: "JAVA",
        timeLimit: 1000,
        memoryLimit: 256,
        lessonId: null,
        courseId: null,
        published: true
    });
    const [saving, setSaving] = useState(false);

    // Modal TestCases
    const [selectedExerciseForTestCases, setSelectedExerciseForTestCases] = useState(null);
    const [testCases, setTestCases] = useState([]);
    const [loadingTestCases, setLoadingTestCases] = useState(false);

    // Modal Form TestCase
    const [showTestCaseModal, setShowTestCaseModal] = useState(false);
    const [editingTestCase, setEditingTestCase] = useState(null);
    const [testCaseForm, setTestCaseForm] = useState({
        input: "",
        expectedOutput: "",
        points: 10,
        hidden: false
    });

    // 1. Tải danh sách bài học
    const fetchLessons = useCallback(async () => {
        try {
            const res = await adminCourseService.getAllLessonsPaging({ page: 0, size: 200 });
            const data = res.data?.result?.data || res.result?.data || [];
            setLessonsList(data);
        } catch (err) {
            console.error("Lỗi tải bài học:", err);
        }
    }, []);

    // 2. Tải bài tập phân trang kết hợp Bộ lọc
    const fetchExercises = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await adminExerciseService.getAllExercisesPaging({
                page,
                size: PAGE_SIZE,
                keyword: activeKeyword.trim(),
                lessonId: selectedLessonId,
                difficulty: difficultyFilter
            });

            const pageResult = res.data?.result || res.result;
            if (pageResult) {
                setExercises(pageResult.data || []);
                setTotalPages(Math.max(1, pageResult.totalPages || 1));
                setTotalElements(pageResult.totalElements || 0);
            }
        } catch (err) {
            console.error("Lỗi tải bài tập:", err);
            setError("Không thể tải danh sách bài tập.");
        } finally {
            setLoading(false);
        }
    }, [page, activeKeyword, selectedLessonId, difficultyFilter]);

    useEffect(() => {
        let isMounted = true;
        (async () => {
            if (isMounted) {
                await fetchLessons();
                await fetchExercises();
            }
        })();
        return () => { isMounted = false; };
    }, [fetchLessons, fetchExercises]);

    // Xử lý Tìm kiếm
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(0);
        setActiveKeyword(keywordInput);
    };

    // Mở Form Thêm / Sửa Bài tập
    const handleOpenExerciseModal = (ex = null) => {
        if (ex) {
            setEditingExercise(ex);
            setExerciseForm({
                title: ex.title || "",
                description: ex.description || "",
                difficulty: ex.difficulty || "EASY",
                language: ex.language || "JAVA",
                timeLimit: ex.timeLimit || 1000,
                memoryLimit: ex.memoryLimit || 256,
                lessonId: ex.lessonId || null,
                courseId: ex.courseId || null,
                published: ex.published ?? true
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
                lessonId: selectedLessonId || null,
                courseId: null,
                published: true
            });
        }
        setShowExerciseModal(true);
    };

    const handleSaveExercise = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...exerciseForm,
                lessonId: exerciseForm.lessonId || null,
                courseId: exerciseForm.courseId || null,
                timeLimit: Number(exerciseForm.timeLimit),
                memoryLimit: Number(exerciseForm.memoryLimit)
            };

            if (editingExercise) {
                await adminExerciseService.updateExercise(editingExercise.id, payload);
                setNotice("Cập nhật bài tập thành công!");
            } else {
                await adminExerciseService.createExercise(payload);
                setNotice("Tạo mới bài tập thành công!");
            }
            setShowExerciseModal(false);
            fetchExercises();
        } catch (err) {
            setError(err.response?.data?.message || "Lỗi khi lưu bài tập!");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteExercise = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa bài tập này?")) return;
        try {
            await adminExerciseService.deleteExercise(id);
            setNotice("Xóa bài tập thành công!");
            fetchExercises();
        } catch (err) {
            setError(err.response?.data?.message || "Không thể xóa bài tập.");
        }
    };

    // Thao tác TestCases
    const handleOpenTestCasesModal = async (ex) => {
        setSelectedExerciseForTestCases(ex);
        setLoadingTestCases(true);
        try {
            const res = await adminExerciseService.getTestCases(ex.id);
            const data = res.data?.result || res.data || [];
            setTestCases(Array.isArray(data) ? data : []);
        } catch {
            setTestCases([]);
        } finally {
            setLoadingTestCases(false);
        }
    };

    const handleOpenTestCaseForm = (tc = null) => {
        if (tc) {
            setEditingTestCase(tc);
            setTestCaseForm({
                input: tc.input || "",
                expectedOutput: tc.expectedOutput || "",
                points: tc.points || 10,
                hidden: tc.hidden ?? false
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
        setShowTestCaseModal(true);
    };

    const handleSaveTestCase = async (e) => {
        e.preventDefault();
        if (!selectedExerciseForTestCases) return;
        try {
            const payload = { ...testCaseForm, points: Number(testCaseForm.points) };
            if (editingTestCase) {
                await adminExerciseService.updateTestCase(selectedExerciseForTestCases.id, editingTestCase.id, payload);
            } else {
                await adminExerciseService.addTestCase(selectedExerciseForTestCases.id, payload);
            }
            setShowTestCaseModal(false);
            handleOpenTestCasesModal(selectedExerciseForTestCases);
        } catch (err) {
            alert(err.response?.data?.message || "Không thể lưu TestCase.");
        }
    };

    const handleDeleteTestCase = async (tcId) => {
        if (!window.confirm("Xóa TestCase này?")) return;
        try {
            await adminExerciseService.deleteTestCase(selectedExerciseForTestCases.id, tcId);
            setTestCases((prev) => prev.filter((tc) => tc.id !== tcId));
        } catch {
            alert("Lỗi khi xóa TestCase.");
        }
    };

    return (
        <div className="em-container">
            {/* Header */}
            <div className="em-header">
                <div>
                    <span className="em-eyebrow">QUẢN TRỊ NỘI DUNG</span>
                    <h2 className="em-title">Quản lý bài tập lập trình</h2>
                    <p className="em-subtitle">
                        Danh sách bài tập lập trình, phân trang từ server và quản lý bộ TestCases.
                    </p>
                </div>
                <div>
                    <button type="button" className="em-btn em-btn--primary" onClick={() => handleOpenExerciseModal()}>
                        <FontAwesomeIcon icon={faPlus} /> Thêm bài tập
                    </button>
                </div>
            </div>

            {/* Alert */}
            {error && <div className="em-alert em-alert--error"><span>{error}</span><button type="button" onClick={() => setError("")}><FontAwesomeIcon icon={faXmark} /></button></div>}
            {notice && <div className="em-alert em-alert--success"><span>{notice}</span><button type="button" onClick={() => setNotice("")}><FontAwesomeIcon icon={faXmark} /></button></div>}

            {/* Panel */}
            <section className="em-panel">
                <div className="em-toolbar">
                    <form className="em-search-form" onSubmit={handleSearchSubmit}>
                        <div className="em-search-input">
                            <FontAwesomeIcon icon={faMagnifyingGlass} className="em-search-icon" />
                            <input
                                type="search"
                                value={keywordInput}
                                onChange={(e) => setKeywordInput(e.target.value)}
                                placeholder="Tìm kiếm theo tiêu đề..."
                            />
                        </div>

                        <button type="submit" className="em-btn em-btn--primary">Tìm kiếm</button>

                        {/* Filter theo Lesson */}
                        <select
                            className="em-select-filter"
                            value={selectedLessonId}
                            onChange={(e) => {
                                setSelectedLessonId(e.target.value);
                                setPage(0);
                            }}
                        >
                            <option value="">-- Tất cả bài học --</option>
                            {lessonsList.map((l) => (
                                <option key={l.id} value={l.id}>{l.title}</option>
                            ))}
                        </select>

                        {/* Filter theo Độ khó */}
                        <select
                            className="em-select-filter"
                            value={difficultyFilter}
                            onChange={(e) => {
                                setDifficultyFilter(e.target.value);
                                setPage(0);
                            }}
                        >
                            <option value="ALL">-- Tất cả độ khó --</option>
                            <option value="EASY">Dễ (EASY)</option>
                            <option value="MEDIUM">Trung bình (MEDIUM)</option>
                            <option value="HARD">Khó (HARD)</option>
                        </select>

                        <button type="button" className="em-btn em-btn--outline" onClick={fetchExercises}>
                            <FontAwesomeIcon icon={faRotate} /> Làm mới
                        </button>
                    </form>
                </div>

                {/* Table */}
                <div className="em-table-wrapper">
                    <table className="em-table">
                        <thead>
                            <tr>
                                <th>STT</th>
                                <th>TIÊU ĐỀ BÀI TẬP</th>
                                <th>ĐỘ KHÓ</th>
                                <th>NGÔN NGỮ</th>
                                <th>GIỚI HẠN</th>
                                <th style={{ textAlign: "right", paddingRight: "24px" }}>THAO TÁC</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: "center", padding: "40px" }}>
                                        <Loading text="Đang tải bài tập..." />
                                    </td>
                                </tr>
                            ) : exercises.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: "center", padding: "40px" }}>
                                        <div style={{ color: "#64748b" }}>
                                            <FontAwesomeIcon icon={faFolderOpen} style={{ fontSize: "32px", marginBottom: "8px" }} />
                                            <p>Không tìm thấy bài tập nào.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                exercises.map((ex, index) => (
                                    <tr key={ex.id}>
                                        <td>{page * PAGE_SIZE + index + 1}</td>
                                        <td><strong>{ex.title}</strong></td>
                                        <td>
                                            <span className={`em-badge-diff ${ex.difficulty?.toLowerCase()}`}>
                                                {ex.difficulty}
                                            </span>
                                        </td>
                                        <td><span className="em-code-badge">{ex.language || "JAVA"}</span></td>
                                        <td>{ex.timeLimit}ms / {ex.memoryLimit}MB</td>
                                        <td>
                                            <div className="em-actions">
                                                <button
                                                    type="button"
                                                    className="em-btn-action em-btn-action--testcase"
                                                    onClick={() => handleOpenTestCasesModal(ex)}
                                                >
                                                    <FontAwesomeIcon icon={faVial} /> TestCases
                                                </button>
                                                <button
                                                    type="button"
                                                    className="em-btn-action em-btn-action--edit"
                                                    onClick={() => handleOpenExerciseModal(ex)}
                                                >
                                                    <FontAwesomeIcon icon={faPenToSquare} /> Sửa
                                                </button>
                                                <button
                                                    type="button"
                                                    className="em-btn-action em-btn-action--delete"
                                                    onClick={() => handleDeleteExercise(ex.id)}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} /> Xóa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* THANH PHÂN TRANG (PAGINATION BAR) */}
                {totalPages > 1 && (
                    <div className="em-pagination">
                        <div className="em-pagination__info">
                            Trang <strong>{page + 1}</strong> / <strong>{totalPages}</strong> (Tổng <strong>{totalElements}</strong> bài tập)
                        </div>
                        <div className="em-pagination__controls">
                            <button
                                type="button"
                                className="em-pagination__btn"
                                disabled={page === 0}
                                onClick={() => setPage((p) => p - 1)}
                            >
                                <FontAwesomeIcon icon={faChevronLeft} /> Trước
                            </button>
                            <button
                                type="button"
                                className="em-pagination__btn"
                                disabled={page + 1 >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Sau <FontAwesomeIcon icon={faChevronRight} />
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {/* MODAL: TẠO / SỬA BÀI TẬP */}
            {showExerciseModal && (
                <div className="em-modal-backdrop" onClick={() => setShowExerciseModal(false)}>
                    <div className="em-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="em-modal__header">
                            <h3>{editingExercise ? "Sửa Bài Tập" : "Tạo Bài Tập Mới"}</h3>
                            <button type="button" className="em-modal__close" onClick={() => setShowExerciseModal(false)}>
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveExercise} className="em-modal__body">
                            <div className="em-form-group">
                                <label>Tiêu đề bài tập *</label>
                                <input
                                    type="text"
                                    required
                                    value={exerciseForm.title}
                                    onChange={(e) => setExerciseForm({ ...exerciseForm, title: e.target.value })}
                                />
                            </div>

                            <div className="em-form-group">
                                <label>Thuộc Bài Học (Không bắt buộc)</label>
                                <select
                                    value={exerciseForm.lessonId || ""}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (!val) {
                                            setExerciseForm({ ...exerciseForm, lessonId: null, courseId: null });
                                        } else {
                                            const l = lessonsList.find((x) => x.id === val);
                                            setExerciseForm({ ...exerciseForm, lessonId: val, courseId: l?.courseId || null });
                                        }
                                    }}
                                >
                                    <option value="">-- Bài tập tự do (Không thuộc bài học) --</option>
                                    {lessonsList.map((l) => (
                                        <option key={l.id} value={l.id}>{l.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="em-form-row">
                                <div className="em-form-group">
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
                                <div className="em-form-group">
                                    <label>Ngôn ngữ</label>
                                    <input type="text" value={exerciseForm.language} disabled />
                                </div>
                            </div>

                            <div className="em-form-row">
                                <div className="em-form-group">
                                    <label>Thời gian tối đa (ms)</label>
                                    <input
                                        type="number"
                                        value={exerciseForm.timeLimit}
                                        onChange={(e) => setExerciseForm({ ...exerciseForm, timeLimit: e.target.value })}
                                    />
                                </div>
                                <div className="em-form-group">
                                    <label>Bộ nhớ tối đa (MB)</label>
                                    <input
                                        type="number"
                                        value={exerciseForm.memoryLimit}
                                        onChange={(e) => setExerciseForm({ ...exerciseForm, memoryLimit: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="em-form-group">
                                <label>Mô tả / Đề bài chi tiết</label>
                                <textarea
                                    rows="4"
                                    value={exerciseForm.description}
                                    onChange={(e) => setExerciseForm({ ...exerciseForm, description: e.target.value })}
                                />
                            </div>

                            <div className="em-modal__footer">
                                <button type="button" className="em-btn em-btn--ghost" onClick={() => setShowExerciseModal(false)}>Hủy</button>
                                <button type="submit" className="em-btn em-btn--primary" disabled={saving}>
                                    {saving ? "Đang lưu..." : "Lưu bài tập"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: DANH SÁCH TESTCASES */}
            {selectedExerciseForTestCases && (
                <div className="em-modal-backdrop" onClick={() => setSelectedExerciseForTestCases(null)}>
                    <div className="em-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="em-modal__header">
                            <h3>TestCases: {selectedExerciseForTestCases.title}</h3>
                            <button type="button" className="em-modal__close" onClick={() => setSelectedExerciseForTestCases(null)}>
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>
                        <div className="em-modal__body">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <strong>Tổng số: {testCases.length} TestCases</strong>
                                <button
                                    type="button"
                                    className="em-btn em-btn--primary em-btn--sm"
                                    onClick={() => handleOpenTestCaseForm()}
                                >
                                    <FontAwesomeIcon icon={faPlus} /> Thêm TestCase
                                </button>
                            </div>

                            {loadingTestCases ? (
                                <Loading text="Đang tải TestCases..." />
                            ) : testCases.length === 0 ? (
                                <p style={{ textAlign: "center", color: "#64748b", padding: "20px" }}>Chưa có TestCase nào.</p>
                            ) : (
                                testCases.map((tc) => (
                                    <div key={tc.id} style={{ padding: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", display: "flex", justifyContent: "space-between" }}>
                                        <div>
                                            <div><strong>Input:</strong> {tc.input || "(Trống)"}</div>
                                            <div><strong>Output:</strong> {tc.expectedOutput}</div>
                                            <small style={{ color: "#64748b" }}>Điểm: {tc.points} | {tc.hidden ? "Ẩn" : "Công khai"}</small>
                                        </div>
                                        <div style={{ display: "flex", gap: "4px" }}>
                                            <button type="button" className="em-btn-action em-btn-action--edit" onClick={() => handleOpenTestCaseForm(tc)}>
                                                <FontAwesomeIcon icon={faPenToSquare} />
                                            </button>
                                            <button type="button" className="em-btn-action em-btn-action--delete" onClick={() => handleDeleteTestCase(tc.id)}>
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

            {/* MODAL: TẠO / SỬA TESTCASE */}
            {showTestCaseModal && (
                <div className="em-modal-backdrop" onClick={() => setShowTestCaseModal(false)}>
                    <div className="em-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="em-modal__header">
                            <h3>{editingTestCase ? "Sửa TestCase" : "Thêm TestCase Mới"}</h3>
                            <button type="button" className="em-modal__close" onClick={() => setShowTestCaseModal(false)}>
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveTestCase} className="em-modal__body">
                            <div className="em-form-group">
                                <label>Input</label>
                                <textarea
                                    rows="2"
                                    value={testCaseForm.input}
                                    onChange={(e) => setTestCaseForm({ ...testCaseForm, input: e.target.value })}
                                />
                            </div>
                            <div className="em-form-group">
                                <label>Expected Output *</label>
                                <textarea
                                    rows="2"
                                    required
                                    value={testCaseForm.expectedOutput}
                                    onChange={(e) => setTestCaseForm({ ...testCaseForm, expectedOutput: e.target.value })}
                                />
                            </div>
                            <div className="em-form-row">
                                <div className="em-form-group">
                                    <label>Điểm số</label>
                                    <input
                                        type="number"
                                        required
                                        value={testCaseForm.points}
                                        onChange={(e) => setTestCaseForm({ ...testCaseForm, points: e.target.value })}
                                    />
                                </div>
                                <div className="em-form-group">
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
                            <div className="em-modal__footer">
                                <button type="button" className="em-btn em-btn--ghost" onClick={() => setShowTestCaseModal(false)}>Hủy</button>
                                <button type="submit" className="em-btn em-btn--primary">Lưu TestCase</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}