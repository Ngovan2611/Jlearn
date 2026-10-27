import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowRight,
} from "@fortawesome/free-solid-svg-icons";

import Button from "../../common/Button/Button";

function CTA() {
    const navigate = useNavigate();

    return (
        <section className="cta">

            <h2>
                Sẵn sàng bắt đầu hành trình Java?
            </h2>

            <p>
                Học · Thực hành · Tạo sản phẩm
            </p>

            <Button
                variant="primary"
                className="big"
                onClick={() => navigate("/courses")}
            >
                <span>
                    Bắt đầu miễn phí
                </span>

                <FontAwesomeIcon
                    icon={faArrowRight}
                />
            </Button>

        </section>
    );
}

export default CTA;