import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";


function CourseCard({
    icon,
    level,
    title,
    description,
    progress,
}) {
    return (
        <article className="course-card">

            <div className="course-card-top">

                <div className="course-icon">
                    <FontAwesomeIcon icon={icon} />
                </div>

                <span className="course-level">
                    {level}
                </span>

            </div>

            <h3>
                {title}
            </h3>

            <p>
                {description}
            </p>

            <div className="course-progress">

                <div className="course-progress-header">
                    <span>
                        Tiến độ
                    </span>

                    <strong>
                        {progress}
                    </strong>
                </div>

                <div className="course-progress-bar">
                    <div
                        className="course-progress-value"
                        style={{
                            width: progress,
                        }}
                    />
                </div>

            </div>

        </article>
    );
}

export default CourseCard;