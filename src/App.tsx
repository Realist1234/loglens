import { useEffect, useRef, useState, useCallback, Component } from "react";
import { useLogFile } from "./hooks/useLogFile";
import { useFilter } from "./hooks/useFilter";
import { useAiAnalysis } from "./hooks/useAiAnalysis";
import { useSettings } from "./hooks/useSettings";
import { useTailWatch } from "./hooks/useTailWatch";
import { useToast } from "./hooks/useToast";
import { DropZone } from "./components/DropZone";
import { LogViewer } from "./components/LogViewer";
import { Toolbar } from "./components/Toolbar";
import { FilterBar } from "./components/Toolbar/FilterBar";
import { AiSidebar } from "./components/AiSidebar";
import { Settings } from "./components/Settings";
import { ToastContainer } from "./components/Toast";
import type { LogLine } from "./types";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Error Boundary
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="h-screen flex flex-col items-center justify-center gap-4"
          style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
        >
          <p className="text-lg" style={{ color: "var(--level-error)" }}>
            发生错误
          </p>
          <pre
            className="text-xs p-4 rounded"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              maxWidth: "600px",
              overflow: "auto",
              color: "var(--text-muted)",
            }}
          >
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-4 py-2 rounded text-sm"
            style={{
              background: "var(--accent)",
              color: "var(--accent-text)",
              border: "none",
              cursor: "pointer",
            }}
          >
            重新加载
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const { fileState, openFile: openFileRaw, loadMore, appendLines } = useLogFile();
  const { settings, loaded: settingsLoaded, updateSetting } = useSettings();
  const {
    filter,
    filteredLines,
    setKeyword,
    setIsRegex,
    toggleLevel,
    clearKeyword,
    totalCount,
    filteredCount,
  } = useFilter(fileState?.lines || []);

  const {
    state: aiState,
    sidebarOpen,
    analyze,
    closeSidebar,
    clearText,
  } = useAiAnalysis(settings);

  const { tailing, toggleTail } = useTailWatch(
    fileState?.path ?? null,
    fileState?.lines.length ?? 0,
    appendLines,
  );

  const { toasts, addToast } = useToast();

  const openFile = useCallback(
    async (path: string) => {
      try {
        await openFileRaw(path);
      } catch (err) {
        addToast(`打开文件失败: ${err}`, "error");
      }
    },
    [openFileRaw, addToast],
  );

  const [fontSize, setFontSize] = useState(settings.fontSize);
  const [showSettings, setShowSettings] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync font size from settings
  useEffect(() => {
    if (settingsLoaded) {
      setFontSize(settings.fontSize);
    }
  }, [settings.fontSize, settingsLoaded]);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", settings.theme);
  }, [settings.theme]);

  // Toast on AI errors
  useEffect(() => {
    if (aiState.error) {
      addToast(`AI 错误: ${aiState.error}`, "error");
    }
  }, [aiState.error, addToast]);

  const handleAskAi = useCallback(
    (line: LogLine) => {
      if (fileState) {
        clearText();
        analyze(line, fileState.lines);
      }
    },
    [fileState, analyze, clearText],
  );

  const handleRetry = useCallback(() => {
    // Re-send last message — placeholder for mock
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      if (isMod && e.key === "o") {
        e.preventDefault();
        document.getElementById("hidden-file-open")?.click();
      }

      if (isMod && e.key === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      if (isMod && e.key === ",") {
        e.preventDefault();
        setShowSettings((v) => !v);
      }

      if (e.key === "Escape") {
        if (sidebarOpen) {
          closeSidebar();
        } else if (showSettings) {
          setShowSettings(false);
        }
      }

      // T key — only when not in input
      if (e.key === "t" && !isMod && !isInput && fileState) {
        e.preventDefault();
        toggleTail();
      }

      if (e.key === "Home" && !isMod && !isInput) {
        e.preventDefault();
        const viewer = document.querySelector("[data-log-viewer]");
        viewer?.scrollTo({ top: 0 });
      }

      if (e.key === "End" && !isMod && !isInput) {
        e.preventDefault();
        const viewer = document.querySelector("[data-log-viewer]");
        if (viewer) viewer.scrollTo({ top: viewer.scrollHeight });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen, showSettings, closeSidebar, fileState, toggleTail]);

  // Ctrl+滚轮 缩放字体
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setFontSize((prev) => {
          const next = prev + (e.deltaY < 0 ? 1 : -1);
          const clamped = Math.max(10, Math.min(20, next));
          updateSetting("fontSize", clamped);
          return clamped;
        });
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [updateSetting]);

  // Listen for "filter-all-levels" event from FilterBar
  useEffect(() => {
    const handler = () => {
      ["ERROR", "FATAL", "WARN", "INFO", "DEBUG", "TRACE", "UNKNOWN"].forEach(
        (l) => {
          toggleLevel(l as any);
        },
      );
    };
    window.addEventListener("filter-all-levels", handler);
    return () => window.removeEventListener("filter-all-levels", handler);
  }, [toggleLevel]);

  const hasFile = !!fileState;

  return (
    <ErrorBoundary>
      <div
        className="h-screen flex flex-col"
        style={{ background: "var(--bg-base)", position: "relative" }}
      >
        {hasFile ? (
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
              <Toolbar
                fileName={fileState.name}
                fileSize={formatBytes(fileState.totalBytes)}
                lineCount={fileState.lines.length}
                onOpenSettings={() => setShowSettings(true)}
              />
              <FilterBar
                filter={filter}
                onKeywordChange={setKeyword}
                onRegexToggle={setIsRegex}
                onLevelToggle={toggleLevel}
                onClearKeyword={clearKeyword}
                filteredCount={filteredCount}
                totalCount={totalCount}
                searchInputRef={searchInputRef}
              />
              <LogViewer
                lines={filteredLines}
                fontSize={fontSize}
                keyword={filter.keyword}
                loading={fileState.loading}
                isEof={fileState.isEof}
                onLoadMore={loadMore}
                onAskAi={handleAskAi}
              />
              <div
                className="flex items-center justify-between px-3 py-1"
                style={{
                  background: "var(--bg-surface)",
                  borderTop: "1px solid var(--border)",
                  flexShrink: 0,
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {fileState.path}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {filteredCount.toLocaleString()} / {totalCount.toLocaleString()} 行
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {fontSize}px
                  </span>
                  <span
                    className="text-xs flex items-center gap-1"
                    style={{
                      color: tailing ? "var(--level-info)" : "var(--text-muted)",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: tailing ? "var(--level-info)" : "var(--text-muted)",
                      }}
                    />
                    Tail {tailing ? "ON" : "OFF"} (T)
                  </span>
                </div>
              </div>
            </div>

            <AiSidebar
              open={sidebarOpen}
              streaming={aiState.streaming}
              text={aiState.text}
              error={aiState.error}
              onClose={closeSidebar}
              onRetry={handleRetry}
            />
          </div>
        ) : (
          <DropZone onFileOpen={openFile} />
        )}

        {showSettings && (
          <Settings
            settings={settings}
            onUpdate={updateSetting}
            onClose={() => setShowSettings(false)}
          />
        )}

        <ToastContainer toasts={toasts} />
      </div>
    </ErrorBoundary>
  );
}

export default App;
