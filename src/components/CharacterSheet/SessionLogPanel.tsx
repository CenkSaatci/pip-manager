import { useState } from "react";
import { Character } from "../../types/character";
import { useT } from "../../i18n/context";

export function SessionLogPanel({ char, onChange }: { char: Character; onChange: (c: Character) => void }) {
  const { t } = useT();
  const [draft, setDraft] = useState("");

  const addEntry = () => {
    const text = draft.trim();
    if (!text) return;
    onChange({
      ...char,
      sessionLog: [{ id: crypto.randomUUID(), timestamp: new Date().toISOString(), text }, ...char.sessionLog],
    });
    setDraft("");
  };

  const removeEntry = (id: string) => {
    onChange({ ...char, sessionLog: char.sessionLog.filter((e) => e.id !== id) });
  };

  return (
    <div className="pip-panel rounded-sm p-4">
      <h3 className="pip-label mb-2">{t('sessionLog.title')}</h3>
      <div className="mb-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addEntry()}
          placeholder={t('sessionLog.placeholder')}
          className="pip-input flex-1 rounded-sm px-2 py-1 text-sm"
        />
        <button onClick={addEntry} className="pip-btn-ghost px-3">
          {t('sessionLog.add')}
        </button>
      </div>
      <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
        {char.sessionLog.map((entry) => (
          <div key={entry.id} className="flex items-start justify-between gap-2 border-b border-pip-line py-1 text-sm">
            <div>
              <div className="text-xs text-pip-greendim">
                {new Date(entry.timestamp).toLocaleString("de-DE")}
              </div>
              <div>{entry.text}</div>
            </div>
            <button onClick={() => removeEntry(entry.id)} className="shrink-0 text-xs text-pip-red hover:text-glow">
              {t('charList.delete')}
            </button>
          </div>
        ))}
        {char.sessionLog.length === 0 && <p className="text-sm text-pip-greendim">{t('sessionLog.empty')}</p>}
      </div>
    </div>
  );
}
