(() => {
  if (location.pathname.startsWith("/more_settings")) return;

  const DEF = window.BLOXD_V3_DEFAULTS || { hudSettings: {}, visualV3: {} };
  const HUD_STYLE_ID = "bloxd-v3-hud-css";
  const VISUAL_STYLE_ID = "bloxd-v3-visual-css";
  const CROSSHAIR_ID = "bloxd-v3-crosshair";
  const KEYS_ID = "bloxd-v3-keystrokes";
  const FPS_ID = "bloxd-v3-fps";
  const TIMER_ID = "bloxd-v3-timer";

  let hudCfg = { ...DEF.hudSettings };
  let visCfg = { ...DEF.visualV3 };

  let localBgBlobUrl = null;
  let customCrosshairUrl = null;

  // Estado de Keystrokes + CPS
  const pressedKeys = new Set();
  let lmbDown = false;
  let rmbDown = false;
  let lmbClicks = [];
  let rmbClicks = [];
  let cpsInterval = null;

  // Estado de FPS
  let fpsRaf = null;
  let fpsFrames = 0;
  let fpsLastTs = performance.now();
  let currentFps = 0;

  // Estado de Reloj / Cronómetro
  const sessionStart = Date.now();
  let swRunning = false;
  let swElapsedMs = 0;
  let swStartedAt = 0;
  let timerInterval = null;

  function ensureBaseHudStyles() {
    if (document.getElementById(HUD_STYLE_ID)) return;
    const st = document.createElement("style");
    st.id = HUD_STYLE_ID;
    st.textContent = `
      #${CROSSHAIR_ID} {
        position: fixed !important;
        left: 50% !important;
        top: 50% !important;
        transform: translate(-50%, -50%) !important;
        pointer-events: none !important;
        z-index: 2147483640 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      .bt-v3-widget {
        position: fixed !important;
        z-index: 2147483642 !important;
        font-family: "Segoe UI", system-ui, sans-serif !important;
        user-select: none !important;
        color: var(--bt-text, #ffffff) !important;
        cursor: grab;
      }
      .bt-v3-widget:active { cursor: grabbing; }
      .bt-v3-widget * { box-sizing: border-box !important; }
      .bt-ks-grid {
        display: flex !important;
        flex-direction: column !important;
        gap: 4px !important;
        width: 136px !important;
        padding: 5px !important;
        background: rgba(15, 20, 36, 0.55) !important;
        border: 1.5px solid color-mix(in srgb, var(--bt-accent, #38bdf8) 60%, transparent) !important;
        border-radius: 5px !important;
        backdrop-filter: blur(6px) !important;
      }
      .bt-ks-row {
        display: flex !important;
        justify-content: center !important;
        gap: 4px !important;
      }
      .bt-ks-key {
        flex: 1 !important;
        height: 32px !important;
        background: color-mix(in srgb, var(--bt-panel, #242c44) 85%, transparent) !important;
        border: 1.5px solid rgba(255,255,255,0.18) !important;
        border-radius: 3px !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 12px !important;
        font-weight: 800 !important;
        line-height: 1.05 !important;
        color: var(--bt-text, #ffffff) !important;
        transition: background 0.06s, transform 0.06s !important;
      }
      .bt-ks-key.w-key { flex: 0 0 40px !important; }
      .bt-ks-key.space-key { height: 22px !important; font-size: 10px !important; letter-spacing: 1px !important; }
      .bt-ks-key.mouse-key { height: 34px !important; font-size: 11px !important; }
      .bt-ks-cps { font-size: 9px !important; opacity: 0.85 !important; font-weight: 700 !important; }
      .bt-ks-key.active {
        background: var(--bt-accent, #38bdf8) !important;
        color: #0b1020 !important;
        border-color: #ffffff !important;
        transform: scale(0.95) !important;
      }
      .bt-v3-pill {
        background: rgba(15, 20, 36, 0.72) !important;
        border: 1.5px solid color-mix(in srgb, var(--bt-accent, #38bdf8) 70%, transparent) !important;
        border-radius: 4px !important;
        padding: 5px 10px !important;
        font-size: 12px !important;
        font-weight: 800 !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: 7px !important;
        backdrop-filter: blur(6px) !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
        white-space: nowrap !important;
      }
      .bt-v3-pill-dot {
        width: 7px !important;
        height: 7px !important;
        border-radius: 50% !important;
        background: var(--bt-accent, #38bdf8) !important;
        display: inline-block !important;
      }
      .bt-tm-btn {
        background: rgba(255,255,255,0.12) !important;
        border: 1px solid rgba(255,255,255,0.28) !important;
        color: #fff !important;
        font-size: 10px !important;
        font-weight: 800 !important;
        padding: 2px 6px !important;
        border-radius: 2px !important;
        cursor: pointer !important;
      }
      .bt-tm-btn:hover { background: var(--bt-accent, #38bdf8) !important; color: #0b1020 !important; }
    `;
    document.head.appendChild(st);
  }

  function clampPos(el, x, y) {
    const w = el.offsetWidth || 120;
    const h = el.offsetHeight || 40;
    const maxX = Math.max(8, window.innerWidth - w - 8);
    const maxY = Math.max(8, window.innerHeight - h - 8);
    return {
      left: Math.min(maxX, Math.max(8, Number(x) || 16)),
      top: Math.min(maxY, Math.max(8, Number(y) || 16))
    };
  }

  function makeHudDraggable(el, keyX, keyY) {
    let sx = 0, sy = 0, ol = 0, ot = 0, dragging = false, moved = false;

    el.addEventListener("mousedown", (e) => {
      if (e.button !== 0 || e.target.closest("button")) return;
      const rect = el.getBoundingClientRect();
      sx = e.clientX;
      sy = e.clientY;
      ol = rect.left;
      ot = rect.top;
      dragging = true;
      moved = false;
      e.preventDefault();
    });

    window.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
      const pos = clampPos(el, ol + dx, ot + dy);
      el.style.left = `${pos.left}px`;
      el.style.top = `${pos.top}px`;
    });

    window.addEventListener("mouseup", () => {
      if (!dragging) return;
      dragging = false;
      if (moved) {
        const rect = el.getBoundingClientRect();
        hudCfg[keyX] = Math.round(rect.left);
        hudCfg[keyY] = Math.round(rect.top);
        chrome.storage.local.set({ hudSettings: hudCfg });
      }
    });
  }

  // --- VISUALES 3.0 (FONDO/GIF LOCAL, CRISTAL, BORDES RGB, FUENTES, CURSOR) ---
  async function loadAssetBlob(key) {
    if (!window.BLOXD_V3_ASSETS_DB) return null;
    try {
      const rec = await window.BLOXD_V3_ASSETS_DB.get(key);
      return rec && rec.blob ? rec.blob : null;
    } catch {
      return null;
    }
  }

  async function refreshLocalBgAsset() {
    if (localBgBlobUrl) {
      URL.revokeObjectURL(localBgBlobUrl);
      localBgBlobUrl = null;
    }
    if (visCfg.localBgActive) {
      const blob = await loadAssetBlob("local_bg");
      if (blob) localBgBlobUrl = URL.createObjectURL(blob);
    }
    applyVisualsV3();
  }

  async function refreshCustomCrosshairAsset() {
    if (customCrosshairUrl) {
      URL.revokeObjectURL(customCrosshairUrl);
      customCrosshairUrl = null;
    }
    if (hudCfg.crosshairType === "custom_png") {
      const blob = await loadAssetBlob("custom_crosshair");
      if (blob) customCrosshairUrl = URL.createObjectURL(blob);
    }
    renderCrosshair();
  }

  function applyVisualsV3() {
    let style = document.getElementById(VISUAL_STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = VISUAL_STYLE_ID;
      document.head.appendChild(style);
    }

    const rules = [];

    // 1. Fondo o GIF subido desde PC
    if (visCfg.localBgActive && localBgBlobUrl) {
      const dim = Math.min(0.85, Math.max(0, (Number(visCfg.localBgDim) || 40) / 100));
      rules.push(`
        html, body, #root, [data-bt-zone="main"] {
          background: linear-gradient(rgba(0,0,0,${dim}), rgba(0,0,0,${dim})), url("${localBgBlobUrl}") center/cover fixed no-repeat !important;
        }
      `);
    }

    // 2. Efecto Cristal (Glassmorphism)
    if (visCfg.glassMode) {
      const op = Math.min(92, Math.max(25, Number(visCfg.glassOpacity) || 68));
      rules.push(`
        [data-bt-zone="sidebar"] {
          background-color: color-mix(in srgb, var(--bt-sidebar, #181d2c) ${op}%, transparent) !important;
          backdrop-filter: blur(12px) saturate(135%) !important;
          -webkit-backdrop-filter: blur(12px) saturate(135%) !important;
        }
        [data-bt-zone="panel"] {
          background-color: color-mix(in srgb, var(--bt-panel, #242c44) ${op}%, transparent) !important;
          backdrop-filter: blur(10px) saturate(130%) !important;
          -webkit-backdrop-filter: blur(10px) saturate(130%) !important;
        }
        #bloxd-ost-widget .bt-ost-card {
          background: rgba(24, 29, 44, ${Math.max(0.45, op / 100).toFixed(2)}) !important;
          backdrop-filter: blur(10px) !important;
        }
      `);
    }

    // 3. Bordes RGB animados
    if (visCfg.rgbBorders) {
      rules.push(`
        @keyframes bt-v3-rgb-border {
          0%   { border-color: #f87171; box-shadow: 0 0 10px rgba(248,113,113,0.45); }
          20%  { border-color: #facc15; box-shadow: 0 0 10px rgba(250,204,21,0.45); }
          40%  { border-color: #4ade80; box-shadow: 0 0 10px rgba(74,222,128,0.45); }
          60%  { border-color: #38bdf8; box-shadow: 0 0 10px rgba(56,189,248,0.45); }
          80%  { border-color: #c084fc; box-shadow: 0 0 10px rgba(192,132,252,0.45); }
          100% { border-color: #f87171; box-shadow: 0 0 10px rgba(248,113,113,0.45); }
        }
        [data-bt-zone="sidebar"],
        [data-bt-zone="panel"],
        #bloxd-ost-widget .bt-ost-card,
        .bt-ks-grid,
        .bt-v3-pill {
          animation: bt-v3-rgb-border 4s linear infinite !important;
        }
        [data-bt-zone="progress"] {
          background: linear-gradient(90deg, #f87171, #facc15, #4ade80, #38bdf8, #c084fc) !important;
        }
      `);
    }

    // 4. Tipografía personalizada
    const fontFamily = (window.BLOXD_V3_FONTS || {})[visCfg.fontStyle || "default"];
    if (fontFamily) {
      rules.push(`
        body, button, input, select, textarea, h1, h2, h3, p, span, a {
          font-family: ${fontFamily} !important;
        }
      `);
    }

    // 5. Cursor personalizado en menús
    const cursorVal = (window.BLOXD_V3_CURSORS || {})[visCfg.cursorStyle || "default"];
    if (cursorVal) {
      rules.push(`
        html, body, div, button, a, input, select {
          cursor: ${cursorVal} !important;
        }
      `);
    }

    // 6. Forma de partículas (complementa a content.js)
    const shape = visCfg.particleShape || "circle";
    if (shape === "blocks") {
      rules.push(`.bt-particle { border-radius: 1px !important; box-shadow: 0 0 4px rgba(0,0,0,0.4) !important; }`);
    } else if (shape === "stars") {
      rules.push(`.bt-particle { border-radius: 0 !important; clip-path: polygon(50% 0%, 63% 36%, 100% 38%, 70% 60%, 80% 98%, 50% 76%, 20% 98%, 30% 60%, 0% 38%, 37% 36%) !important; }`);
    } else if (shape === "rain") {
      rules.push(`.bt-particle { width: 2px !important; height: 14px !important; border-radius: 2px !important; opacity: 0.65 !important; }`);
    }

    style.textContent = rules.join("\n");
  }

  // --- MIRA PERSONALIZADA (CUSTOM CROSSHAIR) ---
  function renderCrosshair() {
    let el = document.getElementById(CROSSHAIR_ID);
    if (!hudCfg.crosshairEnabled) {
      if (el) el.remove();
      return;
    }

    ensureBaseHudStyles();
    if (!el) {
      el = document.createElement("div");
      el.id = CROSSHAIR_ID;
      el.setAttribute("data-bt-ignore", "1");
      document.body.appendChild(el);
    }

    const visibleNow = !hudCfg.crosshairOnlyInGame || !!document.pointerLockElement;
    el.style.visibility = visibleNow ? "visible" : "hidden";
    el.style.opacity = String(Math.min(1, Math.max(0.1, (Number(hudCfg.crosshairOpacity) || 100) / 100)));

    const size = Math.min(48, Math.max(4, Number(hudCfg.crosshairSize) || 14));
    const thick = Math.min(8, Math.max(1, Number(hudCfg.crosshairThickness) || 2));
    const gap = Math.min(20, Math.max(0, Number(hudCfg.crosshairGap) || 4));
    const color = hudCfg.crosshairColor || "#00f5d4";
    const outline = !!hudCfg.crosshairOutline;

    if (hudCfg.crosshairType === "custom_png" && customCrosshairUrl) {
      const box = size * 2 + 8;
      el.innerHTML = `<img src="${customCrosshairUrl}" style="width:${box}px;height:${box}px;object-fit:contain;display:block;pointer-events:none">`;
      return;
    }

    const dim = (size + gap + thick) * 2 + 10;
    const c = dim / 2;
    const strokeOut = outline ? `stroke="#000000" stroke-width="${thick + 2}"` : "";
    const parts = [];

    if (hudCfg.crosshairType === "cross" || hudCfg.crosshairType === "cross_dot") {
      const lines = [
        [c, c - gap - size, c, c - gap],
        [c, c + gap, c, c + gap + size],
        [c - gap - size, c, c - gap, c],
        [c + gap, c, c + gap + size, c]
      ];
      if (outline) {
        lines.forEach(([x1, y1, x2, y2]) => {
          parts.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${strokeOut} stroke-linecap="square"/>`);
        });
      }
      lines.forEach(([x1, y1, x2, y2]) => {
        parts.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${thick}" stroke-linecap="square"/>`);
      });
    }

    if (hudCfg.crosshairType === "circle") {
      if (outline) parts.push(`<circle cx="${c}" cy="${c}" r="${size}" fill="none" stroke="#000" stroke-width="${thick + 2}"/>`);
      parts.push(`<circle cx="${c}" cy="${c}" r="${size}" fill="none" stroke="${color}" stroke-width="${thick}"/>`);
      parts.push(`<circle cx="${c}" cy="${c}" r="${Math.max(1.5, thick / 1.5)}" fill="${color}"/>`);
    }

    if (hudCfg.crosshairType === "dot" || hudCfg.crosshairType === "cross_dot") {
      const r = Math.max(1.8, thick * 1.1);
      if (outline) parts.push(`<circle cx="${c}" cy="${c}" r="${r + 1.1}" fill="#000"/>`);
      parts.push(`<circle cx="${c}" cy="${c}" r="${r}" fill="${color}"/>`);
    }

    el.innerHTML = `<svg width="${dim}" height="${dim}" viewBox="0 0 ${dim} ${dim}" style="display:block;pointer-events:none">${parts.join("")}</svg>`;
  }

  // --- KEYSTROKES + CPS ---
  function updateKeystrokesVisual() {
    const root = document.getElementById(KEYS_ID);
    if (!root) return;
    const now = Date.now();
    lmbClicks = lmbClicks.filter((t) => now - t <= 1000);
    rmbClicks = rmbClicks.filter((t) => now - t <= 1000);

    const setAct = (sel, cond) => {
      const el = root.querySelector(sel);
      if (el) el.classList.toggle("active", cond);
    };
    setAct('[data-k="KeyW"]', pressedKeys.has("KeyW"));
    setAct('[data-k="KeyA"]', pressedKeys.has("KeyA"));
    setAct('[data-k="KeyS"]', pressedKeys.has("KeyS"));
    setAct('[data-k="KeyD"]', pressedKeys.has("KeyD"));
    setAct('[data-k="Space"]', pressedKeys.has("Space"));
    setAct('[data-k="LMB"]', lmbDown);
    setAct('[data-k="RMB"]', rmbDown);

    const lCps = root.querySelector(".bt-lmb-cps");
    const rCps = root.querySelector(".bt-rmb-cps");
    if (lCps) lCps.textContent = `${lmbClicks.length} CPS`;
    if (rCps) rCps.textContent = `${rmbClicks.length} CPS`;
  }

  function renderKeystrokes() {
    let root = document.getElementById(KEYS_ID);
    if (!hudCfg.keystrokesEnabled) {
      if (root) root.remove();
      if (cpsInterval) {
        clearInterval(cpsInterval);
        cpsInterval = null;
      }
      return;
    }

    ensureBaseHudStyles();
    if (!root) {
      root = document.createElement("div");
      root.id = KEYS_ID;
      root.className = "bt-v3-widget";
      root.setAttribute("data-bt-ignore", "1");
      document.body.appendChild(root);
      makeHudDraggable(root, "keystrokesPosX", "keystrokesPosY");
    }

    root.innerHTML = `
      <div class="bt-ks-grid" title="Drag to move Keystrokes">
        <div class="bt-ks-row"><div class="bt-ks-key w-key" data-k="KeyW">W</div></div>
        <div class="bt-ks-row">
          <div class="bt-ks-key" data-k="KeyA">A</div>
          <div class="bt-ks-key" data-k="KeyS">S</div>
          <div class="bt-ks-key" data-k="KeyD">D</div>
        </div>
        ${hudCfg.keystrokesShowCps ? `
        <div class="bt-ks-row">
          <div class="bt-ks-key mouse-key" data-k="LMB"><span>LMB</span><span class="bt-ks-cps bt-lmb-cps">0 CPS</span></div>
          <div class="bt-ks-key mouse-key" data-k="RMB"><span>RMB</span><span class="bt-ks-cps bt-rmb-cps">0 CPS</span></div>
        </div>` : ""}
        ${hudCfg.keystrokesShowSpace ? `
        <div class="bt-ks-row"><div class="bt-ks-key space-key" data-k="Space">SPACE</div></div>` : ""}
      </div>
    `;

    const pos = clampPos(root, hudCfg.keystrokesPosX, hudCfg.keystrokesPosY);
    root.style.left = `${pos.left}px`;
    root.style.top = `${pos.top}px`;

    if (!cpsInterval) {
      cpsInterval = setInterval(updateKeystrokesVisual, 100);
    }
    updateKeystrokesVisual();
  }

  // --- CONTADOR DE FPS ---
  function fpsLoop(now) {
    fpsFrames++;
    if (now - fpsLastTs >= 500) {
      currentFps = Math.round((fpsFrames * 1000) / (now - fpsLastTs));
      fpsFrames = 0;
      fpsLastTs = now;
      const val = document.querySelector(`#${FPS_ID} .bt-fps-val`);
      if (val) val.textContent = `${currentFps} FPS`;
    }
    if (hudCfg.fpsEnabled) {
      fpsRaf = requestAnimationFrame(fpsLoop);
    } else {
      fpsRaf = null;
    }
  }

  function renderFps() {
    let root = document.getElementById(FPS_ID);
    if (!hudCfg.fpsEnabled) {
      if (root) root.remove();
      if (fpsRaf) {
        cancelAnimationFrame(fpsRaf);
        fpsRaf = null;
      }
      return;
    }

    ensureBaseHudStyles();
    if (!root) {
      root = document.createElement("div");
      root.id = FPS_ID;
      root.className = "bt-v3-widget";
      root.setAttribute("data-bt-ignore", "1");
      root.innerHTML = `<div class="bt-v3-pill" title="Drag to move FPS"><span class="bt-v3-pill-dot"></span><span class="bt-fps-val">-- FPS</span></div>`;
      document.body.appendChild(root);
      makeHudDraggable(root, "fpsPosX", "fpsPosY");
    }

    const pos = clampPos(root, hudCfg.fpsPosX, hudCfg.fpsPosY);
    root.style.left = `${pos.left}px`;
    root.style.top = `${pos.top}px`;

    if (!fpsRaf) {
      fpsFrames = 0;
      fpsLastTs = performance.now();
      fpsRaf = requestAnimationFrame(fpsLoop);
    }
  }

  // --- RELOJ DE SESIÓN / CRONÓMETRO SPEEDRUN ---
  function formatTime(ms, withTenths) {
    const totalSec = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const base = hrs > 0
      ? `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
      : `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    if (!withTenths) return base;
    const tenths = Math.floor((ms % 1000) / 100);
    return `${base}.${tenths}`;
  }

  function updateTimerDisplay() {
    const root = document.getElementById(TIMER_ID);
    if (!root) return;
    const valEl = root.querySelector(".bt-tm-val");
    if (!valEl) return;

    if (hudCfg.timerMode === "stopwatch") {
      const total = swElapsedMs + (swRunning ? Date.now() - swStartedAt : 0);
      valEl.textContent = formatTime(total, true);
      const toggleBtn = root.querySelector(".bt-tm-toggle");
      if (toggleBtn) toggleBtn.textContent = swRunning ? "⏸" : "▶";
    } else {
      valEl.textContent = formatTime(Date.now() - sessionStart, false);
    }
  }

  function toggleStopwatch() {
    if (swRunning) {
      swElapsedMs += Date.now() - swStartedAt;
      swRunning = false;
    } else {
      swStartedAt = Date.now();
      swRunning = true;
    }
    updateTimerDisplay();
  }

  function resetStopwatch() {
    swRunning = false;
    swElapsedMs = 0;
    swStartedAt = 0;
    updateTimerDisplay();
  }

  function renderTimer() {
    let root = document.getElementById(TIMER_ID);
    if (!hudCfg.timerEnabled) {
      if (root) root.remove();
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      return;
    }

    ensureBaseHudStyles();
    if (!root) {
      root = document.createElement("div");
      root.id = TIMER_ID;
      root.className = "bt-v3-widget";
      root.setAttribute("data-bt-ignore", "1");
      document.body.appendChild(root);
      makeHudDraggable(root, "timerPosX", "timerPosY");
    }

    const isSw = hudCfg.timerMode === "stopwatch";
    root.innerHTML = `
      <div class="bt-v3-pill" title="${isSw ? "Speedrun Timer (Alt+T start/pause, Alt+R reset)" : "Session Time - Drag to move"}">
        <span class="bt-v3-pill-dot"></span>
        <span>${isSw ? "⏱" : "🕒"}</span>
        <span class="bt-tm-val">00:00</span>
        ${isSw ? `<button class="bt-tm-btn bt-tm-toggle" title="Start / Pause (Alt+T)">▶</button><button class="bt-tm-btn bt-tm-rst" title="Reset (Alt+R)">↺</button>` : ""}
      </div>
    `;

    if (isSw) {
      root.querySelector(".bt-tm-toggle")?.addEventListener("click", toggleStopwatch);
      root.querySelector(".bt-tm-rst")?.addEventListener("click", resetStopwatch);
    }

    const pos = clampPos(root, hudCfg.timerPosX, hudCfg.timerPosY);
    root.style.left = `${pos.left}px`;
    root.style.top = `${pos.top}px`;

    if (!timerInterval) {
      timerInterval = setInterval(updateTimerDisplay, 100);
    }
    updateTimerDisplay();
  }

  function renderAllHud() {
    if (!document.body) return;
    renderCrosshair();
    renderKeystrokes();
    renderFps();
    renderTimer();
  }

  // --- EVENTOS GLOBALES ---
  window.addEventListener("keydown", (e) => {
    if (["KeyW", "KeyA", "KeyS", "KeyD", "Space"].includes(e.code)) {
      pressedKeys.add(e.code);
      if (hudCfg.keystrokesEnabled) updateKeystrokesVisual();
    }
    if (hudCfg.timerEnabled && hudCfg.timerMode === "stopwatch" && e.altKey) {
      if (e.target && e.target.matches && e.target.matches("input, textarea")) return;
      if (e.code === "KeyT") {
        e.preventDefault();
        toggleStopwatch();
      } else if (e.code === "KeyR") {
        e.preventDefault();
        resetStopwatch();
      }
    }
  }, true);

  window.addEventListener("keyup", (e) => {
    if (pressedKeys.has(e.code)) {
      pressedKeys.delete(e.code);
      if (hudCfg.keystrokesEnabled) updateKeystrokesVisual();
    }
  }, true);

  window.addEventListener("mousedown", (e) => {
    if (!hudCfg.keystrokesEnabled) return;
    if (e.button === 0) {
      lmbDown = true;
      lmbClicks.push(Date.now());
    } else if (e.button === 2) {
      rmbDown = true;
      rmbClicks.push(Date.now());
    }
    updateKeystrokesVisual();
  }, true);

  window.addEventListener("mouseup", (e) => {
    if (e.button === 0) lmbDown = false;
    else if (e.button === 2) rmbDown = false;
    if (hudCfg.keystrokesEnabled) updateKeystrokesVisual();
  }, true);

  window.addEventListener("blur", () => {
    pressedKeys.clear();
    lmbDown = false;
    rmbDown = false;
    if (hudCfg.keystrokesEnabled) updateKeystrokesVisual();
  });

  document.addEventListener("pointerlockchange", () => {
    if (hudCfg.crosshairEnabled) renderCrosshair();
  });

  window.addEventListener("resize", () => {
    if (hudCfg.keystrokesEnabled) renderKeystrokes();
    if (hudCfg.fpsEnabled) renderFps();
    if (hudCfg.timerEnabled) renderTimer();
  });

  // --- SINCRONIZACIÓN CON MORE_SETTINGS ---
  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area !== "local") return;
    if (changes.hudSettings) {
      const prevType = hudCfg.crosshairType;
      hudCfg = { ...DEF.hudSettings, ...(changes.hudSettings.newValue || {}) };
      if (hudCfg.crosshairType === "custom_png" && prevType !== "custom_png") {
        await refreshCustomCrosshairAsset();
      }
      renderAllHud();
    }
    if (changes.visualV3) {
      const prevBgTs = visCfg.localBgUpdatedAt;
      const prevBgOn = visCfg.localBgActive;
      const prevChTs = visCfg.customCrosshairUpdatedAt;
      visCfg = { ...DEF.visualV3, ...(changes.visualV3.newValue || {}) };

      if (prevBgTs !== visCfg.localBgUpdatedAt || prevBgOn !== visCfg.localBgActive) {
        await refreshLocalBgAsset();
      } else {
        applyVisualsV3();
      }
      if (prevChTs !== visCfg.customCrosshairUpdatedAt) {
        await refreshCustomCrosshairAsset();
      }
    }
  });

  chrome.storage.local.get(["hudSettings", "visualV3"], async (data) => {
    if (data.hudSettings) hudCfg = { ...DEF.hudSettings, ...data.hudSettings };
    if (data.visualV3) visCfg = { ...DEF.visualV3, ...data.visualV3 };
    await refreshLocalBgAsset();
    await refreshCustomCrosshairAsset();
    applyVisualsV3();
    renderAllHud();
  });
})();