import { useState, useMemo, useCallback } from "react";
import type { LogLevel, LogLine } from "../types";

export interface FilterState {
  keyword: string;
  isRegex: boolean;
  levels: Set<LogLevel>;
}

const ALL_LEVELS: LogLevel[] = ["ERROR", "FATAL", "WARN", "INFO", "DEBUG", "TRACE", "UNKNOWN"];

export function useFilter(lines: LogLine[]) {
  const [filter, setFilter] = useState<FilterState>({
    keyword: "",
    isRegex: false,
    levels: new Set<LogLevel>(ALL_LEVELS),
  });

  const setKeyword = useCallback((keyword: string) => {
    setFilter((prev) => ({ ...prev, keyword }));
  }, []);

  const setIsRegex = useCallback((isRegex: boolean) => {
    setFilter((prev) => ({ ...prev, isRegex }));
  }, []);

  const toggleLevel = useCallback((level: LogLevel) => {
    setFilter((prev) => {
      const next = new Set(prev.levels);
      if (next.has(level)) {
        if (next.size > 1) next.delete(level);
      } else {
        next.add(level);
      }
      return { ...prev, levels: next };
    });
  }, []);

  const setAllLevels = useCallback(() => {
    setFilter((prev) => ({ ...prev, levels: new Set(ALL_LEVELS) }));
  }, []);

  const clearKeyword = useCallback(() => {
    setFilter((prev) => ({ ...prev, keyword: "" }));
  }, []);

  const filteredLines = useMemo(() => {
    let result = lines;

    // Filter by level
    if (filter.levels.size < ALL_LEVELS.length) {
      result = result.filter((l) => filter.levels.has(l.level));
    }

    // Filter by keyword
    if (filter.keyword) {
      if (filter.isRegex) {
        try {
          const re = new RegExp(filter.keyword, "i");
          result = result.filter((l) => re.test(l.raw));
        } catch {
          // Invalid regex — return empty
          result = [];
        }
      } else {
        const kw = filter.keyword.toLowerCase();
        result = result.filter((l) => l.raw.toLowerCase().includes(kw));
      }
    }

    return result;
  }, [lines, filter]);

  return {
    filter,
    filteredLines,
    setKeyword,
    setIsRegex,
    toggleLevel,
    setAllLevels,
    clearKeyword,
    totalCount: lines.length,
    filteredCount: filteredLines.length,
  };
}
