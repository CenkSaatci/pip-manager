import { useState, useEffect, useMemo } from "react";
import { useAppStore } from "../../store/useAppStore";
import { useT } from "../../i18n/context";
import { SpecialPanel } from "./SpecialPanel";
import { SkillsPanel } from "./SkillsPanel";
import { BackgroundPanel } from "./BackgroundPanel";
import { PerksTraitsPanel } from "./PerksTraitsPanel";
import { InventoryPanel } from "./InventoryPanel";
import { DiceRollerPanel } from "./DiceRollerPanel";
import { HitLocationPanel } from "./HitLocationPanel";
import { NeedsPanel } from "./NeedsPanel";
import { SessionLogPanel } from "./SessionLogPanel";
import { PrintSheet } from "./PrintSheet";
import { LevelUpModal } from "./LevelUpModal";
import { getResource, setResource, getCaps } from "../../lib/compat";
import { getMaxHp, getMaxApr, getCarryWeight, getHealingRate } from "../../lib/derived";
import { buildCharacterPdf } from "../../lib/pdf";
import { Character } from "../../types/character";
import { RuleSet, getUiTemplate } from "../../types/rules";
import * as api from "../../lib/api";

export function CharacterSheet() {
  const { t } = useT();
  const { characters, selectedCharacterId, activeRuleSet, upsertCharacter, selectCharacter } = useAppStore();
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [localName, setLocalName] = useState("");
  const [localNotes, setLocalNotes] = useState("");
  const char = characters.find((c) => c.id === selectedCharacterId);

  useEffect(() => { if (char) { setLocalName(char.name); setLocalNotes(char.backstory ?? ""); } }, [char?.id, char?.name, char?.backstory]);

  const commitName = () => {
    if (char && localName !== char.name) update({ ...char, name: localName });
  };
  const commitNotes = () => {
    if (char && localNotes !== (char.backstory ?? "")) update({ ...char, backstory: localNotes });
  };

  if (!char) {
    return <p className="text-pip-greendim">{t('sheet.noCharacter')}</p>;
  }

  const rules = activeRuleSet;
  const maxHp = getMaxHp(char, rules);
  const maxApr = getMaxApr(char, rules);
  const karmaEnabled = !rules.disabledMechanics.includes("karma");

  const update = (next: Character) => {
    upsertCharacter({ ...next, updatedAt: new Date().toISOString() });
  };

  const handleExport = () => api.exportJsonFile(char, `${char.name.replace(/\s+/g, "_")}.json`);

  const handleExportPdf = async () => {
    try {
      const doc = buildCharacterPdf(char, rules);
      const bytes = new Uint8Array(doc.output("arraybuffer"));
      const saved = await api.exportBinaryFile(bytes, `${char.name.replace(/\s+/g, "_")}.pdf`, "pdf", "PDF");
      if (!saved) return; // Nutzer hat den Speichern-Dialog abgebrochen
    } catch (err) {
      console.error("PDF-Export fehlgeschlagen:", err);
      alert(t('sheet.pdfExportError', { error: err instanceof Error ? err.message : String(err) }));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="pip-panel flex flex-wrap items-center justify-between gap-3 rounded-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => selectCharacter(null)} className="pip-btn-ghost px-2 py-1 text-sm">
            {t('sheet.back')}
          </button>
          <input
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => { if (e.key === "Enter") { (e.target as HTMLInputElement).blur(); } }}
            className="pip-input rounded-sm px-2 py-1 font-display text-2xl"
          />
          <RaceBackgroundSelect char={char} rules={rules} onChange={update} />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowLevelUp(true)} className="pip-btn">
            {t('sheet.levelUp')}
          </button>
          <button onClick={() => window.print()} className="pip-btn-ghost">
            {t('sheet.print')}
          </button>
          <button onClick={handleExportPdf} className="pip-btn-ghost">
            {t('sheet.savePdf')}
          </button>
          <button onClick={handleExport} className="pip-btn-ghost">
            {t('sheet.exportJson')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {getUiTemplate(rules).resources.map((res) => {
          const resVal = getResource(char, res.key);
          const formulaMap: Record<string, number> = {
            maxHp, maxApr,
            carryWeight: getCarryWeight(char, rules),
            healingRate: getHealingRate(char, rules),
          };
          const maxVal = res.formula ? formulaMap[res.formula] : undefined;
          const barColor: Record<string, string> = {
            red: "bg-pip-red", amber: "bg-pip-amber", blue: "bg-pip-blue", green: "bg-pip-green",
          };
          if (maxVal !== undefined && maxVal > 0) {
            return (
              <ResourceBar
                key={res.key}
                label={res.label}
                value={resVal}
                max={maxVal}
                color={barColor[res.color] ?? "bg-pip-amber"}
                onChange={(v) => update(setResource(char, res.key, v))}
              />
            );
          }
          return (
            <div key={res.key} className="pip-panel flex items-center justify-between rounded-sm p-3">
              <div>
                <span className="pip-label">{res.label}</span>
                <div className="font-display text-2xl text-glow">{resVal}</div>
              </div>
            </div>
          );
        })}
        <div className="pip-panel flex items-center justify-between rounded-sm p-3">
          <div>
            <span className="pip-label">{t('sheet.globalCaps', { currency: getUiTemplate(rules).currencyLabel ?? "Caps" })}</span>
            <div className="font-display text-2xl text-glow">{getCaps(char)}</div>
          </div>
          <div>
            <span className="pip-label">{t('sheet.globalXp')}</span>
            <div className="font-display text-2xl text-glow">{char.xp}</div>
          </div>
        </div>
      </div>

      <SpecialPanel char={char} rules={rules} onChange={update} />
      <BackgroundPanel char={char} rules={rules} onChange={update} />
      <SkillsPanel char={char} rules={rules} onChange={update} />
      <PerksTraitsPanel char={char} rules={rules} onChange={update} />
      <InventoryPanel char={char} rules={rules} onChange={update} />
      {getUiTemplate(rules).panels.hitLocations.enabled && (
        <HitLocationPanel char={char} rules={rules} onChange={update} />
      )}
      {getUiTemplate(rules).panels.needs.enabled && (
        <NeedsPanel char={char} onChange={update} />
      )}
      <DiceRollerPanel char={char} rules={rules} onCharChange={update} />

      <div className="pip-panel rounded-sm p-4">
        <h3 className="pip-label mb-2">{t('sheet.notesLabel')}</h3>
        <textarea
          value={localNotes}
          onChange={(e) => setLocalNotes(e.target.value)}
          onBlur={commitNotes}
          rows={4}
          className="pip-input w-full rounded-sm p-2 text-sm"
          placeholder={t('sheet.notesPlaceholder')}
        />
      </div>

      <SessionLogPanel char={char} onChange={update} />

      {showLevelUp && (
        <LevelUpModal char={char} rules={rules} onClose={() => setShowLevelUp(false)} onChange={update} />
      )}

      <PrintSheet char={char} rules={rules} />
    </div>
  );
}

function RaceBackgroundSelect({
  char,
  rules,
  onChange,
}: {
  char: Character;
  rules: RuleSet;
  onChange: (c: Character) => void;
}) {
  return (
    <div className="flex gap-2">
      {rules.races.length > 0 && (
        <select
          value={char.raceId}
          onChange={(e) => onChange({ ...char, raceId: e.target.value })}
          className="pip-input rounded-sm px-2 py-1 text-sm"
        >
          <option value="">Rasse wählen</option>
          {rules.races.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      )}
      <select
        value={char.backgroundId}
        onChange={(e) => onChange({ ...char, backgroundId: e.target.value })}
        className="pip-input rounded-sm px-2 py-1 text-sm"
      >
        <option value="">Hintergrund wählen</option>
        {rules.backgrounds.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
            {b.requiresGmApproval ? " (SL-Genehmigung)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

function ResourceBar({
  label,
  value,
  max,
  color,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  onChange: (v: number) => void;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className="pip-panel rounded-sm p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="pip-label">{label}</span>
        <span className="text-xs text-pip-amber">
          {value} / {max}
        </span>
      </div>
      <div className="mb-2 h-2 w-full overflow-hidden rounded-sm border border-pip-line bg-black/40">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <input
        type="range"
        min={0}
        max={Math.max(max, 1)}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-pip-green"
      />
    </div>
  );
}
