import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X } from "lucide-react";
import type { LogLevel, FilterState } from "../../types";

interface FilterBarProps {
  filter: FilterState;
  onKeywordChange: (keyword: string) => void;
  onRegexToggle: (isRegex: boolean) => void;
  onLevelToggle: (level: LogLevel) => void;
  onClearKeyword: () => void;
  filteredCount: number;
  totalCount: number;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

const LEVELS: { label: string; value: LogLevel }[] = [
  { label: "ALL", value: "UNKNOWN" }, // ALL is handled specially
  { label: "INFO", value: "INFO" },
  { label: "WARN", value: "WARN" },
  { label: "ERROR", value: "ERROR" },
  { label: "DEBUG", value: "DEBUG" },
];

export function FilterBar({
  filter,
  onKeywordChange,
  onRegexToggle,
  onLevelToggle,
  onClearKeyword,
  filteredCount,
  totalCount,
  searchInputRef,
}: FilterBarProps) {
  const [localKeyword, setLocalKeyword] = useState(filter.keyword);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounce keyword input
  const handleChange = useCallback(
    (value: string) => {
      setLocalKeyword(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onKeywordChange(value);
      }, 150);
    },
    [onKeywordChange],
  );

  // Sync external changes
  useEffect(() => {
    setLocalKeyword(filter.keyword);
  }, [filter.keyword]);

  const [regexError, setRegexError] = useState(false);

  useEffect(() => {
    if (filter.isRegex && filter.keyword) {
      try {
        new RegExp(filter.keyword);
        setRegexError(false);
      } catch {
        setRegexError(true);
      }
    } else {
      setRegexError(false);
    }
  }, [filter.keyword, filter.isRegex]);

  const buttonStyle = (active: boolean) => ({
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "11px",
    border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
    background: active ? "var(--accent)" : "transparent",
    color: active ? "var(--button-text-active)" : "var(--text-muted)",
    cursor: "pointer",
    transition: "all 0.15s",
  });

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5"
      style={{
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <Search size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
      <input
        ref={searchInputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={localKeyword}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="搜索日志..."
        className="flex-1 text-xs outline-none"
        style={{
          background: "transparent",
          color: "var(--text-primary)",
          border: regexError
            ? "1px solid var(--level-error)"
            : "1px solid transparent",
          borderRadius: "4px",
          padding: "4px 8px",
        }}
      />
      {localKeyword && (
        <button
          onClick={() => {
            setLocalKeyword("");
            onClearKeyword();
          }}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <X size={14} style={{ color: "var(--text-muted)" }} />
        </button>
      )}

      <div className="flex items-center gap-1 ml-2">
        <button
          style={buttonStyle(filter.isRegex)}
          onClick={() => onRegexToggle(!filter.isRegex)}
        >
          .*
        </button>
      </div>

      <div className="flex items-center gap-1 ml-2">
        {LEVELS.map(({ label, value }) => (
          <button
            key={label}
            style={buttonStyle(
              label === "ALL"
                ? filter.levels.size >= 5
                : filter.levels.has(value),
            )}
            onClick={() => {
              if (label === "ALL") {
                // Reset to all levels
                onLevelToggle("INFO"); // trigger re-render
                window.dispatchEvent(new CustomEvent("filter-all-levels"));
              } else {
                onLevelToggle(value);
              }
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <span
        className="text-xs ml-2"
        style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}
      >
        已显示 {filteredCount.toLocaleString()} / {totalCount.toLocaleString()}{" "}
        行
      </span>
    </div>
  );
}
