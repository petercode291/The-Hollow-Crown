# Contributing to The Hollow Crown

Thanks for helping improve the game.

## Before opening a pull request

1. Create a focused branch for your change.
2. Keep game rules in `src/engine/` or `src/systems/`, not inside UI event handlers.
3. Add or update tests for behavior changes and bug fixes.
4. Run `npm run check` and confirm it passes.
5. Update the README or docs when changing controls, architecture, saves, or gameplay rules.

## Code guidelines

- Prefer small modules with one clear responsibility.
- Use descriptive names and avoid hidden global state.
- Keep random behavior seedable through `Random`.
- Treat save files as untrusted input and validate schema changes.
- Avoid adding a dependency unless it provides a clear benefit.
- Do not commit secrets, browser save data, generated build output, or unlicensed assets.

## Pull request description

Please include the problem being solved, a summary of the change, how it was tested, and screenshots for visible UI changes.
