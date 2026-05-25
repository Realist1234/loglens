import { useState, useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { LogLine } from "../types";

export function useTailWatch(
  filePath: string | null,
  _currentLineCount: number,
  onNewLines: (lines: LogLine[]) => void,
) {
  const [tailing, setTailing] = useState(false);
  const unlistenRef = useRef<(() => void) | null>(null);

  const startTail = useCallback(async () => {
    if (!filePath) return;
    try {
      const unlisten = await listen<LogLine[]>("log-tail-update", (event) => {
        const lines = event.payload;
        if (lines.length > 0) {
          onNewLines(lines);
        }
      });
      unlistenRef.current = unlisten;
      await invoke("watch_file_tail", {
        path: filePath,
        fromOffset: 0,
      });
      setTailing(true);
    } catch (err) {
      console.error("Failed to start tail:", err);
    }
  }, [filePath, onNewLines]);

  const stopTail = useCallback(async () => {
    try {
      await invoke("stop_watch");
    } catch (err) {
      console.error("Failed to stop tail:", err);
    }
    if (unlistenRef.current) {
      unlistenRef.current();
      unlistenRef.current = null;
    }
    setTailing(false);
  }, []);

  const toggleTail = useCallback(async () => {
    if (tailing) {
      await stopTail();
    } else {
      await startTail();
    }
  }, [tailing, startTail, stopTail]);

  // Cleanup on unmount or file change
  useEffect(() => {
    return () => {
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }
      invoke("stop_watch").catch(() => {});
    };
  }, [filePath]);

  // Stop tailing when file changes
  useEffect(() => {
    if (tailing && filePath) {
      stopTail();
    }
  }, [filePath]); // eslint-disable-line react-hooks/exhaustive-deps

  return { tailing, toggleTail, startTail, stopTail };
}
