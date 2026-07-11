import jsPDF from "jspdf";
import { Character } from "../types/character";
import { RuleSet, getUiTemplate } from "../types/rules";
import { getEffectiveSpecial, getMaxHp, getMaxApr, getCarryWeight, getSkillEffectiveValue } from "./derived";
import { specialBonus } from "./formula";

const MARGIN = 14;
const PAGE_WIDTH = 210; // A4 in mm

export function buildCharacterPdf(char: Character, rules: RuleSet): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const race = rules.races.find((r) => r.id === char.raceId);
  const background = rules.backgrounds.find((b) => b.id === char.backgroundId);
  const effective = getEffectiveSpecial(char, rules);
  let y = MARGIN;

  const line = (h = 6) => {
    y += h;
    if (y > 280) {
      doc.addPage();
      y = MARGIN;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(char.name, MARGIN, y);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Level ${char.level} · ${race?.name ?? "—"} · ${background?.name ?? "—"}`,
    PAGE_WIDTH - MARGIN,
    y,
    { align: "right" }
  );
  y += 2;
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  line(8);

  // SPECIAL
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("S.P.E.C.I.A.L.", MARGIN, y);
  line(6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const specialKeys = Object.keys(effective);
  const colWidth = (PAGE_WIDTH - 2 * MARGIN) / specialKeys.length;
  specialKeys.forEach((key, i) => {
    const x = MARGIN + i * colWidth;
    doc.setFont("helvetica", "bold");
    doc.text(key, x, y);
    doc.setFont("helvetica", "normal");
    doc.text(`${effective[key]} (+${specialBonus(effective[key])})`, x, y + 5);
  });
  line(14);

  // Kernwerte
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Kernwerte", MARGIN, y);
  line(6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const core = [
    `HP: ${char.currentHp} / ${getMaxHp(char, rules)}`,
    `APR: ${char.currentApr} / ${getMaxApr(char, rules)}`,
    `Traglast: ${getCarryWeight(char, rules)} kg`,
    `${getUiTemplate(rules).currencyLabel ?? "Caps"}: ${char.caps ?? 0}`,
  ];
  doc.text(core.join("   ·   "), MARGIN, y);
  line(12);

  // Skills
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Fertigkeiten", MARGIN, y);
  line(6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const skillColWidth = (PAGE_WIDTH - 2 * MARGIN) / 3;
  rules.skills.forEach((skill, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = MARGIN + col * skillColWidth;
    const rowY = y + row * 5;
    if (rowY > 280) return; // simplistic overflow guard
    const tag = (char.tagSkillIds ?? []).includes(skill.id) ? " *" : "";
    doc.text(`${skill.name}${tag}: ${getSkillEffectiveValue(skill, char, rules)}`, x, rowY);
  });
  line(Math.ceil(rules.skills.length / 3) * 5 + 8);

  // Perks & Traits
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Perks & Traits", MARGIN, y);
  line(6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const perkNames = char.perks.map((p) => {
    const perk = rules.perks.find((x) => x.id === p.perkId);
    return `${perk?.name ?? p.perkId}${perk && perk.maxRanks > 1 ? ` (Rang ${p.rank})` : ""}`;
  });
  const traitNames = char.traitIds.map((tid) => rules.traits.find((t) => t.id === tid)?.name ?? tid);
  const perksText = [...perkNames, ...traitNames].join(", ") || "—";
  const perksLines = doc.splitTextToSize(perksText, PAGE_WIDTH - 2 * MARGIN);
  doc.text(perksLines, MARGIN, y);
  line(perksLines.length * 5 + 6);

  // Ausrüstung
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Ausrüstung", MARGIN, y);
  line(6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const invText =
    char.inventory
      .map((entry) => {
        const item = rules.items.find((i) => i.id === entry.itemId);
        return `${item?.name ?? entry.itemId} ×${entry.quantity}${entry.equipped ? " (angelegt)" : ""}`;
      })
      .join(", ") || "—";
  const invLines = doc.splitTextToSize(invText, PAGE_WIDTH - 2 * MARGIN);
  doc.text(invLines, MARGIN, y);
  line(invLines.length * 5 + 6);

  // Hintergrund
  if (char.backstory?.trim()) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Hintergrund", MARGIN, y);
    line(6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const bgLines = doc.splitTextToSize(char.backstory, PAGE_WIDTH - 2 * MARGIN);
    doc.text(bgLines, MARGIN, y);
  }

  return doc;
}
