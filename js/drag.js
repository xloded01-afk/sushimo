(() => {
  // Геометрия креветки: доли ширины сцены и доли её высоты для силуэта тела
  const TAIL_F = 0.234375; // хвост — неподвижная часть (150/800 × 1.25)
  const HEAD_F = 0.4375; // голова — подвижная часть (280/800 × 1.25)
  const PITCH_F = 0.105; // ширина одного вагончика
  const HEAD_REST_F = TAIL_F + PITCH_F;

  // Силуэт тела: верх и низ брюшка в долях высоты сцены
  const TOP_TAIL = 0.42;
  const BOT_TAIL = 0.62;
  const TOP_HEAD = 0.35;
  const BOT_HEAD = 0.63;
  const ARCH = 0.045; // спина выгибается вверх в средней части
  const BELLY = 0.018; // брюшко слегка провисает

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

    function renderWagons() {
      const bodyW = PITCH_F * sceneW + delta;
      const pitch = PITCH_F * sceneW;
      const n = Math.max(1, Math.round(bodyW / pitch));
      const w = bodyW / n;
      const H = scene.clientHeight;
      const ext = deltaMax > 0 ? clamp01(delta / deltaMax) : 0;

      bodyEl.style.left = TAIL_F * sceneW + "px";
      bodyEl.style.width = bodyW + "px";

      // силуэт: в покое тело просто сужается к хвосту, при вытягивании спина выгибается дугой
      const topTail = TOP_TAIL * H;
      const botTail = BOT_TAIL * H;
      const topHead = TOP_HEAD * H;
      const botHead = BOT_HEAD * H;
      const arch = ARCH * ext * H;
      const belly = BELLY * ext * H;
      const shapeSvg = bodyEl.querySelector(".prawn-shape");
      const paths = shapeSvg.querySelectorAll("path");
      shapeSvg.setAttribute("viewBox", "0 0 " + bodyW + " " + H);
      paths[0].setAttribute(
        "d",
        "M 0 " + topTail +
        " C " + bodyW * 0.25 + " " + (topTail - arch * 0.7) + ", " + bodyW * 0.6 + " " + (topHead - arch) + ", " + bodyW + " " + topHead +
        " L " + bodyW + " " + botHead +
        " C " + bodyW * 0.6 + " " + (botHead + belly) + ", " + bodyW * 0.25 + " " + (botTail + belly * 0.5) + ", 0 " + botTail + " Z"
      );
      paths[1].setAttribute(
        "d",
        "M 2 " + (topTail - 5) +
        " C " + bodyW * 0.25 + " " + (topTail - arch * 0.7 - 5) + ", " + bodyW * 0.6 + " " + (topHead - arch - 5) + ", " + (bodyW - 2) + " " + (topHead - 5)
      );

      // пересобираем стыки и плавники только когда меняется число вагончиков
      if (Number(bodyEl.dataset.n || 0) !== n) {
        while (bodyEl.childElementCount > 1) bodyEl.lastElementChild.remove();
        for (let i = 1; i < n; i++) {
          const joint = document.createElement("div");
          joint.className = "prawn-joint";
          bodyEl.appendChild(joint);
        }
        for (let i = 0; i < n; i++) {
          const fin = document.createElement("div");
          fin.className = "prawn-fin";
          bodyEl.appendChild(fin);
        }
        bodyEl.dataset.n = n;
      }

      const joints = bodyEl.querySelectorAll(".prawn-joint");
      const fins = bodyEl.querySelectorAll(".prawn-fin");

      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0.5 : (i + 0.5) / n;
        const bulge = Math.sin(Math.PI * t) * ext;
        const top = (TOP_TAIL + (TOP_HEAD - TOP_TAIL) * t - ARCH * bulge) * H;
        const bottom = (BOT_TAIL + (BOT_HEAD - BOT_TAIL) * t + BELLY * bulge) * H;

        if (i > 0) {
          const joint = joints[i - 1];
          joint.style.left = i * w + "px";
          joint.style.top = top + H * 0.06 + "px";
          joint.style.height = bottom - top - H * 0.12 + "px";
        }
        const fin = fins[i];
        fin.style.left = i * w + w * 0.28 + "px";
        fin.style.width = Math.max(6, w * 0.42) + "px";
        fin.style.top = bottom + "px";
        fin.style.height = Math.max(8, H * 0.022) + "px";
      }
    }

    function setDelta(d) {
      delta = clamp(d, 0, deltaMax);
      headEl.style.transform = "translateX(" + delta + "px)";
      renderWagons();
    }

    function evaluate() {
      const p = deltaMax > 0 ? clamp01(delta / deltaMax) : 0;
      window.__sushimo.setProgress(p, { instant: true });
    }

    function finalize() {
      dragging = false;
      scene.classList.remove("no-anim");
      document.documentElement.classList.remove("theme-no-anim");
    }

    headEl.addEventListener("pointerdown", (e) => {
      dragging = true;
      startX = e.clientX;
      grabDelta = delta;
      headEl.style.transition = "";
      scene.classList.add("no-anim");
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
        scene.classList.add("no-anim");
        setDelta(p * deltaMax);
        window.__sushimo.setProgress(p, { instant: true });
        scene.classList.remove("no-anim");
        return;
      }
      headEl.style.transition = "transform 600ms ease";
      setDelta(p * deltaMax);
      window.__sushimo.setProgress(p);
      setTimeout(() => {
        headEl.style.transition = "";
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

    window.addEventListener("resize", () => {
      measure();
      renderWagons();
    });

    measure();
    renderWagons();

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
