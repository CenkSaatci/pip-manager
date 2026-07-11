const ITEM_TYPES = ["weapon", "armor", "consumable", "ammo", "misc"];

function requireString(obj: any, field: string, errors: string[]) {
  if (typeof obj?.[field] !== "string" || obj[field].trim() === "") {
    errors.push(`Feld "${field}" fehlt oder ist kein nicht-leerer String`);
  }
}

function requireNumber(obj: any, field: string, errors: string[]) {
  if (typeof obj?.[field] !== "number" || Number.isNaN(obj[field])) {
    errors.push(`Feld "${field}" fehlt oder ist keine Zahl`);
  }
}

export function validateRace(item: any): string[] {
  const errors: string[] = [];
  requireString(item, "id", errors);
  requireString(item, "name", errors);
  if (item.statModifiers && typeof item.statModifiers !== "object") {
    errors.push('"statModifiers" muss ein Objekt sein, z.B. { "STR": 1 }');
  }
  return errors;
}

export function validateSkill(item: any): string[] {
  const errors: string[] = [];
  requireString(item, "id", errors);
  requireString(item, "name", errors);
  requireString(item, "baseFormula", errors);
  if (typeof item?.governingStat !== "string" || item.governingStat.trim() === "") {
    errors.push('"governingStat" muss ein nicht-leerer String sein');
  }
  return errors;
}

export function validatePerk(item: any): string[] {
  const errors: string[] = [];
  requireString(item, "id", errors);
  requireString(item, "name", errors);
  requireNumber(item, "maxRanks", errors);
  if (item.requirements && typeof item.requirements !== "object") {
    errors.push('"requirements" muss ein Objekt sein');
  }
  return errors;
}

export function validateTrait(item: any): string[] {
  const errors: string[] = [];
  requireString(item, "id", errors);
  requireString(item, "name", errors);
  if (!Array.isArray(item?.benefits)) errors.push('"benefits" muss ein Array sein (kann leer sein: [])');
  if (!Array.isArray(item?.drawbacks)) errors.push('"drawbacks" muss ein Array sein (kann leer sein: [])');
  return errors;
}

export function validateItem(item: any): string[] {
  const errors: string[] = [];
  requireString(item, "id", errors);
  requireString(item, "name", errors);
  requireNumber(item, "weight", errors);
  requireNumber(item, "value", errors);
  if (!ITEM_TYPES.includes(item?.type)) errors.push(`"type" muss eines von ${ITEM_TYPES.join(", ")} sein`);
  if (item.damage !== undefined && typeof item.damage !== "number") {
    errors.push('"damage" muss eine Zahl sein (fixer Wert, keine Würfelnotation wie "2d6")');
  }
  return errors;
}

export function validateBackground(item: any): string[] {
  const errors: string[] = [];
  requireString(item, "id", errors);
  requireString(item, "name", errors);
  if (item.pointBuyPools && !Array.isArray(item.pointBuyPools)) {
    errors.push('"pointBuyPools" muss ein Array sein');
  }
  return errors;
}

export function validateEnemy(item: any): string[] {
  const errors: string[] = [];
  requireString(item, "id", errors);
  requireString(item, "name", errors);
  requireNumber(item, "hp", errors);
  requireNumber(item, "damageResistance", errors);
  requireNumber(item, "skillValue", errors);
  return errors;
}

export function validateLevelReward(item: any): string[] {
  const errors: string[] = [];
  requireNumber(item, "level", errors);
  return errors;
}
