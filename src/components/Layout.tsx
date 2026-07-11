import { useState, useEffect, ReactNode } from "react";
import { useAppStore } from "../store/useAppStore";
import { THEMES, getUiTemplate } from "../types/rules";

const STORAGE_KEY = "pip-manager-custom-themes";

interface CustomTheme {
  id: string;
  label: string;
  colors: Record<string, string>;
}

function loadCustomThemes(): CustomTheme[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch { return []; }
}

function saveCustomThemes(themes: CustomTheme[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(themes));
}

const BUILTIN_IDS = new Set<string>(THEMES.map((t) => t.id));

export function Layout({ children }: { children: ReactNode }) {
  const { view, setView, activeRuleSet, upsertRuleSet } = useAppStore();
  const ui = getUiTemplate(activeRuleSet);
  const currentTheme = ui.theme ?? "pip-boy";
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>(loadCustomThemes);

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
        const required = ["pip-bg", "pip-panel", "pip-line", "pip-green", "pip-greendim", "pip-amber", "pip-red"];
        for (const key of required) {
          if (typeof parsed.colors[key] !== "string") {
            alert(`Ungültiges Theme: Farbe '${key}' fehlt in 'colors'.`);
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
    ? Object.fromEntries(Object.entries(customTheme.colors).map(([k, v]) => [`--${k}`, v]))
    : undefined;

  const tabs: { id: typeof view; label: string }[] = [
    { id: "characters", label: "WANDERER" },
    { id: "sheet", label: "AKTE" },
    { id: "rules", label: "REGELWERK" },
  ];

  return (
    <div
      className={`crt-frame min-h-screen w-full text-pip-green animate-flicker ${isBuiltin ? `theme-${currentTheme}` : ""}`}
      style={customStyle as React.CSSProperties}
    >
      <div className="relative z-10 mx-auto flex h-screen max-w-6xl flex-col p-4 md:p-6">
        <header className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-pip-line pb-3">
          <div>
            <h1 className="font-display text-4xl tracking-widest text-glow">PIP-MANAGER</h1>
            <p className="text-xs text-pip-greendim">
              Regelwerk: <span className="text-pip-amber">{activeRuleSet.name}</span> · v{activeRuleSet.version}
            </p>
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
            <select
              value={currentTheme}
              onChange={(e) => setTheme(e.target.value)}
              className="pip-input ml-2 rounded-sm px-2 py-1 text-xs"
              title="Theme wechseln"
            >
              <optgroup label="Integrierte Themes">
                {THEMES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </optgroup>
              {customThemes.length > 0 && (
                <optgroup label="Eigene Themes">
                  {customThemes.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </optgroup>
              )}
            </select>
            <button onClick={handleImportTheme} className="pip-btn-ghost px-2 py-1 text-xs" title="Theme importieren">
              + Theme
            </button>
          </nav>
        </header>
        <main className="flex-1 overflow-y-auto pr-1">{children}</main>
      </div>
    </div>
  );
}
