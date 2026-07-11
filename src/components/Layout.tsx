import { ReactNode } from "react";
import { useAppStore } from "../store/useAppStore";
import { THEMES, getUiTemplate } from "../types/rules";

export function Layout({ children }: { children: ReactNode }) {
  const { view, setView, activeRuleSet, upsertRuleSet } = useAppStore();
  const ui = getUiTemplate(activeRuleSet);
  const currentTheme = ui.theme ?? "pip-boy";

  const setTheme = (themeId: string) => {
    upsertRuleSet({
      ...activeRuleSet,
      ui: { ...activeRuleSet.ui ?? ui, theme: themeId },
    });
  };

  const tabs: { id: typeof view; label: string }[] = [
    { id: "characters", label: "WANDERER" },
    { id: "sheet", label: "AKTE" },
    { id: "rules", label: "REGELWERK" },
  ];

  return (
    <div className={`crt-frame min-h-screen w-full text-pip-green animate-flicker theme-${currentTheme}`}>
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
              {THEMES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </nav>
        </header>
        <main className="flex-1 overflow-y-auto pr-1">{children}</main>
      </div>
    </div>
  );
}
