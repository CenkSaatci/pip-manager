import { useState, useEffect, ReactNode } from "react";
import { useAppStore } from "../store/useAppStore";
import { THEMES, getUiTemplate } from "../types/rules";
import { useT } from "../i18n/context";

const STORAGE_KEY = "pip-manager-custom-themes";

interface CustomTheme {
  id: string;
  label: string;
  colors: Record<string, string>;
}

function loadCustomThemes(): CustomTheme[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; }
}

function saveCustomThemes(themes: CustomTheme[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(themes));
}

const BUILTIN_IDS = new Set<string>(THEMES.map((t) => t.id));

const THEME_KEY_MAP: Record<string, string> = {
  bg: "--pip-bg",
  panel: "--pip-panel",
  border: "--pip-line",
  primary: "--pip-green",
  muted: "--pip-greendim",
  warning: "--pip-amber",
  danger: "--pip-red",
};

const REQUIRED_THEME_KEYS = Object.keys(THEME_KEY_MAP);

export function Layout({ children }: { children: ReactNode }) {
  const { view, setView, activeRuleSet, upsertRuleSet } = useAppStore();
  const { t, locale, setLocale } = useT();
  const ui = getUiTemplate(activeRuleSet);
  const currentTheme = ui.theme ?? "pip-boy";
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>(loadCustomThemes);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const el = document.querySelector("main");
    if (!el) return;
    const onScroll = () => setShowScrollTop(el.scrollTop > 400);
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!showSettings) return;
    const close = () => setShowSettings(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [showSettings]);

  const scrollTop = () => document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });

  useEffect(() => { saveCustomThemes(customThemes); }, [customThemes]);

  const isBuiltin = BUILTIN_IDS.has(currentTheme);
  const customTheme = customThemes.find((t) => t.id === currentTheme);

  const setTheme = (themeId: string) => {
    upsertRuleSet({
      ...activeRuleSet,
      ui: { ...(activeRuleSet.ui ?? ui), theme: themeId },
    });
  };

  const handleImportTheme = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (!parsed.id || !parsed.label || !parsed.colors || typeof parsed.colors !== "object") {
          alert("Ungültiges Theme: 'id', 'label' und 'colors' (Objekt) werden benötigt.");
          return;
        }
        for (const key of REQUIRED_THEME_KEYS) {
          if (typeof parsed.colors[key] !== "string") {
            alert(`Ungültiges Theme: Farbe '${key}' fehlt in 'colors'. Erwartet werden: ${REQUIRED_THEME_KEYS.join(", ")}`);
            return;
          }
        }
        if (BUILTIN_IDS.has(parsed.id)) {
          alert(`Theme-ID '${parsed.id}' ist bereits ein Built-in-Theme. Bitte wähle eine andere ID.`);
          return;
        }
        setCustomThemes((prev) => {
          const filtered = prev.filter((t) => t.id !== parsed.id);
          return [...filtered, parsed as CustomTheme];
        });
        setTheme(parsed.id);
      } catch (e: any) {
        alert("Fehler beim Import: " + (e.message ?? "ungültige JSON-Datei"));
      }
    };
    input.click();
  };

  const customStyle = customTheme
    ? Object.fromEntries(Object.entries(customTheme.colors).map(([k, v]) => [THEME_KEY_MAP[k] ?? `--${k}`, v]))
    : undefined;

  const tabs: { id: typeof view; label: string }[] = [
    { id: "characters", label: t("nav.characters") },
    { id: "sheet", label: t("nav.sheet") },
    { id: "rules", label: t("nav.rules") },
  ];

  return (
    <div
      className={`${currentTheme === "pip-boy" ? "crt-frame " : ""}min-h-screen w-full text-pip-green ${currentTheme === "pip-boy" ? "animate-flicker" : ""} ${isBuiltin ? `theme-${currentTheme}` : ""}`}
      style={customStyle as React.CSSProperties}
    >
      <div className="relative z-10 mx-auto flex h-screen max-w-6xl flex-col p-4 md:p-6">
        <header className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-pip-line pb-3">
          <div>
            <h1 className="font-display text-4xl tracking-widest text-glow">Byte &amp; Dice</h1>
            <p className="text-xs text-pip-greendim">{t("app.subtitle", { name: activeRuleSet.name, version: activeRuleSet.version })}</p>
          </div>
          <nav className="flex gap-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setView(t.id)}
                className={`border px-3 py-1.5 font-display text-lg tracking-wider transition-colors ${
                  view === t.id
                    ? "border-pip-green bg-pip-green/10 text-pip-green text-glow"
                    : "border-pip-line text-pip-greendim hover:border-pip-greendim hover:text-pip-green"
                }`}
              >
                {t.label}
              </button>
            ))}
            <div className="relative">
              <button onClick={() => setShowSettings(!showSettings)} className="pip-btn-ghost px-2 py-1 text-xs" title="Einstellungen">⚙</button>
              {showSettings && (
                <div className="absolute right-0 top-full z-50 mt-1 flex flex-col gap-2 rounded-sm border border-pip-line bg-pip-bg p-3 shadow-lg" onClick={(e) => e.stopPropagation()}>
                  <select value={locale} onChange={(e) => setLocale(e.target.value)} className="pip-input rounded-sm px-2 py-1 text-xs" title="Language">
                    <option value="de">DE</option>
                    <option value="en">EN</option>
                    <option value="fr">FR</option>
                    <option value="it">IT</option>
                    <option value="es">ES</option>
                    <option value="tr">TR</option>
                  </select>
                  <select
                    value={currentTheme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="pip-input rounded-sm px-2 py-1 text-xs"
                  >
                    <optgroup label={t("app.theme.builtin")}>
                      {THEMES.map((th) => (
                        <option key={th.id} value={th.id}>{t(`theme.${th.id}`)}</option>
                      ))}
                    </optgroup>
                    {customThemes.length > 0 && (
                      <optgroup label={t("app.theme.custom")}>
                        {customThemes.map((th) => (
                          <option key={th.id} value={th.id}>{th.label}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <button onClick={handleImportTheme} className="pip-btn-ghost px-2 py-1 text-xs text-center">{t("app.theme.import")}</button>
                </div>
              )}
            </div>
          </nav>
        </header>
        <main className="flex-1 overflow-y-auto pr-1">{children}</main>

        {showScrollTop && (
          <button
            onClick={scrollTop}
            className="fixed bottom-6 right-6 z-50 rounded-sm border border-pip-green bg-pip-bg px-3 py-2 text-xs text-pip-green shadow-lg transition-all hover:bg-pip-green/20"
            title="Nach oben"
          >
            ↑
          </button>
        )}
      </div>
    </div>
  );
}
