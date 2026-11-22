(() => {
  if (!location.pathname.startsWith("/more_settings")) return;

  const STYLE_ID = "bt-x3-ui-style";
  const BTN_ID = "bt-x3-open-btn";
  const MODAL_ID = "bt-x3-modal";

  function getDefaults() {
    return window.BLOXD_V3_EXTRAS_DEFAULTS || {
      watermarkEnabled: false, watermarkText: "Bloxd Studio v3.0", watermarkPosX: 16, watermarkPosY: 275,
      pingEnabled: false, pingPosX: 16, pingPosY: 320,
      clockEnabled: false, clock24h: false, clockPosX: 16, clockPosY: 365,
      maxCpsEnabled: false, maxCpsPosX: 16, maxCpsPosY: 410,
      coordsEnabled: false, coordsCollapsed: false, coordsPosX: 16, coordsPosY: 455,
      dynamicCrosshair: false, dynamicCrosshairColor: "#ef4444",
      cursorTrail: false, clickRipples: false, ambientMode: "none",
      customTitle: "", uiSound: "none", musicHotkeys: true,
      customCursorEnabled: false, customCursorUpdatedAt: 0
    };
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const st = document.createElement("style");
    st.id = STYLE_ID;
    st.textContent =
      "#" + BTN_ID + ".bt-x3-float{position:fixed;bottom:20px;right:20px;top:auto;z-index:2147483640;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;border:2px solid #60a5fa;border-radius:8px;padding:9px 15px;font-weight:800;font-size:13px;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.5)}" +
      "#" + BTN_ID + ".bt-x3-float:hover{filter:brightness(1.12)}" +
      "#" + BTN_ID + ".bt-x3-inline{background:linear-gradient(135deg,#2563eb,#7c3aed)!important;color:#fff!important;border-color:#60a5fa!important;white-space:nowrap!important}" +
      "#" + MODAL_ID + "{position:fixed;inset:0;z-index:2147483645;background:rgba(9,13,24,.82);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:18px;font-family:'Segoe UI',system-ui,sans-serif;color:#f1f5f9}" +
      "#" + MODAL_ID + " *{box-sizing:border-box}" +
      ".bt-x3-panel{width:min(880px,96vw);max-height:90vh;overflow-y:auto;background:#131824;border:2px solid #354061;border-radius:10px;padding:18px;box-shadow:0 18px 50px rgba(0,0,0,.65)}" +
      ".bt-x3-top{display:flex;align-items:center;justify-content:space-between;gap:10px;border-bottom:1.5px solid #28324d;padding-bottom:12px;margin-bottom:14px}" +
      ".bt-x3-top h2{margin:0;font-size:18px;font-weight:800;color:#fff}" +
      ".bt-x3-close{background:#dc2626;border:0;color:#fff;font-weight:800;font-size:12px;padding:7px 12px;border-radius:5px;cursor:pointer}" +
      ".bt-x3-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(265px,1fr));gap:12px}" +
      ".bt-x3-card{background:#1b2234;border:1.5px solid #303b59;border-radius:8px;padding:13px;display:flex;flex-direction:column;gap:9px}" +
      ".bt-x3-card h3{margin:0;font-size:13px;font-weight:800;color:#38bdf8;text-transform:uppercase;letter-spacing:.4px}" +
      ".bt-x3-row{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12.5px;font-weight:700;color:#e2e8f0}" +
      ".bt-x3-row input[type=checkbox]{width:16px;height:16px;accent-color:#38bdf8;cursor:pointer}" +
      ".bt-x3-inp,.bt-x3-sel{width:100%;background:#0f1420;border:1.5px solid #3d4a6e;color:#fff;font-size:12px;font-weight:700;padding:6px 8px;border-radius:5px;outline:none}" +
      ".bt-x3-inp:focus,.bt-x3-sel:focus{border-color:#38bdf8}" +
      ".bt-x3-btns{display:grid;grid-template-columns:1fr 1fr;gap:7px}" +
      ".bt-x3-b{border:0;border-radius:5px;padding:8px 9px;font-size:12px;font-weight:800;color:#fff;cursor:pointer;background:#2563eb;border-bottom:3px solid #1d4ed8}" +
      ".bt-x3-b:hover{filter:brightness(1.12)}" +
      ".bt-x3-b.green{background:#16a34a;border-bottom-color:#15803d}" +
      ".bt-x3-b.purple{background:#7c3aed;border-bottom-color:#5b21b6}" +
      ".bt-x3-b.slate{background:#475569;border-bottom-color:#334155}" +
      ".bt-x3-b.red{background:#dc2626;border-bottom-color:#991b1b}" +
      ".bt-x3-hint{font-size:11px;color:#94a3b8;line-height:1.35}" +
      ".bt-x3-msg{min-height:18px;font-size:12px;font-weight:800;color:#4ade80;margin-top:8px;text-align:center}" +
      ".bt-x3-cur-prev{width:28px;height:28px;border:1px solid #475569;border-radius:4px;background:#0f1420;object-fit:contain;image-rendering:pixelated}";
    document.head.appendChild(st);
  }

  function resizeCursorImage(file, flipLeft) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const cv = document.createElement("canvas");
        cv.width = 24; cv.height = 24;
        const ctx = cv.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        if (flipLeft) { ctx.translate(24, 0); ctx.scale(-1, 1); }
        ctx.drawImage(img, 0, 0, 24, 24);
        URL.revokeObjectURL(url);
        cv.toBlob((blob) => {
          if (!blob) return reject(new Error("Blob failed"));
          resolve(new File([blob], "custom_cursor.png", { type: "image/png" }));
        }, "image/png");
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Invalid image")); };
      img.src = url;
    });
  }

  function applyPreset(mode, setMsg) {
    chrome.storage.local.get(["hudSettings", "visualV3", "extrasV3"], (d) => {
      const hud = { ...(window.BLOXD_V3_DEFAULTS ? window.BLOXD_V3_DEFAULTS.hudSettings : {}), ...(d.hudSettings || {}) };
      const vis = { ...(window.BLOXD_V3_DEFAULTS ? window.BLOXD_V3_DEFAULTS.visualV3 : {}), ...(d.visualV3 || {}) };
      const ext = { ...getDefaults(), ...(d.extrasV3 || {}) };

      if (mode === "pvp") {
        hud.crosshairEnabled = true; hud.keystrokesEnabled = true; hud.fpsEnabled = true; hud.timerEnabled = false;
        vis.glassMode = false; vis.rgbBorders = false;
        ext.pingEnabled = true; ext.maxCpsEnabled = true; ext.dynamicCrosshair = true;
        ext.cursorTrail = false; ext.clickRipples = false; ext.ambientMode = "none"; ext.coordsEnabled = false;
      } else if (mode === "chill") {
        hud.crosshairEnabled = false; hud.keystrokesEnabled = false; hud.fpsEnabled = false; hud.timerEnabled = false;
        vis.glassMode = true; vis.rgbBorders = false;
        ext.watermarkEnabled = true; ext.clockEnabled = true; ext.pingEnabled = false; ext.maxCpsEnabled = false;
        ext.cursorTrail = true; ext.clickRipples = true; ext.ambientMode = "vignette"; ext.dynamicCrosshair = false;
      } else if (mode === "parkour") {
        hud.crosshairEnabled = true; hud.keystrokesEnabled = true; hud.fpsEnabled = true; hud.timerEnabled = true;
        ext.pingEnabled = true; ext.coordsEnabled = true; ext.maxCpsEnabled = false;
        ext.cursorTrail = false; ext.clickRipples = false; ext.ambientMode = "none";
      }

      chrome.storage.local.set({ hudSettings: hud, visualV3: vis, extrasV3: ext }, () => {
        setMsg("Profile applied: " + mode.toUpperCase() + "!");
        openModal();
      });
    });
  }

  function openModal() {
    ensureStyles();
    const old = document.getElementById(MODAL_ID);
    if (old) old.remove();

    chrome.storage.local.get(["extrasV3", "customProfileV3"], async (data) => {
      let ext = { ...getDefaults(), ...(data.extrasV3 || {}) };
      const hasCustomProf = Boolean(data.customProfileV3);

      const wrap = document.createElement("div");
      wrap.id = MODAL_ID;
      wrap.innerHTML =
        '<div class="bt-x3-panel">' +
        '  <div class="bt-x3-top">' +
        '    <h2>Extras &amp; Profiles (v3.0)</h2>' +
        '    <button type="button" class="bt-x3-close">Close [Esc]</button>' +
        '  </div>' +
        '  <div class="bt-x3-grid">' +
        '    <div class="bt-x3-card">' +
        '      <h3>1-Click Profiles</h3>' +
        '      <div class="bt-x3-btns">' +
        '        <button type="button" class="bt-x3-b red" data-prof="pvp">PvP Mode</button>' +
        '        <button type="button" class="bt-x3-b purple" data-prof="chill">Chill Mode</button>' +
        '        <button type="button" class="bt-x3-b green" data-prof="parkour">Parkour Mode</button>' +
        '        <button type="button" class="bt-x3-b slate" id="bt-x3-save-my">Save My Setup</button>' +
        '      </div>' +
        '      <button type="button" class="bt-x3-b" id="bt-x3-load-my"' + (hasCustomProf ? '' : ' disabled style="opacity:0.5;cursor:not-allowed"') + '>Load My Saved Setup</button>' +
        '      <div class="bt-x3-hint">Switches HUD, visuals, and extras instantly without deleting your themes.</div>' +
        '    </div>' +
        '    <div class="bt-x3-card">' +
        '      <h3>Client HUD Widgets</h3>' +
        '      <label class="bt-x3-row"><span>Client Watermark</span><input type="checkbox" id="x3-wm"></label>' +
        '      <input type="text" class="bt-x3-inp" id="x3-wm-txt" maxlength="40" placeholder="Bloxd Studio v3.0">' +
        '      <label class="bt-x3-row"><span>Live Ping Meter (ms)</span><input type="checkbox" id="x3-ping"></label>' +
        '      <label class="bt-x3-row"><span>Real-Time Clock</span><input type="checkbox" id="x3-clk"></label>' +
        '      <label class="bt-x3-row"><span>Clock 24-Hour Format</span><input type="checkbox" id="x3-clk24"></label>' +
        '      <label class="bt-x3-row"><span>Max CPS Tracker</span><input type="checkbox" id="x3-cps"></label>' +
        '      <label class="bt-x3-row"><span>Coords Notepad (X/Y/Z)</span><input type="checkbox" id="x3-coords"></label>' +
        '    </div>' +
        '    <div class="bt-x3-card">' +
        '      <h3>Visuals &amp; Feedback</h3>' +
        '      <label class="bt-x3-row"><span>Dynamic Crosshair (Click Pulse)</span><input type="checkbox" id="x3-dynch"></label>' +
        '      <label class="bt-x3-row"><span>Crosshair Flash Color</span><input type="color" id="x3-dyncol"></label>' +
        '      <label class="bt-x3-row"><span>Menu Cursor Trail</span><input type="checkbox" id="x3-trail"></label>' +
        '      <label class="bt-x3-row"><span>Menu Click Ripples</span><input type="checkbox" id="x3-ripple"></label>' +
        '      <label class="bt-x3-row"><span>Ambient Edge Glow</span></label>' +
        '      <select class="bt-x3-sel" id="x3-ambient">' +
        '        <option value="none">None</option>' +
        '        <option value="vignette">Dark Vignette</option>' +
        '        <option value="accent">Theme Accent Glow</option>' +
        '        <option value="rgb">RGB Edge Glow</option>' +
        '      </select>' +
        '      <label class="bt-x3-row"><span>Custom Browser Tab Title</span></label>' +
        '      <input type="text" class="bt-x3-inp" id="x3-title" maxlength="40" placeholder="Default (Bloxd.io)">' +
        '    </div>' +
        '    <div class="bt-x3-card">' +
        '      <h3>Audio &amp; Music Controls</h3>' +
        '      <label class="bt-x3-row"><span>Menu UI Click Sounds</span></label>' +
        '      <select class="bt-x3-sel" id="x3-sound">' +
        '        <option value="none">Off</option>' +
        '        <option value="soft">Soft Click</option>' +
        '        <option value="pixel">Pixel Block</option>' +
        '        <option value="pop">Pop</option>' +
        '      </select>' +
        '      <label class="bt-x3-row"><span>Music Alt Shortcuts</span><input type="checkbox" id="x3-mkeys"></label>' +
        '      <div class="bt-x3-hint">Alt+P: Play/Pause | Alt+Left/Right: Prev/Next | Alt+Up/Down: Volume. Time seek bar appears automatically in the mini player!</div>' +
        '    </div>' +
        '    <div class="bt-x3-card">' +
        '      <h3>Custom PNG Cursor</h3>' +
        '      <label class="bt-x3-row"><span>Use Uploaded PNG Cursor</span><input type="checkbox" id="x3-cur-on"></label>' +
        '      <label class="bt-x3-row"><span>Flip Left on Upload</span><input type="checkbox" id="x3-cur-flip" checked></label>' +
        '      <div class="bt-x3-row">' +
        '        <input type="file" id="x3-cur-file" accept="image/png,image/webp,image/gif" style="font-size:11px;width:190px">' +
        '        <img id="x3-cur-prev" class="bt-x3-cur-prev" alt="">' +
        '      </div>' +
        '      <button type="button" class="bt-x3-b red" id="x3-cur-del">Remove Custom PNG Cursor</button>' +
        '      <div class="bt-x3-hint">Auto-scales to normal cursor size (24x24px) keeping sharp pixels.</div>' +
        '    </div>' +
        '    <div class="bt-x3-card">' +
        '      <h3>Full Backup (.json)</h3>' +
        '      <div class="bt-x3-btns">' +
        '        <button type="button" class="bt-x3-b green" id="x3-exp">Export Backup</button>' +
        '        <button type="button" class="bt-x3-b" id="x3-imp-btn">Import Backup</button>' +
        '      </div>' +
        '      <input type="file" id="x3-imp-file" accept=".json,application/json" style="display:none">' +
        '      <div class="bt-x3-hint">Saves all themes, HUD layout, extras, coords, lobbies, and playlist in one file.</div>' +
        '    </div>' +
        '  </div>' +
        '  <div class="bt-x3-msg" id="x3-msg"></div>' +
        '</div>';

      document.body.appendChild(wrap);

      const $ = (id) => wrap.querySelector("#" + id);
      const setMsg = (txt) => { const m = $("x3-msg"); if (m) m.textContent = txt; };
      const saveExt = (msg) => { chrome.storage.local.set({ extrasV3: ext }, () => { if (msg) setMsg(msg); }); };

      $("x3-wm").checked = Boolean(ext.watermarkEnabled);
      $("x3-wm-txt").value = ext.watermarkText || "Bloxd Studio v3.0";
      $("x3-ping").checked = Boolean(ext.pingEnabled);
      $("x3-clk").checked = Boolean(ext.clockEnabled);
      $("x3-clk24").checked = Boolean(ext.clock24h);
      $("x3-cps").checked = Boolean(ext.maxCpsEnabled);
      $("x3-coords").checked = Boolean(ext.coordsEnabled);
      $("x3-dynch").checked = Boolean(ext.dynamicCrosshair);
      $("x3-dyncol").value = ext.dynamicCrosshairColor || "#ef4444";
      $("x3-trail").checked = Boolean(ext.cursorTrail);
      $("x3-ripple").checked = Boolean(ext.clickRipples);
      $("x3-ambient").value = ext.ambientMode || "none";
      $("x3-title").value = ext.customTitle || "";
      $("x3-sound").value = ext.uiSound || "none";
      $("x3-mkeys").checked = ext.musicHotkeys !== false;
      $("x3-cur-on").checked = Boolean(ext.customCursorEnabled);

      if (window.BLOXD_V3_ASSETS_DB) {
        try {
          const rec = await window.BLOXD_V3_ASSETS_DB.get("custom_cursor");
          if (rec && rec.blob) $("x3-cur-prev").src = URL.createObjectURL(rec.blob);
        } catch {}
      }

      const bindChk = (id, key) => $(id).addEventListener("change", (e) => { ext[key] = e.target.checked; saveExt("Saved!"); });
      const bindVal = (id, key) => $(id).addEventListener("input", (e) => { ext[key] = e.target.value; saveExt("Saved!"); });

      bindChk("x3-wm", "watermarkEnabled"); bindVal("x3-wm-txt", "watermarkText");
      bindChk("x3-ping", "pingEnabled"); bindChk("x3-clk", "clockEnabled");
      bindChk("x3-clk24", "clock24h"); bindChk("x3-cps", "maxCpsEnabled");
      bindChk("x3-coords", "coordsEnabled"); bindChk("x3-dynch", "dynamicCrosshair");
      bindVal("x3-dyncol", "dynamicCrosshairColor"); bindChk("x3-trail", "cursorTrail");
      bindChk("x3-ripple", "clickRipples"); bindVal("x3-ambient", "ambientMode");
      bindVal("x3-title", "customTitle"); bindVal("x3-sound", "uiSound");
      bindChk("x3-mkeys", "musicHotkeys"); bindChk("x3-cur-on", "customCursorEnabled");

      wrap.querySelectorAll("[data-prof]").forEach((b) => {
        b.addEventListener("click", () => applyPreset(b.getAttribute("data-prof"), setMsg));
      });

      $("bt-x3-save-my").addEventListener("click", () => {
        chrome.storage.local.get(["currentTheme", "hudSettings", "visualV3", "extrasV3"], (d) => {
          chrome.storage.local.set({ customProfileV3: d }, () => {
            $("bt-x3-load-my").disabled = false;
            $("bt-x3-load-my").style.opacity = "1";
            $("bt-x3-load-my").style.cursor = "pointer";
            setMsg("Your custom profile was saved!");
          });
        });
      });

      $("bt-x3-load-my").addEventListener("click", () => {
        chrome.storage.local.get(["customProfileV3"], (d) => {
          if (!d.customProfileV3) return;
          chrome.storage.local.set(d.customProfileV3, () => {
            setMsg("Loaded your custom profile!");
            openModal();
          });
        });
      });

      $("x3-cur-file").addEventListener("change", async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file || !window.BLOXD_V3_ASSETS_DB) return;
        try {
          const resized = await resizeCursorImage(file, $("x3-cur-flip").checked);
          await window.BLOXD_V3_ASSETS_DB.set("custom_cursor", resized);
          $("x3-cur-prev").src = URL.createObjectURL(resized);
          ext.customCursorEnabled = true;
          ext.customCursorUpdatedAt = Date.now();
          $("x3-cur-on").checked = true;
          saveExt("Custom PNG cursor saved (24x24)!");
        } catch {
          setMsg("Could not load that image.");
        }
      });

      $("x3-cur-del").addEventListener("click", async () => {
        if (window.BLOXD_V3_ASSETS_DB) await window.BLOXD_V3_ASSETS_DB.remove("custom_cursor");
        $("x3-cur-prev").removeAttribute("src");
        ext.customCursorEnabled = false;
        ext.customCursorUpdatedAt = Date.now();
        $("x3-cur-on").checked = false;
        saveExt("Custom PNG cursor removed.");
      });

      $("x3-exp").addEventListener("click", () => {
        chrome.storage.local.get(null, (all) => {
          const blob = new Blob([JSON.stringify(all, null, 2)], { type: "application/json" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "bloxd-theme-studio-v3-backup.json";
          a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 1500);
          setMsg("Backup downloaded!");
        });
      });

      $("x3-imp-btn").addEventListener("click", () => $("x3-imp-file").click());
      $("x3-imp-file").addEventListener("change", (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = () => {
          try {
            const parsed = JSON.parse(String(r.result || ""));
            if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Bad");
            chrome.storage.local.set(parsed, () => {
              setMsg("Backup restored! Reloading...");
              setTimeout(() => location.reload(), 700);
            });
          } catch {
            setMsg("Invalid backup JSON file.");
          }
        };
        r.readAsText(f);
      });

      const close = () => wrap.remove();
      wrap.querySelector(".bt-x3-close").addEventListener("click", close);
      wrap.addEventListener("click", (e) => { if (e.target === wrap) close(); });
      const onEsc = (e) => {
        if (e.key === "Escape") { close(); window.removeEventListener("keydown", onEsc); }
      };
      window.addEventListener("keydown", onEsc);
    });
  }

  function injectLauncherButton() {
    if (!document.body) return;
    ensureStyles();
    const tabs = document.querySelectorAll("[data-tab]");
    let btn = document.getElementById(BTN_ID);

    if (!btn) {
      btn = document.createElement("button");
      btn.id = BTN_ID;
      btn.type = "button";
      btn.textContent = "Extras & Profiles";
      btn.addEventListener("click", openModal);
    }

    if (tabs.length > 0) {
      const lastTab = tabs[tabs.length - 1];
      if (btn.parentElement !== lastTab.parentElement) {
        btn.className = (lastTab.className || "").replace(/\bactive\b/g, "").trim() + " bt-x3-inline";
        lastTab.parentElement.style.flexWrap = "wrap";
        lastTab.insertAdjacentElement("afterend", btn);
      }
    } else if (!btn.parentElement) {
      btn.className = "bt-x3-float";
      document.body.appendChild(btn);
    }
  }

  const obs = new MutationObserver(() => {
    const btn = document.getElementById(BTN_ID);
    const hasTabs = Boolean(document.querySelector("[data-tab]"));
    if (!btn || (hasTabs && btn.classList.contains("bt-x3-float"))) {
      injectLauncherButton();
    }
  });
  obs.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("DOMContentLoaded", () => setTimeout(injectLauncherButton, 300));
  setTimeout(injectLauncherButton, 1200);
})();