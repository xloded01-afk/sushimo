(() => {
  // Доли ширины сцены; вагончик-сегмент — 60 единиц при высоте сцены 800
  const TAIL_F = 0.234375; // хвост — неподвижная часть (150/800 × 1.25)
  const TILE_F = 0.09375; // один вагончик-сегмент (60/800 × 1.25)
  const HEAD_F = 0.4375; // голова — подвижная часть (280/800 × 1.25)
  const HEAD_REST_F = TAIL_F + TILE_F;

  function clamp(n, min, max) {
    return n < min ? min : n > max ? max : n;
  }

  function clamp01(n) {
    return clamp(n, 0, 1);
  }

  function initDrag(el) {
    const scene = el.querySelector(".prawn-scene");
    const headEl = el.querySelector(".prawn-head");
    const bodyEl = el.querySelector(".prawn-body");

    let dragging = false;
    let startX = 0;
    let grabDelta = 0;
    let delta = 0;
    let deltaMax = 0;
    let sceneW = 0;

    function measure() {
      sceneW = scene.clientWidth;
      const sceneRect = scene.getBoundingClientRect();
      const headRestLeft = sceneRect.left + HEAD_REST_F * sceneW;
      const headW = HEAD_F * sceneW;
      // голова может доехать до правого края страницы
      deltaMax = Math.max(0, window.innerWidth - headRestLeft - headW);
    }

    function setDelta(d) {
      delta = clamp(d, 0, deltaMax);
      headEl.style.transform = "translateX(" + delta + "px)";
      bodyEl.style.width = (TILE_F * sceneW + delta) + "px";
    }

    function evaluate() {
      const p = deltaMax > 0 ? clamp01(delta / deltaMax) : 0;
      window.__sushimo.setProgress(p, { instant: true });
    }

    function finalize() {
      dragging = false;
      document.documentElement.classList.remove("theme-no-anim");
    }

    headEl.addEventListener("pointerdown", (e) => {
      dragging = true;
      startX = e.clientX;
      grabDelta = delta;
      headEl.style.transition = "";
      bodyEl.style.transition = "";
      measure();
      try {
        headEl.setPointerCapture(e.pointerId);
      } catch (_) {
        /* синтетические события без активного указателя */
      }
    });

    headEl.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      setDelta(grabDelta + (e.clientX - startX));
      evaluate();
    });

    headEl.addEventListener("pointerup", finalize);
    headEl.addEventListener("pointercancel", finalize);

    function glideTo(target) {
      const p = clamp01(target);
      measure();
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setDelta(p * deltaMax);
        window.__sushimo.setProgress(p, { instant: true });
        return;
      }
      headEl.style.transition = "transform 600ms ease";
      bodyEl.style.transition = "width 600ms ease";
      setDelta(p * deltaMax);
      window.__sushimo.setProgress(p);
      setTimeout(() => {
        headEl.style.transition = "";
        bodyEl.style.transition = "";
      }, 620);
    }

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
