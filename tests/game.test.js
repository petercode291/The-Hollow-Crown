import test from "node:test";
import assert from "node:assert/strict";
import { createPlayer, createInitialState } from "../src/engine/GameState.js";
import { awardXP } from "../src/systems/ProgressionSystem.js";
import {
  applyStatus,
  processStartOfTurn,
} from "../src/systems/StatusEffectSystem.js";
import { Random } from "../src/engine/Random.js";
import { createEnemy, generateRoom } from "../src/systems/DungeonGenerator.js";
import { validateSave, SaveManager } from "../src/persistence/SaveManager.js";
import { Game } from "../src/engine/Game.js";

test("all five classes create valid players", () => {
  for (const name of ["Warrior", "Mage", "Rogue", "Paladin", "Necromancer"]) {
    const player = createPlayer(name, "Test Hero");
    assert.equal(player.className, name);
    assert.equal(player.hp, player.maxHp);
    assert.equal(player.mana, player.maxMana);
    assert.ok(player.baseAttack > 0);
  }
});

test("unknown character class is rejected", () => {
  assert.throws(() => createPlayer("Dragonlord"), /Unknown class/);
});

test("large XP awards grant multiple levels and preserve remainder", () => {
  const player = createPlayer("Warrior");
  const levels = awardXP(player, 250);
  assert.deepEqual(levels, [2, 3]);
  assert.equal(player.xp, 70); // 250 - 70 - floor(70 * 1.32 + 18)
  assert.equal(player.level, 3);
});

test("stun expires after its defined duration instead of locking a target forever", () => {
  const target = { name: "Skeleton", hp: 30, status: [] };
  applyStatus(target, "stun", 1, 0);
  const result = processStartOfTurn(target);
  assert.equal(result.skipTurn, true);
  assert.equal(target.status.length, 0);
  assert.equal(processStartOfTurn(target).skipTurn, false);
});

test("poison deals damage and expires after its duration", () => {
  const target = { name: "Ghoul", hp: 20, status: [] };
  applyStatus(target, "poison", 2, 4);
  processStartOfTurn(target);
  assert.equal(target.hp, 16);
  assert.equal(target.status[0].duration, 1);
  processStartOfTurn(target);
  assert.equal(target.hp, 12);
  assert.equal(target.status.length, 0);
});

test("random generator is deterministic for the same seed", () => {
  const a = new Random(12345);
  const b = new Random(12345);
  assert.deepEqual(
    Array.from({ length: 10 }, () => a.int(1, 100)),
    Array.from({ length: 10 }, () => b.int(1, 100)),
  );
});

test("bosses spawn on milestone floors", () => {
  for (const floor of [10, 25, 50, 100]) {
    const enemy = createEnemy(floor, new Random(1));
    assert.equal(enemy.isBoss, true);
    assert.ok(enemy.hp > 0);
  }
});

test("floor one always begins with a combat room", () => {
  assert.equal(generateRoom(1, new Random(10)).type, "combat");
});

test("new game reaches exploration after its first encounter is cleared", () => {
  const game = Game.newGame("Warrior", "Ada", 7);
  game.explore();
  assert.equal(game.state.phase, "combat");
  game.state.enemy.hp = 1;
  game.attack();
  assert.equal(game.state.phase, "exploration");
  assert.equal(game.state.stats.kills, 1);
});

test("saved random state resumes the same random sequence", () => {
  const game = Game.newGame("Mage", "Seer", 123);
  game.explore();
  const snapshot = game.getState();
  const restored = Game.fromSave(snapshot);
  assert.equal(game.rng.next(), restored.rng.next());
});

test("save validation rejects malformed and unsupported saves", () => {
  assert.equal(validateSave(null).ok, false);
  assert.equal(validateSave({ schemaVersion: 99 }).ok, false);
  const valid = createInitialState("Mage", "Test", 4);
  assert.equal(validateSave(valid).ok, true);
});

test("save manager handles empty and corrupted slots safely", () => {
  const map = new Map();
  const storage = {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
  };
  const manager = new SaveManager(storage);
  assert.equal(manager.load(1).ok, false);
  map.set("hollow-crown-save-v1:2", "{broken json");
  assert.equal(manager.load(2).ok, false);
  const state = createInitialState("Rogue", "Rook", 88);
  manager.save(1, state);
  const loaded = manager.load(1);
  assert.equal(loaded.ok, true);
  assert.equal(loaded.data.player.name, "Rook");
});
