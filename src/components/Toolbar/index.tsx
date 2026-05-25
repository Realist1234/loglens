import { Settings } from "lucide-react";

interface ToolbarProps {
  fileName: string;
  fileSize: string;
  lineCount: number;
  onOpenSettings: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function Toolbar({
  fileName,
  fileSize,
  lineCount,
  onOpenSettings,
}: ToolbarProps) {
  return (
    <div
      className="flex items-center justify-between px-3 py-1.5"
      style={{
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {fileName}
        </span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {fileSize}
        </span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {lineCount.toLocaleString()} 行
        </span>
      </div>
      <button
        onClick={onOpenSettings}
        className="p-1 rounded"
        style={{ background: "none", border: "none", cursor: "pointer" }}
        title="设置 (Ctrl+,)"
      >
        <Settings size={16} style={{ color: "var(--text-muted)" }} />
      </button>
    </div>
  );
}

export { formatBytes };
