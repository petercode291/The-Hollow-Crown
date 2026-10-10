# The Hollow Crown

> A kingdom fell. A crown remained. The abyss remembers.

**The Hollow Crown** is a browser-playable, single-player dark-fantasy dungeon RPG built with HTML, CSS, and modular JavaScript. It is designed as both a playable game and a maintainable software-engineering portfolio project.

## Features

- Five playable classes: Warrior, Mage, Rogue, Paladin, and Necromancer.
- Turn-based combat with class-specific signature abilities, defending, potions, critical hits, and retreat attempts.
- Status effects with explicit durations, including poison, burn, and stun support in the game engine.
- Dungeon exploration with combat rooms, treasure caches, shrines, merchants, events, and boss milestones.
- Boss encounters on floors 10, 25, 50, and 100, including Malakor, the Hollow King.
- XP, multi-level progression, gold, weapon and armor upgrades, relics, and achievements.
- Three local save slots with validation and graceful handling of missing or malformed saves.
- Responsive dark-fantasy interface, three visual themes, reduced-motion setting, and keyboard shortcuts during combat.
- Deterministic random generator for reproducible engine tests.
- Automated tests using Node's built-in test runner and a GitHub Actions build/deploy workflow.

## Play locally

### Requirements

- Node.js 20 or newer (for local server, tests, and build)
- Git (optional, but recommended)

There are no runtime or build dependencies to install.

### Install and run

```bash
git clone https://github.com/YOUR-USERNAME/the-hollow-crown.git
cd the-hollow-crown
npm run dev
```

Open `http://localhost:5173`. Alternatively, serve the root directory with any static HTTP server. Opening `index.html` directly as a `file://` URL is not recommended because browsers restrict JavaScript modules on local files.

### Tests and production build

```bash
npm test
npm run build
npm run preview
```

`npm run build` writes a dependency-free static production site to `dist/`. `npm run preview` serves that build at `http://localhost:4173`.

## Publish to GitHub Pages

1. Create a GitHub repository named `the-hollow-crown` and push this project to its `main` branch.
2. The included workflow runs tests, builds the site, and deploys the `dist/` output on pushes to `main`.
3. In the repository, open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
4. Wait for the workflow to finish successfully. The project site URL will look like:

   `https://YOUR-USERNAME.github.io/the-hollow-crown/`

The site uses relative asset paths, so it works both at the repository project URL and at a user/organization Pages root URL. The workflow uses only Node.js and GitHub Pages actions; no package installation is needed.

## Controls

During combat, use the on-screen action buttons or keyboard shortcuts:

| Key | Action |
|---|---|
| `1` | Strike |
| `2` | Class ability |
| `3` | Defend |
| `4` | Use potion |
| `Escape` | Close an open dialog |

Other actions are available through the interface.

## Architecture

```text
UI (HTML/CSS/JS)
  └── Game controller
      ├── Game state and deterministic RNG
      ├── Combat and status-effect systems
      ├── Dungeon and enemy generation
      ├── Progression and achievements
      └── Save manager / validation
```

- `src/engine/` — game lifecycle, state creation, and deterministic random generation.
- `src/systems/` — combat, effects, progression, and dungeon generation.
- `src/data/` — class definitions, enemies, bosses, and achievements.
- `src/persistence/` — versioned browser saves and validation.
- `src/ui/` — interface helpers.
- `src/styles/` — visual design and responsive layout.
- `tests/` — automated regression tests.

The engine is intentionally separated from the DOM so important game rules can be tested without launching the UI.

## Save data and privacy

Save slots and settings are stored in the browser's local storage. They are not uploaded to a server or synchronized between devices. Clearing browser site data may remove them. Do not store sensitive personal information in save files.

## Known limitations

- This is a client-side, single-player game. There is no account system, multiplayer, online leaderboard, or server-side save service.
- The visuals are CSS-based original interface artwork; a later art pass could replace them with commissioned or properly licensed assets.
- Browser saves are local to the current browser and device.
- Game balance and long-run difficulty should be playtested and adjusted as content grows.
- The Python/Tkinter prototype is a reference for the game's original concepts; this is a browser implementation, not a line-by-line Python runtime port.

## Roadmap

- [ ] Expand the dungeon with more branching routes and story decisions.
- [ ] Add more enemy patterns and boss phases.
- [ ] Add more equipment affixes and relic synergies.
- [ ] Add visual/audio asset packs with documented licenses.
- [ ] Add browser end-to-end tests and balance simulation reports.
- [ ] Consider an optional server backend only if online accounts or shared leaderboards become necessary.

## Credits and assets

The source code is distributed under the MIT License. Google Fonts are requested for Cinzel and DM Sans when network access is available; system font fallbacks are defined. If adding third-party images, sounds, or fonts, record their source and license here before distributing them.

## License

MIT. See [`LICENSE`](LICENSE).
