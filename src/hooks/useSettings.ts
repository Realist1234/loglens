import { useState, useEffect, useCallback } from "react";
import { load } from "@tauri-apps/plugin-store";
import type { ThemeId } from "../styles/themes";
import { DEFAULT_THEME } from "../styles/themes";

export interface SettingsData {
  apiKey: string;
  baseUrl: string;
  model: string;
  proxyUrl: string;
  fontSize: number;
  theme: ThemeId;
}

const DEFAULTS: SettingsData = {
  apiKey: "",
  baseUrl: "https://api.anthropic.com",
  model: "claude-3-5-sonnet-20241022",
  proxyUrl: "",
  fontSize: 13,
  theme: DEFAULT_THEME,
};

let storePromise: ReturnType<typeof load> | null = null;

async function getStore() {
  if (!storePromise) {
    storePromise = load("settings.json", { autoSave: true, defaults: {} });
  }
  return storePromise;
}

export function useSettings() {
  const [settings, setSettings] = useState<SettingsData>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const store = await getStore();
        const apiKey = await store.get<string>("apiKey");
        const baseUrl = await store.get<string>("baseUrl");
        const model = await store.get<string>("model");
        const proxyUrl = await store.get<string>("proxyUrl");
        const fontSize = await store.get<number>("fontSize");
        const theme = await store.get<ThemeId>("theme");

        setSettings({
          apiKey: apiKey ?? DEFAULTS.apiKey,
          baseUrl: baseUrl ?? DEFAULTS.baseUrl,
          model: model ?? DEFAULTS.model,
          proxyUrl: proxyUrl ?? DEFAULTS.proxyUrl,
          fontSize: fontSize ?? DEFAULTS.fontSize,
          theme: theme ?? DEFAULTS.theme,
        });
      } catch (e) {
        console.warn("Failed to load settings:", e);
      }
      setLoaded(true);
    })();
  }, []);

  const updateSetting = useCallback(
    async <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
      try {
        const store = await getStore();
        await store.set(key, value);
      } catch (e) {
        console.warn("Failed to save setting:", e);
      }
    },
    [],
  );

  return { settings, loaded, updateSetting };
}
