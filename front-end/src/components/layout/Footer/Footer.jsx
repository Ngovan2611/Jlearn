import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCode,
    faCopyright,
} from "@fortawesome/free-solid-svg-icons";

import Logo from "../../common/Logo/Logo";

function Footer() {
    return (
        <footer>

            <Logo />

            <p>
                <FontAwesomeIcon icon={faCode} />

                <span>
                    Nền tảng học lập trình Java trực tuyến.
                </span>
            </p>

            <span>
                <FontAwesomeIcon icon={faCopyright} />
                {" "}2026 JLearn
            </span>

        </footer>
    );
}

export default Footer;