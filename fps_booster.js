(() => {
  if (window.__BLOXD_FPS_BOOSTER_V31__) return;
  window.__BLOXD_FPS_BOOSTER_V31__ = true;

  const P = "bfps-";
  const STORE_KEY = "bloxdFpsBoosterV31";
  const NATIVE_DPR = window.devicePixelRatio || 1;

  const DEF = {
    enabled: false,
    preset: "off",
    resScale: 1.0,
    noAA: true,
    noBlur: true,
    noAnim: false,
    hideAds: false,
    showPill: true,
    pos: null
  };

  function loadCfg() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return { ...DEF };
      return Object.assign({}, DEF, JSON.parse(raw));
    } catch {
      return { ...DEF };
    }
  }

  let cfg = loadCfg();
  let needsReload = false;

  function saveCfg() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(cfg));
    } catch {}
  }

  // 1) Hook devicePixelRatio at document_start for real WebGL resolution scaling
  try {
    Object.defineProperty(window, "devicePixelRatio", {
      configurable: true,
      get() {
        if (!cfg.enabled) return NATIVE_DPR;
        return Math.max(0.45, Number((NATIVE_DPR * (cfg.resScale || 1)).toFixed(2)));
      }
    });
  } catch {}

  // 2) Hook WebGL context creation to disable antialiasing & request high-performance GPU
  try {
    const origGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, attrs) {
      if (cfg.enabled && cfg.noAA && (type === "webgl" || type === "webgl2" || type === "experimental-webgl")) {
        const nextAttrs = Object.assign({}, attrs || {}, {
          antialias: false,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false
        });
        return origGetContext.call(this, type, nextAttrs);
      }
      return origGetContext.call(this, type, attrs);
    };
  } catch {}

  function applyDomOptimizations() {
    let st = document.getElementById(P + "opt-css");
    if (!st) {
      st = document.createElement("style");
      st.id = P + "opt-css";
      (document.head || document.documentElement).appendChild(st);
    }

    if (!cfg.enabled) {
      st.textContent = "";
      return;
    }

    let css = "";
    if (cfg.noBlur) {
      css += `
        *:not(#${P}pill):not(#${P}panel):not(#${P}panel *) {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          box-shadow: none !important;
          text-shadow: none !important;
        }
      `;
    }
    if (cfg.noAnim) {
      css += `
        *:not(#${P}pill):not(#${P}panel):not(#${P}panel *):not(canvas) {
          animation-duration: 0.001ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.001ms !important;
        }
      `;
    }
    if (cfg.hideAds) {
      css += `
        [id*="ad-" i]:not([id^="bfps"]),
        [class*="AdBanner" i],
        [class*="RemoveAds" i],
        [class*="ad-container" i],
        iframe[src*="doubleclick"],
        iframe[src*="googlesyndication"],
        ins.adsbygoogle {
          display: none !important;
        }
      `;
    }
    st.textContent = css;
  }

  function triggerResize() {
    try {
      window.dispatchEvent(new Event("resize"));
    } catch {}
  }

  function applyPreset(name) {
    cfg.preset = name;
    if (name === "off") {
      cfg.enabled = false;
      cfg.resScale = 1.0;
      cfg.noAA = false;
      cfg.noBlur = false;
      cfg.noAnim = false;
      cfg.hideAds = false;
    } else if (name === "balanced") {
      cfg.enabled = true;
      cfg.resScale = 0.85;
      cfg.noAA = true;
      cfg.noBlur = true;
      cfg.noAnim = false;
      cfg.hideAds = false;
    } else if (name === "ultra") {
      cfg.enabled = true;
      cfg.resScale = 0.6;
      cfg.noAA = true;
      cfg.noBlur = true;
      cfg.noAnim = true;
      cfg.hideAds = true;
    }
    needsReload = true;
    saveCfg();
    applyDomOptimizations();
    triggerResize();
    renderPanel();
  }

  function ensureBaseCss() {
    if (document.getElementById(P + "base-css")) return;
    const st = document.createElement("style");
    st.id = P + "base-css";
    st.textContent = `
      #${P}pill, #${P}panel {
        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif !important;
        box-sizing: border-box !important;
      }
      #${P}panel * { box-sizing: border-box !important; }

      #${P}pill {
        position: fixed; top: 10px; right: 14px; z-index: 2147483640;
        display: flex; align-items: center; gap: 6px;
        background: rgba(15, 17, 23, 0.9); color: #f8fafc;
        border: 1.5px solid #334155; border-radius: 9px;
        padding: 5px 10px; font-size: 12.5px; font-weight: 800;
        cursor: grab; user-select: none; touch-action: none;
        box-shadow: 0 4px 14px rgba(0,0,0,0.35);
        transition: border-color .15s, background .15s;
      }
      #${P}pill:hover { border-color: #38bdf8; background: rgba(22, 26, 36, 0.96); }
      #${P}pill.on { border-color: #22c55e; }
      #${P}pill.drag { cursor: grabbing; }
      #${P}pill .dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; flex-shrink: 0; }
      #${P}pill .ms { font-size: 10.5px; color: #94a3b8; font-weight: 600; }

      #${P}panel {
        position: fixed; top: 54px; right: 14px; z-index: 2147483644;
        width: min(330px, 92vw); display: none; flex-direction: column;
        background: #12151d; color: #f1f5f9;
        border: 1.5px solid #2e3748; border-radius: 12px;
        box-shadow: 0 16px 40px rgba(0,0,0,0.55); overflow: hidden;
      }
      #${P}panel.open { display: flex; }

      .${P}hdr {
        display: flex; align-items: center; justify-content: space-between;
        padding: 10px 13px; background: #191e2a; border-bottom: 1px solid #2a3242;
        cursor: move; user-select: none;
      }
      .${P}hdr b { font-size: 13.5px; display: flex; align-items: center; gap: 6px; }
      .${P}x {
        background: transparent; color: #94a3b8; border: 0; border-radius: 6px;
        padding: 2px 8px; font-size: 13px; font-weight: 800; cursor: pointer;
      }
      .${P}x:hover { background: #7f1d1d; color: #fff; }

      .${P}body { padding: 12px; display: flex; flex-direction: column; gap: 9px; max-height: 78vh; overflow-y: auto; }
      .${P}stats {
        display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;
      }
      .${P}sbox {
        background: #191e2a; border: 1px solid #2a3242; border-radius: 8px;
        padding: 7px 6px; text-align: center;
      }
      .${P}sbox span { display: block; font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase; }
      .${P}sbox b { font-size: 15px; font-family: Consolas, monospace; color: #f8fafc; }

      .${P}lbl { font-size: 10.5px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: .4px; }
      .${P}presets { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
      .${P}pbtn {
        background: #191e2a; color: #cbd5e1; border: 1px solid #334155;
        border-radius: 8px; padding: 7px 4px; font-size: 11.5px; font-weight: 800; cursor: pointer;
      }
      .${P}pbtn:hover { border-color: #64748b; color: #fff; }
      .${P}pbtn.on { background: #22c55e; color: #052e16; border-color: #22c55e; }
      .${P}pbtn.off.on { background: #475569; color: #fff; border-color: #64748b; }

      .${P}row {
        display: flex; align-items: center; justify-content: space-between; gap: 8px;
        background: #191e2a; border: 1px solid #2a3242; border-radius: 8px;
        padding: 7px 10px; font-size: 12px; font-weight: 600;
      }
      #${P}panel input[type="checkbox"] {
        appearance: none; -webkit-appearance: none; flex-shrink: 0;
        width: 34px; height: 19px; border-radius: 999px; position: relative;
        background: #334155; border: 0; cursor: pointer;
      }
      #${P}panel input[type="checkbox"]::after {
        content: ""; position: absolute; top: 2.5px; left: 2.5px;
        width: 14px; height: 14px; border-radius: 50%; background: #fff; transition: transform .15s;
      }
      #${P}panel input[type="checkbox"]:checked { background: #22c55e; }
      #${P}panel input[type="checkbox"]:checked::after { transform: translateX(15px); }

      .${P}sel {
        background: #0f131b; color: #f8fafc; border: 1px solid #334155;
        border-radius: 6px; padding: 4px 6px; font-size: 11.5px; font-weight: 700; outline: none;
      }
      .${P}btn {
        background: #2563eb; color: #fff; border: 0; border-radius: 8px;
        padding: 8px 10px; font-size: 12px; font-weight: 800; cursor: pointer; width: 100%;
      }
      .${P}btn:hover { background: #1d4ed8; }
      .${P}note { font-size: 11px; color: #94a3b8; line-height: 1.35; }
      .${P}warn {
        background: rgba(234, 179, 8, 0.14); border: 1px solid #ca8a04; color: #fde047;
        border-radius: 8px; padding: 7px 9px; font-size: 11px; font-weight: 600;
        display: flex; align-items: center; justify-content: space-between; gap: 6px;
      }
      .${P}warn button {
        background: #eab308; color: #111; border: 0; border-radius: 6px;
        padding: 4px 8px; font-size: 11px; font-weight: 800; cursor: pointer; flex-shrink: 0;
      }
    `;
    (document.head || document.documentElement).appendChild(st);
  }

  let curFps = 0, curMs = 0, minFps = 999, maxFps = 0;

  function applyPillPos() {
    const pill = document.getElementById(P + "pill");
    if (!pill) return;
    pill.style.display = cfg.showPill ? "flex" : "none";
    pill.classList.toggle("on", Boolean(cfg.enabled));
    if (cfg.pos && typeof cfg.pos.x === "number") {
      pill.style.right = "auto";
      pill.style.left = Math.max(6, Math.min(window.innerWidth - 110, cfg.pos.x)) + "px";
      pill.style.top = Math.max(6, Math.min(window.innerHeight - 36, cfg.pos.y)) + "px";
    }
  }

  function renderPanel() {
    const panel = document.getElementById(P + "panel");
    if (!panel) return;
    applyPillPos();

    const body = panel.querySelector("." + P + "body");
    body.innerHTML = `
      <div class="${P}stats">
        <div class="${P}sbox"><span>FPS</span><b id="${P}st-fps">${curFps || "--"}</b></div>
        <div class="${P}sbox"><span>Frame</span><b id="${P}st-ms">${curMs ? curMs + "ms" : "--"}</b></div>
        <div class="${P}sbox"><span>Min / Max</span><b id="${P}st-mm">${minFps < 999 ? minFps + "/" + maxFps : "--"}</b></div>
      </div>

      ${needsReload ? `<div class="${P}warn"><span>Recarga Bloxd para aplicar cambios WebGL al 100%.</span><button type="button" id="${P}rld">Recargar</button></div>` : ""}

      <div class="${P}lbl">Presets rápidos</div>
      <div class="${P}presets">
        <button type="button" class="${P}pbtn off${!cfg.enabled ? " on" : ""}" data-pr="off">Off</button>
        <button type="button" class="${P}pbtn${cfg.enabled && cfg.preset === "balanced" ? " on" : ""}" data-pr="balanced">Balanced</button>
        <button type="button" class="${P}pbtn${cfg.enabled && cfg.preset === "ultra" ? " on" : ""}" data-pr="ultra">Ultra</button>
      </div>

      <div class="${P}lbl">Ajustes del FPS Booster</div>
      <label class="${P}row">
        <span>Activar FPS Booster</span>
        <input type="checkbox" id="${P}en"${cfg.enabled ? " checked" : ""}>
      </label>
      <div class="${P}row">
        <span>Escala 3D (Resolución)</span>
        <select class="${P}sel" id="${P}res">
          <option value="1"${cfg.resScale === 1 ? " selected" : ""}>100% (Nativa)</option>
          <option value="0.85"${cfg.resScale === 0.85 ? " selected" : ""}>85% (Balanceado)</option>
          <option value="0.75"${cfg.resScale === 0.75 ? " selected" : ""}>75% (Alto FPS)</option>
          <option value="0.6"${cfg.resScale === 0.6 ? " selected" : ""}>60% (Modo Papa)</option>
        </select>
      </div>
      <label class="${P}row">
        <span>Desactivar Antialiasing + GPU Alta</span>
        <input type="checkbox" id="${P}aa"${cfg.noAA ? " checked" : ""}>
      </label>
      <label class="${P}row">
        <span>Quitar Blur y Sombras de UI</span>
        <input type="checkbox" id="${P}bl"${cfg.noBlur ? " checked" : ""}>
      </label>
      <label class="${P}row">
        <span>Desactivar animaciones de menú</span>
        <input type="checkbox" id="${P}an"${cfg.noAnim ? " checked" : ""}>
      </label>
      <label class="${P}row">
        <span>Ocultar bloques de anuncios</span>
        <input type="checkbox" id="${P}ad"${cfg.hideAds ? " checked" : ""}>
      </label>
      <label class="${P}row">
        <span>Mostrar contador flotante FPS</span>
        <input type="checkbox" id="${P}pl"${cfg.showPill ? " checked" : ""}>
      </label>
      <div class="${P}note">Atajos: <b>Alt + F</b> abrir/cerrar panel • <b>Alt + Shift + F</b> ocultar contador.</div>
    `;

    const rld = body.querySelector("#" + P + "rld");
    if (rld) rld.onclick = () => location.reload();

    body.querySelectorAll("[data-pr]").forEach((b) => {
      b.onclick = () => applyPreset(b.getAttribute("data-pr"));
    });

    body.querySelector("#" + P + "en").onchange = (e) => {
      cfg.enabled = e.target.checked;
      cfg.preset = cfg.enabled ? "custom" : "off";
      needsReload = true;
      saveCfg(); applyDomOptimizations(); triggerResize(); renderPanel();
    };
    body.querySelector("#" + P + "res").onchange = (e) => {
      cfg.resScale = parseFloat(e.target.value) || 1;
      cfg.enabled = true;
      cfg.preset = "custom";
      needsReload = true;
      saveCfg(); applyDomOptimizations(); triggerResize(); renderPanel();
    };
    body.querySelector("#" + P + "aa").onchange = (e) => {
      cfg.noAA = e.target.checked; needsReload = true; saveCfg(); renderPanel();
    };
    body.querySelector("#" + P + "bl").onchange = (e) => {
      cfg.noBlur = e.target.checked; saveCfg(); applyDomOptimizations();
    };
    body.querySelector("#" + P + "an").onchange = (e) => {
      cfg.noAnim = e.target.checked; saveCfg(); applyDomOptimizations();
    };
    body.querySelector("#" + P + "ad").onchange = (e) => {
      cfg.hideAds = e.target.checked; saveCfg(); applyDomOptimizations();
    };
    body.querySelector("#" + P + "pl").onchange = (e) => {
      cfg.showPill = e.target.checked; saveCfg(); applyPillPos();
    };
  }

  function mountUi() {
    if (!document.body || document.getElementById(P + "pill")) return;
    ensureBaseCss();
    applyDomOptimizations();

    const boltSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="#facc15"><polygon points="13,2 4,14 11,14 10,22 20,10 13,10"/></svg>`;

    const pill = document.createElement("div");
    pill.id = P + "pill";
    pill.title = "Arrastra para mover | Clic para abrir FPS Booster (Alt+F)";
    pill.innerHTML = `<span class="dot" id="${P}dot"></span>${boltSvg}<span id="${P}fps">-- FPS</span><span class="ms" id="${P}ms"></span>`;
    document.body.appendChild(pill);

    const panel = document.createElement("div");
    panel.id = P + "panel";
    panel.innerHTML = `
      <div class="${P}hdr">
        <b>${boltSvg}<span>Bloxd FPS Booster v3.1</span></b>
        <button type="button" class="${P}x" id="${P}close">X</button>
      </div>
      <div class="${P}body"></div>
    `;
    document.body.appendChild(panel);

    panel.querySelector("#" + P + "close").onclick = () => panel.classList.remove("open");

    // Draggable pill
    let dn = false, mv = false, sup = false, sx = 0, sy = 0, ol = 0, ot = 0;
    pill.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      dn = true; mv = false;
      const r = pill.getBoundingClientRect();
      sx = e.clientX; sy = e.clientY; ol = r.left; ot = r.top;
      try { pill.setPointerCapture(e.pointerId); } catch {}
    });
    pill.addEventListener("pointermove", (e) => {
      if (!dn) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!mv && Math.hypot(dx, dy) > 5) { mv = true; pill.classList.add("drag"); }
      if (!mv) return;
      pill.style.right = "auto";
      pill.style.left = Math.max(6, Math.min(window.innerWidth - pill.offsetWidth - 6, ol + dx)) + "px";
      pill.style.top = Math.max(6, Math.min(window.innerHeight - pill.offsetHeight - 6, ot + dy)) + "px";
    });
    const endDrag = () => {
      if (!dn) return;
      dn = false; pill.classList.remove("drag");
      if (mv) {
        sup = true; setTimeout(() => { sup = false; }, 120);
        cfg.pos = { x: Math.round(parseFloat(pill.style.left) || 14), y: Math.round(parseFloat(pill.style.top) || 10) };
        saveCfg();
      }
    };
    pill.addEventListener("pointerup", endDrag);
    pill.addEventListener("pointercancel", endDrag);
    pill.onclick = () => {
      if (sup) return;
      panel.classList.toggle("open");
      if (panel.classList.contains("open")) renderPanel();
    };

    // Draggable panel header
    let pdn = false, pox = 0, poy = 0;
    const hdr = panel.querySelector("." + P + "hdr");
    hdr.addEventListener("mousedown", (e) => {
      if (e.target.closest("button")) return;
      pdn = true;
      const r = panel.getBoundingClientRect();
      pox = e.clientX - r.left; poy = e.clientY - r.top;
      panel.style.right = "auto";
      panel.style.left = r.left + "px"; panel.style.top = r.top + "px";
      e.preventDefault();
    });
    window.addEventListener("mousemove", (e) => {
      if (!pdn) return;
      panel.style.left = Math.max(6, Math.min(window.innerWidth - 100, e.clientX - pox)) + "px";
      panel.style.top = Math.max(6, Math.min(window.innerHeight - 40, e.clientY - poy)) + "px";
    });
    window.addEventListener("mouseup", () => { pdn = false; });

    // Hotkeys (safe while chatting)
    window.addEventListener("keydown", (e) => {
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.altKey && e.shiftKey && e.code === "KeyF") {
        e.preventDefault();
        cfg.showPill = !cfg.showPill;
        saveCfg(); applyPillPos();
        if (panel.classList.contains("open")) renderPanel();
      } else if (e.altKey && !e.shiftKey && e.code === "KeyF") {
        e.preventDefault();
        panel.classList.toggle("open");
        if (panel.classList.contains("open")) renderPanel();
      }
    }, true);

    applyPillPos();
    window.addEventListener("resize", applyPillPos);

    // Live FPS meter loop
    let frames = 0, lastT = performance.now();
    const tick = (now) => {
      frames++;
      const dt = now - lastT;
      if (dt >= 500) {
        curFps = Math.round((frames * 1000) / dt);
        curMs = Number((dt / frames).toFixed(1));
        if (curFps > 0 && curFps < minFps) minFps = curFps;
        if (curFps > maxFps) maxFps = curFps;
        frames = 0;
        lastT = now;

        const color = curFps >= 55 ? "#22c55e" : (curFps >= 30 ? "#facc15" : "#ef4444");
        const fEl = document.getElementById(P + "fps");
        const mEl = document.getElementById(P + "ms");
        const dEl = document.getElementById(P + "dot");
        if (fEl) fEl.textContent = curFps + " FPS";
        if (mEl) mEl.textContent = curMs + "ms";
        if (dEl) dEl.style.background = color;

        if (panel.classList.contains("open")) {
          const sf = document.getElementById(P + "st-fps");
          const sm = document.getElementById(P + "st-ms");
          const smm = document.getElementById(P + "st-mm");
          if (sf) { sf.textContent = String(curFps); sf.style.color = color; }
          if (sm) sm.textContent = curMs + "ms";
          if (smm) smm.textContent = minFps + "/" + maxFps;
        }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountUi, { once: true });
  } else {
    mountUi();
  }
})();