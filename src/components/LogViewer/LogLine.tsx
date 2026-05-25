import { useState, useRef, useCallback } from "react";
import type { LogLine as LogLineType } from "../../types";

const LEVEL_COLORS: Record<string, string> = {
  ERROR: "var(--level-error)",
  FATAL: "var(--level-error)",
  WARN: "var(--level-warn)",
  INFO: "var(--level-info)",
  DEBUG: "var(--level-debug)",
  TRACE: "var(--level-debug)",
  UNKNOWN: "var(--text-muted)",
};

const LEVEL_BG: Record<string, string> = {
  ERROR: "var(--level-error-bg)",
  FATAL: "var(--level-error-bg)",
  WARN: "var(--level-warn-bg)",
  INFO: "transparent",
  DEBUG: "transparent",
  TRACE: "transparent",
  UNKNOWN: "transparent",
};

interface LogLineProps {
  line: LogLineType;
  fontSize: number;
  keyword?: string;
  onAskAi?: (line: LogLineType) => void;
}

export function LogLineRow({ line, fontSize, keyword, onAskAi }: LogLineProps) {
  const color = LEVEL_COLORS[line.level] || "var(--text-primary)";
  const bg = LEVEL_BG[line.level] || "transparent";
  const [hovered, setHovered] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const showAskAi = useRef(false);

  const isAiEnabled = line.level === "ERROR" || line.level === "FATAL";

  const handleMouseEnter = useCallback(() => {
    if (!isAiEnabled) return;
    hoverTimerRef.current = setTimeout(() => {
      showAskAi.current = true;
      setHovered(true);
    }, 300);
  }, [isAiEnabled]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    showAskAi.current = false;
    setHovered(false);
  }, []);

  // Highlight keyword in raw text
  let displayContent: React.ReactNode = line.raw;
  if (keyword && keyword.length > 0) {
    const idx = line.raw.toLowerCase().indexOf(keyword.toLowerCase());
    if (idx >= 0) {
      const before = line.raw.slice(0, idx);
      const match = line.raw.slice(idx, idx + keyword.length);
      const after = line.raw.slice(idx + keyword.length);
      displayContent = (
        <>
          {before}
          <mark
            style={{
              background: "var(--keyword-highlight)",
              color: "inherit",
              borderRadius: "2px",
              padding: "0 1px",
            }}
          >
            {match}
          </mark>
          {after}
        </>
      );
    }
  }

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        display: "flex",
        alignItems: "flex-start",
        background: hovered ? "var(--bg-hover)" : bg,
        fontFamily:
          "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        fontSize: `${fontSize}px`,
        lineHeight: "22px",
        height: "22px",
        borderBottom: "1px solid var(--border)",
        color,
        whiteSpace: "pre",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <span
        style={{
          minWidth: "60px",
          textAlign: "right",
          paddingRight: "12px",
          color: "var(--text-muted)",
          userSelect: "none",
          flexShrink: 0,
        }}
      >
        {line.id}
      </span>
      {line.timestamp && (
        <span
          style={{
            minWidth: "180px",
            paddingRight: "8px",
            color: "var(--text-muted)",
            flexShrink: 0,
          }}
        >
          {line.timestamp}
        </span>
      )}
      <span
        style={{
          minWidth: "56px",
          paddingRight: "8px",
          color,
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {line.level}
      </span>
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
        {displayContent}
      </span>
      {hovered && isAiEnabled && onAskAi && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAskAi(line);
          }}
          style={{
            position: "absolute",
            right: "8px",
            top: "1px",
            background: "var(--accent)",
            color: "var(--accent-text)",
            border: "none",
            borderRadius: "4px",
            padding: "1px 8px",
            fontSize: "11px",
            cursor: "pointer",
            whiteSpace: "nowrap",
            lineHeight: "18px",
          }}
        >
          ✨ Ask AI
        </button>
      )}
    </div>
  );
}
