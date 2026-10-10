export function renderSaveSlots(slots, mode = "save") {
  return `<div class="slot-list">${slots
    .map(
      (slot) => `
    <article class="slot-card">
      <div class="slot-number">SLOT 0${slot.slot}</div>
      ${slot.exists ? `<div class="slot-name">${escapeHTML(slot.name)}</div><div class="muted">${escapeHTML(slot.className)} · Floor ${slot.floor}</div><div class="muted small">${slot.savedAt ? new Date(slot.savedAt).toLocaleString() : "Saved game"}</div>` : `<div class="slot-name">Empty slot</div><div class="muted">No saved adventure</div>`}
      <div class="slot-actions">
        ${mode === "save" ? `<button class="button button-small" data-action="save-slot" data-slot="${slot.slot}">Save here</button>` : `<button class="button button-small" data-action="load-slot" data-slot="${slot.slot}" ${slot.exists ? "" : "disabled"}>Load</button>`}
        ${slot.exists ? `<button class="button button-small button-quiet" data-action="delete-slot" data-slot="${slot.slot}">Delete</button>` : ""}
      </div>
    </article>`,
    )
    .join("")}</div>`;
}
function escapeHTML(value) {
  return String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
