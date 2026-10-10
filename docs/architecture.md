# Architecture notes

## Design goals

1. **Engine independent of the DOM.** Combat, progression, and dungeon systems must be usable in Node tests.
2. **One authoritative game state.** UI components display state and send actions; they do not directly implement combat rules.
3. **Reproducible randomness.** `Random` uses a compact seeded generator and its current state is included in saves so a resumed run continues the random sequence.
4. **Validated persistence.** Browser saves are schema-versioned and checked before being loaded.
5. **Progressive complexity.** New enemy and item definitions should be data-driven where practical.

## Action flow

`UI event → Game action → system rules → state/event log → render`

The interface currently rerenders the game view after actions. For this game's turn-based pace, that is simple and adequate. If the UI grows substantially, rendering can be split into screen components or migrated to a framework without moving game rules into the UI.

## Save contract

The save envelope contains `schemaVersion`, `savedAt`, the complete game state, and `rngState`. When the save schema changes, add an explicit migration rather than silently interpreting old data as new data. `localStorage` is user-editable and should never be treated as trusted server data.

## Testing strategy

- Unit tests for pure calculations and state transitions.
- Regression tests for discovered bugs (stun expiry, poison duration, XP overflow, boss milestones, save corruption).
- Future: seeded simulation tests for class balance and browser end-to-end tests for critical journeys.
