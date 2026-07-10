import { useState } from "react";
import { Character } from "../../types/character";
import { RuleSet } from "../../types/rules";
import { getCarryWeight, getCurrentCarriedWeight } from "../../lib/derived";

export function InventoryPanel({
  char,
  rules,
  onChange,
}: {
  char: Character;
  rules: RuleSet;
  onChange: (c: Character) => void;
}) {
  const [selectedItem, setSelectedItem] = useState(rules.items[0]?.id ?? "");
  const carried = getCurrentCarriedWeight(char, rules);
  const capacity = getCarryWeight(char, rules);
  const overloaded = carried > capacity;

  const addItem = () => {
    if (!selectedItem) return;
    const existing = char.inventory.find((i) => i.itemId === selectedItem);
    if (existing) {
      onChange({
        ...char,
        inventory: char.inventory.map((i) =>
          i.itemId === selectedItem ? { ...i, quantity: i.quantity + 1 } : i
        ),
      });
    } else {
      onChange({
        ...char,
        inventory: [...char.inventory, { itemId: selectedItem, quantity: 1, equipped: false }],
      });
    }
  };

  const updateQty = (itemId: string, qty: number) => {
    if (qty <= 0) {
      onChange({ ...char, inventory: char.inventory.filter((i) => i.itemId !== itemId) });
      return;
    }
    onChange({
      ...char,
      inventory: char.inventory.map((i) => (i.itemId === itemId ? { ...i, quantity: qty } : i)),
    });
  };

  const toggleEquip = (itemId: string) => {
    onChange({
      ...char,
      inventory: char.inventory.map((i) => (i.itemId === itemId ? { ...i, equipped: !i.equipped } : i)),
    });
  };

  return (
    <div className="pip-panel rounded-sm p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="pip-label">Inventar</h3>
        <span className={`text-xs ${overloaded ? "text-pip-red" : "text-pip-amber"}`}>
          {carried.toFixed(1)} / {capacity} kg {overloaded ? "· ÜBERLADEN" : ""}
        </span>
      </div>

      <div className="mb-3 flex gap-2">
        <select
          value={selectedItem}
          onChange={(e) => setSelectedItem(e.target.value)}
          className="pip-input flex-1 rounded-sm px-2 py-1"
        >
          {rules.items.length === 0 && <option value="">Keine Items im Regelwerk</option>}
          {rules.items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} ({item.type}, {item.weight}kg)
            </option>
          ))}
        </select>
        <button onClick={addItem} className="pip-btn-ghost px-3">
          + Hinzufügen
        </button>
      </div>

      <div className="flex flex-col gap-1">
        {char.inventory.map((entry) => {
          const item = rules.items.find((i) => i.id === entry.itemId);
          if (!item) return null;
          return (
            <div key={entry.itemId} className="flex items-center justify-between border-b border-pip-line py-1 text-sm">
              <div>
                <span className={entry.equipped ? "text-pip-amber" : ""}>{item.name}</span>
                <span className="ml-2 text-xs text-pip-greendim">
                  {item.type}
                  {item.damage !== undefined ? ` · Schaden ${item.damage}` : ""}
                  {item.damageResistance ? ` · DR ${item.damageResistance}` : ""}
                  {item.isHelmet ? " · Helm" : ""}
                  {item.requiresTraining ? " · benötigt Ausbildung" : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {(item.type === "weapon" || item.type === "armor") && (
                  <button onClick={() => toggleEquip(entry.itemId)} className="text-xs text-pip-greendim hover:text-pip-green">
                    {entry.equipped ? "Ablegen" : "Ausrüsten"}
                  </button>
                )}
                <input
                  type="number"
                  min={0}
                  value={entry.quantity}
                  onChange={(e) => updateQty(entry.itemId, Number(e.target.value))}
                  className="pip-input w-14 rounded-sm px-1 py-0.5 text-center"
                />
              </div>
            </div>
          );
        })}
        {char.inventory.length === 0 && <p className="text-sm text-pip-greendim">Inventar ist leer.</p>}
      </div>
    </div>
  );
}
