(() => {
  window.BLOXD_V3_EXTRAS_DEFAULTS = {
    watermarkEnabled: false, watermarkText: "Bloxd Studio v3.0", watermarkPosX: 16, watermarkPosY: 275,
    pingEnabled: false, pingPosX: 16, pingPosY: 320,
    clockEnabled: false, clock24h: false, clockPosX: 16, clockPosY: 365,
    maxCpsEnabled: false, maxCpsPosX: 16, maxCpsPosY: 410,
    coordsEnabled: false, coordsCollapsed: false, coordsPosX: 16, coordsPosY: 455,
    dynamicCrosshair: false, dynamicCrosshairColor: "#ef4444",
    cursorTrail: false, clickRipples: false, ambientMode: "none",
    customTitle: "", uiSound: "none", customCursorEnabled: false, customCursorUpdatedAt: 0
  };

  let cfg = { ...window.BLOXD_V3_EXTRAS_DEFAULTS };
  let uiAudioCtx = null;

  function playUiSound(mode) {
    if (!mode || mode === "none" || document.pointerLockElement) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!uiAudioCtx) uiAudioCtx = new AC();
      if (uiAudioCtx.state === "suspended") uiAudioCtx.resume().catch(() => {});
      const now = uiAudioCtx.currentTime;
      const osc = uiAudioCtx.createOscillator();
      const gain = uiAudioCtx.createGain();
      osc.connect(gain);
      gain.connect(uiAudioCtx.destination);
      if (mode === "pixel") {
        osc.type = "square"; osc.frequency.setValueAtTime(660, now); osc.frequency.exponentialRampToValueAtTime(980, now + 0.045);
        gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
        osc.start(now); osc.stop(now + 0.06);
      } else if (mode === "pop") {
        osc.type = "triangle"; osc.frequency.setValueAtTime(320, now); osc.frequency.exponentialRampToValueAtTime(640, now + 0.05);
        gain.gain.setValueAtTime(0.09, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
        osc.start(now); osc.stop(now + 0.07);
      } else {
        osc.type = "sine"; osc.frequency.setValueAtTime(520, now); osc.frequency.exponentialRampToValueAtTime(280, now + 0.04);
        gain.gain.setValueAtTime(0.06, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now); osc.stop(now + 0.055);
      }
    } catch {}
  }

  document.addEventListener("click", (e) => {
    if (!cfg.uiSound || cfg.uiSound === "none") return;
    if (e.target && e.target.closest && e.target.closest('button, a, select, input[type="checkbox"], [role="button"]')) {
      playUiSound(cfg.uiSound);
    }
  }, true);

  if (location.pathname.startsWith("/more_settings")) {
    chrome.storage.local.get(["extrasV3"], (d) => {
      if (d.extrasV3) cfg = { ...window.BLOXD_V3_EXTRAS_DEFAULTS, ...d.extrasV3 };
    });
    chrome.storage.onChanged.addListener((ch, area) => {
      if (area === "local" && ch.extrasV3) cfg = { ...window.BLOXD_V3_EXTRAS_DEFAULTS, ...(ch.extrasV3.newValue || {}) };
    });
    return;
  }

  const STYLE_ID = "bloxd-x3-style", CURSOR_STYLE_ID = "bloxd-x3-custom-cursor";
  const WM_ID = "bloxd-x3-watermark", PING_ID = "bloxd-x3-ping", CLOCK_ID = "bloxd-x3-clock";
  const MAXCPS_ID = "bloxd-x3-maxcps", COORDS_ID = "bloxd-x3-coords", AMBIENT_ID = "bloxd-x3-ambient";

  let coordNotes = [], customCursorUrl = null, pingTimer = null, clockTimer = null, titleTimer = null;
  let defaultTitle = document.title || "Bloxd.io", lastTrailTs = 0, trailCount = 0, chPulseTimer = null;
  let clickTimestamps = [], maxSessionCps = 0;

  function ensureExtrasStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const st = document.createElement("style");
    st.id = STYLE_ID;
    st.textContent =
      ".bt-x3-widget{position:fixed!important;z-index:2147483642!important;font-family:'Segoe UI',system-ui,sans-serif!important;user-select:none!important;color:var(--bt-text,#fff)!important;cursor:grab}" +
      ".bt-x3-widget:active{cursor:grabbing}.bt-x3-widget *{box-sizing:border-box!important}" +
      ".bt-x3-pill{display:inline-flex!important;align-items:center!important;gap:7px!important;background:rgba(15,20,36,.78)!important;border:1.5px solid color-mix(in srgb,var(--bt-accent,#38bdf8) 72%,transparent)!important;border-radius:5px!important;padding:5px 10px!important;font-size:12px!important;font-weight:800!important;line-height:1.1!important;white-space:nowrap!important;backdrop-filter:blur(8px)!important;box-shadow:0 4px 14px rgba(0,0,0,.42)!important}" +
      ".bt-x3-dot{width:8px!important;height:8px!important;border-radius:50%!important;background:var(--bt-accent,#38bdf8)!important;box-shadow:0 0 6px currentColor!important;flex-shrink:0!important}" +
      ".bt-x3-coords-box{width:214px!important;background:rgba(15,20,36,.80)!important;border:1.5px solid color-mix(in srgb,var(--bt-accent,#38bdf8) 70%,transparent)!important;border-radius:5px!important;padding:7px!important;backdrop-filter:blur(8px)!important;box-shadow:0 6px 18px rgba(0,0,0,.45)!important}" +
      ".bt-x3-c-head{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:6px!important;font-size:11px!important;font-weight:800!important;padding-bottom:5px!important;border-bottom:1px solid rgba(255,255,255,.12)!important;margin-bottom:6px!important}" +
      ".bt-x3-c-btn{background:rgba(255,255,255,.12)!important;border:1px solid rgba(255,255,255,.24)!important;color:#fff!important;font-size:10px!important;font-weight:800!important;padding:2px 6px!important;border-radius:3px!important;cursor:pointer!important}" +
      ".bt-x3-c-btn:hover{background:var(--bt-accent,#38bdf8)!important;color:#0b1020!important}" +
      ".bt-x3-c-form{display:grid!important;grid-template-columns:1fr 1fr 1fr!important;gap:4px!important;margin-bottom:6px!important}" +
      ".bt-x3-c-inp{width:100%!important;background:rgba(10,14,24,.88)!important;border:1px solid rgba(255,255,255,.22)!important;color:#fff!important;font-size:11px!important;font-weight:700!important;padding:4px 5px!important;border-radius:3px!important;outline:none!important}" +
      ".bt-x3-c-inp:focus{border-color:var(--bt-accent,#38bdf8)!important}.bt-x3-c-name{grid-column:1/-1!important}" +
      ".bt-x3-c-add{grid-column:1/-1!important;background:var(--bt-accent,#38bdf8)!important;color:#0b1020!important;border:0!important;font-size:11px!important;font-weight:800!important;padding:4px 6px!important;border-radius:3px!important;cursor:pointer!important}" +
      ".bt-x3-c-list{max-height:120px!important;overflow-y:auto!important;display:flex!important;flex-direction:column!important;gap:4px!important}" +
      ".bt-x3-c-item{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:5px!important;background:rgba(255,255,255,.07)!important;border-radius:3px!important;padding:4px 6px!important;font-size:10px!important;line-height:1.25!important}" +
      ".bt-x3-c-del{background:rgba(220,38,38,.85)!important;border:0!important;color:#fff!important;font-size:10px!important;font-weight:800!important;padding:1px 5px!important;border-radius:2px!important;cursor:pointer!important}" +
      "#" + AMBIENT_ID + "{position:fixed!important;inset:0!important;pointer-events:none!important;z-index:2147483635!important}" +
      "#" + AMBIENT_ID + ".mode-vignette{box-shadow:inset 0 0 110px rgba(0,0,0,.72)!important}" +
      "#" + AMBIENT_ID + ".mode-accent{box-shadow:inset 0 0 42px color-mix(in srgb,var(--bt-accent,#38bdf8) 58%,transparent)!important}" +
      "@keyframes bt-x3-ambient-rgb{0%{box-shadow:inset 0 0 42px rgba(248,113,113,.52)}25%{box-shadow:inset 0 0 42px rgba(250,204,21,.52)}50%{box-shadow:inset 0 0 42px rgba(74,222,128,.52)}75%{box-shadow:inset 0 0 42px rgba(56,189,248,.52)}100%{box-shadow:inset 0 0 42px rgba(248,113,113,.52)}}" +
      "#" + AMBIENT_ID + ".mode-rgb{animation:bt-x3-ambient-rgb 5s linear infinite!important}" +
      "#bloxd-v3-crosshair{transition:transform .06s ease-out,filter .06s ease-out!important}" +
      "#bloxd-v3-crosshair.bt-ch-pulse{transform:translate(-50%,-50%) scale(1.26)!important;filter:drop-shadow(0 0 5px var(--bt-ch-flash,#ef4444)) brightness(1.35)!important}" +
      ".bt-x3-trail{position:fixed!important;width:7px!important;height:7px!important;border-radius:50%!important;pointer-events:none!important;z-index:2147483646!important;background:var(--bt-accent,#38bdf8)!important;box-shadow:0 0 8px var(--bt-accent,#38bdf8)!important;transform:translate(-50%,-50%) scale(1);animation:bt-x3-trail-fade .36s ease-out forwards!important}" +
      "@keyframes bt-x3-trail-fade{0%{opacity:.85;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) scale(.15)}}" +
      ".bt-x3-ripple{position:fixed!important;width:12px!important;height:12px!important;border-radius:50%!important;border:2px solid var(--bt-accent,#38bdf8)!important;pointer-events:none!important;z-index:2147483646!important;transform:translate(-50%,-50%) scale(.4);animation:bt-x3-ripple-out .38s ease-out forwards!important}" +
      "@keyframes bt-x3-ripple-out{0%{opacity:.9;transform:translate(-50%,-50%) scale(.4)}100%{opacity:0;transform:translate(-50%,-50%) scale(3.2)}}";
    document.head.appendChild(st);
  }

  function clampPos(el, x, y) {
    const maxX = Math.max(8, window.innerWidth - (el.offsetWidth || 140) - 8);
    const maxY = Math.max(8, window.innerHeight - (el.offsetHeight || 36) - 8);
    return { left: Math.min(maxX, Math.max(8, Number(x) || 16)), top: Math.min(maxY, Math.max(8, Number(y) || 16)) };
  }

  function makeDraggable(el, keyX, keyY) {
    let sx = 0, sy = 0, ol = 0, ot = 0, dragging = false, moved = false;
    el.addEventListener("mousedown", (e) => {
      if (e.button !== 0 || e.target.closest("button, input, textarea")) return;
      const r = el.getBoundingClientRect();
      sx = e.clientX; sy = e.clientY; ol = r.left; ot = r.top; dragging = true; moved = false;
      e.preventDefault();
    });
    window.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
      const pos = clampPos(el, ol + dx, ot + dy);
      el.style.left = pos.left + "px"; el.style.top = pos.top + "px";
    });
    window.addEventListener("mouseup", () => {
      if (!dragging) return;
      dragging = false;
      if (moved) {
        const r = el.getBoundingClientRect();
        cfg[keyX] = Math.round(r.left); cfg[keyY] = Math.round(r.top);
        chrome.storage.local.set({ extrasV3: cfg });
      }
    });
  }

  function renderWatermark() {
    let el = document.getElementById(WM_ID);
    if (!cfg.watermarkEnabled) { if (el) el.remove(); return; }
    ensureExtrasStyles();
    if (!el) {
      el = document.createElement("div"); el.id = WM_ID; el.className = "bt-x3-widget";
      el.setAttribute("data-bt-ignore", "1"); document.body.appendChild(el);
      makeDraggable(el, "watermarkPosX", "watermarkPosY");
    }
    el.innerHTML = '<div class="bt-x3-pill" title="Drag to move Watermark"><span class="bt-x3-dot"></span><span class="bt-wm-txt"></span></div>';
    el.querySelector(".bt-wm-txt").textContent = (cfg.watermarkText || "Bloxd Studio v3.0").slice(0, 40);
    const pos = clampPos(el, cfg.watermarkPosX, cfg.watermarkPosY);
    el.style.left = pos.left + "px"; el.style.top = pos.top + "px";
  }

  async function measurePingOnce() {
    const el = document.getElementById(PING_ID);
    if (!el || document.hidden) return;
    const t0 = performance.now();
    try {
      await fetch(location.origin + "/favicon.ico?_bt=" + Date.now(), { cache: "no-store" });
      const ms = Math.max(1, Math.round(performance.now() - t0));
      const val = el.querySelector(".bt-ping-val"), dot = el.querySelector(".bt-ping-dot");
      if (val) val.textContent = ms + " ms";
      if (dot) dot.style.background = ms < 70 ? "#4ade80" : (ms < 150 ? "#facc15" : "#f87171");
    } catch {
      const val = el.querySelector(".bt-ping-val");
      if (val) val.textContent = "-- ms";
    }
  }

  function renderPing() {
    let el = document.getElementById(PING_ID);
    if (!cfg.pingEnabled) {
      if (el) el.remove();
      if (pingTimer) { clearInterval(pingTimer); pingTimer = null; }
      return;
    }
    ensureExtrasStyles();
    if (!el) {
      el = document.createElement("div"); el.id = PING_ID; el.className = "bt-x3-widget";
      el.setAttribute("data-bt-ignore", "1");
      el.innerHTML = '<div class="bt-x3-pill" title="Drag to move Ping"><span class="bt-x3-dot bt-ping-dot"></span><span class="bt-ping-val">-- ms</span></div>';
      document.body.appendChild(el);
      makeDraggable(el, "pingPosX", "pingPosY");
    }
    const pos = clampPos(el, cfg.pingPosX, cfg.pingPosY);
    el.style.left = pos.left + "px"; el.style.top = pos.top + "px";
    if (!pingTimer) { measurePingOnce(); pingTimer = setInterval(measurePingOnce, 4500); }
  }

  function updateClockText() {
    const el = document.getElementById(CLOCK_ID);
    if (!el) return;
    const span = el.querySelector(".bt-clock-val");
    if (span) span.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: !cfg.clock24h });
  }

  function renderClock() {
    let el = document.getElementById(CLOCK_ID);
    if (!cfg.clockEnabled) {
      if (el) el.remove();
      if (clockTimer) { clearInterval(clockTimer); clockTimer = null; }
      return;
    }
    ensureExtrasStyles();
    if (!el) {
      el = document.createElement("div"); el.id = CLOCK_ID; el.className = "bt-x3-widget";
      el.setAttribute("data-bt-ignore", "1");
      el.innerHTML = '<div class="bt-x3-pill" title="Drag to move Clock"><span>Clock:</span><span class="bt-clock-val">--:--</span></div>';
      document.body.appendChild(el);
      makeDraggable(el, "clockPosX", "clockPosY");
    }
    updateClockText();
    const pos = clampPos(el, cfg.clockPosX, cfg.clockPosY);
    el.style.left = pos.left + "px"; el.style.top = pos.top + "px";
    if (!clockTimer) clockTimer = setInterval(updateClockText, 1000);
  }

  function updateMaxCpsText() {
    const el = document.getElementById(MAXCPS_ID);
    if (!el) return;
    const now = performance.now();
    clickTimestamps = clickTimestamps.filter((t) => now - t <= 1000);
    if (clickTimestamps.length > maxSessionCps) maxSessionCps = clickTimestamps.length;
    const span = el.querySelector(".bt-maxcps-val");
    if (span) span.textContent = clickTimestamps.length + " CPS (Max: " + maxSessionCps + ")";
  }

  function renderMaxCps() {
    let el = document.getElementById(MAXCPS_ID);
    if (!cfg.maxCpsEnabled) { if (el) el.remove(); return; }
    ensureExtrasStyles();
    if (!el) {
      el = document.createElement("div"); el.id = MAXCPS_ID; el.className = "bt-x3-widget";
      el.setAttribute("data-bt-ignore", "1");
      el.innerHTML = '<div class="bt-x3-pill" title="Drag to move - Double-click to reset Max CPS"><span class="bt-x3-dot"></span><span class="bt-maxcps-val">0 CPS (Max: 0)</span></div>';
      el.addEventListener("dblclick", () => { maxSessionCps = 0; clickTimestamps = []; updateMaxCpsText(); });
      document.body.appendChild(el);
      makeDraggable(el, "maxCpsPosX", "maxCpsPosY");
    }
    updateMaxCpsText();
    const pos = clampPos(el, cfg.maxCpsPosX, cfg.maxCpsPosY);
    el.style.left = pos.left + "px"; el.style.top = pos.top + "px";
  }

  setInterval(() => { if (cfg.maxCpsEnabled) updateMaxCpsText(); }, 200);

  function renderCoords() {
    let el = document.getElementById(COORDS_ID);
    if (!cfg.coordsEnabled) { if (el) el.remove(); return; }
    ensureExtrasStyles();
    if (!el) {
      el = document.createElement("div"); el.id = COORDS_ID; el.className = "bt-x3-widget";
      el.setAttribute("data-bt-ignore", "1"); document.body.appendChild(el);
      makeDraggable(el, "coordsPosX", "coordsPosY");
    }
    if (cfg.coordsCollapsed) {
      el.innerHTML = '<div class="bt-x3-pill" title="Click + to open Coordinates"><span>Coords (' + coordNotes.length + ')</span><button class="bt-x3-c-btn bt-c-tog">+</button></div>';
      el.querySelector(".bt-c-tog").addEventListener("click", () => {
        cfg.coordsCollapsed = false; chrome.storage.local.set({ extrasV3: cfg }); renderCoords();
      });
    } else {
      el.innerHTML =
        '<div class="bt-x3-coords-box">' +
        '<div class="bt-x3-c-head" title="Drag to move"><span>Coords (' + coordNotes.length + ')</span><button class="bt-x3-c-btn bt-c-tog">-</button></div>' +
        '<div class="bt-x3-c-form">' +
        '<input type="text" class="bt-x3-c-inp bt-x3-c-name" placeholder="Place (e.g. Base)" maxlength="22">' +
        '<input type="text" class="bt-x3-c-inp bt-c-x" placeholder="X" maxlength="7">' +
        '<input type="text" class="bt-x3-c-inp bt-c-y" placeholder="Y" maxlength="7">' +
        '<input type="text" class="bt-x3-c-inp bt-c-z" placeholder="Z" maxlength="7">' +
        '<button class="bt-x3-c-add">+ Save Coords</button></div>' +
        '<div class="bt-x3-c-list"></div></div>';
      el.querySelectorAll("input").forEach((inp) => {
        inp.addEventListener("keydown", (e) => e.stopPropagation());
        inp.addEventListener("keyup", (e) => e.stopPropagation());
      });
      el.querySelector(".bt-c-tog").addEventListener("click", () => {
        cfg.coordsCollapsed = true; chrome.storage.local.set({ extrasV3: cfg }); renderCoords();
      });
      const saveNote = () => {
        const name = el.querySelector(".bt-x3-c-name").value.trim() || "Waypoint";
        const x = el.querySelector(".bt-c-x").value.trim() || "0";
        const y = el.querySelector(".bt-c-y").value.trim() || "0";
        const z = el.querySelector(".bt-c-z").value.trim() || "0";
        coordNotes.unshift({ id: "c-" + Date.now(), name, x, y, z });
        chrome.storage.local.set({ coordNotes }); renderCoords();
      };
      el.querySelector(".bt-x3-c-add").addEventListener("click", saveNote);
      el.querySelector(".bt-c-z").addEventListener("keydown", (e) => { if (e.key === "Enter") saveNote(); });
      const list = el.querySelector(".bt-x3-c-list");
      if (!coordNotes.length) {
        list.innerHTML = '<div style="font-size:10px;opacity:0.7;text-align:center;padding:3px">No coords saved</div>';
      } else {
        coordNotes.forEach((n) => {
          const item = document.createElement("div"); item.className = "bt-x3-c-item";
          const txt = document.createElement("div"); txt.style.minWidth = "0";
          const b = document.createElement("b"); b.textContent = n.name;
          const cs = document.createElement("div"); cs.style.opacity = "0.85"; cs.textContent = "X:" + n.x + " Y:" + n.y + " Z:" + n.z;
          txt.append(b, cs);
          const del = document.createElement("button"); del.className = "bt-x3-c-del"; del.textContent = "x";
          del.addEventListener("click", () => {
            coordNotes = coordNotes.filter((k) => k.id !== n.id);
            chrome.storage.local.set({ coordNotes }); renderCoords();
          });
          item.append(txt, del); list.appendChild(item);
        });
      }
    }
    const pos = clampPos(el, cfg.coordsPosX, cfg.coordsPosY);
    el.style.left = pos.left + "px"; el.style.top = pos.top + "px";
  }

  function renderAmbient() {
    let el = document.getElementById(AMBIENT_ID);
    const mode = cfg.ambientMode || "none";
    if (mode === "none") { if (el) el.remove(); return; }
    ensureExtrasStyles();
    if (!el) {
      el = document.createElement("div"); el.id = AMBIENT_ID;
      el.setAttribute("data-bt-ignore", "1"); document.body.appendChild(el);
    }
    el.className = "mode-" + mode;
  }

  function applyCustomTitle() {
    const custom = (cfg.customTitle || "").trim();
    if (titleTimer) { clearInterval(titleTimer); titleTimer = null; }
    if (custom) {
      document.title = custom;
      titleTimer = setInterval(() => { if (document.title !== custom) document.title = custom; }, 2000);
    } else if (defaultTitle) {
      document.title = defaultTitle;
    }
  }

  async function refreshCustomCursor() {
    if (customCursorUrl) { URL.revokeObjectURL(customCursorUrl); customCursorUrl = null; }
    let st = document.getElementById(CURSOR_STYLE_ID);
    if (!cfg.customCursorEnabled || !window.BLOXD_V3_ASSETS_DB) { if (st) st.remove(); return; }
    try {
      const rec = await window.BLOXD_V3_ASSETS_DB.get("custom_cursor");
      if (!rec || !rec.blob) { if (st) st.remove(); return; }
      customCursorUrl = URL.createObjectURL(rec.blob);
      if (!st) { st = document.createElement("style"); st.id = CURSOR_STYLE_ID; document.head.appendChild(st); }
      const q = String.fromCharCode(34);
      st.textContent = "html, body, div, button, a, input, select { cursor: url(" + q + customCursorUrl + q + ") 2 2, auto !important; }";
    } catch { if (st) st.remove(); }
  }

  window.addEventListener("mousedown", (e) => {
    if (cfg.maxCpsEnabled && e.button === 0) { clickTimestamps.push(performance.now()); updateMaxCpsText(); }
    if (cfg.dynamicCrosshair) {
      const ch = document.getElementById("bloxd-v3-crosshair");
      if (ch) {
        ch.style.setProperty("--bt-ch-flash", cfg.dynamicCrosshairColor || "#ef4444");
        ch.classList.add("bt-ch-pulse");
        clearTimeout(chPulseTimer);
        chPulseTimer = setTimeout(() => ch.classList.remove("bt-ch-pulse"), 115);
      }
    }
    if (cfg.clickRipples && !document.pointerLockElement && document.body) {
      ensureExtrasStyles();
      const rip = document.createElement("div");
      rip.className = "bt-x3-ripple";
      rip.setAttribute("data-bt-ignore", "1");
      rip.style.left = e.clientX + "px";
      rip.style.top = e.clientY + "px";
      document.body.appendChild(rip);
      setTimeout(() => rip.remove(), 400);
    }
  }, true);

  window.addEventListener("mousemove", (e) => {
    if (!cfg.cursorTrail || document.pointerLockElement || !document.body) return;
    const now = performance.now();
    if (now - lastTrailTs < 30 || trailCount >= 14) return;
    lastTrailTs = now; trailCount++;
    ensureExtrasStyles();
    const dot = document.createElement("div");
    dot.className = "bt-x3-trail";
    dot.setAttribute("data-bt-ignore", "1");
    dot.style.left = e.clientX + "px";
    dot.style.top = e.clientY + "px";
    document.body.appendChild(dot);
    setTimeout(() => { dot.remove(); trailCount = Math.max(0, trailCount - 1); }, 370);
  }, { passive: true });

  window.addEventListener("resize", () => {
    if (cfg.watermarkEnabled) renderWatermark();
    if (cfg.pingEnabled) renderPing();
    if (cfg.clockEnabled) renderClock();
    if (cfg.maxCpsEnabled) renderMaxCps();
    if (cfg.coordsEnabled) renderCoords();
  });

  function renderAllExtras() {
    if (!document.body) return;
    renderWatermark(); renderPing(); renderClock(); renderMaxCps(); renderCoords(); renderAmbient(); applyCustomTitle();
  }

  chrome.storage.onChanged.addListener(async (ch, area) => {
    if (area !== "local") return;
    if (ch.coordNotes) { coordNotes = Array.isArray(ch.coordNotes.newValue) ? ch.coordNotes.newValue : []; renderCoords(); }
    if (ch.extrasV3) {
      const prevTs = cfg.customCursorUpdatedAt, prevOn = cfg.customCursorEnabled;
      cfg = { ...window.BLOXD_V3_EXTRAS_DEFAULTS, ...(ch.extrasV3.newValue || {}) };
      renderAllExtras();
      if (prevTs !== cfg.customCursorUpdatedAt || prevOn !== cfg.customCursorEnabled) await refreshCustomCursor();
    }
  });

  chrome.storage.local.get(["extrasV3", "coordNotes"], async (d) => {
    if (d.extrasV3) cfg = { ...window.BLOXD_V3_EXTRAS_DEFAULTS, ...d.extrasV3 };
    coordNotes = Array.isArray(d.coordNotes) ? d.coordNotes : [];
    await refreshCustomCursor();
    renderAllExtras();
  });
})();