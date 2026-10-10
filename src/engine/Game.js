import { createInitialState } from "./GameState.js";
import { Random } from "./Random.js";
import { CombatSystem } from "../systems/CombatSystem.js";
import { CLASSES } from "../data/classes.js";
import { ACHIEVEMENTS } from "../data/content.js";

export class Game {
  constructor(state) {
    this.state = state;
    this.rng = new Random(state.rngState ?? state.seed);
    this.combat = new CombatSystem(state, this.rng);
    this.checkAchievements();
  }
  static newGame(className, name, seed = Date.now()) {
    return new Game(createInitialState(className, name, seed));
  }
  static fromSave(state) {
    return new Game(state);
  }
  getState() {
    return { ...structuredClone(this.state), rngState: this.rng.getState() };
  }
  getClass() {
    return CLASSES[this.state.player.className];
  }
  explore() {
    this.combat.explore();
    this.checkAchievements();
  }
  descend() {
    this.combat.descend();
    this.checkAchievements();
  }
  attack() {
    if (this.state.phase !== "combat") return;
    this.combat.playerAttack();
    if (this.state.phase === "combat") this.combat.enemyTurn();
    this.checkAchievements();
  }
  defend() {
    this.combat.defend();
    this.checkAchievements();
  }
  useAbility() {
    const result = this.combat.useAbility();
    if (result.ok && this.state.phase === "combat") this.combat.enemyTurn();
    this.checkAchievements();
    return result;
  }
  usePotion() {
    const result = this.combat.usePotion();
    this.checkAchievements();
    return result;
  }
  flee() {
    if (this.state.phase !== "combat") return;
    if (this.rng.next() < 0.55) {
      this.state.enemy = null;
      this.state.phase = "exploration";
      this.combat.log(
        "You escape into a side passage. No glory, but you live.",
        "normal",
      );
    } else {
      this.combat.log(
        "Your escape is blocked. The enemy gets a free strike.",
        "danger",
      );
      this.combat.enemyTurn();
    }
  }
  upgrade(kind) {
    const p = this.state.player;
    const item = p[kind];
    if (!["weapon", "armor"].includes(kind))
      return { ok: false, message: "Unknown equipment slot." };
    const cost = 25 + item.tier * 35 + item.level * 12;
    if (item.tier >= 9 && item.level >= 10)
      return { ok: false, message: "This item has reached Mythic +10." };
    if (p.gold < cost)
      return {
        ok: false,
        message: `You need ${cost} gold to upgrade this item.`,
      };
    p.gold -= cost;
    this.state.stats.goldSpent += cost;
    item.level++;
    if (item.level > 10) {
      item.tier++;
      item.level = 0;
      this.combat.log(`${item.name} evolves to tier ${item.tier + 1}!`, "loot");
    } else
      this.combat.log(
        `${item.name} upgraded to +${item.level} for ${cost} gold.`,
        "loot",
      );
    this.checkAchievements();
    return { ok: true, message: "Upgrade complete." };
  }
  buyPotion() {
    const p = this.state.player;
    const cost = 18;
    if (p.gold < cost) return { ok: false, message: `You need ${cost} gold.` };
    if (p.potions >= 9)
      return { ok: false, message: "You cannot carry more than 9 potions." };
    p.gold -= cost;
    p.potions++;
    this.state.stats.goldSpent += cost;
    this.combat.log("You purchase a healing draught for 18 gold.", "loot");
    return { ok: true };
  }
  checkAchievements() {
    const state = this.state;
    for (const achievement of ACHIEVEMENTS) {
      if (
        !state.achievements.includes(achievement.id) &&
        achievement.test(state)
      ) {
        state.achievements.push(achievement.id);
        state.log.push({
          type: "achievement",
          text: `Achievement unlocked: ${achievement.name}`,
        });
      }
    }
    state.log = state.log.slice(-60);
  }
}
