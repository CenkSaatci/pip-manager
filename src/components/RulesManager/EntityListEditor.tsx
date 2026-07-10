import { useState } from "react";
import { JsonImportExport } from "./JsonImportExport";

interface Props<T> {
  label: string;
  items: T[];
  idKey: keyof T;
  renderTitle: (item: T) => string;
  renderSubtitle?: (item: T) => string;
  newItem: () => T;
  onChange: (items: T[]) => void;
  /** Optional: gibt eine Liste von Fehlermeldungen zurück (leer = gültig). Ungültige Einträge werden beim Import abgelehnt. */
  validateItem?: (item: T) => string[];
}

export function EntityListEditor<T extends Record<string, any>>({
  label,
  items,
  idKey,
  renderTitle,
  renderSubtitle,
  newItem,
  onChange,
  validateItem,
}: Props<T>) {
  const [rawMode, setRawMode] = useState(false);
  const [rawText, setRawText] = useState(() => JSON.stringify(items, null, 2));
  const [rawError, setRawError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [history, setHistory] = useState<T[][]>([]);

  const pushHistory = () => {
    setHistory((h) => [...h.slice(-4), items]);
  };

  const undo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    onChange(previous);
  };

  const enterRawMode = () => {
    setRawText(JSON.stringify(items, null, 2));
    setRawError(null);
    setRawMode(true);
  };

  const applyRaw = () => {
    try {
      const parsed = JSON.parse(rawText);
      if (!Array.isArray(parsed)) throw new Error("Erwartet wird ein JSON-Array");
      if (validateItem) {
        const problems: string[] = [];
        parsed.forEach((entry, i) => {
          const errs = validateItem(entry);
          if (errs.length > 0) problems.push(`Eintrag ${i + 1}: ${errs.join("; ")}`);
        });
        if (problems.length > 0) {
          setRawError(`${problems.length} ungültige(r) Eintrag/Einträge:\n${problems.join("\n")}`);
          return;
        }
      }
      pushHistory();
      onChange(parsed);
      setRawMode(false);
    } catch (e: any) {
      setRawError(e.message ?? "Ungültiges JSON");
    }
  };

  const removeItem = (id: string) => {
    pushHistory();
    onChange(items.filter((i) => i[idKey] !== id));
  };

  const addItem = () => {
    pushHistory();
    onChange([...items, newItem()]);
  };

  const handleImport = (imported: unknown) => {
    if (!Array.isArray(imported)) return;
    if (validateItem) {
      const problems: string[] = [];
      const valid: T[] = [];
      imported.forEach((entry, i) => {
        const errs = validateItem(entry as T);
        if (errs.length > 0) problems.push(`Eintrag ${i + 1} (${entry?.name ?? "?"}): ${errs.join("; ")}`);
        else valid.push(entry as T);
      });
      if (problems.length > 0) {
        alert(
          `${problems.length} Eintrag/Einträge wurden NICHT importiert, weil sie ungültig sind:\n\n${problems.join("\n")}\n\n${valid.length} gültige Einträge wurden trotzdem übernommen.`
        );
      }
      imported = valid;
    }
    pushHistory();
    const byId = new Map(items.map((i) => [String(i[idKey]), i]));
    let added = 0;
    let updated = 0;
    for (const entry of imported as T[]) {
      const id = String(entry[idKey]);
      if (byId.has(id)) updated++;
      else added++;
      byId.set(id, entry);
    }
    onChange(Array.from(byId.values()));
    if (added + updated > 0) {
      alert(`${label}: ${added} neu hinzugefügt, ${updated} aktualisiert (nach ID abgeglichen). Bestehende, nicht in der Datei enthaltene Einträge bleiben erhalten.`);
    }
  };

  return (
    <div className="pip-panel rounded-sm p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="pip-label">{label}</h3>
        <div className="flex flex-wrap gap-2">
          {history.length > 0 && (
            <button onClick={undo} className="pip-btn-ghost px-2 py-1 text-xs text-pip-amber">
              ↺ Rückgängig ({history.length})
            </button>
          )}
          <JsonImportExport label={label} data={items} onImport={handleImport} />
          <button
            onClick={() => {
              if (rawMode) applyRaw();
              else enterRawMode();
            }}
            className="pip-btn-ghost px-2 py-1 text-xs"
          >
            {rawMode ? "JSON übernehmen" : "Als JSON bearbeiten"}
          </button>
          {!rawMode && (
            <button onClick={addItem} className="pip-btn-ghost px-2 py-1 text-xs">
              + Neu
            </button>
          )}
        </div>
      </div>

      {rawMode ? (
        <div>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={16}
            className="pip-input w-full rounded-sm p-2 font-mono text-xs"
            spellCheck={false}
          />
          {rawError && <pre className="mt-1 whitespace-pre-wrap text-xs text-pip-red">{rawError}</pre>}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {items.map((item) => {
            const id = String(item[idKey]);
            const isEditing = editingId === id;
            return (
              <div key={id} className="rounded-sm border border-pip-line p-2 text-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{renderTitle(item)}</div>
                    {renderSubtitle && <div className="text-xs text-pip-greendim">{renderSubtitle(item)}</div>}
                  </div>
                  <div className="flex gap-2 text-xs">
                    <button
                      onClick={() => setEditingId(isEditing ? null : id)}
                      className="text-pip-green hover:text-glow"
                    >
                      {isEditing ? "Fertig" : "Bearbeiten"}
                    </button>
                    <button onClick={() => removeItem(id)} className="text-pip-red hover:text-glow">
                      Löschen
                    </button>
                  </div>
                </div>
                {isEditing && (
                  <textarea
                    defaultValue={JSON.stringify(item, null, 2)}
                    rows={10}
                    className="pip-input mt-2 w-full rounded-sm p-2 font-mono text-xs"
                    onBlur={(e) => {
                      try {
                        const updated = JSON.parse(e.target.value);
                        if (validateItem) {
                          const errs = validateItem(updated);
                          if (errs.length > 0) {
                            alert(`Änderung nicht übernommen, ungültig:\n${errs.join("\n")}`);
                            return;
                          }
                        }
                        pushHistory();
                        onChange(items.map((i) => (String(i[idKey]) === id ? updated : i)));
                      } catch {
                        // ignore invalid JSON until corrected
                      }
                    }}
                  />
                )}
              </div>
            );
          })}
          {items.length === 0 && <p className="text-sm text-pip-greendim">Keine Einträge.</p>}
        </div>
      )}
    </div>
  );
}
