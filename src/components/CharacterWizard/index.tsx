import { useState, useEffect } from "react";
import { blankCharacter, Character } from "../../types/character";
import { RuleSet, getUiTemplate } from "../../types/rules";
import {
  getEffectiveSpecial,
  getSkillBaseValue,
  getMaxHp,
  getMaxApr,
} from "../../lib/derived";
import { getBonusValue } from "../../lib/formula";
import { getTags, setTags, getStats } from "../../lib/compat";
import { useT } from "../../i18n/context";

type Step = "name" | "race" | "special" | "background" | "skills" | "traits" | "review";

export function CharacterWizard({
  rules,
  onFinish,
  onCancel,
}: {
  rules: RuleSet;
  onFinish: (char: Character) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<Step>("name");
  const [draft, setDraft] = useState<Character>(() => {
    const c = blankCharacter(rules.id);
    c.resources = { hp: 0, apr: 0, karma: 0 };
    return c;
  });

  const { t } = useT();
  const ui = getUiTemplate(rules);
  const cc = rules.characterCreation;
  const statDefaultSum = ui.stats.reduce((s, st) => s + (st.defaultValue ?? 5), 0);
  const statBudget = statDefaultSum + cc.freeSpecialPoints;
  const spentStats = ui.stats.reduce((s, st) => s + (getStats(draft)[st.key] ?? 0), 0);
  const spentSkills = Object.values(draft.skills).reduce((a, b) => a + b, 0);

  const ws = ui.wizardSteps ?? {};
  const allSteps: { id: Step; label: string }[] = [
    { id: "name", label: t("wizard.step.name") },
    { id: "race", label: t("wizard.step.race") },
    { id: "special", label: t("wizard.step.stats", { label: ui.statsLabel }) },
    { id: "background", label: t("wizard.step.background") },
    { id: "skills", label: t("wizard.step.skills") },
    { id: "traits", label: t("wizard.step.traits") },
    { id: "review", label: t("wizard.step.review") },
  ];
  const steps = allSteps.filter((s) => {
    if (s.id === "name" || s.id === "special" || s.id === "skills" || s.id === "review") return true;
    if (s.id === "race" && ws.race === false) return false;
    if (s.id === "background" && ws.background === false) return false;
    if (s.id === "traits" && ws.traits === false) return false;
    return true;
  });

  const canAdvance = (): boolean => {
    switch (step) {
      case "name":
        return draft.name.trim().length > 0;
      case "race":
        return rules.races.length === 0 || draft.raceId !== "";
      case "special":
        return spentStats <= statBudget;
      case "background":
        return true;
      case "skills":
        return spentSkills <= cc.freeSkillPoints;
      case "traits":
        return true;
      case "review":
        return true;
    }
  };

  const update = (patch: Partial<Character>) => setDraft((p) => ({ ...p, ...patch }));

  const idx = steps.findIndex((s) => s.id === step);

  // Leere Schritte automatisch überspringen (via useEffect, nicht während render)
  useEffect(() => {
    const isEmpty = (s: Step): boolean => {
      if (s === "race" && rules.races.length === 0) return true;
      if (s === "background" && rules.backgrounds.length === 0 && ws.background !== false) return true;
      if (s === "traits" && rules.traits.length === 0 && ws.traits !== false) return true;
      return false;
    };
    if (steps.length > 0 && isEmpty(step) && idx < steps.length - 1) {
      setStep(steps[idx + 1].id);
    }
  }, [step, steps.length]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-sm border border-pip-green bg-black p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl text-glow">{t("wizard.title")}</h2>
          <button onClick={onCancel} className="pip-btn-ghost px-2 py-1 text-sm text-pip-red">
            {t("wizard.cancel")}
          </button>
        </div>

        <nav className="mb-6 flex flex-wrap gap-1">
          {steps.map((s, i) => (
            <button
              key={s.id}
              onClick={() => i < idx && setStep(s.id)}
              className={`rounded-sm border px-2 py-1 text-xs transition-colors ${
                s.id === step
                  ? "border-pip-green bg-pip-green/10 text-pip-green"
                  : i < idx
                    ? "border-pip-green/30 text-pip-green/60 cursor-pointer"
                    : "border-pip-line text-pip-greendim cursor-default"
              }`}
            >
              {i + 1}. {s.label}
            </button>
          ))}
        </nav>

        {step === "name" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-pip-greendim">{t("wizard.namePrompt")}</p>
            <label className="flex flex-col gap-1">
              <span className="pip-label">{t("wizard.charName")}</span>
              <input
                autoFocus
                value={draft.name}
                onChange={(e) => update({ name: e.target.value })}
                className="pip-input rounded-sm px-3 py-2 font-display text-xl"
                placeholder={t("wizard.charNamePlaceholder")}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="pip-label">{t("wizard.playerName")}</span>
              <input
                value={draft.playerName ?? ""}
                onChange={(e) => update({ playerName: e.target.value })}
                className="pip-input rounded-sm px-3 py-2"
                placeholder={t("wizard.playerNamePlaceholder")}
              />
            </label>
          </div>
        )}

        {step === "race" && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-pip-greendim">{t("wizard.racePrompt", { statsLabel: ui.statsLabel })}</p>
            {rules.races.length === 0 && (
              <p className="text-pip-amber text-sm">{t("wizard.raceEmpty")}</p>
            )}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {rules.races.map((r) => {
                const active = draft.raceId === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => update({ raceId: r.id })}
                    className={`rounded-sm border p-3 text-left transition-colors ${
                      active
                        ? "border-pip-green bg-pip-green/10"
                        : "border-pip-line hover:border-pip-green/50"
                    }`}
                  >
                    <div className="font-display text-lg">{r.name}</div>
                    {r.description && <p className="mt-1 text-xs text-pip-greendim">{r.description}</p>}
                    {Object.keys(r.statModifiers).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(Object.entries(r.statModifiers) as [string, number][]).map(([k, v]) => (
                          <span key={k} className="rounded-sm border border-pip-line px-1.5 py-0.5 text-xs">
                            {k} {v > 0 ? "+" : ""}{v}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <button onClick={() => update({ raceId: "" })} className="pip-btn-ghost self-start px-2 py-1 text-xs text-pip-greendim">
              {t("wizard.noRace")}
            </button>
          </div>
        )}

        {step === "special" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-pip-greendim">{t("wizard.statsPrompt", { label: ui.statsLabel })}</p>
              <span className={`text-sm ${spentStats > statBudget ? "text-pip-red" : "text-pip-amber"}`}>
                {t("wizard.statsSpent", { spent: spentStats, budget: statBudget })}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {ui.stats.map((stat) => {
                const statsMap = getStats(draft);
                const val = statsMap[stat.key] ?? stat.defaultValue ?? 5;
                const effective = getEffectiveSpecial(draft, rules);
                const effectiveVal = effective[stat.key] ?? val;
                const raceMod = effectiveVal - val;
                const st = stat;
                return (
                  <div key={st.key} className="flex flex-col items-center gap-1 rounded-sm border border-pip-line p-3">
                    <label className="text-xs text-pip-greendim">{st.label}</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          val > (st.min ?? 1) &&
                          setDraft((p) => ({
                            ...p,
                            stats: { ...getStats(p), [st.key]: val - 1 },
                          }))
                        }
                        className="pip-btn-ghost px-1 text-lg"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={st.min ?? 1}
                        max={st.max ?? 10}
                        value={val}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            stats: { ...getStats(p), [st.key]: Number(e.target.value) },
                          }))
                        }
                        className={`pip-input w-14 rounded-sm px-1 py-1 text-center font-display text-xl ${
                          val <= (st.extremeThreshold ?? 2) ? "border-pip-amber" : ""
                        }`}
                      />
                      <button
                        onClick={() =>
                          val < (st.max ?? 10) &&
                          setDraft((p) => ({
                            ...p,
                            stats: { ...getStats(p), [st.key]: val + 1 },
                          }))
                        }
                        className="pip-btn-ghost px-1 text-lg"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs text-pip-amber">
                      {effectiveVal}
                      {raceMod !== 0 && ` (${raceMod > 0 ? "+" : ""}${raceMod})`}
                    </span>
                    <span className="text-xs text-pip-greendim">Mod +{getBonusValue(effectiveVal, rules)}</span>
                    {val <= (st.extremeThreshold ?? 2) && <span className="text-xs text-pip-amber">{t("wizard.gmApproval")}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === "background" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-pip-greendim">{t("wizard.backgroundPrompt")}</p>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {rules.backgrounds.map((bg) => {
                const active = draft.backgroundId === bg.id;
                return (
                  <button
                    key={bg.id}
                    onClick={() => update({ backgroundId: bg.id, backgroundAllocations: {} })}
                    className={`rounded-sm border p-3 text-left transition-colors ${
                      active
                        ? "border-pip-green bg-pip-green/10"
                        : "border-pip-line hover:border-pip-green/50"
                    }`}
                  >
                    <div className="font-display text-lg">
                      {bg.name}
                      {bg.requiresGmApproval && (
                        <span className="ml-2 text-xs text-pip-amber">{t("wizard.gmApproval")}</span>
                      )}
                    </div>
                    {bg.description && (
                      <p className="mt-1 text-xs text-pip-greendim">{bg.description}</p>
                    )}
                    {bg.fixedSkillBonuses && Object.keys(bg.fixedSkillBonuses).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Object.entries(bg.fixedSkillBonuses).map(([skillId, amount]) => {
                          const skill = rules.skills.find((s) => s.id === skillId);
                          return (
                            <span key={skillId} className="rounded-sm border border-pip-line px-1.5 py-0.5 text-xs">
                              {skill?.name ?? skillId} +{amount}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <button onClick={() => update({ backgroundId: "" })} className="pip-btn-ghost self-start px-2 py-1 text-xs text-pip-greendim">
              {t("wizard.noBackground")}
            </button>

            {draft.backgroundId && rules.backgrounds.find((b) => b.id === draft.backgroundId)?.pointBuyPools && (
              <div className="mt-2 border-t border-pip-line pt-4">
                <h4 className="pip-label mb-2">{t("wizard.pointBuy")}</h4>
                {rules.backgrounds
                  .find((b) => b.id === draft.backgroundId)
                  ?.pointBuyPools?.map((pool) => {
                    const allocations = (draft.backgroundAllocations ?? {})[pool.poolName] ?? {};
                    const spent = Object.values(allocations).reduce((a, b) => a + b, 0);
                    return (
                      <div key={pool.poolName} className="mb-3 rounded-sm border border-pip-line p-2">
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-pip-greendim">
                            {t("wizard.pointBuySummary", { name: pool.poolName, max: pool.maxPerSkill })}
                          </span>
                          <span className={`text-pip-amber ${spent > pool.points ? "text-pip-red" : ""}`}>
                            {t("wizard.pointBuySpent", { spent, points: pool.points })}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                          {pool.eligibleSkillIds.map((skillId) => {
                            const skill = rules.skills.find((s) => s.id === skillId);
                            const val = allocations[skillId] ?? 0;
                            return (
                              <div key={skillId} className="flex items-center justify-between gap-1 text-xs">
                                <span>{skill?.name ?? skillId}</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      const next = Math.max(0, val - 1);
                                      setDraft((p) => ({
                                        ...p,
                                        backgroundAllocations: {
                                          ...(p.backgroundAllocations ?? {}),
                                          [pool.poolName]: {
                                            ...allocations,
                                            [skillId]: next,
                                          },
                                        },
                                      }));
                                    }}
                                    className="pip-btn-ghost px-1"
                                  >
                                    −
                                  </button>
                                  <span className="w-4 text-center">{val}</span>
                                  <button
                                    onClick={() => {
                                      if (val < pool.maxPerSkill) {
                                        setDraft((p) => ({
                                          ...p,
                                          backgroundAllocations: {
                                            ...p.backgroundAllocations,
                                            [pool.poolName]: {
                                              ...allocations,
                                              [skillId]: val + 1,
                                            },
                                          },
                                        }));
                                      }
                                    }}
                                    className="pip-btn-ghost px-1"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {draft.backgroundId && (
              <div className="mt-2 border-t border-pip-line pt-4">
                <h4 className="pip-label mb-2">
                  {t("wizard.tagSkills", { count: getTags(draft).length, max: cc.tagSkillCount, bonus: cc.tagSkillBonus })}
                </h4>
                <div className="flex flex-wrap gap-1">
                  {rules.skills.map((skill) => {
                    const active = getTags(draft).includes(skill.id);
                    const disabled = !active && getTags(draft).length >= cc.tagSkillCount;
                    return (
                      <button
                        key={skill.id}
                        disabled={disabled}
                        onClick={() => {
                          const has = getTags(draft).includes(skill.id);
                          setDraft((p) => setTags(p, has
                            ? getTags(p).filter((id) => id !== skill.id)
                            : [...getTags(p), skill.id]
                          ));
                        }}
                        className={`rounded-sm border px-2 py-0.5 text-xs transition-colors ${
                          active
                            ? "border-pip-amber bg-pip-amber/10 text-pip-amber"
                            : "border-pip-line text-pip-greendim hover:text-pip-green disabled:opacity-40"
                        }`}
                      >
                        {skill.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {step === "skills" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-pip-greendim">{t("wizard.skillsPrompt", { cap: cc.skillCapAtCreation })}</p>
              <span className={`text-sm ${spentSkills > cc.freeSkillPoints ? "text-pip-red" : "text-pip-amber"}`}>
                {t("wizard.skillsSpent", { spent: spentSkills, budget: cc.freeSkillPoints })}
              </span>
            </div>
            {rules.skills.length === 0 ? (
              <p className="text-pip-amber text-sm">{t("wizard.skillsEmpty")}</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {rules.skills.map((skill) => {
                  const base = getSkillBaseValue(skill, draft, rules);
                  const invested = draft.skills[skill.id] ?? 0;
                  const effective = base + invested;
                  const overCap = effective > cc.skillCapAtCreation;
                  return (
                    <div key={skill.id} className="flex items-center justify-between border-b border-pip-line py-2 text-sm">
                      <div>
                        <span>{skill.name}</span>
                        <span className="ml-2 text-xs text-pip-greendim">
                          {t("wizard.skillBase", { base, stat: skill.governingStat })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            invested > 0 &&
                            setDraft((p) => ({
                              ...p,
                              skills: { ...p.skills, [skill.id]: invested - 1 },
                            }))
                          }
                          className="pip-btn-ghost px-1"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={0}
                          value={invested}
                          onChange={(e) =>
                            setDraft((p) => ({
                              ...p,
                              skills: { ...p.skills, [skill.id]: Math.max(0, Number(e.target.value)) },
                            }))
                          }
                          className="pip-input w-12 rounded-sm px-1 py-0.5 text-center"
                        />
                        <button
                          onClick={() =>
                            setDraft((p) => ({
                              ...p,
                              skills: { ...p.skills, [skill.id]: invested + 1 },
                            }))
                          }
                          className="pip-btn-ghost px-1"
                        >
                          +
                        </button>
                        <span className={`w-8 text-right font-display text-lg ${overCap ? "text-pip-red" : "text-glow"}`}>
                          {effective}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {step === "traits" && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-pip-greendim">{t("wizard.traitsPrompt")}</p>
            {rules.traits.length === 0 && (
              <p className="text-pip-amber text-sm">{t("wizard.traitsEmpty")}</p>
            )}
            <div className="flex flex-col gap-2">
              {rules.traits.map((trait) => {
                const active = draft.traitIds.includes(trait.id);
                return (
                  <label
                    key={trait.id}
                    className={`cursor-pointer rounded-sm border p-3 text-sm transition-colors ${
                      active ? "border-pip-green bg-pip-green/10" : "border-pip-line"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{trait.name}</span>
                      <input type="checkbox" checked={active} onChange={() => {
                        const has = draft.traitIds.includes(trait.id);
                        setDraft((p) => ({
                          ...p,
                          traitIds: has
                            ? p.traitIds.filter((t) => t !== trait.id)
                            : [...p.traitIds, trait.id],
                        }));
                      }} />
                    </div>
                    {trait.description && <p className="mt-1 text-xs text-pip-greendim">{trait.description}</p>}
                    {trait.benefits.length > 0 && (
                      <p className="mt-1 text-xs text-pip-green">
                        {t("wizard.traitBenefits", { effects: trait.benefits.map((e) => `${e.target} ${e.amount > 0 ? "+" : ""}${e.amount}`).join(", ") })}
                      </p>
                    )}
                    {trait.drawbacks.length > 0 && (
                      <p className="mt-1 text-xs text-pip-red">
                        {t("wizard.traitDrawbacks", { effects: trait.drawbacks.map((e) => `${e.target} ${e.amount > 0 ? "+" : ""}${e.amount}`).join(", ") })}
                      </p>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-pip-greendim">{t("wizard.reviewPrompt")}</p>
            <div className="grid grid-cols-2 gap-3 rounded-sm border border-pip-line p-3 text-sm">
              <div>
                <span className="pip-label">{t("wizard.reviewName")}</span>
                <p className="font-display text-xl">{draft.name}</p>
              </div>
              <div>
                <span className="pip-label">{t("wizard.reviewPlayer")}</span>
                <p>{draft.playerName || "—"}</p>
              </div>
              <div>
                <span className="pip-label">{t("wizard.reviewRace")}</span>
                <p>{rules.races.find((r) => r.id === draft.raceId)?.name ?? "—"}</p>
              </div>
              <div>
                <span className="pip-label">{t("wizard.reviewBackground")}</span>
                <p>{rules.backgrounds.find((b) => b.id === draft.backgroundId)?.name ?? "—"}</p>
              </div>
              <div>
                <span className="pip-label">{t("wizard.reviewStats", { label: ui.statsLabel })}</span>
                <p>{ui.stats.map((s) => `${s.key} ${(getStats(draft)[s.key] ?? s.defaultValue ?? 5)}`).join(" · ")}</p>
              </div>
              <div>
                <span className="pip-label">{t("wizard.reviewTraits")}</span>
                <p>{draft.traitIds.map((id) => rules.traits.find((t) => t.id === id)?.name ?? id).join(", ") || "—"}</p>
              </div>
              <div className="col-span-2">
                <span className="pip-label">{t("wizard.reviewTagSkills")}</span>
                <p>{getTags(draft).map((id) => rules.skills.find((s) => s.id === id)?.name ?? id).join(", ") || "—"}</p>
              </div>
              <div className="col-span-2">
                <span className="pip-label">{t("wizard.reviewSkillPoints")}</span>
                <p>{t("wizard.reviewSkillsSpent", { spent: spentSkills, budget: cc.freeSkillPoints })}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-pip-line pt-4">
          <button
            onClick={() => {
              const prevIdx = steps.findIndex((s) => s.id === step);
              if (prevIdx > 0) setStep(steps[prevIdx - 1].id);
            }}
            disabled={idx === 0}
            className="pip-btn-ghost px-3 py-1 disabled:opacity-40"
          >
            {t("wizard.back")}
          </button>

          <button
            onClick={() => {
              if (step === "review") {
                const now = new Date().toISOString();
                const final: Character = {
                  ...draft,
                  stats: getStats(draft),
                  resources: {
                    ...draft.resources,
                    hp: getMaxHp(draft, rules),
                    apr: getMaxApr(draft, rules),
                  },
                  createdAt: now,
                  updatedAt: now,
                };
                onFinish(final);
              } else {
                const nextIdx = steps.findIndex((s) => s.id === step) + 1;
                if (nextIdx < steps.length) setStep(steps[nextIdx].id);
              }
            }}
            disabled={!canAdvance()}
            className={`rounded-sm px-6 py-2 font-display text-sm transition-colors ${
              canAdvance()
                ? "border border-pip-green bg-pip-green/10 text-pip-green hover:bg-pip-green/20"
                : "border border-pip-line text-pip-greendim cursor-not-allowed"
            }`}
          >
            {step === "review" ? t("wizard.create") : t("wizard.next")}
          </button>
        </div>
      </div>
    </div>
  );
}
