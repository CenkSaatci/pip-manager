import { useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { useT } from "../i18n/context";
import { blankCharacter, Character } from "../types/character";
import { CharacterWizard } from "./CharacterWizard";
import * as api from "../lib/api";
import { migrateCharacter } from "../lib/migration";

export function CharacterList() {
  const { t } = useT();
  const { characters, ruleSets, activeRuleSet, selectCharacter, upsertCharacter, removeCharacter } = useAppStore();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const filtered = showAll
    ? characters
    : characters.filter((c) => c.ruleSetId === activeRuleSet.id);

  const getRuleSetName = (ruleSetId: string): string => {
    return ruleSets.find((r) => r.id === ruleSetId)?.name ?? t('charList.unknownSystem');
  };

  const handleCreate = () => setWizardOpen(true);

  const handleFinishWizard = async (char: Character) => {
    setWizardOpen(false);
    await upsertCharacter(char);
    selectCharacter(char.id);
  };

  const handleImport = async () => {
    const imported = await api.importJsonFile<Character>();
    if (!imported) return;
    imported.id = imported.id ?? crypto.randomUUID();
    imported.updatedAt = new Date().toISOString();
    await upsertCharacter(migrateCharacter(imported));
  };

  const handleExportAll = async () => {
    if (characters.length === 0) return;
    await api.exportJsonFile(
      { exportedAt: new Date().toISOString(), characters },
      `pip-manager_backup_${new Date().toISOString().slice(0, 10)}.json`
    );
  };

  const handleImportAll = async () => {
    const raw = await api.importJsonFile<{ characters?: Character[] } | Character[]>();
    if (!raw) return;
    const list = Array.isArray(raw) ? raw : raw.characters ?? [];
    if (list.length === 0) {
      alert(t('charList.importAllError'));
      return;
    }
    for (const c of list) {
      const migrated = migrateCharacter(c);
      migrated.id = migrated.id ?? crypto.randomUUID();
      migrated.updatedAt = new Date().toISOString();
      await upsertCharacter(migrated);
    }
    alert(t('charList.importAllDone', { count: list.length }));
  };

  const handleExport = async (c: Character, e: React.MouseEvent) => {
    e.stopPropagation();
    await api.exportJsonFile(c, `${c.name.replace(/\s+/g, "_")}.json`);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(t('charList.deleteConfirm'))) {
      await removeCharacter(id);
    }
  };

  const handleQuickCreate = async () => {
    const c = blankCharacter(activeRuleSet.id);
    await upsertCharacter(c);
    selectCharacter(c.id);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={handleCreate} className="pip-btn">
          {t('charList.createGuided')}
        </button>
        <button onClick={handleQuickCreate} className="pip-btn-ghost px-2 py-1 text-xs">
          {t('charList.createQuick')}
        </button>
        <button onClick={handleImport} className="pip-btn-ghost px-2 py-1 text-xs">
          {t('charList.import')}
        </button>
        <span className="w-px self-stretch bg-pip-line/50" />
        <button onClick={handleExportAll} className="pip-btn-ghost px-2 py-1 text-xs">
          {t('charList.exportAll')}
        </button>
        <button onClick={handleImportAll} className="pip-btn-ghost px-2 py-1 text-xs">
          {t('charList.importAll')}
        </button>
      </div>

      {characters.length > 0 && (
        <div className="mb-3 flex items-center gap-2 text-xs">
          <span className="text-pip-greendim">
            {showAll ? t('charList.filterAll', { count: characters.length }) : t('charList.filter', { count: filtered.length, name: activeRuleSet.name })}
          </span>
          <button onClick={() => setShowAll(!showAll)} className="pip-btn-ghost px-2 py-0.5">
            {showAll ? t('charList.toggleFilterOff') : t('charList.toggleFilter')}
          </button>
        </div>
      )}

      {filtered.length === 0 && (
        <p className="text-pip-greendim">
          {showAll
            ? t('charList.empty')
            : t('charList.emptyFiltered', { name: activeRuleSet.name })}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => {
          const race = activeRuleSet.races.find((r) => r.id === c.raceId);
          const systemName = getRuleSetName(c.ruleSetId);
          const isOtherSystem = c.ruleSetId !== activeRuleSet.id;
          return (
            <button
              key={c.id}
              onClick={() => selectCharacter(c.id)}
              className={`pip-panel group flex flex-col gap-1 rounded-sm p-4 text-left transition-transform hover:-translate-y-0.5 ${isOtherSystem ? "opacity-70" : ""}`}
            >
              <div className="flex items-start justify-between">
                <h3 className="font-display text-2xl text-glow">{c.name}</h3>
                <span className="rounded border border-pip-line px-1.5 text-xs text-pip-amber">
                  {t('charList.lvl', { level: c.level })}
                </span>
              </div>
              <p className="text-sm text-pip-greendim">
                {race?.name ?? t('charList.unknownRace')} · {c.playerName || t('charList.noPlayer')}
              </p>
              {isOtherSystem && (
                <p className="text-xs text-pip-amber">{systemName}</p>
              )}
              <div className="mt-2 flex items-center justify-between text-xs">
                <span>{t('charList.hp', { hp: c.resources?.hp ?? c.currentHp ?? 0 })}</span>
                <div className="flex gap-2">
                  <span onClick={(e) => handleExport(c, e)} className="text-pip-greendim hover:text-pip-green cursor-pointer">{t('charList.export')}</span>
                  <span onClick={(e) => handleDelete(c.id, e)} className="text-pip-greendim hover:text-pip-red cursor-pointer">{t('charList.delete')}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {wizardOpen && (
        <CharacterWizard
          rules={activeRuleSet}
          onFinish={handleFinishWizard}
          onCancel={() => setWizardOpen(false)}
        />
      )}
    </div>
  );
}
