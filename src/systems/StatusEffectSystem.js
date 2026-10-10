export const STATUS = {
  poison: { label: "Poison", color: "poison" },
  burn: { label: "Burn", color: "burn" },
  stun: { label: "Stun", color: "stun" },
};

export function applyStatus(target, type, duration = 2, potency = 4) {
  if (!STATUS[type]) return;
  const existing = target.status.find((s) => s.type === type);
  if (existing) {
    existing.duration = Math.max(existing.duration, duration);
    existing.potency = Math.max(existing.potency, potency);
  } else {
    target.status.push({ type, duration, potency });
  }
}

export function processStartOfTurn(target) {
  const events = [];
  let skipTurn = false;
  for (const effect of [...target.status]) {
    if (effect.type === "poison" || effect.type === "burn") {
      const damage = Math.max(1, effect.potency);
      target.hp = Math.max(0, target.hp - damage);
      events.push({
        type: "damage",
        text: `${target.name} suffers ${damage} ${effect.type} damage.`,
      });
    }
    if (effect.type === "stun") {
      skipTurn = true;
      events.push({
        type: "status",
        text: `${target.name} is stunned and loses this turn.`,
      });
    }
    effect.duration -= 1;
    if (effect.duration <= 0)
      target.status = target.status.filter((s) => s !== effect);
  }
  return { events, skipTurn, defeated: target.hp <= 0 };
}
