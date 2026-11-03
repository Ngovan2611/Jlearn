import FeatureCard from "./FeatureCard";

import {
    faBookOpen,
    faCode,
    faRobot,
    faChartLine,
} from "@fortawesome/free-solid-svg-icons";

function Features() {
    return (
        <section className="features">

            <div className="section-heading">

                <span>WHY JLEARN</span>

                <h2>
                    Mọi thứ bạn cần để học Java
                </h2>

                <p>
                    Một nền tảng duy nhất cho việc học, thực hành
                    và cải thiện kỹ năng lập trình.
                </p>

            </div>

            <div className="feature-grid">

                <FeatureCard
                    icon={faBookOpen}
                    title="Khóa học"
                    text="Lộ trình học Java được xây dựng từ cơ bản đến nâng cao."
                />

                <FeatureCard
                    icon={faCode}
                    title="Luyện code"
                    text="Viết và chạy Java trực tiếp trên trình duyệt."
                />

                <FeatureCard
                    icon={faRobot}
                    title="AI Tutor"
                    text="Nhận hướng dẫn và phân tích lỗi từ AI."
                />

                <FeatureCard
                    icon={faChartLine}
                    title="Tiến độ"
                    text="Theo dõi quá trình học và kết quả bài tập."
                />

            </div>

        </section>
    );
}

export default Features;