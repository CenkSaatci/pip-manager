import { useState } from "react";
import { StepBasics, BasicsDraft } from "./StepBasics";
import { StepStats, StatsDraft } from "./StepStats";
import { StepMechanics, MechanicsDraft } from "./StepMechanics";
import { StepPanels, PanelsDraft } from "./StepPanels";
import { StepReview } from "./StepReview";

type Step = "basics" | "stats" | "mechanics" | "panels" | "review";

const STEPS: { id: Step; label: string }[] = [
  { id: "basics", label: "Basis" },
  { id: "stats", label: "Attribute" },
  { id: "mechanics", label: "Mechaniken" },
  { id: "panels", label: "Panels" },
  { id: "review", label: "Export" },
];

const DEFAULT_BASICS: BasicsDraft = {
  name: "",
  version: "0.1",
  description: "",
  currencyLabel: "Caps",
  theme: "pip-boy",
  diceType: "d10-pool",
};

const DEFAULT_STATS: StatsDraft = {
  statsLabel: "Attribute",
  stats: [
    { key: "STR", label: "Stärke", defaultValue: 5, min: 1, max: 10, extremeThreshold: 2 },
    { key: "DEX", label: "Geschick", defaultValue: 5, min: 1, max: 10, extremeThreshold: 2 },
    { key: "CON", label: "Konstitution", defaultValue: 5, min: 1, max: 10, extremeThreshold: 2 },
    { key: "INT", label: "Intelligenz", defaultValue: 5, min: 1, max: 10, extremeThreshold: 2 },
    { key: "WIS", label: "Weisheit", defaultValue: 5, min: 1, max: 10, extremeThreshold: 2 },
    { key: "CHA", label: "Charisma", defaultValue: 5, min: 1, max: 10, extremeThreshold: 2 },
  ],
  bonusFormula: "specialBonus(x)",
  freeSpecialPoints: 5,
};

const DEFAULT_MECHANICS: MechanicsDraft = {
  hpEnabled: true,
  hpFormula: "(STR+END)*5",
  karmaEnabled: false,
  armorRoll: true,
  burstFire: false,
  coverPenalty: true,
  calledShots: true,
  freeSkillPoints: 8,
  skillCapAtCreation: 6,
};

const DEFAULT_PANELS: PanelsDraft = {
  panelSkills: true,
  panelPerks: true,
  panelTraits: true,
  panelInventory: true,
  panelDice: true,
  panelHitLocations: true,
  panelNeeds: true,
  wizardRace: true,
  wizardBackground: true,
  wizardTraits: true,
  tagSkillCount: 3,
  tagSkillBonus: 1,
};

export function SystemWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>("basics");
  const [basics, setBasics] = useState<BasicsDraft>(DEFAULT_BASICS);
  const [stats, setStats] = useState<StatsDraft>(DEFAULT_STATS);
  const [mechanics, setMechanics] = useState<MechanicsDraft>(DEFAULT_MECHANICS);
  const [panels, setPanels] = useState<PanelsDraft>(DEFAULT_PANELS);

  const idx = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-sm border border-pip-green bg-black p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl text-glow">System-Assistent</h2>
          <button onClick={onClose} className="pip-btn-ghost px-2 py-1 text-sm text-pip-red">Schließen</button>
        </div>

        <nav className="mb-6 flex flex-wrap gap-1">
          {STEPS.map((s, i) => (
            <button key={s.id} onClick={() => i < idx && setStep(s.id)}
              className={`rounded-sm border px-2 py-1 text-xs transition-colors ${s.id === step ? "border-pip-green bg-pip-green/10 text-pip-green" : i < idx ? "border-pip-green/30 text-pip-green/60 cursor-pointer" : "border-pip-line text-pip-greendim cursor-default"}`}>
              {i + 1}. {s.label}
            </button>
          ))}
        </nav>

        {step === "basics" && <StepBasics value={basics} onChange={setBasics} onNext={() => setStep("stats")} />}
        {step === "stats" && <StepStats value={stats} onChange={setStats} onNext={() => setStep("mechanics")} onBack={() => setStep("basics")} />}
        {step === "mechanics" && <StepMechanics value={mechanics} onChange={setMechanics} onNext={() => setStep("panels")} onBack={() => setStep("stats")} />}
        {step === "panels" && <StepPanels value={panels} onChange={setPanels} onNext={() => setStep("review")} onBack={() => setStep("mechanics")} />}
        {step === "review" && <StepReview basics={basics} stats={stats} mechanics={mechanics} panels={panels} onBack={() => setStep("panels")} />}
      </div>
    </div>
  );
}
