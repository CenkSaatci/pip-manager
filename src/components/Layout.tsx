import { ReactNode } from "react";
import { useAppStore } from "../store/useAppStore";

export function Layout({ children }: { children: ReactNode }) {
  const { view, setView, activeRuleSet } = useAppStore();

  const tabs: { id: typeof view; label: string }[] = [
    { id: "characters", label: "WANDERER" },
    { id: "sheet", label: "AKTE" },
    { id: "rules", label: "REGELWERK" },
  ];

  return (
    <div className="crt-frame min-h-screen w-full text-pip-green animate-flicker">
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
          </nav>
        </header>
        <main className="flex-1 overflow-y-auto pr-1">{children}</main>
      </div>
    </div>
  );
}
