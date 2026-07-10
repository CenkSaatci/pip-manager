import * as api from "../../lib/api";

export function JsonImportExport<T>({
  label,
  data,
  onImport,
}: {
  label: string;
  data: T;
  onImport: (imported: T) => void;
}) {
  const handleExport = () => api.exportJsonFile(data, `${label.toLowerCase().replace(/\s+/g, "_")}.json`);

  const handleImport = async () => {
    const imported = await api.importJsonFile<T>();
    if (imported) onImport(imported);
  };

  return (
    <div className="flex gap-2">
      <button onClick={handleImport} className="pip-btn-ghost px-2 py-1 text-xs">
        {label} importieren
      </button>
      <button onClick={handleExport} className="pip-btn-ghost px-2 py-1 text-xs">
        {label} exportieren
      </button>
    </div>
  );
}
