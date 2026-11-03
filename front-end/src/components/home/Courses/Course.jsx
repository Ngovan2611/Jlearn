import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCoffee,
    faSeedling,
    faGear,
    faArrowRight,
} from "@fortawesome/free-solid-svg-icons";

import Button from "../../common/Button/Button";
import CourseCard from "./CourseCard";

function Courses() {
    const navigate = useNavigate();

    return (
        <section className="courses">

            <div className="section-heading row">

                <div>
                    <span>LEARNING PATH</span>

                    <h2>
                        Khóa học nổi bật
                    </h2>
                </div>

                <Button
                    onClick={() => navigate("/courses")}
                >
                    <span>Xem tất cả</span>

                    <FontAwesomeIcon
                        icon={faArrowRight}
                    />
                </Button>

            </div>

            <div className="course-grid">

                <CourseCard
                    icon={faCoffee}
                    level="BEGINNER"
                    title="Java Core"
                    description="Nắm vững nền tảng Java và lập trình hướng đối tượng."
                    progress="65%"
                />

                <CourseCard
                    icon={faSeedling}
                    level="INTERMEDIATE"
                    title="Spring Boot"
                    description="Xây dựng REST API và ứng dụng Web với Spring Boot."
                    progress="35%"
                />

                <CourseCard
                    icon={faGear}
                    level="ADVANCED"
                    title="Microservices"
                    description="Thiết kế hệ thống Java theo kiến trúc Microservices."
                    progress="15%"
                />

            </div>

        </section>
    );
}

export default Courses;