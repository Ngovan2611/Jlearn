import "./Loading.css";

function Loading({ text = "Đang tải..." }) {
    return (
        <div className="loading-container">
            <div className="loading-spinner">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>

            {text && (
                <p className="loading-text">
                    {text}
                </p>
            )}
        </div>
    );
}

export default Loading;