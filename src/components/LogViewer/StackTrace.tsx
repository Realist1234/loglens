import { useState } from "react";
import type { LogLine } from "../../types";

interface StackTraceProps {
  group: LogLine[];
  fontSize: number;
}

export function StackTrace({ group, fontSize }: StackTraceProps) {
  const [expanded, setExpanded] = useState(false);

  if (group.length === 0) return null;

  const firstLine = group[0];
  const frameCount = group.length - 1;

  return (
    <div>
      {/* First frame — always visible, clickable */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex",
          alignItems: "flex-start",
          fontFamily:
            "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
          fontSize: `${fontSize}px`,
          lineHeight: "22px",
          height: "22px",
          cursor: "pointer",
          color: "var(--level-error)",
          borderBottom: "1px solid var(--border)",
          background: "var(--level-error-bg)",
          userSelect: "none",
        }}
      >
        <span
          style={{
            minWidth: "60px",
            textAlign: "right",
            paddingRight: "12px",
            color: "var(--text-muted)",
            flexShrink: 0,
          }}
        >
          {firstLine.id}
        </span>
        <span style={{ flex: 1 }}>
          {expanded ? "▼" : "▶"} {firstLine.raw}
          {!expanded && frameCount > 0 && (
            <span style={{ color: "var(--text-muted)", marginLeft: "8px" }}>
              [+{frameCount} frames]
            </span>
          )}
        </span>
      </div>

      {/* Expanded frames */}
      {expanded &&
        group.slice(1).map((line) => (
          <div
            key={line.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              fontFamily:
                "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
              fontSize: `${fontSize}px`,
              lineHeight: "22px",
              height: "22px",
              color: "var(--level-error)",
              borderBottom: "1px solid var(--border)",
              background: "var(--level-error-bg)",
              paddingLeft: "24px",
            }}
          >
            <span
              style={{
                minWidth: "60px",
                textAlign: "right",
                paddingRight: "12px",
                color: "var(--text-muted)",
                flexShrink: 0,
              }}
            >
              {line.id}
            </span>
            <span style={{ flex: 1 }}>{line.raw}</span>
          </div>
        ))}
    </div>
  );
}
