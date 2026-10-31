(() => {
  function clamp(n, min, max) {
    return n < min ? min : n > max ? max : n;
  }

  function clamp01(n) {
    return clamp(n, 0, 1);
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
      el.style.transform = "translateX(" + (left - homeLeft) + "px)";
    }

    function measure() {
      homeLeft = el.offsetLeft;
      const w = el.offsetWidth;
      maxLeft = Math.max(0, window.innerWidth - w);
      homeCenter = homeLeft + w / 2;
    }

    function evaluate(left) {
      const center = left + el.offsetWidth / 2;
      const maxCenter = maxLeft + el.offsetWidth / 2;
      const span = Math.max(1, maxCenter - homeCenter);
      progress = clamp01((center - homeCenter) / span);
      window.__sushimo.setProgress(progress, { instant: true });
    }

    function leftForProgress(p) {
      return homeLeft + p * (maxLeft - homeLeft);
    }

    function glideTo(target) {
      const p = clamp01(target);
      measure();
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        window.__sushimo.setProgress(p, { instant: true });
        apply(leftForProgress(p));
        return;
      }
      el.style.transition = "transform 600ms ease";
      apply(leftForProgress(p));
      window.__sushimo.setProgress(p);
      setTimeout(() => {
        el.style.transition = "";
      }, 620);
    }

    function finalize() {
      dragging = false;
      document.documentElement.classList.remove("theme-no-anim");
    }

    el.addEventListener("pointerdown", (e) => {
      dragging = true;
      startX = e.clientX;
      el.style.transition = "";
      measure();
      maxLeft = Math.max(0, window.innerWidth - el.offsetWidth);
      startLeft = el.getBoundingClientRect().left;
      const maxCenter = maxLeft + el.offsetWidth / 2;
      progress = clamp01((startLeft + el.offsetWidth / 2 - homeCenter) / Math.max(1, maxCenter - homeCenter));
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
        const now = document.documentElement.dataset.theme === "sea";
        window.__sushimo.setTheme(now ? "asian" : "sea");
      }
    });

    return { glideTo };
  }

  window.__sushimo = window.__sushimo || {};

  function boot() {
    const el = document.getElementById("prawn");
    if (!el) return;
    const api = initDrag(el);
    window.__sushimo.initDrag = initDrag;
    window.__sushimo.glideTo = api.glideTo;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
