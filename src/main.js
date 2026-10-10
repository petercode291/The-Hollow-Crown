import { CLASSES } from "./data/classes.js";
import { ACHIEVEMENTS } from "./data/content.js";
import { Game } from "./engine/Game.js";
import { SaveManager } from "./persistence/SaveManager.js";
import { renderSaveSlots } from "./ui/SaveSlots.js";

const app = document.querySelector("#app");
let game = null;
let screen = "title";
let modal = null;
let selectedClass = "Warrior";
let playerName = "";
let settings = SaveManager.readSettings();
let notice = "";
let noticeTimer;
const saveManager = new SaveManager();

const escapeHTML = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const pct = (value, max) =>
  Math.max(0, Math.min(100, Math.round((value / Math.max(1, max)) * 100)));
const iconFor = (type) =>
  ({
    story: "✧",
    combat: "⚔",
    crit: "✹",
    ability: "✦",
    status: "☠",
    heal: "✚",
    loot: "◇",
    victory: "♛",
    level: "↑",
    danger: "!",
    achievement: "★",
    normal: "·",
  })[type] || "·";

function toast(message) {
  notice = message;
  render();
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {
    notice = "";
    render();
  }, 3000);
}
function newGame() {
  game = Game.newGame(selectedClass, playerName);
  screen = "game";
  modal = null;
  game.explore();
  render();
}
function openModal(name) {
  modal = name;
  render();
}
function closeModal() {
  modal = null;
  render();
}
function render() {
  document.documentElement.dataset.theme = settings.theme || "obsidian";
  if (!game && screen === "title") app.innerHTML = renderTitle();
  else if (screen === "character") app.innerHTML = renderCharacter();
  else if (screen === "game" && game) app.innerHTML = renderGame();
  else app.innerHTML = renderTitle();
  if (modal) renderModal();
  if (notice) {
    const toastEl = document.createElement("div");
    toastEl.className = "toast";
    toastEl.textContent = notice;
    toastEl.setAttribute("role", "status");
    app.append(toastEl);
  }
  bindEvents();
}

function renderTitle() {
  const slots = saveManager.list();
  const hasSave = slots.some((s) => s.exists);
  return `<main class="title-screen">
    <div class="title-topline"><span class="sigil">HC</span><span>AN INTERACTIVE DARK FANTASY RPG</span><span class="version">WEB EDITION · 1.0</span></div>
    <div class="title-art" aria-hidden="true"><div class="moon"></div><div class="mountain mountain-back"></div><div class="mountain mountain-front"></div><div class="crown-mark">♛</div><div class="art-rune rune-one">✦</div><div class="art-rune rune-two">ᚱ</div><div class="art-rune rune-three">✧</div></div>
    <section class="title-copy"><p class="eyebrow">THE KINGDOM HAS FORGOTTEN ITS NAME</p><h1>The Hollow <span>Crown</span></h1><p class="tagline">A kingdom fell. A crown remained. The abyss remembers.</p><p class="intro-copy">Descend beneath Sol-Aethel, face the things left behind, and discover what sits upon the throne of ash.</p>
    <div class="title-actions"><button class="button button-primary button-large" data-action="new-game">Begin your descent <span>↗</span></button><button class="button button-outline button-large" data-action="continue" ${hasSave ? "" : "disabled"}>Continue adventure</button></div>
    <div class="title-foot"><span>✦ FIVE PATHS · ONE FORGOTTEN KINGDOM</span><span>TURN-BASED · SINGLE PLAYER</span><button class="text-button" data-action="settings">Settings</button></div></section>
  </main>`;
}

function renderCharacter() {
  return `<main class="setup-screen"><header class="simple-header"><button class="text-button" data-action="back-title">← Back</button><span class="eyebrow">CHAPTER ZERO · THE CALLING</span><span class="version">CHARACTER CREATION</span></header><section class="setup-heading"><p class="eyebrow">CHOOSE YOUR FATE</p><h1>Who descends?</h1><p>Every path has a strength. Every strength has a cost.</p></section>
    <div class="class-grid">${Object.entries(CLASSES)
      .map(
        ([key, c]) =>
          `<button class="class-card ${selectedClass === key ? "selected" : ""}" data-action="choose-class" data-class="${key}" aria-pressed="${selectedClass === key}"><span class="class-icon">${c.icon}</span><span class="class-role">${c.role}</span><strong>${c.name}</strong><span class="class-epithet">${c.epithet}</span><span class="class-description">${c.description}</span><span class="class-stats"><span>♥ ${c.hp} HP</span><span>✦ ${c.mana} MP</span><span>⚔ ${c.attack} ATK</span></span></button>`,
      )
      .join("")}</div>
    <section class="character-bottom"><label class="field-label" for="hero-name">YOUR NAME <span>(optional)</span></label><input id="hero-name" maxlength="24" placeholder="Enter your name…" value="${escapeHTML(playerName)}" autocomplete="off"/><div class="selected-ability"><span class="ability-symbol">✦</span><div><div class="eyebrow">SIGNATURE ABILITY</div><strong>${CLASSES[selectedClass].ability}</strong><p>${CLASSES[selectedClass].abilityDescription}</p><span class="muted">Mana cost: ${CLASSES[selectedClass].abilityCost}</span></div></div><button class="button button-primary button-large" data-action="start-adventure">Enter the underkingdom <span>↗</span></button></section></main>`;
}

function renderGame() {
  const s = game.state;
  const p = s.player;
  const cls = CLASSES[p.className];
  const e = s.enemy;
  const floorLabel =
    s.floor > 100
      ? `ABYSS ${s.floor - 100}`
      : `FLOOR ${String(s.floor).padStart(2, "0")}`;
  const room = s.room || {
    title: "The Threshold",
    description: "The dark awaits.",
  };
  return `<main class="game-shell">
    <header class="game-header"><button class="brand-lockup" data-action="title-confirm"><span class="brand-sigil">HC</span><span><strong>THE HOLLOW CROWN</strong><small>THE UNDERKINGDOM</small></span></button><div class="header-center"><span class="live-dot"></span><span>${floorLabel}</span><span class="header-divider">/</span><span>${room.title.toUpperCase()}</span></div><div class="header-actions"><button class="icon-button" data-action="save-menu" aria-label="Save game" title="Save game">▣</button><button class="icon-button" data-action="settings" aria-label="Settings" title="Settings">⚙</button><button class="icon-button" data-action="help" aria-label="Help" title="Help">?</button></div></header>
    <div class="game-layout"><aside class="left-rail"><div class="panel-label">YOUR CHAMPION <span>01</span></div><div class="hero-avatar"><div class="avatar-glow"></div><span>${cls.icon}</span><small>LVL ${p.level}</small></div><h2 class="hero-name">${escapeHTML(p.name)}</h2><p class="hero-class">${p.className.toUpperCase()} · ${cls.epithet}</p><div class="stat-block"><div class="stat-heading"><span>VITALITY</span><strong>${p.hp}<i> / ${p.maxHp}</i></strong></div><div class="meter hp-meter"><span style="width:${pct(p.hp, p.maxHp)}%"></span></div></div><div class="stat-block"><div class="stat-heading"><span>ARCANA</span><strong>${p.mana}<i> / ${p.maxMana}</i></strong></div><div class="meter mana-meter"><span style="width:${pct(p.mana, p.maxMana)}%"></span></div></div><div class="stat-block"><div class="stat-heading"><span>EXPERIENCE</span><strong>${p.xp}<i> / ${p.nextXp}</i></strong></div><div class="meter xp-meter"><span style="width:${pct(p.xp, p.nextXp)}%"></span></div></div><div class="quick-stats"><div><span>⚔</span><small>ATTACK</small><strong>${p.baseAttack + p.weapon.bonus + p.weapon.tier * 5 + p.weapon.level}</strong></div><div><span>⬟</span><small>DEFENSE</small><strong>${p.baseDefense + p.armor.bonus + p.armor.tier * 4 + p.armor.level}</strong></div><div><span>◇</span><small>GOLD</small><strong>${p.gold}</strong></div></div><div class="inventory-mini"><div class="panel-label">EQUIPPED <span>02</span></div><div class="gear-row"><span class="gear-icon">⚔</span><span><small>WEAPON</small><strong>${escapeHTML(p.weapon.name)}</strong><em>Tier ${p.weapon.tier + 1} · +${p.weapon.level}</em></span></div><div class="gear-row"><span class="gear-icon armor-icon">⬟</span><span><small>ARMOR</small><strong>${escapeHTML(p.armor.name)}</strong><em>Tier ${p.armor.tier + 1} · +${p.armor.level}</em></span></div></div><button class="button button-outline full-width" data-action="inventory">Inventory & forge <span>↗</span></button></aside>
    <section class="dungeon-main"><div class="dungeon-overline"><span class="eyebrow">THE DESCENT</span><span class="floor-chip">${floorLabel}</span></div><div class="scene-panel ${s.phase === "combat" ? "in-combat" : ""}"><div class="scene-grain"></div><div class="scene-orb"></div><div class="scene-arch arch-outer"></div><div class="scene-arch arch-inner"></div><div class="scene-floor"></div><div class="scene-symbol">${s.phase === "combat" && e ? e.icon : room.type === "treasure" ? "◇" : room.type === "shrine" ? "✚" : room.type === "merchant" ? "♙" : "ᚱ"}</div><div class="scene-caption"><span>${s.phase === "combat" ? (e?.isBoss ? "BOSS ENCOUNTER" : "HOSTILE PRESENCE") : (room.type || "exploration").toUpperCase()}</span><h2>${s.phase === "combat" && e ? escapeHTML(e.name) : escapeHTML(room.title)}</h2><p>${s.phase === "combat" && e ? escapeHTML(e.flavor) : escapeHTML(room.description)}</p></div><div class="scene-coordinate">SOL-AETHEL <span>·</span> ${String(s.floor).padStart(3, "0")}</div></div>
      ${s.phase === "combat" && e ? `<section class="enemy-strip"><div class="enemy-identity"><span class="enemy-glyph">${e.icon}</span><div><span class="eyebrow">${e.isBoss ? "ANCIENT THREAT" : "HOSTILE"}</span><strong>${escapeHTML(e.name)}</strong></div></div><div class="enemy-vitals"><div class="stat-heading"><span>ENEMY VITALITY</span><strong>${e.hp} <i>/ ${e.maxHp}</i></strong></div><div class="meter enemy-meter"><span style="width:${pct(e.hp, e.maxHp)}%"></span></div><div class="status-list">${e.status.map((st) => `<span class="status-pill">${escapeHTML(st.type)} · ${st.duration}</span>`).join("")}</div></div></section>` : s.phase === "game-over" ? `<section class="game-over-banner"><span>☽</span><div><strong>Your light has faded.</strong><p>The underkingdom claims another soul. Your legend is not yet written.</p></div><button class="button button-primary" data-action="new-game">Rise again</button></section>` : `<section class="room-summary"><span class="summary-mark">✧</span><div><span class="eyebrow">THE WAY FORWARD</span><strong>${escapeHTML(room.title)}</strong><p>${escapeHTML(room.description)}</p></div></section>`}
      <section class="action-area"><div class="panel-label">${s.phase === "combat" ? "CHOOSE YOUR ACTION" : s.phase === "game-over" ? "THE END — FOR NOW" : "YOUR NEXT MOVE"}<span>${s.phase === "combat" ? "YOUR TURN" : s.phase === "game-over" ? "RUN ENDED" : "EXPLORATION"}</span></div>${s.phase === "combat" ? `<div class="combat-actions"><button class="action-card primary-action" data-action="attack"><span class="action-icon">⚔</span><strong>Strike</strong><small>Reliable physical attack</small><kbd>1</kbd></button><button class="action-card" data-action="ability" ${p.mana < cls.abilityCost ? "disabled" : ""}><span class="action-icon">✦</span><strong>${escapeHTML(cls.ability)}</strong><small>${cls.abilityCost} mana · class skill</small><kbd>2</kbd></button><button class="action-card" data-action="defend"><span class="action-icon">⬟</span><strong>Defend</strong><small>Reduce incoming damage</small><kbd>3</kbd></button><button class="action-card" data-action="potion" ${p.potions < 1 ? "disabled" : ""}><span class="action-icon">⚗</span><strong>Use potion <b>×${p.potions}</b></strong><small>Restore health and mana</small><kbd>4</kbd></button><button class="action-card action-escape" data-action="flee"><span class="action-icon">↗</span><strong>Retreat</strong><small>Attempt to escape</small></button></div>` : s.phase === "game-over" ? `<div class="combat-actions"><button class="action-card primary-action" data-action="new-game"><span class="action-icon">↻</span><strong>New adventure</strong><small>Begin a fresh run</small></button><button class="action-card" data-action="save-menu"><span class="action-icon">▣</span><strong>Save run</strong><small>Preserve your record</small></button></div>` : `<div class="explore-actions"><button class="button button-primary button-large" data-action="descend">${s.floor === 100 ? "Face the Hollow King" : "Descend deeper"} <span>↓</span></button><button class="button button-outline" data-action="inventory">Inspect inventory</button>${room.type === "merchant" ? '<button class="button button-outline" data-action="merchant">Trade with broker</button>' : '<button class="button button-outline" data-action="achievements">Achievements</button>'}</div>`}</section>
      <section class="chronicle"><div class="panel-label">CHRONICLE <span>LAST EVENTS</span></div><div class="log-list">${s.log
        .slice(-5)
        .reverse()
        .map(
          (item) =>
            `<div class="log-entry log-${item.type}"><span>${iconFor(item.type)}</span><p>${escapeHTML(item.text)}</p></div>`,
        )
        .join("")}</div></section>
    </section><aside class="right-rail"><div class="panel-label">RUN RECORD <span>03</span></div><div class="run-stat"><span class="run-stat-icon">⌖</span><div><small>FLOORS CLEARED</small><strong>${Math.max(0, s.floor - 1)}</strong></div></div><div class="run-stat"><span class="run-stat-icon">☠</span><div><small>FOES DEFEATED</small><strong>${s.stats.kills}</strong></div></div><div class="run-stat"><span class="run-stat-icon">♛</span><div><small>BOSSES DEFEATED</small><strong>${s.stats.bosses}</strong></div></div><div class="rail-divider"></div><div class="panel-label">RELICS <span>${p.relics.length}/10</span></div>${p.relics.length ? `<div class="relic-list">${p.relics.map((r) => `<div class="relic-item"><span>✦</span><div><strong>${escapeHTML(r.name)}</strong><small>${escapeHTML(r.description)}</small></div></div>`).join("")}</div>` : `<div class="empty-relics"><span>◇</span><p>No relics discovered.</p><small>Search forgotten caches to find relics of the old kingdom.</small></div>`}<div class="rail-divider"></div><div class="panel-label">ACHIEVEMENTS <span>${s.achievements.length}/${ACHIEVEMENTS.length}</span></div><div class="achievement-progress"><div class="meter achievement-meter"><span style="width:${pct(s.achievements.length, ACHIEVEMENTS.length)}%"></span></div><p>${s.achievements.length ? `You have earned ${s.achievements.length} mark${s.achievements.length === 1 ? "" : "s"} of legend.` : "Your legend has yet to be written."}</p><button class="text-button" data-action="achievements">View all achievements ↗</button></div><div class="rail-bottom"><span class="live-dot"></span> AUTOSAVE IS NOT ENABLED <button class="text-button" data-action="save-menu">Save manually ↗</button></div></aside></div><footer class="game-footer"><span>THE HOLLOW CROWN <i>·</i> A WORK OF DARK FANTASY</span><span>YOUR CHOICES SHAPE THE DESCENT</span><span>LOCAL SINGLE-PLAYER</span></footer></main>`;
}

function renderModal() {
  let content = "";
  let title = "";
  if (modal === "save" || modal === "load") {
    title =
      modal === "save" ? "Preserve your legend" : "Return to your adventure";
    content = `<p class="modal-intro">${modal === "save" ? "Choose a slot to save your current progress in this browser." : "Choose a saved adventure to continue."}</p>${renderSaveSlots(saveManager.list(), modal)}<p class="muted small">Saves are stored in this browser on this device. Clearing site data may erase them.</p>`;
  } else if (modal === "inventory") {
    title = "Inventory & the forge";
    const p = game.state.player;
    const upgradeCost = (item) => 25 + item.tier * 35 + item.level * 12;
    content = `<div class="inventory-detail"><div class="inventory-item"><span class="gear-icon">⚔</span><div><small>WEAPON</small><strong>${escapeHTML(p.weapon.name)}</strong><p>Tier ${p.weapon.tier + 1} · +${p.weapon.level} · +${p.weapon.bonus + p.weapon.tier * 5 + p.weapon.level} attack</p></div><button class="button button-small" data-action="upgrade-weapon" ${p.gold < upgradeCost(p.weapon) || (p.weapon.tier >= 9 && p.weapon.level >= 10) ? "disabled" : ""}>Upgrade · ${upgradeCost(p.weapon)}g</button></div><div class="inventory-item"><span class="gear-icon armor-icon">⬟</span><div><small>ARMOR</small><strong>${escapeHTML(p.armor.name)}</strong><p>Tier ${p.armor.tier + 1} · +${p.armor.level} · +${p.armor.bonus + p.armor.tier * 4 + p.armor.level} defense</p></div><button class="button button-small" data-action="upgrade-armor" ${p.gold < upgradeCost(p.armor) || (p.armor.tier >= 9 && p.armor.level >= 10) ? "disabled" : ""}>Upgrade · ${upgradeCost(p.armor)}g</button></div><div class="inventory-item"><span class="gear-icon potion-icon">⚗</span><div><small>CONSUMABLE</small><strong>Healing draught ×${p.potions}</strong><p>Restores 35% HP and 20% mana during combat.</p></div><button class="button button-small" data-action="buy-potion" ${p.gold < 18 || p.potions >= 9 ? "disabled" : ""}>Buy · 18g</button></div></div><div class="inventory-footer"><span>Available gold</span><strong>◇ ${p.gold}</strong></div>`;
  } else if (modal === "achievements") {
    title = "Marks of legend";
    content = `<div class="achievement-list">${ACHIEVEMENTS.map((a) => `<article class="achievement-card ${game.state.achievements.includes(a.id) ? "earned" : ""}"><span>${game.state.achievements.includes(a.id) ? "★" : "◇"}</span><div><strong>${a.name}</strong><p>${a.description}</p></div><small>${game.state.achievements.includes(a.id) ? "UNLOCKED" : "LOCKED"}</small></article>`).join("")}</div>`;
  } else if (modal === "settings") {
    title = "Settings";
    content = `<div class="settings-list"><label>Visual theme<select id="theme-select"><option value="obsidian" ${settings.theme === "obsidian" ? "selected" : ""}>Obsidian & gold</option><option value="ember" ${settings.theme === "ember" ? "selected" : ""}>Ember & ash</option><option value="terminal" ${settings.theme === "terminal" ? "selected" : ""}>Terminal green</option></select></label><label class="toggle-row"><span><strong>Reduced motion</strong><small>Limit decorative movement</small></span><input id="motion-toggle" type="checkbox" ${settings.reducedMotion ? "checked" : ""}></label><label class="toggle-row"><span><strong>Sound effects</strong><small>Reserved for a future audio pass</small></span><input id="sound-toggle" type="checkbox" ${settings.sound ? "checked" : ""}></label></div><p class="muted small">Settings are stored locally in this browser.</p>`;
  } else if (modal === "help") {
    title = "Field guide";
    content = `<div class="help-copy"><p><strong>Combat:</strong> Strike, use your class ability, defend, drink a potion, or attempt to retreat. Enemy turns resolve automatically after most actions.</p><p><strong>Exploration:</strong> Descend to discover enemies, treasure, shrines, merchants and strange events. Bosses await on floors 10, 25, 50 and 100.</p><p><strong>Progression:</strong> Defeat enemies to earn XP and gold. Level-ups increase core stats. Visit Inventory & Forge to upgrade your weapon and armor.</p><p><strong>Saving:</strong> Use the save icon to create one of three local save slots. Saves belong to this browser and are not synced between devices.</p><p><strong>Tip:</strong> Mage damage is high but defense is low; Paladins sustain themselves; Rogues can guarantee critical hits with their signature ability.</p></div>`;
  } else if (modal === "merchant") {
    title = "The Wandering Broker";
    content = `<p class="modal-intro">“Gold buys a little time, traveler. Nothing more.”</p><div class="merchant-offer"><span class="gear-icon potion-icon">⚗</span><div><strong>Healing draught</strong><p>Restore health and mana during combat.</p><small>Cost: 18 gold · You have ${game.state.player.gold} gold</small></div><button class="button button-small" data-action="buy-potion" ${game.state.player.gold < 18 || game.state.player.potions >= 9 ? "disabled" : ""}>Buy</button></div>`;
  }
  const overlay = document.createElement("div");
  overlay.className = "modal-backdrop";
  overlay.innerHTML = `<section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header class="modal-header"><div><p class="eyebrow">THE HOLLOW CROWN</p><h2 id="modal-title">${title}</h2></div><button class="icon-button modal-close" data-action="close-modal" aria-label="Close dialog">×</button></header><div class="modal-content">${content}</div>${["settings", "help", "achievements"].includes(modal) ? '<footer class="modal-footer"><button class="button button-outline" data-action="close-modal">Close</button></footer>' : ""}</section>`;
  app.append(overlay);
}

function bindEvents() {
  app
    .querySelectorAll("[data-action]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        handleAction(button.dataset.action, button.dataset),
      ),
    );
  const nameInput = app.querySelector("#hero-name");
  if (nameInput)
    nameInput.addEventListener("input", (e) => {
      playerName = e.target.value;
    });
  const themeSelect = app.querySelector("#theme-select");
  if (themeSelect)
    themeSelect.addEventListener("change", (e) => {
      settings.theme = e.target.value;
      SaveManager.writeSettings(settings);
      render();
      openModal("settings");
    });
  const motionToggle = app.querySelector("#motion-toggle");
  if (motionToggle)
    motionToggle.addEventListener("change", (e) => {
      settings.reducedMotion = e.target.checked;
      SaveManager.writeSettings(settings);
      document.documentElement.classList.toggle(
        "reduced-motion",
        settings.reducedMotion,
      );
    });
  const soundToggle = app.querySelector("#sound-toggle");
  if (soundToggle)
    soundToggle.addEventListener("change", (e) => {
      settings.sound = e.target.checked;
      SaveManager.writeSettings(settings);
    });
}

function handleAction(action, data = {}) {
  switch (action) {
    case "new-game":
      screen = "character";
      modal = null;
      render();
      break;
    case "back-title":
      screen = "title";
      modal = null;
      render();
      break;
    case "choose-class":
      selectedClass = data.class;
      render();
      break;
    case "start-adventure":
      newGame();
      break;
    case "continue":
      openModal("load");
      break;
    case "title-confirm":
      if (
        confirm(
          "Return to the title screen? Save your adventure first if you want to keep it.",
        )
      ) {
        screen = "title";
        modal = null;
        render();
      }
      break;
    case "attack":
      game.attack();
      render();
      break;
    case "ability": {
      const result = game.useAbility();
      if (!result.ok) toast(result.message);
      render();
      break;
    }
    case "defend":
      game.defend();
      render();
      break;
    case "potion": {
      const result = game.usePotion();
      if (!result.ok) toast(result.message);
      render();
      break;
    }
    case "flee":
      game.flee();
      render();
      break;
    case "descend":
      game.descend();
      render();
      break;
    case "inventory":
      openModal("inventory");
      break;
    case "achievements":
      openModal("achievements");
      break;
    case "settings":
      openModal("settings");
      break;
    case "help":
      openModal("help");
      break;
    case "merchant":
      openModal("merchant");
      break;
    case "save-menu":
      openModal("save");
      break;
    case "close-modal":
      closeModal();
      break;
    case "save-slot":
      try {
        saveManager.save(Number(data.slot), game.getState());
        toast(`Adventure saved to slot ${data.slot}.`);
        modal = null;
        render();
      } catch (e) {
        toast(`Save failed: ${e.message}`);
      }
      break;
    case "load-slot": {
      const result = saveManager.load(Number(data.slot));
      if (result.ok) {
        game = Game.fromSave(result.data);
        screen = "game";
        modal = null;
        render();
        toast("Adventure loaded.");
      } else toast(result.reason);
      break;
    }
    case "delete-slot":
      if (confirm(`Delete save slot ${data.slot}? This cannot be undone.`)) {
        saveManager.delete(Number(data.slot));
        render();
        openModal(modal || "load");
      }
      break;
    case "upgrade-weapon": {
      const r = game.upgrade("weapon");
      modal = "inventory";
      render();
      if (!r.ok) toast(r.message);
      break;
    }
    case "upgrade-armor": {
      const r = game.upgrade("armor");
      modal = "inventory";
      render();
      if (!r.ok) toast(r.message);
      break;
    }
    case "buy-potion": {
      const r = game.buyPotion();
      modal = modal === "merchant" ? "merchant" : "inventory";
      render();
      if (!r.ok) toast(r.message);
      break;
    }
  }
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal) {
    closeModal();
    return;
  }
  if (modal || !game || game.state.phase !== "combat") return;
  const action = { 1: "attack", 2: "ability", 3: "defend", 4: "potion" }[
    event.key
  ];
  if (action) handleAction(action);
});

if (settings.reducedMotion)
  document.documentElement.classList.add("reduced-motion");
render();
