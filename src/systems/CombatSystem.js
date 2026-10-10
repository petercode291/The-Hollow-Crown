import { CLASSES } from "../data/classes.js";
import { applyStatus, processStartOfTurn } from "./StatusEffectSystem.js";
import { awardXP } from "./ProgressionSystem.js";
import { createEnemy, generateRoom } from "./DungeonGenerator.js";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export class CombatSystem {
  constructor(state, rng) {
    this.state = state;
    this.rng = rng;
  }
  log(text, type = "normal") {
    this.state.log.push({ text, type });
    this.state.log = this.state.log.slice(-60);
  }
  playerAttack(multiplier = 1, guaranteedCrit = false) {
    const { player, enemy } = this.state;
    const crit =
      guaranteedCrit ||
      this.rng.next() < 0.14 + (player.className === "Rogue" ? 0.12 : 0);
    const weaponBonus =
      player.weapon.bonus + player.weapon.tier * 5 + player.weapon.level;
    let raw = Math.floor(
      (player.baseAttack + weaponBonus + this.rng.int(-2, 4)) *
        multiplier *
        (crit ? 1.65 : 1),
    );
    if (
      player.className === "Warrior" &&
      player.buffs.some((b) => b.type === "bastion")
    )
      raw = Math.floor(raw * 1.12);
    const damage = Math.max(
      1,
      raw - Math.floor(enemy.defense * (enemy.defending ? 1.5 : 0.65)),
    );
    enemy.hp = Math.max(0, enemy.hp - damage);
    enemy.defending = false;
    this.state.stats.damageDealt += damage;
    this.log(
      `${player.name} ${crit ? "lands a critical strike" : "strikes"} ${enemy.name} for ${damage} damage${enemy.hp === 0 ? " — fatal!" : "."}.`,
      crit ? "crit" : "combat",
    );
    if (enemy.hp <= 0) this.finishEnemy();
    return damage;
  }
  useAbility() {
    const { player, enemy } = this.state;
    if (!enemy || enemy.hp <= 0 || this.state.phase !== "combat")
      return { ok: false, message: "There is no active enemy." };
    const cls = CLASSES[player.className];
    if (player.mana < cls.abilityCost)
      return { ok: false, message: "Not enough mana." };
    player.mana -= cls.abilityCost;
    player.skillsUsed++;
    if (player.className === "Warrior") {
      player.buffs = player.buffs.filter((b) => b.type !== "bastion");
      player.buffs.push({ type: "bastion", duration: 2 });
      this.log(
        `${player.name} raises ${cls.ability}: incoming damage is reduced for two enemy turns.`,
        "ability",
      );
      this.playerAttack(1.6, false);
    } else if (player.className === "Mage") {
      this.log(`${player.name} unleashes ${cls.ability}!`, "ability");
      this.playerAttack(2.35, false);
      if (
        this.state.enemy &&
        this.state.enemy.hp > 0 &&
        this.rng.next() < 0.45
      ) {
        applyStatus(enemy, "burn", 2, 5 + player.level);
        this.log(`${enemy.name} is set ablaze.`, "status");
      }
    } else if (player.className === "Rogue") {
      this.log(
        `${player.name} disappears into shadow and uses ${cls.ability}.`,
        "ability",
      );
      this.playerAttack(1.9, true);
    } else if (player.className === "Paladin") {
      this.log(`${player.name} calls down ${cls.ability}.`, "ability");
      this.playerAttack(1.55, false);
      player.hp = Math.min(
        player.maxHp,
        player.hp + Math.floor(player.maxHp * 0.18),
      );
      this.log("Radiant light closes some of your wounds.", "heal");
    } else {
      this.log(`${player.name} invokes ${cls.ability}.`, "ability");
      const dealt = this.playerAttack(1.7, false);
      player.hp = Math.min(player.maxHp, player.hp + Math.floor(dealt * 0.25));
      if (this.state.enemy && this.state.enemy.hp > 0)
        applyStatus(enemy, "poison", 2, 5 + player.level);
    }
    return { ok: true };
  }
  defend() {
    if (this.state.phase !== "combat" || !this.state.enemy) return;
    this.state.player.buffs = this.state.player.buffs.filter(
      (b) => b.type !== "guard",
    );
    this.state.player.buffs.push({ type: "guard", duration: 1 });
    this.log(`${this.state.player.name} takes a defensive stance.`, "normal");
    this.enemyTurn();
  }
  usePotion() {
    const p = this.state.player;
    if (this.state.phase !== "combat" || !this.state.enemy)
      return { ok: false, message: "There is no active enemy." };
    if (p.potions < 1)
      return { ok: false, message: "You have no healing potions." };
    if (p.hp >= p.maxHp && p.mana >= p.maxMana)
      return { ok: false, message: "You are already fully restored." };
    p.potions--;
    p.potionsUsed++;
    const healed = Math.min(p.maxHp - p.hp, Math.ceil(p.maxHp * 0.35));
    const restored = Math.min(p.maxMana - p.mana, Math.ceil(p.maxMana * 0.2));
    p.hp += healed;
    p.mana += restored;
    this.log(
      `You drink a healing draught: +${healed} HP, +${restored} mana.`,
      "heal",
    );
    this.enemyTurn();
    return { ok: true };
  }
  enemyTurn() {
    const { player, enemy } = this.state;
    if (!enemy || enemy.hp <= 0 || this.state.phase !== "combat") return;
    const effectResult = processStartOfTurn(enemy);
    effectResult.events.forEach((e) => this.log(e.text, "status"));
    if (effectResult.defeated) {
      this.finishEnemy();
      return;
    }
    if (effectResult.skipTurn) {
      this.log(`${enemy.name} cannot act this turn.`, "status");
      this.tickBuffs(player);
      return;
    }
    const stunned = processStartOfTurn(player);
    stunned.events.forEach((e) => this.log(e.text, "status"));
    if (stunned.defeated) {
      this.endRun();
      return;
    }
    if (stunned.skipTurn) {
      this.log(`${player.name} loses their turn to the stun.`, "status");
      this.tickBuffs(player);
      return;
    }
    const guarding = player.buffs.some((b) => b.type === "guard");
    const bastion = player.buffs.some((b) => b.type === "bastion");
    const crit = this.rng.next() < 0.08;
    let damage = Math.max(
      1,
      Math.floor((enemy.attack + this.rng.int(-3, 3)) * (crit ? 1.5 : 1)) -
        player.baseDefense -
        player.armor.bonus -
        player.armor.tier * 4 -
        player.armor.level,
    );
    if (guarding) damage = Math.max(1, Math.floor(damage * 0.45));
    if (bastion) damage = Math.max(1, Math.floor(damage * 0.5));
    player.hp = Math.max(0, player.hp - damage);
    this.state.stats.damageTaken += damage;
    this.log(
      `${enemy.name} ${crit ? "crits" : "hits"} you for ${damage} damage${player.hp === 0 ? "." : "."}`,
      crit ? "danger" : "combat",
    );
    if (enemy.isBoss && this.rng.next() < 0.18 && player.hp > 0) {
      applyStatus(
        player,
        "burn",
        2,
        Math.max(3, Math.floor(enemy.attack * 0.16)),
      );
      this.log("A dark brand burns across your skin.", "status");
    }
    this.tickBuffs(player);
    if (player.hp <= 0) this.endRun();
  }
  tickBuffs(entity) {
    entity.buffs = entity.buffs
      .map((b) => ({ ...b, duration: b.duration - 1 }))
      .filter((b) => b.duration > 0);
  }
  finishEnemy() {
    const s = this.state;
    const enemy = s.enemy;
    if (!enemy || enemy._rewarded) return;
    enemy._rewarded = true;
    const p = s.player;
    const gold = this.rng.int(enemy.goldRange[0], enemy.goldRange[1]);
    p.gold += gold;
    s.stats.goldEarned += gold;
    s.stats.kills++;
    if (enemy.isBoss) {
      s.stats.bosses++;
      this.log(
        `${enemy.name} falls. The chamber shudders around you.`,
        "victory",
      );
    }
    this.log(`Victory: +${enemy.xp} XP and ${gold} gold.`, "victory");
    const levels = awardXP(p, enemy.xp);
    levels.forEach((level) =>
      this.log(
        `LEVEL UP — you are now level ${level}. Your strength grows.`,
        "level",
      ),
    );
    if (s.floor === 100 && enemy.isBoss) {
      s.stats.malakorDefeated = true;
      this.log(
        "The crown breaks. Princess Aurelia is free, and the kingdom sees its first dawn in a century.",
        "story",
      );
    }
    s.phase = "exploration";
    s.enemy = null;
    this.checkAchievements();
  }
  endRun() {
    this.state.phase = "game-over";
    this.state.runEnded = true;
    this.log(
      "Your light fades beneath the kingdom. The Hollow Crown remains.",
      "danger",
    );
    this.checkAchievements();
  }
  explore() {
    const s = this.state;
    if (s.phase !== "exploration" || s.runEnded) return;
    const room = generateRoom(s.floor, this.rng);
    s.room = room;
    s.stats.rooms++;
    this.log(`Floor ${s.floor}: ${room.title}. ${room.description}`, "story");
    if (room.type === "combat" || room.type === "boss") {
      s.enemy = createEnemy(s.floor, this.rng);
      s.phase = "combat";
      this.log(
        `${s.enemy.name} emerges from the dark. ${s.enemy.flavor}`,
        "danger",
      );
    } else if (room.type === "treasure") {
      const gold = this.rng.int(18, 45) + s.floor;
      s.player.gold += gold;
      s.stats.goldEarned += gold;
      if (this.rng.next() < 0.3) {
        const relic = this.rng.pick([
          { name: "Emberheart", description: "+5 attack", attack: 5 },
          { name: "Moon Shard", description: "+12 max mana", mana: 12 },
          { name: "Grave-Silk", description: "+10 max health", hp: 10 },
        ]);
        s.player.relics.push(relic);
        if (relic.attack) s.player.baseAttack += relic.attack;
        if (relic.mana) {
          s.player.maxMana += relic.mana;
          s.player.mana += relic.mana;
        }
        if (relic.hp) {
          s.player.maxHp += relic.hp;
          s.player.hp += relic.hp;
        }
        this.log(
          `You find ${gold} gold and a relic: ${relic.name} (${relic.description}).`,
          "loot",
        );
      } else this.log(`You find ${gold} gold in the forgotten cache.`, "loot");
      this.checkAchievements();
    } else if (room.type === "shrine") {
      const hp = Math.ceil(s.player.maxHp * 0.22);
      const mana = Math.ceil(s.player.maxMana * 0.25);
      s.player.hp = Math.min(s.player.maxHp, s.player.hp + hp);
      s.player.mana = Math.min(s.player.maxMana, s.player.mana + mana);
      this.log(
        `The shrine restores your strength (+${hp} HP, +${mana} mana).`,
        "heal",
      );
    } else if (room.type === "merchant") {
      this.log(
        "A hooded broker offers draughts and rumors beneath a lantern of blue flame.",
        "story",
      );
    } else {
      if (this.rng.next() < 0.5) {
        s.player.hp = Math.max(1, s.player.hp - 8);
        this.log("A spectral hand steals 8 health before vanishing.", "danger");
      } else {
        s.player.gold += 20;
        s.stats.goldEarned += 20;
        this.log("You decipher a rune and uncover 20 gold.", "loot");
      }
    }
    this.checkAchievements();
  }
  descend() {
    if (this.state.phase !== "exploration" || this.state.runEnded) return;
    this.state.floor++;
    if (this.state.floor > 100)
      this.log(
        "You have crossed beyond the known dungeon. Endless descent begins.",
        "story",
      );
    this.explore();
  }
  checkAchievements() {
    // Achievement definitions are evaluated centrally by the app to keep the engine deterministic.
    this.state._achievementCheck = true;
  }
}
