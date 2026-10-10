const PREFIX = "hollow-crown-save-v1:";
const SETTINGS_KEY = "hollow-crown-settings-v1";

export function validateSave(data) {
  if (!data || typeof data !== "object")
    return { ok: false, reason: "Save data is not an object." };
  if (data.schemaVersion !== 1)
    return { ok: false, reason: "This save version is not supported." };
  if (
    !data.player ||
    typeof data.player.name !== "string" ||
    !Number.isFinite(data.player.hp)
  )
    return { ok: false, reason: "The save is missing valid player data." };
  if (!Number.isFinite(data.floor) || data.floor < 1)
    return { ok: false, reason: "The save has an invalid dungeon floor." };
  if (!["exploration", "combat", "game-over"].includes(data.phase))
    return { ok: false, reason: "The save has an invalid game phase." };
  if (
    data.phase === "combat" &&
    (!data.enemy || !Number.isFinite(data.enemy.hp))
  )
    return { ok: false, reason: "The save has an invalid enemy state." };
  return { ok: true };
}

export class SaveManager {
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
  }
  save(slot, state) {
    if (!Number.isInteger(slot) || slot < 1 || slot > 3)
      throw new Error("Save slot must be between 1 and 3.");
    const payload = {
      ...structuredClone(state),
      savedAt: new Date().toISOString(),
    };
    const result = validateSave(payload);
    if (!result.ok) throw new Error(result.reason);
    this.storage.setItem(`${PREFIX}${slot}`, JSON.stringify(payload));
    return payload.savedAt;
  }
  load(slot) {
    const raw = this.storage.getItem(`${PREFIX}${slot}`);
    if (!raw) return { ok: false, reason: "This slot is empty." };
    try {
      const data = JSON.parse(raw);
      const result = validateSave(data);
      if (!result.ok) return { ok: false, reason: result.reason };
      return { ok: true, data };
    } catch {
      return {
        ok: false,
        reason:
          "This save is corrupted. You can start a new adventure or delete this slot.",
      };
    }
  }
  list() {
    return [1, 2, 3].map((slot) => {
      const result = this.load(slot);
      return result.ok
        ? {
            slot,
            exists: true,
            name: result.data.player.name,
            className: result.data.player.className,
            floor: result.data.floor,
            savedAt: result.data.savedAt,
          }
        : { slot, exists: false, reason: result.reason };
    });
  }
  delete(slot) {
    this.storage.removeItem(`${PREFIX}${slot}`);
  }
  static readSettings(storage = globalThis.localStorage) {
    try {
      return {
        theme: "obsidian",
        reducedMotion: false,
        sound: true,
        ...JSON.parse(storage.getItem(SETTINGS_KEY) || "{}"),
      };
    } catch {
      return { theme: "obsidian", reducedMotion: false, sound: true };
    }
  }
  static writeSettings(settings, storage = globalThis.localStorage) {
    storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
}
