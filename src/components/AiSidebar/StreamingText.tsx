import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";

interface StreamingTextProps {
  text: string;
}

export function StreamingText({ text }: StreamingTextProps) {
  if (!text) return null;

  return (
    <div
      className="text-sm leading-relaxed"
      style={{ color: "var(--text-primary)" }}
    >
      <ReactMarkdown
        rehypePlugins={[rehypeHighlight]}
        components={{
          code({ className, children, ...props }) {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <pre
                  style={{
                    background: "var(--bg-base)",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    padding: "12px",
                    overflow: "auto",
                    fontSize: "12px",
                    fontFamily:
                      "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                  }}
                >
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              );
            }
            return (
              <code
                style={{
                  background: "var(--bg-base)",
                  padding: "2px 4px",
                  borderRadius: "3px",
                  fontSize: "12px",
                  fontFamily:
                    "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                }}
                {...props}
              >
                {children}
              </code>
            );
          },
          p({ children }) {
            return (
              <p style={{ marginBottom: "8px" }}>{children}</p>
            );
          },
          ul({ children }) {
            return (
              <ul style={{ paddingLeft: "20px", marginBottom: "8px" }}>
                {children}
              </ul>
            );
          },
          ol({ children }) {
            return (
              <ol style={{ paddingLeft: "20px", marginBottom: "8px" }}>
                {children}
              </ol>
            );
          },
          strong({ children }) {
            return (
              <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                {children}
              </strong>
            );
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
