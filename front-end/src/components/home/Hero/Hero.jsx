import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faRocket,
    faArrowRight,
} from "@fortawesome/free-solid-svg-icons";

import Button from "../../common/Button/Button";
import Stats from "../Stats/Stats";
import CodePreview from "../CodePreview/CodePreview";

function Hero() {
    const navigate = useNavigate();

    return (
        <section className="hero">

            <div className="hero-left">

                <div className="neu-badge">
                    <FontAwesomeIcon icon={faRocket} />

                    <span>
                        Nền tảng học Java thông minh
                    </span>
                </div>

                <h1>
                    Học Java
                    <br />
                    <span>theo cách mới.</span>
                </h1>

                <p>
                    Học Java từ cơ bản đến nâng cao, luyện code trực tiếp,
                    theo dõi tiến độ và nhận hỗ trợ từ AI Tutor.
                </p>

                <div className="hero-buttons">

                    <Button
                        variant="primary"
                        className="big"
                        onClick={() => navigate("/courses")}
                    >
                        Bắt đầu học

                        <FontAwesomeIcon
                            icon={faArrowRight}
                        />
                    </Button>

                    <Button
                        className="big"
                        onClick={() => navigate("/courses")}
                    >
                        Khám phá khóa học
                    </Button>

                </div>

                <Stats />

            </div>

            <CodePreview />

        </section>
    );
}

export default Hero;