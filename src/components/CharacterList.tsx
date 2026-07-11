import { useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { blankCharacter, Character } from "../types/character";
import { CharacterWizard } from "./CharacterWizard";
import * as api from "../lib/api";

export function CharacterList() {
  const { characters, activeRuleSet, selectCharacter, upsertCharacter, removeCharacter } = useAppStore();
  const [wizardOpen, setWizardOpen] = useState(false);

  const handleCreate = async () => {
    setWizardOpen(true);
  };

  const handleFinishWizard = async (char: Character) => {
    setWizardOpen(false);
    await upsertCharacter(char);
    selectCharacter(char.id);
  };

  const handleImport = async () => {
    const imported = await api.importJsonFile<Character>();
    if (!imported) return;
    if (!imported.name || !imported.special) {
      alert("Ungültige Charakter-Datei: 'name' und 'special' werden benötigt.");
      return;
    }
    imported.id = imported.id ?? crypto.randomUUID();
    imported.updatedAt = new Date().toISOString();
    await upsertCharacter(imported);
  };

  const handleExportAll = async () => {
    if (characters.length === 0) return;
    await api.exportJsonFile(
      { exportedAt: new Date().toISOString(), characters },
      `pip-manager_backup_${new Date().toISOString().slice(0, 10)}.json`
    );
  };

  const handleImportAll = async () => {
    const imported = await api.importJsonFile<{ characters?: Character[] } | Character[]>();
    if (!imported) return;
    const list = Array.isArray(imported) ? imported : imported.characters ?? [];
    if (list.length === 0) {
      alert("Keine Charaktere in dieser Datei gefunden.");
      return;
    }
    for (const c of list) {
      c.id = c.id ?? crypto.randomUUID();
      c.updatedAt = new Date().toISOString();
      await upsertCharacter(c);
    }
    alert(`${list.length} Charakter(e) importiert/aktualisiert.`);
  };

  const handleExport = async (c: Character, e: React.MouseEvent) => {
    e.stopPropagation();
    await api.exportJsonFile(c, `${c.name.replace(/\s+/g, "_")}.json`);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Diesen Wanderer wirklich löschen?")) {
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
          + Neuer Wanderer (geführt)
        </button>
        <button onClick={handleQuickCreate} className="pip-btn-ghost">
          + Schnellerstellung
        </button>
        <button onClick={handleImport} className="pip-btn-ghost">
          Charakter importieren (JSON)
        </button>
        <button onClick={handleExportAll} className="pip-btn-ghost">
          Alle exportieren (Backup)
        </button>
        <button onClick={handleImportAll} className="pip-btn-ghost">
          Alle importieren (Backup)
        </button>
      </div>

      {characters.length === 0 && (
        <p className="text-pip-greendim">
          Keine Aktendatensätze gefunden. Leg mit "+ Neuer Wanderer" los oder importiere einen bestehenden
          Charakter.
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {characters.map((c) => {
          const race = activeRuleSet.races.find((r) => r.id === c.raceId);
          return (
            <button
              key={c.id}
              onClick={() => selectCharacter(c.id)}
              className="pip-panel group flex flex-col gap-1 rounded-sm p-4 text-left transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-display text-2xl text-glow">{c.name}</h3>
                <span className="rounded border border-pip-line px-1.5 text-xs text-pip-amber">
                  LVL {c.level}
                </span>
              </div>
              <p className="text-sm text-pip-greendim">
                {race?.name ?? "Unbekannte Rasse"} · {c.playerName || "kein Spieler eingetragen"}
              </p>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span>LVL {c.level} · {(c.resources?.hp ?? c.currentHp ?? 0)} HP</span>
                <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <span onClick={(e) => handleExport(c, e)} className="text-pip-green hover:text-glow">
                    Export
                  </span>
                  <span onClick={(e) => handleDelete(c.id, e)} className="text-pip-red hover:text-glow">
                    Löschen
                  </span>
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
