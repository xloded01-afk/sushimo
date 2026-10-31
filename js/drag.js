(() => {
  // Доли ширины сцены (внутренней области карточки); рисунок занимает 640 условных единиц
  const TAIL_F = 140 / 640; // хвост — неподвижная часть
  const BODY_F = 235 / 640; // тело — проявляется между хвостом и головой
  const HEAD_F = 265 / 640; // голова — подвижная часть
  const BODY_REST = 0.2; // доля тела, видная в покое (сложенная)
  const STRETCH_MAX = 3.2; // предел растяжения тела
  const HEAD_REST_F = TAIL_F + BODY_REST * BODY_F;
  const DELTA_MAX_F = (STRETCH_MAX - BODY_REST) * BODY_F;

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
      deltaMax = DELTA_MAX_F * sceneW;
    }

    function setDelta(d) {
      delta = clamp(d, 0, deltaMax);
      headEl.style.transform = "translateX(" + delta + "px)";
      bodyEl.style.width = (BODY_REST * BODY_F * sceneW + delta) + "px";
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
