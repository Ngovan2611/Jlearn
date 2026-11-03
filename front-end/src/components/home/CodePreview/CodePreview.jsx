

function CodePreview() {
  return (
    <div className="code-wrapper">
      <div className="code-card">
        <div className="code-top">
          <div className="code-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <span>Java Playground</span>
        </div>

        <div className="code-content">
          <div>
            <span className="keyword">public</span>{" "}
            <span className="keyword">class</span>{" "}
            <span className="class-name">Main</span> {"{"}
          </div>

          <div className="indent">
            <span className="keyword">
              public static void
            </span>{" "}
            <span className="method">main</span>
            <span>() {"{"}</span>
          </div>

          <div className="indent-2">
            <span className="keyword">String</span> name ={" "}
            <span className="string">"JLearn"</span>;
          </div>

          <div className="indent-2">
            System.out.println(name);
          </div>

          <div className="indent">{"}"}</div>

          <div>{"}"}</div>
        </div>

        <div className="terminal">
          <div className="terminal-title">
            <span>●</span> Output
          </div>

          <div className="terminal-result">
            <span>$</span> Welcome to JLearn
          </div>

          <div className="success">
            ✓ Program finished successfully
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodePreview;