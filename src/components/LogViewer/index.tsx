import { useRef, useCallback, useEffect, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { LogLine } from "../../types";
import { LogLineRow } from "./LogLine";
import { StackTrace } from "./StackTrace";

interface LogViewerProps {
  lines: LogLine[];
  fontSize: number;
  keyword?: string;
  loading: boolean;
  isEof: boolean;
  onLoadMore: () => void;
  onAskAi?: (line: LogLine) => void;
  scrollElementRef?: React.RefObject<HTMLDivElement | null>;
}

interface StackGroup {
  groupId: number;
  lines: LogLine[];
}

function buildRenderItems(lines: LogLine[]): Array<{ type: "line"; line: LogLine } | { type: "stack"; group: StackGroup }> {
  const items: Array<{ type: "line"; line: LogLine } | { type: "stack"; group: StackGroup }> = [];
  const stackGroups = new Map<number, LogLine[]>();

  for (const line of lines) {
    if (line.is_stack_frame && line.stack_group_id != null) {
      if (!stackGroups.has(line.stack_group_id)) {
        stackGroups.set(line.stack_group_id, []);
      }
      stackGroups.get(line.stack_group_id)!.push(line);
    } else {
      items.push({ type: "line", line });
    }
  }

  // Insert stack groups at the position of their first line
  const result: Array<{ type: "line"; line: LogLine } | { type: "stack"; group: StackGroup }> = [];
  const insertedGroups = new Set<number>();

  for (const line of lines) {
    if (line.is_stack_frame && line.stack_group_id != null) {
      if (!insertedGroups.has(line.stack_group_id)) {
        insertedGroups.add(line.stack_group_id);
        const groupLines = stackGroups.get(line.stack_group_id) || [];
        result.push({
          type: "stack",
          group: { groupId: line.stack_group_id, lines: groupLines },
        });
      }
    } else {
      result.push({ type: "line", line });
    }
  }

  return result;
}

export function LogViewer({
  lines,
  fontSize,
  keyword,
  loading,
  isEof,
  onLoadMore,
  onAskAi,
}: LogViewerProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const renderItems = useMemo(() => buildRenderItems(lines), [lines]);

  const virtualizer = useVirtualizer({
    count: renderItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 22,
    overscan: 20,
  });

  // Load more when scrolling near bottom (80%)
  const handleScroll = useCallback(() => {
    const el = parentRef.current;
    if (!el || loading || isEof) return;
    const scrollRatio = (el.scrollTop + el.clientHeight) / el.scrollHeight;
    if (scrollRatio > 0.8) {
      onLoadMore();
    }
  }, [loading, isEof, onLoadMore]);

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div
      ref={parentRef}
      className="flex-1 overflow-y-auto"
      style={{ background: "var(--bg-base)" }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const item = renderItems[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {item.type === "stack" ? (
                <StackTrace group={item.group.lines} fontSize={fontSize} />
              ) : (
                <LogLineRow
                  line={item.line}
                  fontSize={fontSize}
                  keyword={keyword}
                  onAskAi={onAskAi}
                />
              )}
            </div>
          );
        })}
      </div>
      {loading && (
        <div
          className="text-center py-2 text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          加载中...
        </div>
      )}
    </div>
  );
}
