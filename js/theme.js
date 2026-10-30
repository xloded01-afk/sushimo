(() => {
  const root = document.documentElement;
  const prawn = document.getElementById("prawn");
  const hint = document.getElementById("theme-hint");

  function syncPrawn() {
    if (!prawn) return;
    prawn.setAttribute("aria-pressed", String(root.dataset.theme === "sea"));
  }

  function hideHint() {
    if (!hint || hint.dataset.hidden === "true") return;
    hint.dataset.hidden = "true";
    hint.style.opacity = "0";
    hint.setAttribute("aria-hidden", "true");
  }

  function rememberHintSeen() {
    try {
      sessionStorage.setItem("sushimo:hint-seen", "1");
    } catch (_) {
      /* sessionStorage недоступен — подсказка просто скроется до перезагрузки */
    }
  }

  function setTheme(name) {
    if (root.dataset.theme === name) return;
    root.dataset.theme = name;
    syncPrawn();
    hideHint();
    rememberHintSeen();
  }

  syncPrawn();

  try {
    if (sessionStorage.getItem("sushimo:hint-seen") === "1") hideHint();
  } catch (_) {}

  window.__sushimo = { setTheme };
})();
