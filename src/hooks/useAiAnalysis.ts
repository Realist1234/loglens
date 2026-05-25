import { useState, useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { AiConfig, AiMessage, LogLine } from "../types";

export interface AiState {
  streaming: boolean;
  text: string;
  error: string | null;
}

const SYSTEM_PROMPT = `你是一位 Java/Spring Boot 后端专家。以下是从生产日志中截取的错误片段，请：
1. 用一句话说明根本原因
2. 给出 2-3 个可能的修复方案（代码级别）
3. 如有需要，指出需要检查的配置项或依赖版本

日志内容：
\`\`\`
{CONTEXT_LINES}
\`\`\``;

function buildContextLines(lines: LogLine[], errorLineId: number): string {
  const start = Math.max(0, errorLineId - 26);
  const end = Math.min(lines.length, errorLineId + 25);
  return lines
    .slice(start, end)
    .map((l) => l.raw)
    .join("\n");
}

export function useAiAnalysis(settings?: {
  apiKey: string;
  baseUrl: string;
  model: string;
  proxyUrl: string;
}) {
  const [state, setState] = useState<AiState>({
    streaming: false,
    text: "",
    error: null,
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const unlistenRefs = useRef<(() => void)[]>([]);

  // Clean up listeners on unmount
  useEffect(() => {
    return () => {
      unlistenRefs.current.forEach((fn) => fn());
    };
  }, []);

  const analyze = useCallback(
    async (errorLine: LogLine, allLines: LogLine[]) => {
      // Cancel any existing stream
      await invoke("cancel_ai_stream").catch(() => {});

      // Clean up old listeners
      unlistenRefs.current.forEach((fn) => fn());
      unlistenRefs.current = [];

      setState({ streaming: true, text: "", error: null });
      setSidebarOpen(true);

      const contextLines = buildContextLines(allLines, errorLine.id);
      const prompt = SYSTEM_PROMPT.replace("{CONTEXT_LINES}", contextLines);

      const messages: AiMessage[] = [{ role: "user", content: prompt }];

      const config: AiConfig = {
        api_key: settings?.apiKey ?? "",
        base_url: settings?.baseUrl ?? "https://api.anthropic.com",
        model: settings?.model ?? "claude-3-5-sonnet-20241022",
        proxy_url: settings?.proxyUrl || undefined,
      };

      // Register event listeners
      const unlistenChunk = await listen<{ token: string }>(
        "ai-stream-chunk",
        (event) => {
          setState((prev) => ({
            ...prev,
            text: prev.text + event.payload.token,
          }));
        },
      );

      const unlistenDone = await listen("ai-stream-done", () => {
        setState((prev) => ({ ...prev, streaming: false }));
      });

      const unlistenError = await listen<{ message: string }>(
        "ai-stream-error",
        (event) => {
          setState((prev) => ({
            ...prev,
            streaming: false,
            error: event.payload.message,
          }));
        },
      );

      unlistenRefs.current = [unlistenChunk, unlistenDone, unlistenError];

      try {
        await invoke("ai_chat_stream", { config, messages });
      } catch (err) {
        setState((prev) => ({
          ...prev,
          streaming: false,
          error: String(err),
        }));
      }
    },
    [],
  );

  const cancel = useCallback(async () => {
    await invoke("cancel_ai_stream").catch(() => {});
    setState((prev) => ({ ...prev, streaming: false }));
  }, []);

  const closeSidebar = useCallback(async () => {
    await cancel();
    setSidebarOpen(false);
  }, [cancel]);

  const clearText = useCallback(() => {
    setState({ streaming: false, text: "", error: null });
  }, []);

  return {
    state,
    sidebarOpen,
    analyze,
    cancel,
    closeSidebar,
    clearText,
  };
}
