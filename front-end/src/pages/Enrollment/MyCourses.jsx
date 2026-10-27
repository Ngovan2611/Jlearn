import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faBookOpen,
    faGraduationCap,
    faArrowRight,
    faCheck,
    faSpinner,
    faCircleExclamation,
    faCalendarDays,
    faClock,
    faPlay,
} from "@fortawesome/free-solid-svg-icons";

import Navbar from "../../components/layout/Navbar/Navbar";
import enrollmentService from "../../services/enrollmentService";

import "./MyCourses.css";


function MyCourses() {
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let ignore = false;

        enrollmentService
            .getMyEnrollments()
            .then((response) => {
                if (ignore) return;

                setEnrollments(
                    response.data?.result || []
                );
            })
            .catch((error) => {
                if (ignore) return;

                console.error(
                    "Get my courses failed:",
                    error
                );

                setError(
                    error.response?.data?.message ||
                    "Không thể tải danh sách khóa học."
                );
            })
            .finally(() => {
                if (!ignore) {
                    setLoading(false);
                }
            });

        return () => {
            ignore = true;
        };
    }, []);


    /*
    * Loading
    */
    if (loading) {
        return (
            <div className="my-courses-page">

                <Navbar />

                <main className="my-courses-container">
                    <div className="my-courses-loading">

                        <FontAwesomeIcon
                            icon={faSpinner}
                            spin
                            className="my-courses-spinner"
                        />

                        <h3>
                            Đang tải khóa học
                        </h3>

                        <p>
                            Vui lòng chờ trong giây lát...
                        </p>

                    </div>
                </main>

            </div>
        );
    }


    return (
        <div className="my-courses-page">

            <Navbar />

            <main className="my-courses-container">

                {/* ========================================
                        HEADER
                    ======================================== */}

                <section className="my-courses-header">

                    <div className="my-courses-heading">

                        <span className="my-courses-label">
                            <FontAwesomeIcon
                                icon={faGraduationCap}
                            />

                            <span>
                                MY LEARNING
                            </span>
                        </span>

                        <h1>
                            Khóa học của tôi
                        </h1>

                        <p>
                            Theo dõi tiến độ và tiếp tục
                            hành trình học tập của bạn.
                        </p>

                    </div>


                    <div className="my-courses-count">

                        <div className="my-courses-count-icon">
                            <FontAwesomeIcon
                                icon={faBookOpen}
                            />
                        </div>

                        <div>
                            <strong>
                                {enrollments.length}
                            </strong>

                            <span>
                                Khóa học
                            </span>
                        </div>

                    </div>

                </section>


                {/* ========================================
                        ERROR
                    ======================================== */}

                {error && (
                    <div className="my-courses-error">

                        <FontAwesomeIcon
                            icon={faCircleExclamation}
                        />

                        <span>
                            {error}
                        </span>

                    </div>
                )}


                {/* ========================================
                        EMPTY
                    ======================================== */}

                {!error &&
                    enrollments.length === 0 && (
                        <div className="my-courses-empty">

                            <div className="empty-icon">
                                <FontAwesomeIcon
                                    icon={faBookOpen}
                                />
                            </div>

                            <h2>
                                Bạn chưa đăng ký khóa học nào
                            </h2>

                            <p>
                                Hãy khám phá các khóa học và
                                bắt đầu hành trình học lập trình
                                của bạn.
                            </p>

                            <Link
                                to="/courses"
                                className="my-courses-button"
                            >
                                <span>
                                    Khám phá khóa học
                                </span>

                                <FontAwesomeIcon
                                    icon={faArrowRight}
                                />
                            </Link>

                        </div>
                    )}


                {/* ========================================
                        COURSES
                    ======================================== */}

                {!error &&
                    enrollments.length > 0 && (
                        <section className="my-courses-section">

                            <div className="my-courses-section-header">

                                <div>
                                    <span>
                                        YOUR COURSES
                                    </span>

                                    <h2>
                                        Tiếp tục học tập
                                    </h2>
                                </div>

                            </div>


                            <div className="my-courses-grid">

                                {enrollments.map(
                                    (enrollment) => (
                                        <MyCourseCard
                                            key={enrollment.id}
                                            enrollment={
                                                enrollment
                                            }
                                        />
                                    )
                                )}

                            </div>

                        </section>
                    )}

            </main>

        </div>
    );
}


/* =====================================================
MY COURSE CARD
===================================================== */

function MyCourseCard({ enrollment }) {
    const courseId = enrollment.courseId;

    const status =
        enrollment.status || "ACTIVE";

    const [progress, setProgress] = useState(0);
    const [completed, setCompleted] = useState(false);
    const [progressLoading, setProgressLoading] = useState(true);

    useEffect(() => {
        let ignore = false;

        const loadProgress = async () => {
            if (!courseId) {
                setProgress(0);
                setCompleted(false);
                setProgressLoading(false);
                return;
            }

            try {
                setProgressLoading(true);

                const response =
                    await enrollmentService.getProgress(
                        courseId
                    );

                if (ignore) {
                    return;
                }

                const data =
                    response.data?.result;

                setProgress(
                    Number(data?.progress ?? 0)
                );

                setCompleted(
                    Boolean(data?.completed)
                );

            } catch {
                if (ignore) {
                    return;
                }

                setProgress(0);
                setCompleted(false);

            } finally {
                if (!ignore) {
                    setProgressLoading(false);
                }
            }
        };

        loadProgress();

        return () => {
            ignore = true;
        };
    }, [courseId]);


    const safeProgress = Math.min(
        Math.max(
            Number(progress) || 0,
            0
        ),
        100
    );


    const statusConfig = {
        ACTIVE: {
            text: "Đang học",
            icon: faPlay,
        },

        COMPLETED: {
            text: "Đã hoàn thành",
            icon: faCheck,
        },

        CANCELLED: {
            text: "Đã hủy",
            icon: faCircleExclamation,
        },
    };


    const currentStatus =
        statusConfig[status] || {
            text: status,
            icon: faClock,
        };


    const formattedDate =
        enrollment.enrolledAt
            ? new Date(
                enrollment.enrolledAt
            ).toLocaleDateString("vi-VN")
            : "Không xác định";


    return (
        <article className="my-course-card">

            {/* THUMBNAIL */}

            <div className="my-course-thumbnail">

                <div className="my-course-thumbnail-background">

                    <FontAwesomeIcon
                        icon={faGraduationCap}
                    />

                </div>


                <div className="my-course-thumbnail-content">

                    <FontAwesomeIcon
                        icon={faBookOpen}
                    />

                    <span>
                        JLEARN
                    </span>

                </div>


                <span
                    className={`my-course-status ${status.toLowerCase()}`}
                >

                    <FontAwesomeIcon
                        icon={currentStatus.icon}
                    />

                    {currentStatus.text}

                </span>

            </div>


            {/* CONTENT */}

            <div className="my-course-body">

                <div className="my-course-category">

                    <FontAwesomeIcon
                        icon={faGraduationCap}
                    />

                    <span>
                        JAVA PROGRAMMING
                    </span>

                </div>


                <h2>
                    {enrollment.courseTitle ||
                        "Khóa học"}
                </h2>


                <div className="my-course-enrolled">

                    <FontAwesomeIcon
                        icon={faCalendarDays}
                    />

                    <span>
                        Ngày đăng ký:
                    </span>

                    <strong>
                        {formattedDate}
                    </strong>

                </div>


                {/* PROGRESS */}

                <div className="my-course-progress">

                    <div className="progress-header">

                        <span>
                            Tiến độ học tập
                        </span>

                        {progressLoading ? (

                            <FontAwesomeIcon
                                icon={faSpinner}
                                spin
                            />

                        ) : (

                            <strong>
                                {safeProgress}%
                            </strong>

                        )}

                    </div>


                    <div className="progress-bar">

                        <div
                            className="progress-value"
                            style={{
                                width: `${safeProgress}%`,
                            }}
                        />

                    </div>

                </div>


                {/* FOOTER */}

                <div className="my-course-footer">

                    <span className="my-course-progress-text">

                        {progressLoading ? (

                            <>
                                <FontAwesomeIcon
                                    icon={faSpinner}
                                    spin
                                />

                                Đang tải tiến độ
                            </>

                        ) : completed || safeProgress >= 100 ? (

                            <>
                                <FontAwesomeIcon
                                    icon={faCheck}
                                />

                                Hoàn thành khóa học
                            </>

                        ) : safeProgress > 0 ? (

                            <>
                                <FontAwesomeIcon
                                    icon={faPlay}
                                />

                                Tiếp tục học
                            </>

                        ) : (

                            <>
                                <FontAwesomeIcon
                                    icon={faClock}
                                />

                                Chưa bắt đầu
                            </>

                        )}

                    </span>


                    {status !== "CANCELLED" && (

                        <Link
                            to={`/courses/${courseId}`}
                            className="my-course-button"
                        >

                            <span>
                                {safeProgress >= 100
                                    ? "Xem khóa học"
                                    : "Học tiếp"}
                            </span>

                            <FontAwesomeIcon
                                icon={faArrowRight}
                            />

                        </Link>

                    )}

                </div>

            </div>

        </article>
    );
}


export default MyCourses;