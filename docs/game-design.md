# Game design brief

## Premise

Sol-Aethel is a fallen kingdom. The player descends beneath its palace to discover why the crown's last king became the Hollow King and to rescue Princess Aurelia.

## Playable paths

- **Warrior — Bulwark:** durable melee combat and temporary fortification.
- **Mage — Spellcaster:** high damage and burn pressure, balanced by low defense.
- **Rogue — Assassin:** high critical chance and a guaranteed critical signature ability.
- **Paladin — Guardian:** high defense and self-healing.
- **Necromancer — Drain Mage:** damage-over-time and life-steal style sustain.

## Run loop

Explore a room → resolve its event or combat → collect rewards → spend gold and manage resources → descend. Boss milestones are floors 10, 25, 50, and 100. Defeating Malakor ends the rescue story, while the player can continue into an endless descent.

## Balancing principles

- A class should have a strength and a trade-off, not a strictly superior stat line.
- Every status effect has explicit duration and tick timing.
- Large XP rewards must grant every earned level.
- Endless scaling grows more slowly than early-game scaling.
- Combat should remain deterministic under a saved RNG state so bugs can be reproduced.

The game is a prototype in active development. These principles are goals to verify through playtesting, not claims that every class is already perfectly balanced.
