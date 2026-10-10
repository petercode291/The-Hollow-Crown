import { ENEMIES, BOSSES } from "../data/content.js";

export const ROOM_TYPES = ["combat", "treasure", "shrine", "merchant", "event"];

export function generateRoom(floor, rng) {
  if (BOSSES[floor])
    return {
      type: "boss",
      title: "Boss Chamber",
      description: "A vast chamber waits beyond the final arch.",
      paths: ["descend"],
      boss: true,
    };
  if (floor === 100)
    return {
      type: "boss",
      title: "The Throne of Ash",
      description: "The Hollow King waits beyond the veil.",
      paths: ["descend"],
      boss: true,
    };
  const roll = rng.next();
  let type =
    roll < 0.63
      ? "combat"
      : roll < 0.76
        ? "treasure"
        : roll < 0.85
          ? "shrine"
          : roll < 0.93
            ? "merchant"
            : "event";
  if (floor === 1) type = "combat";
  const descriptions = {
    combat: "Something stirs in the blackness beyond your torch.",
    treasure: "A forgotten coffer rests beneath a layer of pale dust.",
    shrine: "A cracked shrine glimmers with a little residual warmth.",
    merchant: "A hooded trader has made a home in the ruins.",
    event: "A cold draft carries whispers from a sealed passage.",
  };
  return {
    type,
    title: {
      combat: "Encounter",
      treasure: "Forgotten Cache",
      shrine: "Ashen Shrine",
      merchant: "The Wandering Broker",
      event: "A Strange Omen",
    }[type],
    description: descriptions[type],
    paths: rng.next() > 0.55 ? ["left", "descend", "right"] : ["descend"],
  };
}

export function createEnemy(floor, rng) {
  const boss = BOSSES[floor];
  const base = boss || rng.pick(ENEMIES);
  const depth = Math.max(0, floor - 1);
  // Gradual early-game scaling, with a slower but unbounded endless-mode ramp.
  const scale =
    1 + Math.min(2.5, depth * 0.025) + Math.max(0, depth - 100) * 0.012;
  return {
    id: `${floor}-${Math.floor(rng.next() * 1e9).toString(36)}`,
    name: base.name,
    icon: base.icon,
    flavor: base.flavor,
    hp: Math.round(base.hp * (boss ? 1 : scale)),
    maxHp: Math.round(base.hp * (boss ? 1 : scale)),
    attack: Math.round(
      base.attack *
        (boss
          ? 1
          : 1 +
            Math.min(1.5, depth * 0.012) +
            Math.max(0, depth - 100) * 0.006),
    ),
    defense: Math.round(
      base.defense *
        (boss
          ? 1
          : 1 + Math.min(1, depth * 0.01) + Math.max(0, depth - 100) * 0.004),
    ),
    xp: base.xp,
    goldRange: base.gold,
    isBoss: Boolean(boss),
    status: [],
    buffs: [],
    defending: false,
  };
}
