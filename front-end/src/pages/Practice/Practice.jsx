import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import exerciseService from "../../services/exerciseService";
import "./Practice.css";


const PAGE_SIZE = 8;
const SEARCH_DEBOUNCE_MS = 350;

const DIFFICULTIES = [
  { value: "", label: "Tất cả độ khó" },
  { value: "EASY", label: "Dễ" },
  { value: "MEDIUM", label: "Trung bình" },
  { value: "HARD", label: "Khó" },
];

const DIFFICULTY_LABELS = {
  EASY: "Dễ",
  MEDIUM: "Trung bình",
  HARD: "Khó",
};

const DEFAULT_PAGE_INFO = {
  currentPage: 0,
  pageSize: PAGE_SIZE,
  totalPages: 0,
  totalElements: 0,
};

const normalizeDifficulty = (difficulty) =>
  String(difficulty || "").toUpperCase();

const getExerciseId = (exercise) =>
  exercise.id ?? exercise.exerciseId;

const getDifficultyLabel = (difficulty) => {
  const value = normalizeDifficulty(difficulty);
  return DIFFICULTY_LABELS[value] || difficulty || "Chưa xác định";
};

const getDifficultyClass = (difficulty) => {
  const value = normalizeDifficulty(difficulty);

  const classes = {
    EASY: "practice-difficulty--easy",
    MEDIUM: "practice-difficulty--medium",
    HARD: "practice-difficulty--hard",
  };

  return classes[value] || "practice-difficulty--default";
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  "Không thể tải danh sách bài tập. Vui lòng thử lại.";

const extractPageData = (response, fallbackPage) => {
  const result = response?.data?.result;

  // Hỗ trợ cả PageResponse và danh sách thông thường.
  const data = Array.isArray(result?.data)
    ? result.data
    : Array.isArray(result)
      ? result
      : [];

  return {
    exercises: data,
    pageInfo: {
      currentPage: result?.currentPage ?? fallbackPage,
      pageSize: result?.pageSize ?? PAGE_SIZE,
      totalPages: result?.totalPages ?? 0,
      totalElements: result?.totalElements ?? data.length,
    },
  };
};

const getExercisePoints = (exercise) => {
  if (!Array.isArray(exercise.testCases)) {
    return null;
  }

  return exercise.testCases.reduce(
    (total, testCase) => total + (Number(testCase.points) || 0),
    0
  );
};

function Practice() {
  const [exercises, setExercises] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  const [pageInfo, setPageInfo] = useState(DEFAULT_PAGE_INFO);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const searchTimeoutRef = useRef(null);
  const requestIdRef = useRef(0);

  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };
  // Hủy timer tìm kiếm khi component bị unmount.
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Tải dữ liệu khi từ khóa, độ khó, trang hoặc reloadKey thay đổi.
  // Không gọi setState đồng bộ ngay trong thân effect.
  useEffect(() => {
    const requestId = ++requestIdRef.current;
    let cancelled = false;

    const fetchExercises = async () => {
      try {
        const response = await exerciseService.getFreeExercises({
          keyword,
          difficulty,
          page: currentPage,
          size: PAGE_SIZE,
        });

        if (cancelled || requestId !== requestIdRef.current) {
          return;
        }

        const { exercises: data, pageInfo: pagination } =
          extractPageData(response, currentPage);

        setExercises(data);
        setPageInfo(pagination);
        setError("");
      } catch (err) {
        if (cancelled || requestId !== requestIdRef.current) {
          return;
        }

        console.error("Không thể tải danh sách bài tập:", err);
        setExercises([]);
        setPageInfo(DEFAULT_PAGE_INFO);
        setError(getErrorMessage(err));
      } finally {
        if (!cancelled && requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    };

    fetchExercises();

    return () => {
      cancelled = true;
    };
  }, [keyword, difficulty, currentPage, reloadKey]);

  // Debounce tìm kiếm: chỉ cập nhật bộ lọc sau khi người dùng ngừng nhập.
  const handleSearchChange = (event) => {
    const value = event.target.value;

    setSearchInput(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      const nextKeyword = value.trim();

      if (nextKeyword !== keyword || currentPage !== 0) {
        setLoading(true);
        setKeyword(nextKeyword);
        setCurrentPage(0);
      }
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleClearSearch = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setSearchInput("");

    if (keyword !== "" || currentPage !== 0) {
      setLoading(true);
      setKeyword("");
      setCurrentPage(0);
    }
  };

  const handleDifficultyChange = (event) => {
    const nextDifficulty = event.target.value;

    if (nextDifficulty === difficulty && currentPage === 0) {
      return;
    }

    setLoading(true);
    setDifficulty(nextDifficulty);
    setCurrentPage(0);
  };

  const handleResetFilters = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const filtersChanged =
      searchInput !== "" ||
      keyword !== "" ||
      difficulty !== "" ||
      currentPage !== 0;

    setSearchInput("");

    if (filtersChanged) {
      setLoading(true);
      setKeyword("");
      setDifficulty("");
      setCurrentPage(0);
    }
  };

  const handlePageChange = (page) => {
    if (
      loading ||
      page < 0 ||
      page >= pageInfo.totalPages ||
      page === currentPage
    ) {
      return;
    }

    setLoading(true);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRetry = () => {
    setLoading(true);
    setReloadKey((previous) => previous + 1);
  };

  const renderPagination = () => {
    const totalPages = pageInfo.totalPages;

    if (totalPages <= 1) {
      return null;
    }

    const startPage = Math.max(0, currentPage - 2);
    const endPage = Math.min(totalPages - 1, currentPage + 2);
    const visiblePages = [];

    for (let page = startPage; page <= endPage; page += 1) {
      visiblePages.push(page);
    }

    return (
      <nav
        className="practice-pagination"
        aria-label="Phân trang bài tập"
      >
        <button
          type="button"
          className="practice-page-arrow"
          disabled={currentPage === 0 || loading}
          onClick={() => handlePageChange(currentPage - 1)}
          aria-label="Trang trước"
        >
          ‹
        </button>

        {startPage > 0 && (
          <>
            <button
              type="button"
              className="practice-page-button"
              disabled={loading}
              onClick={() => handlePageChange(0)}
            >
              1
            </button>

            {startPage > 1 && (
              <span className="practice-page-ellipsis">…</span>
            )}
          </>
        )}

        {visiblePages.map((page) => (
          <button
            type="button"
            key={page}
            className={`practice-page-button ${page === currentPage ? "is-active" : ""
              }`}
            aria-current={
              page === currentPage ? "page" : undefined
            }
            disabled={loading}
            onClick={() => handlePageChange(page)}
          >
            {page + 1}
          </button>
        ))}

        {endPage < totalPages - 1 && (
          <>
            {endPage < totalPages - 2 && (
              <span className="practice-page-ellipsis">…</span>
            )}

            <button
              type="button"
              className="practice-page-button"
              disabled={loading}
              onClick={() => handlePageChange(totalPages - 1)}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          className="practice-page-arrow"
          disabled={currentPage >= totalPages - 1 || loading}
          onClick={() => handlePageChange(currentPage + 1)}
          aria-label="Trang sau"
        >
          ›
        </button>
      </nav>
    );
  };

  const renderExerciseCard = (exercise, index) => {
    const exerciseId = getExerciseId(exercise);
    const difficultyValue = normalizeDifficulty(exercise.difficulty);
    const points = getExercisePoints(exercise);

    const canNavigate = exerciseId != null;

    return (
      <article
        className={`practice-card ${canNavigate ? "practice-card--clickable" : ""
          }`}
        key={exerciseId ?? `${exercise.title}-${index}`}
        onClick={() => {
          if (canNavigate) {
            window.location.href = `/practice/${exerciseId}`;
          }
        }}
        onKeyDown={(event) => {
          if (
            canNavigate &&
            (event.key === "Enter" || event.key === " ")
          ) {
            event.preventDefault();
            window.location.href = `/practice/${exerciseId}`;
          }
        }}
        role={canNavigate ? "link" : undefined}
        tabIndex={canNavigate ? 0 : undefined}
        aria-label={
          canNavigate
            ? `Làm bài ${exercise.title || "Java"}`
            : undefined
        }
      >
        <div className="practice-card-top">
          <div className="practice-card-icon">
            <span aria-hidden="true">{"</>"}</span>
          </div>

          <span
            className={`practice-difficulty ${getDifficultyClass(
              difficultyValue
            )}`}
          >
            {getDifficultyLabel(difficultyValue)}
          </span>
        </div>

        <div className="practice-card-body">
          <h3 title={exercise.title}>
            {exercise.title || "Bài tập Java"}
          </h3>

        </div>

        <div className="practice-card-meta">
          <span>
            <span aria-hidden="true">⌘</span>
            {exercise.language || "Java"}
          </span>

          {points !== null && (
            <span>
              <span aria-hidden="true">★</span>
              {points} điểm
            </span>
          )}
        </div>

        <div className="practice-card-footer">
          <span className="practice-card-index">
            BÀI TẬP{" "}
            {String(currentPage * PAGE_SIZE + index + 1).padStart(
              2,
              "0"
            )}
          </span>

          <span className="practice-start-button">
            Làm bài
            <span aria-hidden="true">→</span>
          </span>
        </div>
      </article>
    );
  };


  return (
    <main className="practice-page">
      <div className="practice-container">
        <section className="practice-hero">
          <button
            type="button"
            className="practice-back-button"
            onClick={handleGoBack}
          >
            <span aria-hidden="true">←</span>
            <span>Quay lại</span>
          </button>
          <div className="practice-hero-content">
            <div
              className="practice-hero-icon"
              aria-hidden="true"
            >
              {"</>"}
            </div>

            <div className="practice-hero-text">
              <span className="practice-eyebrow">
                JAVA LEARNING PLATFORM
              </span>

              <h1>Luyện tập lập trình</h1>

              <p>
                Rèn luyện tư duy lập trình Java qua các bài tập
                thực hành theo cấp độ của bạn.
              </p>
            </div>
          </div>

          <div className="practice-hero-stat">
            <span className="practice-stat-number">
              {pageInfo.totalElements}
            </span>

            <span className="practice-stat-label">
              bài tập phù hợp
            </span>
          </div>
        </section>

        <section className="practice-toolbar">
          <div className="practice-search">
            <span
              className="practice-search-icon"
              aria-hidden="true"
            >
              ⌕
            </span>

            <input
              type="search"
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Tìm kiếm bài tập..."
              aria-label="Tìm kiếm bài tập"
            />

            {searchInput && (
              <button
                type="button"
                className="practice-clear-search"
                onClick={handleClearSearch}
                aria-label="Xóa nội dung tìm kiếm"
              >
                ×
              </button>
            )}
          </div>

          <div className="practice-filter">
            <label htmlFor="practice-difficulty">Độ khó</label>

            <select
              id="practice-difficulty"
              value={difficulty}
              onChange={handleDifficultyChange}
            >
              {DIFFICULTIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="practice-reset-button"
            onClick={handleResetFilters}
          >
            Đặt lại
          </button>
        </section>

        <section className="practice-list-section">
          <div className="practice-section-heading">
            <div>
              <h2>Danh sách bài tập</h2>

              <p>
                {loading
                  ? "Đang cập nhật danh sách..."
                  : `Tìm thấy ${pageInfo.totalElements} bài tập`}
              </p>
            </div>

            {!loading && pageInfo.totalElements > 0 && (
              <span className="practice-page-summary">
                Trang {currentPage + 1}
                {pageInfo.totalPages > 0
                  ? ` / ${pageInfo.totalPages}`
                  : ""}
              </span>
            )}
          </div>

          {loading ? (
            <div className="practice-state" role="status">
              <div className="practice-spinner" />
              <p>Đang tải bài tập...</p>
            </div>
          ) : error ? (
            <div className="practice-state practice-state--error">
              <div className="practice-state-icon">!</div>
              <h3>Không thể tải dữ liệu</h3>
              <p>{error}</p>

              <button
                type="button"
                className="practice-retry-button"
                onClick={handleRetry}
              >
                Thử lại
              </button>
            </div>
          ) : exercises.length === 0 ? (
            <div className="practice-state">
              <div className="practice-state-icon">⌕</div>
              <h3>Không tìm thấy bài tập</h3>

              <p>
                Hãy thử từ khóa khác hoặc thay đổi bộ lọc độ
                khó.
              </p>

              <button
                type="button"
                className="practice-retry-button"
                onClick={handleResetFilters}
              >
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <>
              <div className="practice-grid">
                {exercises.map(renderExerciseCard)}
              </div>

              {renderPagination()}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default Practice;
