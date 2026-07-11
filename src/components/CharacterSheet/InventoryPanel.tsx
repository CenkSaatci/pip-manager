import { useState } from "react";
import { Character } from "../../types/character";
import { RuleSet } from "../../types/rules";
import { getCarryWeight, getCurrentCarriedWeight, applyConsumable } from "../../lib/derived";
import { useT } from "../../i18n/context";

export function InventoryPanel({
  char,
  rules,
  onChange,
}: {
  char: Character;
  rules: RuleSet;
  onChange: (c: Character) => void;
}) {
  const { t } = useT();
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

  const useItem = (entry: Character["inventory"][number]) => {
    const item = rules.items.find((i) => i.id === entry.itemId);
    if (!item) return;
    const updated = applyConsumable(char, rules, item);
    const qty = entry.quantity - 1;
    onChange({
      ...updated,
      inventory: qty <= 0
        ? updated.inventory.filter((i) => i.itemId !== entry.itemId)
        : updated.inventory.map((i) => (i.itemId === entry.itemId ? { ...i, quantity: qty } : i)),
    });
  };

  return (
    <div className="pip-panel rounded-sm p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="pip-label">{t('inventory.title')}</h3>
        <span className={`text-xs ${overloaded ? "text-pip-red" : "text-pip-amber"}`}>
          {t('inventory.weight', { weight: carried.toFixed(1), capacity })} {overloaded ? `· ${t('inventory.overloaded')}` : ""}
        </span>
      </div>

      <div className="mb-3 flex gap-2">
        <select
          value={selectedItem}
          onChange={(e) => setSelectedItem(e.target.value)}
          className="pip-input flex-1 rounded-sm px-2 py-1"
        >
          {rules.items.length === 0 && <option value="">{t('inventory.empty')}</option>}
          {rules.items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} {t('inventory.suffix', { type: item.type, weight: item.weight })}
            </option>
          ))}
        </select>
        <button onClick={addItem} className="pip-btn-ghost px-3">
          {t('inventory.add')}
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
                  {item.damage !== undefined ? ` · ${t('inventory.damage', { dmg: item.damage })}` : ""}
                  {item.damageResistance ? ` · ${t('inventory.dr', { dr: item.damageResistance })}` : ""}
                  {item.isHelmet ? ` · ${t('inventory.helmet')}` : ""}
                  {item.requiresTraining ? ` · ${t('inventory.training')}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {item.type === "consumable" && item.effects && item.effects.length > 0 && (
                  <button onClick={() => useItem(entry)} className="text-xs text-pip-amber hover:text-pip-green">
                    {t('inventory.use')}
                  </button>
                )}
                {(item.type === "weapon" || item.type === "armor") && (
                  <button onClick={() => toggleEquip(entry.itemId)} className="text-xs text-pip-greendim hover:text-pip-green">
                    {entry.equipped ? t('inventory.unequip') : t('inventory.equip')}
                  </button>
                )}
                {item.isAutomatic && (
                  <span className="flex items-center gap-1 text-xs text-pip-amber">
                    {t('inventory.ammo', { count: entry.currentAmmo ?? 0 })}
                    <button
                      onClick={() => {
                        const max = (item.burstAmmoCost ?? 1) * 10;
                        onChange({
                          ...char,
                          inventory: char.inventory.map((i) =>
                            i.itemId === entry.itemId ? { ...i, currentAmmo: (i.currentAmmo ?? 0) + max } : i
                          ),
                        });
                      }}
                      className="ml-1 rounded-sm border border-pip-line px-1 hover:border-pip-green"
                    >
                      {t('inventory.reload')}
                    </button>
                  </span>
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
        {char.inventory.length === 0 && <p className="text-sm text-pip-greendim">{t('inventory.emptyList')}</p>}
      </div>
    </div>
  );
}
