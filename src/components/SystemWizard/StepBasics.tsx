import { THEMES } from "../../types/rules";
import { useT } from "../../i18n/context";

export interface BasicsDraft {
  name: string;
  version: string;
  description: string;
  currencyLabel: string;
  theme: string;
  diceType: string;
}

interface Props {
  value: BasicsDraft;
  onChange: (v: BasicsDraft) => void;
  onNext: () => void;
}

const CURRENCY_OPTIONS = ["Caps", "GM", "Dukaten", "Nuyen", "Euro", "Credit", "Kroner"];

export function StepBasics({ value, onChange, onNext }: Props) {
  const { t } = useT();
  const canProceed = value.name.trim().length > 0;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-2xl text-glow">{t("wizard.title")}</h2>

      <label className="flex flex-col gap-1">
        <span className="pip-label">{t("wizard.charName")}</span>
        <input autoFocus value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })}
          className="pip-input rounded-sm px-3 py-2 font-display text-xl" placeholder="z.B. Mein Hausregel-System" />
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="pip-label">Version</span>
          <input value={value.version} onChange={(e) => onChange({ ...value, version: e.target.value })}
            className="pip-input rounded-sm px-3 py-2" placeholder="0.1" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="pip-label">Würfelmechanik</span>
          <select value={value.diceType} onChange={(e) => onChange({ ...value, diceType: e.target.value })}
            className="pip-input rounded-sm px-2 py-2">
            <option value="d10-pool">d10-Pool (Fallout)</option>
            <option value="d20-plus">d20 + Modifikator (D&D)</option>
            <option value="3d20">3W20-Probe (DSA)</option>
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="pip-label">Beschreibung</span>
        <textarea value={value.description} onChange={(e) => onChange({ ...value, description: e.target.value })}
          className="pip-input rounded-sm px-3 py-2 text-sm" rows={2} placeholder="Kurze Beschreibung des Systems…" />
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="pip-label">Währung</span>
          <select value={CURRENCY_OPTIONS.includes(value.currencyLabel) ? value.currencyLabel : "__other__"}
            onChange={(e) => {
              if (e.target.value === "__other__") return;
              onChange({ ...value, currencyLabel: e.target.value });
            }}
            className="pip-input rounded-sm px-2 py-2">
            {CURRENCY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            <option value="__other__">Eigene…</option>
          </select>
          {!CURRENCY_OPTIONS.includes(value.currencyLabel) && (
            <input value={value.currencyLabel} onChange={(e) => onChange({ ...value, currencyLabel: e.target.value })}
              className="pip-input mt-1 rounded-sm px-2 py-1" placeholder="Eigene Währung" />
          )}
        </label>
        <label className="flex flex-col gap-1">
          <span className="pip-label">Theme</span>
          <select value={value.theme} onChange={(e) => onChange({ ...value, theme: e.target.value })}
            className="pip-input rounded-sm px-2 py-2">
            {THEMES.map((th) => <option key={th.id} value={th.id}>{t(`theme.${th.id}`)}</option>)}
          </select>
        </label>
      </div>

      <div className="flex justify-end border-t border-pip-line pt-4">
        <button onClick={onNext} disabled={!canProceed}
          className={`rounded-sm px-6 py-2 font-display text-sm transition-colors ${canProceed ? "border border-pip-green bg-pip-green/10 text-pip-green hover:bg-pip-green/20" : "border border-pip-line text-pip-greendim cursor-not-allowed"}`}>
          Weiter →
        </button>
      </div>
    </div>
  );
}
