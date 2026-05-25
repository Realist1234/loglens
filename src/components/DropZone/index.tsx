import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open } from "@tauri-apps/plugin-dialog";
import { FolderOpen } from "lucide-react";

interface DropZoneProps {
  onFileOpen: (path: string) => void;
}

const VALID_EXTENSIONS = [".log", ".txt", ".out"];

function isValidFile(path: string): boolean {
  const lower = path.toLowerCase();
  return VALID_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function DropZone({ onFileOpen }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    getCurrentWindow()
      .onDragDropEvent((event) => {
        if (event.payload.type === "over") {
          setIsDragOver(true);
        } else if (event.payload.type === "drop") {
          setIsDragOver(false);
          const paths = event.payload.paths;
          if (paths.length > 0) {
            if (isValidFile(paths[0])) {
              onFileOpen(paths[0]);
            } else {
              console.warn("Unsupported file type:", paths[0]);
            }
          }
        } else {
          setIsDragOver(false);
        }
      })
      .then((fn) => {
        unlisten = fn;
      });

    return () => unlisten?.();
  }, [onFileOpen]);

  const handleSelectFile = async () => {
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: "Log Files",
          extensions: ["log", "txt", "out"],
        },
      ],
    });
    if (selected) {
      onFileOpen(selected);
    }
  };

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center gap-4"
      style={{
        background: isDragOver
          ? "var(--drag-highlight)"
          : "var(--bg-base)",
        border: isDragOver
          ? "2px dashed var(--accent)"
          : "2px dashed var(--border)",
        borderRadius: "12px",
        margin: "32px",
        transition: "all 0.2s ease",
      }}
    >
      <FolderOpen
        size={48}
        style={{ color: isDragOver ? "var(--accent)" : "var(--text-muted)" }}
      />
      <p
        className="text-sm"
        style={{ color: isDragOver ? "var(--accent)" : "var(--text-muted)" }}
      >
        {isDragOver ? "释放以打开文件" : "拖拽日志文件到此处"}
      </p>
      <button
        onClick={handleSelectFile}
        className="px-4 py-2 rounded-md text-sm"
        style={{
          background: "var(--accent)",
          color: "var(--accent-text)",
          border: "none",
          cursor: "pointer",
        }}
      >
        点击选择文件
      </button>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        支持 .log / .txt / .out 格式
      </p>
    </div>
  );
}
