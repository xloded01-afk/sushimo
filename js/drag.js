(() => {
  function clamp(n, min, max) {
    return n < min ? min : n > max ? max : n;
  }

  function initDrag(el, opts) {
    const options = opts || {};
    const onCross = options.onCross || (() => {});
    const onReturn = options.onReturn || (() => {});

    let dragging = false;
    let startX = 0;
    let startLeft = 0;
    let crossed = false;

    function thresholdPx() {
      return options.threshold != null ? options.threshold : 0.66 * window.innerWidth;
    }

    function apply(left) {
      el.style.transform = "translateX(" + (left - startLeft) + "px)";
    }

    function evaluate(left) {
      const center = left + el.getBoundingClientRect().width / 2;
      if (center >= thresholdPx()) {
        if (!crossed) {
          crossed = true;
          onCross();
        }
      } else if (crossed) {
        crossed = false;
        onReturn();
      }
    }

    function finalize() {
      dragging = false;
      if (!crossed) {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          apply(startLeft);
          return;
        }
        el.style.transition = "transform 240ms ease";
        apply(startLeft);
        setTimeout(() => {
          el.style.transition = "";
        }, 260);
      }
    }

    el.addEventListener("pointerdown", (e) => {
      dragging = true;
      crossed = false;
      startX = e.clientX;
      startLeft = el.getBoundingClientRect().left;
      apply(startLeft);
      try {
        el.setPointerCapture(e.pointerId);
      } catch (_) {
        /* синтетические события без активного указателя */
      }
    });

    el.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const left = clamp(startLeft + (e.clientX - startX), 0, window.innerWidth);
      apply(left);
      evaluate(left);
    });

    el.addEventListener("pointerup", finalize);
    el.addEventListener("pointercancel", finalize);

    el.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (!crossed) {
          crossed = true;
          onCross();
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (crossed) {
          crossed = false;
          onReturn();
        }
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        crossed = !crossed;
        if (crossed) {
          onCross();
        } else {
          onReturn();
        }
      }
    });
  }

  window.__sushimo = window.__sushimo || {};
  window.__sushimo.initDrag = initDrag;

  function boot() {
    const el = document.getElementById("prawn");
    if (!el) return;
    initDrag(el, {
      onCross: () => window.__sushimo.setTheme("sea"),
      onReturn: () => window.__sushimo.setTheme("asian"),
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
