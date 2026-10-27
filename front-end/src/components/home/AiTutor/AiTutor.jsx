import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faRobot,
    faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../../common/Button/Button";

function AiTutor() {
    const navigate = useNavigate();

    return (
        <section className="ai-section">

            <div className="ai-icon">
                <FontAwesomeIcon icon={faRobot} />
            </div>

            <div className="ai-content">

                <span>
                    AI TUTOR
                </span>

                <h2>
                    Không biết code sai ở đâu?
                </h2>

                <p>
                    Hãy hỏi AI Tutor. JLearn sẽ phân tích lỗi,
                    giải thích nguyên nhân và hướng dẫn bạn từng
                    bước thay vì đưa ngay đáp án.
                </p>

                <Button
                    variant="primary"
                    onClick={() => navigate("/ai-tutor")}
                >
                    <span>
                        Khám phá AI Tutor
                    </span>

                    <FontAwesomeIcon
                        icon={faArrowRight}
                    />
                </Button>

            </div>

        </section>
    );
}

export default AiTutor;