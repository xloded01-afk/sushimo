(() => {
  const root = document.documentElement;
  const prawn = document.getElementById("prawn");
  const hint = document.getElementById("theme-hint");

  let current = 0;

  function syncPrawn() {
    if (!prawn) return;
    prawn.setAttribute("aria-pressed", String(root.dataset.theme === "sea"));
  }

  function applyState(name) {
    if (root.dataset.theme === name) return;
    root.dataset.theme = name;
    syncPrawn();
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

  function clamp01(n) {
    return n < 0 ? 0 : n > 1 ? 1 : n;
  }

  function setProgress(value, options) {
    const instant = !!(options && options.instant);
    if (instant) {
      root.classList.add("theme-no-anim");
    } else {
      root.classList.remove("theme-no-anim");
    }
    root.style.setProperty("--sea", String(clamp01(value)));
    applyState(value >= 0.5 ? "sea" : "asian");
  }

  function setTheme(name) {
    const target = name === "sea" ? 1 : 0;
    const changed = current !== target;
    current = target;
    root.classList.remove("theme-no-anim");
    root.style.setProperty("--sea", String(target));
    applyState(name);
    if (changed) {
      hideHint();
      rememberHintSeen();
    }
  }

  syncPrawn();

  try {
    if (sessionStorage.getItem("sushimo:hint-seen") === "1") hideHint();
  } catch (_) {}

  window.__sushimo = { setTheme, setProgress, applyState };
})();
