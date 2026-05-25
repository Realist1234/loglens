import { Copy, RotateCw, X, Loader2 } from "lucide-react";
import { StreamingText } from "./StreamingText";

interface AiSidebarProps {
  open: boolean;
  streaming: boolean;
  text: string;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
}

export function AiSidebar({
  open,
  streaming,
  text,
  error,
  onClose,
  onRetry,
}: AiSidebarProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  };

  return (
    <div
      style={{
        width: open ? "420px" : "0px",
        minWidth: open ? "420px" : "0px",
        overflow: "hidden",
        background: "var(--bg-surface)",
        borderLeft: open ? "1px solid var(--border)" : "none",
        transition: "width 0.25s ease, min-width 0.25s ease",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: "1px solid var(--border)", flexShrink: 0 }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            AI 分析
          </span>
          {streaming && (
            <Loader2
              size={14}
              className="animate-spin"
              style={{ color: "var(--accent)" }}
            />
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onRetry}
            disabled={streaming}
            className="p-1 rounded"
            style={{
              background: "none",
              border: "none",
              cursor: streaming ? "not-allowed" : "pointer",
              opacity: streaming ? 0.4 : 1,
            }}
            title="重新分析"
          >
            <RotateCw size={14} style={{ color: "var(--text-muted)" }} />
          </button>
          <button
            onClick={handleCopy}
            disabled={!text}
            className="p-1 rounded"
            style={{
              background: "none",
              border: "none",
              cursor: text ? "pointer" : "not-allowed",
              opacity: text ? 1 : 0.4,
            }}
            title="复制结果"
          >
            <Copy size={14} style={{ color: "var(--text-muted)" }} />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded"
            style={{ background: "none", border: "none", cursor: "pointer" }}
            title="关闭"
          >
            <X size={14} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto p-4"
        style={{ background: "var(--bg-base)" }}
      >
        {error && (
          <div
            className="text-sm mb-4 p-3 rounded"
            style={{
              background: "var(--level-error-bg)",
              color: "var(--level-error)",
              border: "1px solid var(--level-error-border)",
            }}
          >
            {error}
          </div>
        )}
        {text ? (
          <StreamingText text={text} />
        ) : !error && !streaming ? (
          <div
            className="text-sm text-center mt-8"
            style={{ color: "var(--text-muted)" }}
          >
            Hover 到 ERROR 行，点击 ✨ Ask AI 按钮开始分析
          </div>
        ) : null}
      </div>
    </div>
  );
}
