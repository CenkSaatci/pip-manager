import { useState, ReactNode } from "react";

export function CollapsiblePanel({
  label,
  defaultOpen = false,
  children,
}: {
  label: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-sm border border-pip-line bg-pip-panel/30 px-3 py-2 text-left transition-colors hover:bg-pip-green/10"
      >
        <h3 className="pip-label">{label}</h3>
        <span className={`text-xs text-pip-greendim transition-transform ${open ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>
      {open && <div className="pt-2">{children}</div>}
    </div>
  );
}
