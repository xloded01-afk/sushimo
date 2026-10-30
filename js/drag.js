(() => {
  function clamp(n, min, max) {
    return n < min ? min : n > max ? max : n;
  }

  function initDrag(el) {
    let dragging = false;
    let startX = 0;
    let startLeft = 0;
    let homeLeft = 0;
    let homeCenter = 0;
    let maxLeft = 0;
    let progress = 0;

    function apply(left) {
      el.style.transform = "translateX(" + (left - startLeft) + "px)";
    }

    function evaluate(left) {
      const center = left + el.offsetWidth / 2;
      const maxCenter = maxLeft + el.offsetWidth / 2;
      const span = Math.max(1, maxCenter - homeCenter);
      progress = clamp((center - homeCenter) / span, 0, 1);
      window.__sushimo.setProgress(progress, { instant: true });
    }

    function finalize() {
      dragging = false;
      const crossed = progress >= 0.5;
      if (!crossed) {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          apply(homeLeft);
        } else {
          el.style.transition = "transform 240ms ease";
          apply(homeLeft);
          setTimeout(() => {
            el.style.transition = "";
          }, 260);
        }
      }
      window.__sushimo.setTheme(crossed ? "sea" : "asian");
    }

    el.addEventListener("pointerdown", (e) => {
      dragging = true;
      progress = 0;
      startX = e.clientX;
      startLeft = el.getBoundingClientRect().left;
      homeLeft = el.offsetLeft;
      homeCenter = homeLeft + el.offsetWidth / 2;
      maxLeft = Math.max(0, window.innerWidth - el.offsetWidth);
      try {
        el.setPointerCapture(e.pointerId);
      } catch (_) {
        /* синтетические события без активного указателя */
      }
    });

    el.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const left = clamp(startLeft + (e.clientX - startX), 0, maxLeft);
      apply(left);
      evaluate(left);
    });

    el.addEventListener("pointerup", finalize);
    el.addEventListener("pointercancel", finalize);

    el.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        window.__sushimo.setTheme("sea");
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        window.__sushimo.setTheme("asian");
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        window.__sushimo.setTheme(root.dataset.theme === "sea" ? "asian" : "sea");
      }
    });
  }

  window.__sushimo = window.__sushimo || {};
  window.__sushimo.initDrag = initDrag;

  function boot() {
    const el = document.getElementById("prawn");
    if (!el) return;
    initDrag(el);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
