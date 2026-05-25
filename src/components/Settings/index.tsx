import { X, Check } from "lucide-react";
import type { SettingsData } from "../../hooks/useSettings";
import { THEMES } from "../../styles/themes";

interface SettingsProps {
  settings: SettingsData;
  onUpdate: <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => void;
  onClose: () => void;
}

export function Settings({ settings, onUpdate, onClose }: SettingsProps) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ background: "var(--backdrop)" }}
      onClick={onClose}
    >
      <div
        className="rounded-lg"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          width: "480px",
          maxHeight: "80vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h2 className="text-base font-medium" style={{ color: "var(--text-primary)" }}>
            设置
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <X size={16} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Theme Selector */}
          <Field label="主题">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
              {THEMES.map((t) => {
                const active = settings.theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => onUpdate("theme", t.id)}
                    style={{
                      position: "relative",
                      border: active
                        ? "2px solid var(--accent)"
                        : "1px solid var(--border)",
                      borderRadius: "8px",
                      padding: 0,
                      cursor: "pointer",
                      background: "none",
                      overflow: "hidden",
                      transition: "border-color 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", height: "32px" }}>
                      {t.swatchColors.map((c, i) => (
                        <div key={i} style={{ flex: 1, background: c }} />
                      ))}
                    </div>
                    <div
                      style={{
                        padding: "4px 0",
                        fontSize: "11px",
                        color: active ? "var(--accent)" : "var(--text-muted)",
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      {t.name}
                    </div>
                    {active && (
                      <Check
                        size={12}
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          color: "var(--accent-text)",
                          background: "var(--accent)",
                          borderRadius: "50%",
                          padding: 2,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* API Key */}
          <Field label="API Key">
            <input
              type="password"
              value={settings.apiKey}
              onChange={(e) => onUpdate("apiKey", e.target.value)}
              placeholder="sk-..."
              style={inputStyle}
            />
          </Field>

          {/* Base URL */}
          <Field label="API 地址">
            <input
              type="text"
              value={settings.baseUrl}
              onChange={(e) => onUpdate("baseUrl", e.target.value)}
              placeholder="https://api.anthropic.com"
              style={inputStyle}
            />
          </Field>

          {/* Model */}
          <Field label="模型">
            <input
              type="text"
              value={settings.model}
              onChange={(e) => onUpdate("model", e.target.value)}
              placeholder="claude-3-5-sonnet-20241022"
              style={inputStyle}
            />
          </Field>

          {/* Proxy */}
          <Field label="HTTP 代理">
            <input
              type="text"
              value={settings.proxyUrl}
              onChange={(e) => onUpdate("proxyUrl", e.target.value)}
              placeholder="http://127.0.0.1:7890"
              style={inputStyle}
            />
          </Field>

          {/* Font Size */}
          <Field label={`字体大小 (${settings.fontSize}px)`}>
            <input
              type="range"
              min={10}
              max={20}
              value={settings.fontSize}
              onChange={(e) => onUpdate("fontSize", Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--accent)" }}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        className="block text-xs mb-1"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 10px",
  borderRadius: "6px",
  border: "1px solid var(--border)",
  background: "var(--bg-base)",
  color: "var(--text-primary)",
  fontSize: "13px",
  outline: "none",
  fontFamily: "inherit",
};
