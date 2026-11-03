import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function FeatureCard({ icon, title, text }) {
    return (
        <article className="feature-card">

            <div className="feature-icon">
                <FontAwesomeIcon icon={icon} />
            </div>

            <h3>
                {title}
            </h3>

            <p>
                {text}
            </p>

        </article>
    );
}

export default FeatureCard;