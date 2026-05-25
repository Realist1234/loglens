import { useState, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { ChunkResult, LogLine } from "../types";

export interface FileState {
  path: string;
  name: string;
  totalBytes: number;
  lines: LogLine[];
  nextOffset: number;
  isEof: boolean;
  loading: boolean;
  loadedBytes: number;
}

export function useLogFile() {
  const [fileState, setFileState] = useState<FileState | null>(null);
  const loadingRef = useRef(false);

  const openFile = useCallback(async (path: string) => {
    loadingRef.current = true;
    setFileState({
      path,
      name: path.split(/[/\\]/).pop() || path,
      totalBytes: 0,
      lines: [],
      nextOffset: 0,
      isEof: false,
      loading: true,
      loadedBytes: 0,
    });

    try {
      const info = await invoke<{ name: string; size_bytes: number }>(
        "get_file_info",
        { path },
      );

      const chunk = await invoke<ChunkResult>("read_log_chunk", {
        path,
        offset: 0,
      });

      // Assign sequential IDs
      const lines = chunk.lines.map((l, i) => ({ ...l, id: i + 1 }));

      setFileState({
        path,
        name: info.name,
        totalBytes: chunk.total_bytes,
        lines,
        nextOffset: chunk.next_offset,
        isEof: chunk.is_eof,
        loading: false,
        loadedBytes: chunk.next_offset,
      });
    } catch (err) {
      console.error("Failed to open file:", err);
      setFileState(null);
    } finally {
      loadingRef.current = false;
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!fileState || fileState.isEof || fileState.loading || loadingRef.current) {
      return;
    }
    loadingRef.current = true;
    setFileState((prev) => (prev ? { ...prev, loading: true } : prev));

    try {
      const chunk = await invoke<ChunkResult>("read_log_chunk", {
        path: fileState.path,
        offset: fileState.nextOffset,
      });

      const baseId = fileState.lines.length;
      const newLines = chunk.lines.map((l, i) => ({ ...l, id: baseId + i + 1 }));

      setFileState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          lines: [...prev.lines, ...newLines],
          nextOffset: chunk.next_offset,
          isEof: chunk.is_eof,
          loading: false,
          loadedBytes: chunk.next_offset,
        };
      });
    } catch (err) {
      console.error("Failed to load chunk:", err);
      setFileState((prev) => (prev ? { ...prev, loading: false } : null));
    } finally {
      loadingRef.current = false;
    }
  }, [fileState]);

  const appendLines = useCallback((newLines: LogLine[]) => {
    setFileState((prev) => {
      if (!prev) return null;
      const baseId = prev.lines.length;
      const lines = newLines.map((l, i) => ({ ...l, id: baseId + i + 1 }));
      return { ...prev, lines: [...prev.lines, ...lines] };
    });
  }, []);

  const closeFile = useCallback(() => {
    setFileState(null);
  }, []);

  return { fileState, openFile, loadMore, appendLines, closeFile };
}
