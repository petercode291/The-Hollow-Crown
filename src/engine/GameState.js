import { CLASSES } from "../data/classes.js";

export function createPlayer(className, name = "") {
  const definition = CLASSES[className];
  if (!definition) throw new Error(`Unknown class: ${className}`);
  const playerName =
    String(name || "")
      .trim()
      .slice(0, 24) || className;
  return {
    name: playerName,
    className,
    level: 1,
    xp: 0,
    nextXp: 70,
    hp: definition.hp,
    maxHp: definition.hp,
    mana: definition.mana,
    maxMana: definition.mana,
    baseAttack: definition.attack,
    baseDefense: definition.defense,
    agility: definition.agility,
    gold: 25,
    potions: 3,
    weapon: { name: definition.weapon, tier: 0, level: 0, bonus: 3 },
    armor: { name: definition.armor, tier: 0, level: 0, bonus: 2 },
    inventory: [],
    relics: [],
    status: [],
    buffs: [],
    skillsUsed: 0,
    potionsUsed: 0,
  };
}

export function createInitialState(className, name = "", seed = Date.now()) {
  return {
    schemaVersion: 1,
    seed: Number(seed) >>> 0,
    phase: "exploration",
    floor: 1,
    player: createPlayer(className, name),
    enemy: null,
    room: null,
    log: [
      {
        type: "story",
        text: "The bells of Sol-Aethel have fallen silent. Somewhere beneath the ruined kingdom, the Hollow King waits.",
      },
    ],
    achievements: [],
    stats: {
      rooms: 0,
      kills: 0,
      bosses: 0,
      goldEarned: 0,
      goldSpent: 0,
      damageDealt: 0,
      damageTaken: 0,
      malakorDefeated: false,
    },
    startedAt: Date.now(),
    runEnded: false,
  };
}
