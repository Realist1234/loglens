import { AlertCircle, Info } from "lucide-react";
import type { Toast as ToastType } from "../../hooks/useToast";

interface ToastContainerProps {
  toasts: ToastType[];
}

export function ToastContainer({ toasts }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "40px",
        right: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        zIndex: 100,
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 14px",
            borderRadius: "8px",
            background: t.type === "error" ? "rgba(255,107,107,0.9)" : "var(--accent)",
            color: "#fff",
            fontSize: "13px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            animation: "toast-in 0.2s ease-out",
            pointerEvents: "auto",
          }}
        >
          {t.type === "error" ? <AlertCircle size={14} /> : <Info size={14} />}
          {t.message}
        </div>
      ))}
    </div>
  );
}
