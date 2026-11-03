import { useEffect, useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faBook,
    faPlus,
    faRotate,
    faMagnifyingGlass,
    faXmark,
    faPenToSquare,
    faTrash,
    faListCheck,
    faFolderOpen,
    faChevronLeft,
    faChevronRight,
    faVideo,
    faEye,
    faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";

import adminCourseService from "../../../services/admin/adminCourseService";
import Loading from "../../../components/common/Loading/Loading";
import "./CourseManagementPage.css";

const PAGE_SIZE = 8;

export default function CourseManagementPage() {
    // State Danh sách khóa học & Phân trang từ Backend
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const [keywordInput, setKeywordInput] = useState("");
    const [activeKeyword, setActiveKeyword] = useState("");
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    // State Modal Thêm/Sửa Khóa Học
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [courseForm, setCourseForm] = useState({
        title: "",
        categoryId: "",
        description: "",
        thumbnail: "",
        level: "BEGINNER",
        instructorId: "",
        price: 0,
    });
    const [skillsInput, setSkillsInput] = useState("");
    const [savingCourse, setSavingCourse] = useState(false);

    // State Modal Quản lý Bài Học (Lessons)
    const [selectedCourseForLessons, setSelectedCourseForLessons] =
        useState(null);
    const [lessons, setLessons] = useState([]);
    const [loadingLessons, setLoadingLessons] = useState(false);
    const [showLessonFormModal, setShowLessonFormModal] = useState(false);
    const [editingLesson, setEditingLesson] = useState(null);
    const [lessonForm, setLessonForm] = useState({
        title: "",
        description: "",
        content: "",
        videoUrl: "",
        lessonOrder: 1,
    });
    const [savingLesson, setSavingLesson] = useState(false);

    // 1. Tải danh sách khóa học bất đồng bộ
    const fetchCourses = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const response = await adminCourseService.getAllCourses({
                page,
                size: PAGE_SIZE,
                keyword: activeKeyword.trim(),
            });

            const pageResult = response.data?.result || response.result;
            if (pageResult) {
                setCourses(pageResult.data || []);
                setTotalPages(Math.max(1, pageResult.totalPages || 1));
                setTotalElements(pageResult.totalElements || 0);
            }
        } catch (err) {
            console.error("Lỗi khi tải danh sách khóa học:", err);
            setError(
                err.response?.data?.message || "Không thể tải danh sách khóa học.",
            );
        } finally {
            setLoading(false);
        }
    }, [page, activeKeyword]);

    useEffect(() => {
        let isMounted = true;

        (async () => {
            if (isMounted) {
                await fetchCourses();
            }
        })();

        return () => {
            isMounted = false;
        };
    }, [fetchCourses]);

    // 2. Xử lý Form Tìm Kiếm
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

    // 3. Mở Modal Khóa Học
    const handleOpenCourseModal = (course = null) => {
        if (course) {
            setEditingCourse(course);

            setCourseForm({
                title: course.title || "",
                categoryId: course.categoryId || "",
                description: course.description || "",
                thumbnail: course.thumbnail || "",
                level: course.level || "BEGINNER",
                instructorId: course.instructorId || "",
                price: course.price ?? 0,
            });
            setSkillsInput(
                Array.isArray(course.skills) ? course.skills.join(", ") : "",
            );
        } else {
            setEditingCourse(null);

            setCourseForm({
                title: "",
                categoryId: "",
                description: "",
                thumbnail: "",
                level: "BEGINNER",
                instructorId: "",
                price: 0,
            });
            setSkillsInput("");
        }

        setShowCourseModal(true);
    };

    // 4. Lưu Khóa Học
    const handleSaveCourse = async (e) => {
        e.preventDefault();
        setSavingCourse(true);
        setError("");
        setNotice("");

        const payload = {
            ...courseForm,
            title: courseForm.title.trim(),
            skills: skillsInput
                .split(",")
                .map((skill) => skill.trim())
                .filter(Boolean),
            price: Number(courseForm.price) || 0,
        };

        try {
            if (editingCourse) {
                await adminCourseService.updateCourse(editingCourse.id, payload);
                setNotice("Cập nhật khóa học thành công!");
            } else {
                await adminCourseService.createCourse(payload);
                setNotice("Tạo mới khóa học thành công!");
            }
            setShowCourseModal(false);
            fetchCourses();
        } catch (err) {
            console.error("Lỗi lưu khóa học:", err);
            setError(
                err.response?.data?.message || "Không thể lưu thông tin khóa học.",
            );
        } finally {
            setSavingCourse(false);
        }
    };

    // ⚡ 5. Xử lý Ẩn / Hiện Khóa học
    const handleToggleCourseStatus = async (courseId) => {
        try {
            const res = await adminCourseService.toggleCourseStatus(courseId);
            const updatedCourse = res.data?.result || res.result;

            setCourses((prev) =>
                prev.map((c) =>
                    c.id === courseId
                        ? { ...c, published: updatedCourse?.published ?? !c.published }
                        : c,
                ),
            );
            setNotice("Đã thay đổi trạng thái ẩn/hiện của khóa học!");
        } catch (err) {
            console.error("Lỗi thay đổi trạng thái khóa học:", err);
            setError(
                err.response?.data?.message || "Không thể chuyển trạng thái khóa học.",
            );
        }
    };

    // 6. Quản lý Bài học (Lessons)
    const handleOpenLessonsModal = async (course) => {
        setSelectedCourseForLessons(course);
        setLoadingLessons(true);
        setLessons([]);
        try {
            const res = await adminCourseService.getLessonsByCourseId(course.id);
            const data = res.data?.result || res.result || [];
            setLessons(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Lỗi tải bài học:", err);
            setLessons([]);
        } finally {
            setLoadingLessons(false);
        }
    };

    const handleOpenLessonForm = (lesson = null) => {
        if (lesson) {
            setEditingLesson(lesson);
            setLessonForm({
                title: lesson.title || "",
                description: lesson.description || "",
                content: lesson.content || "",
                videoUrl: lesson.videoUrl || "",
                lessonOrder: lesson.lessonOrder || lessons.length + 1,
            });
        } else {
            setEditingLesson(null);
            setLessonForm({
                title: "",
                description: "",
                content: "",
                videoUrl: "",
                lessonOrder: lessons.length + 1,
            });
        }
        setShowLessonFormModal(true);
    };

    const handleSaveLesson = async (e) => {
        e.preventDefault();
        if (!selectedCourseForLessons) return;
        setSavingLesson(true);

        const payload = {
            ...lessonForm,
            courseId: selectedCourseForLessons.id,
            lessonOrder: Number(lessonForm.lessonOrder) || 1,
        };

        try {
            if (editingLesson) {
                await adminCourseService.updateLesson(editingLesson.id, payload);
            } else {
                await adminCourseService.createLesson(payload);
            }
            setShowLessonFormModal(false);
            const res = await adminCourseService.getLessonsByCourseId(
                selectedCourseForLessons.id,
            );
            const data = res.data?.result || res.result || [];
            setLessons(Array.isArray(data) ? data : []);
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi khi lưu bài học!");
        } finally {
            setSavingLesson(false);
        }
    };

    const handleDeleteLesson = async (lessonId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa bài học này?")) return;
        try {
            await adminCourseService.deleteLesson(lessonId);
            setLessons((prev) => prev.filter((l) => l.id !== lessonId));
        } catch (err) {
            alert(err.response?.data?.message || "Không thể xóa bài học.");
        }
    };

    // ⚡ 7. Xử lý Ẩn / Hiện Bài học
    const handleToggleLessonStatus = async (lessonId) => {
        try {
            const res = await adminCourseService.toggleLessonStatus(lessonId);
            const updatedLesson = res.data?.result || res.result;

            setLessons((prev) =>
                prev.map((l) =>
                    l.id === lessonId
                        ? { ...l, published: updatedLesson?.published ?? !l.published }
                        : l,
                ),
            );
        } catch (err) {
            console.error("Lỗi thay đổi trạng thái bài học:", err);
            alert(
                err.response?.data?.message || "Không thể chuyển trạng thái bài học.",
            );
        }
    };

    return (
        <div className="cm-container">
            {/* Header Trang */}
            <div className="cm-header">
                <div>
                    <span className="cm-eyebrow">QUẢN TRỊ NỘI DUNG</span>
                    <h2 className="cm-title">Quản lý khóa học & bài học</h2>
                    <p className="cm-subtitle">
                        Tạo mới, chỉnh sửa, ẩn/hiện khóa học và thiết lập danh mục các bài
                        học chi tiết.
                    </p>
                </div>

                <div className="cm-header__actions">
                    <button
                        type="button"
                        className="cm-btn cm-btn--primary"
                        onClick={() => handleOpenCourseModal()}
                    >
                        <FontAwesomeIcon icon={faPlus} /> Thêm khóa học
                    </button>
                    <button
                        type="button"
                        className="cm-btn cm-btn--outline"
                        onClick={fetchCourses}
                        disabled={loading}
                    >
                        <FontAwesomeIcon icon={faRotate} /> Làm mới
                    </button>
                </div>
            </div>

            {/* Thông báo Alert */}
            {error && (
                <div className="cm-alert cm-alert--error">
                    <span>{error}</span>
                    <button type="button" onClick={() => setError("")}>
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>
            )}
            {notice && (
                <div className="cm-alert cm-alert--success">
                    <span>{notice}</span>
                    <button type="button" onClick={() => setNotice("")}>
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>
            )}

            {/* Panel Bảng dữ liệu */}
            <section className="cm-panel">
                <div className="cm-toolbar">
                    <form className="cm-search-form" onSubmit={handleSearchSubmit}>
                        <div className="cm-search-input">
                            <FontAwesomeIcon
                                icon={faMagnifyingGlass}
                                className="cm-search-icon"
                            />
                            <input
                                type="search"
                                value={keywordInput}
                                onChange={(e) => setKeywordInput(e.target.value)}
                                placeholder="Nhập tên khóa học hoặc Category ID..."
                            />
                        </div>
                        <button type="submit" className="cm-btn cm-btn--primary">
                            Tìm kiếm
                        </button>
                        {activeKeyword && (
                            <button
                                type="button"
                                className="cm-btn cm-btn--ghost"
                                onClick={handleResetSearch}
                            >
                                Xóa lọc
                            </button>
                        )}
                    </form>
                </div>

                {/* Bảng Dữ Liệu Khóa Học */}
                <div className="cm-table-wrapper">
                    <table className="cm-table">
                        <thead>
                            <tr>
                                <th>STT</th>
                                <th>THUMBNAIL & TÊN KHÓA HỌC</th>
                                <th>CATEGORY ID</th>
                                <th>TRÌNH ĐỘ</th>
                                <th>GIÁ BÁN</th>
                                <th>TRẠNG THÁI</th>
                                <th className="cm-table__actions-head">THAO TÁC</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="cm-table__empty">
                                        <Loading text="Đang tải danh sách khóa học..." />
                                    </td>
                                </tr>
                            ) : courses.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="cm-table__empty">
                                        <div className="cm-empty-state">
                                            <FontAwesomeIcon
                                                icon={faFolderOpen}
                                                className="cm-empty-icon"
                                            />
                                            <strong>Không tìm thấy khóa học nào</strong>
                                            <p>
                                                Thử tìm kiếm với từ khóa khác hoặc bấm nút "Thêm khóa
                                                học".
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                courses.map((course, index) => (
                                    <tr key={course.id}>
                                        <td>{page * PAGE_SIZE + index + 1}</td>
                                        <td>
                                            <div className="cm-course-cell">
                                                <img
                                                    src={
                                                        course.thumbnail || "https://via.placeholder.com/60"
                                                    }
                                                    alt={course.title}
                                                    className="cm-course-thumb"
                                                />
                                                <div className="cm-course-info">
                                                    <strong className="cm-course-title">
                                                        {course.title}
                                                    </strong>
                                                    <span className="cm-course-id">ID: {course.id}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="cm-code-badge">
                                                {course.categoryId || "Chưa chọn"}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="cm-level-tag">
                                                {course.level || "N/A"}
                                            </span>
                                        </td>
                                        <td>
                                            <strong className="cm-price">
                                                {course.price
                                                    ? `${course.price.toLocaleString("vi-VN")} đ`
                                                    : "Miễn phí"}
                                            </strong>
                                        </td>
                                        <td>
                                            <span
                                                className={`cm-status-badge ${course.published ? "published" : "draft"}`}
                                            >
                                                {course.published ? "Đang hiện" : "Đang ẩn"}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="cm-actions">
                                                {/* ⚡ NÚT ẨN/HIỆN KHÓA HỌC */}
                                                <button
                                                    type="button"
                                                    className={`cm-btn-action ${course.published ? "cm-btn-action--hide" : "cm-btn-action--show"}`}
                                                    onClick={() => handleToggleCourseStatus(course.id)}
                                                    title={
                                                        course.published ? "Ẩn khóa học" : "Hiện khóa học"
                                                    }
                                                >
                                                    <FontAwesomeIcon
                                                        icon={course.published ? faEyeSlash : faEye}
                                                    />
                                                    {course.published ? " Ẩn" : " Hiện"}
                                                </button>

                                                <button
                                                    type="button"
                                                    className="cm-btn-action cm-btn-action--lesson"
                                                    onClick={() => handleOpenLessonsModal(course)}
                                                    title="Quản lý bài học"
                                                >
                                                    <FontAwesomeIcon icon={faListCheck} /> Bài học
                                                </button>

                                                <button
                                                    type="button"
                                                    className="cm-btn-action cm-btn-action--edit"
                                                    onClick={() => handleOpenCourseModal(course)}
                                                    title="Chỉnh sửa khóa học"
                                                >
                                                    <FontAwesomeIcon icon={faPenToSquare} /> Sửa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Phân Trang */}
                {totalPages > 1 && (
                    <div className="cm-pagination">
                        <span className="cm-pagination__info">
                            Trang <strong>{page + 1}</strong> / {totalPages} (Tổng{" "}
                            {totalElements} khóa học)
                        </span>
                        <div className="cm-pagination__btns">
                            <button
                                type="button"
                                className="cm-btn cm-btn--outline"
                                disabled={page === 0}
                                onClick={() => setPage((p) => p - 1)}
                            >
                                <FontAwesomeIcon icon={faChevronLeft} /> Trước
                            </button>
                            <button
                                type="button"
                                className="cm-btn cm-btn--outline"
                                disabled={page + 1 >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Sau <FontAwesomeIcon icon={faChevronRight} />
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {/* MODAL 1: THÊM / SỬA KHÓA HỌC */}
            {showCourseModal && (
                <div
                    className="cm-modal-backdrop"
                    onClick={() => setShowCourseModal(false)}
                >
                    <div className="cm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="cm-modal__header">
                            <h3>
                                {editingCourse ? "Chỉnh sửa khóa học" : "Tạo khóa học mới"}
                            </h3>
                            <button
                                type="button"
                                className="cm-modal__close"
                                onClick={() => setShowCourseModal(false)}
                            >
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveCourse} className="cm-modal__body">
                            <div className="cm-form-group">
                                <label>
                                    Tên khóa học <span className="req">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={courseForm.title}
                                    onChange={(e) =>
                                        setCourseForm({ ...courseForm, title: e.target.value })
                                    }
                                    placeholder="Nhập tên khóa học..."
                                />
                            </div>

                            <div className="cm-form-row">
                                <div className="cm-form-group">
                                    <label>
                                        Category ID <span className="req">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={courseForm.categoryId}
                                        onChange={(e) =>
                                            setCourseForm({
                                                ...courseForm,
                                                categoryId: e.target.value,
                                            })
                                        }
                                        placeholder="Mã danh mục..."
                                    />
                                </div>
                                <div className="cm-form-group">
                                    <label>Giá bán (VNĐ)</label>
                                    <input
                                        type="number"
                                        value={courseForm.price}
                                        onChange={(e) =>
                                            setCourseForm({ ...courseForm, price: e.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="cm-form-row">
                                <div className="cm-form-group">
                                    <label>Trình độ (Level)</label>
                                    <select
                                        value={courseForm.level}
                                        onChange={(e) =>
                                            setCourseForm({ ...courseForm, level: e.target.value })
                                        }
                                    >
                                        <option value="BEGINNER">Cơ bản (Beginner)</option>
                                        <option value="INTERMEDIATE">
                                            Trung cấp (Intermediate)
                                        </option>
                                        <option value="ADVANCED">Nâng cao (Advanced)</option>
                                    </select>
                                </div>
                                <div className="cm-form-group">
                                    <label>Instructor ID</label>
                                    <input
                                        type="text"
                                        value={courseForm.instructorId}
                                        onChange={(e) =>
                                            setCourseForm({
                                                ...courseForm,
                                                instructorId: e.target.value,
                                            })
                                        }
                                        placeholder="Mã giảng viên..."
                                    />
                                </div>
                            </div>
                            <div className="cm-form-group">
                                <label>
                                    Kỹ năng đạt được (Skills) <span className="req">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={skillsInput}
                                    onChange={(e) => setSkillsInput(e.target.value)}
                                    placeholder="Ví dụ: JAVA, OOP, SPRING_BOOT"
                                />
                                <small className="cm-form-hint">
                                    Nhập nhiều kỹ năng, phân cách bằng dấu phẩy. Kỹ năng sẽ được
                                    thêm vào hồ sơ người học khi hoàn thành 100% khóa học.
                                </small>
                            </div>
                            <div className="cm-form-group">
                                <label>URL Ảnh Thumbnail</label>
                                <input
                                    type="text"
                                    value={courseForm.thumbnail}
                                    onChange={(e) =>
                                        setCourseForm({ ...courseForm, thumbnail: e.target.value })
                                    }
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>

                            <div className="cm-form-group">
                                <label>Mô tả khóa học</label>
                                <textarea
                                    rows="3"
                                    value={courseForm.description}
                                    onChange={(e) =>
                                        setCourseForm({
                                            ...courseForm,
                                            description: e.target.value,
                                        })
                                    }
                                    placeholder="Mô tả tóm tắt nội dung khóa học..."
                                />
                            </div>

                            <div className="cm-modal__footer">
                                <button
                                    type="button"
                                    className="cm-btn cm-btn--ghost"
                                    onClick={() => setShowCourseModal(false)}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="cm-btn cm-btn--primary"
                                    disabled={savingCourse}
                                >
                                    {savingCourse ? "Đang lưu..." : "Lưu khóa học"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: QUẢN LÝ BÀI HỌC (LESSONS) */}
            {selectedCourseForLessons && (
                <div
                    className="cm-modal-backdrop"
                    onClick={() => setSelectedCourseForLessons(null)}
                >
                    <div
                        className="cm-modal cm-modal--lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="cm-modal__header">
                            <div>
                                <h3>Bài học trong: {selectedCourseForLessons.title}</h3>
                                <span className="cm-sub-text">
                                    Mã khóa học: {selectedCourseForLessons.id}
                                </span>
                            </div>
                            <button
                                type="button"
                                className="cm-modal__close"
                                onClick={() => setSelectedCourseForLessons(null)}
                            >
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>

                        <div className="cm-modal__body">
                            <div className="cm-lesson-toolbar">
                                <strong className="cm-lesson-count">
                                    Tổng số: {lessons.length} bài học
                                </strong>
                                <button
                                    type="button"
                                    className="cm-btn cm-btn--primary cm-btn--sm"
                                    onClick={() => handleOpenLessonForm()}
                                >
                                    <FontAwesomeIcon icon={faPlus} /> Thêm bài học mới
                                </button>
                            </div>

                            {loadingLessons ? (
                                <Loading text="Đang tải danh sách bài học..." />
                            ) : lessons.length === 0 ? (
                                <div className="cm-empty-state">
                                    <FontAwesomeIcon icon={faBook} className="cm-empty-icon" />
                                    <p>Khóa học này chưa có bài học nào.</p>
                                </div>
                            ) : (
                                <div className="cm-lesson-list">
                                    {lessons.map((lesson) => (
                                        <div key={lesson.id} className="cm-lesson-item">
                                            <div className="cm-lesson-order">
                                                #{lesson.lessonOrder || 1}
                                            </div>
                                            <div className="cm-lesson-info">
                                                <h4>{lesson.title}</h4>
                                                <p>{lesson.description || "Không có mô tả"}</p>
                                                {lesson.videoUrl && (
                                                    <a
                                                        href={lesson.videoUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="cm-lesson-video-link"
                                                    >
                                                        <FontAwesomeIcon icon={faVideo} /> Xem Video
                                                    </a>
                                                )}
                                            </div>
                                            <div className="cm-lesson-actions">
                                                {/* ⚡ NÚT ẨN/HIỆN BÀI HỌC */}
                                                <button
                                                    type="button"
                                                    className={`cm-icon-btn ${lesson.published ? "cm-icon-btn--active" : "cm-icon-btn--hidden"}`}
                                                    onClick={() => handleToggleLessonStatus(lesson.id)}
                                                    title={
                                                        lesson.published ? "Ẩn bài học" : "Hiện bài học"
                                                    }
                                                >
                                                    <FontAwesomeIcon
                                                        icon={lesson.published ? faEye : faEyeSlash}
                                                    />
                                                </button>

                                                <button
                                                    type="button"
                                                    className="cm-icon-btn"
                                                    onClick={() => handleOpenLessonForm(lesson)}
                                                >
                                                    <FontAwesomeIcon icon={faPenToSquare} />
                                                </button>

                                                <button
                                                    type="button"
                                                    className="cm-icon-btn cm-icon-btn--danger"
                                                    onClick={() => handleDeleteLesson(lesson.id)}
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

            {/* MODAL 3: FORM THÊM / SỬA BÀI HỌC */}
            {showLessonFormModal && (
                <div
                    className="cm-modal-backdrop"
                    onClick={() => setShowLessonFormModal(false)}
                >
                    <div className="cm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="cm-modal__header">
                            <h3>{editingLesson ? "Sửa bài học" : "Thêm bài học mới"}</h3>
                            <button
                                type="button"
                                className="cm-modal__close"
                                onClick={() => setShowLessonFormModal(false)}
                            >
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveLesson} className="cm-modal__body">
                            <div className="cm-form-group">
                                <label>
                                    Tiêu đề bài học <span className="req">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={lessonForm.title}
                                    onChange={(e) =>
                                        setLessonForm({ ...lessonForm, title: e.target.value })
                                    }
                                    placeholder="Nhập tiêu đề bài học..."
                                />
                            </div>

                            <div className="cm-form-row">
                                <div className="cm-form-group">
                                    <label>Thứ tự bài học (Lesson Order)</label>
                                    <input
                                        type="number"
                                        value={lessonForm.lessonOrder}
                                        onChange={(e) =>
                                            setLessonForm({
                                                ...lessonForm,
                                                lessonOrder: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="cm-form-group">
                                    <label>Video URL</label>
                                    <input
                                        type="text"
                                        value={lessonForm.videoUrl}
                                        onChange={(e) =>
                                            setLessonForm({ ...lessonForm, videoUrl: e.target.value })
                                        }
                                        placeholder="https://youtube.com/..."
                                    />
                                </div>
                            </div>

                            <div className="cm-form-group">
                                <label>Mô tả bài học</label>
                                <input
                                    type="text"
                                    value={lessonForm.description}
                                    onChange={(e) =>
                                        setLessonForm({
                                            ...lessonForm,
                                            description: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div className="cm-form-group">
                                <label>Nội dung chi tiết (Content)</label>
                                <textarea
                                    rows="4"
                                    value={lessonForm.content}
                                    onChange={(e) =>
                                        setLessonForm({ ...lessonForm, content: e.target.value })
                                    }
                                    placeholder="Nội dung bài học dạng text / markdown..."
                                />
                            </div>

                            <div className="cm-modal__footer">
                                <button
                                    type="button"
                                    className="cm-btn cm-btn--ghost"
                                    onClick={() => setShowLessonFormModal(false)}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="cm-btn cm-btn--primary"
                                    disabled={savingLesson}
                                >
                                    {savingLesson ? "Đang lưu..." : "Lưu bài học"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
