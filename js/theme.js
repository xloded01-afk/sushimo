const root = document.documentElement;
const prawn = document.getElementById("prawn");

function syncPrawn() {
  if (!prawn) return;
  prawn.setAttribute("aria-pressed", String(root.dataset.theme === "sea"));
}

export function setTheme(name) {
  if (root.dataset.theme === name) return;
  root.dataset.theme = name;
  syncPrawn();
}

syncPrawn();

window.__sushimo = { setTheme };
