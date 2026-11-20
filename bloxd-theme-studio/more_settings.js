(() => {
  if (!location.pathname.startsWith("/more_settings")) return;

  const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="4" y="4" width="56" height="56" rx="10" fill="#151c30" stroke="#60a5fa" stroke-width="6"/><rect x="13" y="13" width="18" height="18" rx="2" fill="#facc15" stroke="#0f1424" stroke-width="2.5"/><rect x="33" y="13" width="18" height="18" rx="2" fill="#a855f7" stroke="#0f1424" stroke-width="2.5"/><rect x="13" y="33" width="18" height="18" rx="2" fill="#38bdf8" stroke="#0f1424" stroke-width="2.5"/><rect x="33" y="33" width="18" height="18" rx="2" fill="#ef4444" stroke="#0f1424" stroke-width="2.5"/></svg>`;

  function createHdLogoPng() {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext("2d");

    ctx.fillStyle = "#151c30";
    ctx.strokeStyle = "#60a5fa";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(5, 5, 54, 54, 10);
    ctx.fill();
    ctx.stroke();

    const tiles = [
      { x: 13, y: 13, fill: "#facc15" },
      { x: 33, y: 13, fill: "#a855f7" },
      { x: 13, y: 33, fill: "#38bdf8" },
      { x: 33, y: 33, fill: "#ef4444" }
    ];

    for (const t of tiles) {
      ctx.fillStyle = t.fill;
      ctx.strokeStyle = "#0f1424";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(t.x, t.y, 18, 18, 2);
      ctx.fill();
      ctx.stroke();
    }

    return c.toDataURL("image/png");
  }

  function setTabIcon(pngUrl) {
    document.querySelectorAll('link[rel*="icon"]').forEach((el) => el.remove());
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/png";
    link.href = pngUrl;
    document.head.appendChild(link);
  }

  const hideStyle = document.createElement("style");
  hideStyle.textContent = "html,body{background:#181d2c!important;margin:0;overflow:hidden}";
  document.documentElement.appendChild(hideStyle);

  const killer = new MutationObserver((muts) => {
    for (const m of muts) {
      for (const n of m.addedNodes) {
        if (n.nodeName === "SCRIPT" || n.nodeName === "IFRAME") n.remove();
      }
    }
  });
  killer.observe(document.documentElement, { childList: true, subtree: true });

  const BONUS_PRESETS = [
    { id: "navidad", name: "Christmas", mainBg: "#0d2b22", sidebarBg: "#2b0c12", loadingBg: "#0a221b", panelBg: "#174234", accent: "#ef4444", text: "#f8fafc", effect: "snow" },
    { id: "halloween", name: "Halloween", mainBg: "#180d26", sidebarBg: "#11081c", loadingBg: "#140a21", panelBg: "#2b1644", accent: "#f97316", text: "#ffedd5", effect: "spooky" },
    { id: "verano", name: "Summer", mainBg: "#0369a1", sidebarBg: "#0c4a6e", loadingBg: "#0284c7", panelBg: "#075985", accent: "#facc15", text: "#ffffff", effect: "summer" },
    { id: "neon", name: "Midnight Neon", mainBg: "#0b1026", sidebarBg: "#070a1a", loadingBg: "#090d20", panelBg: "#141c3d", accent: "#00f5d4", text: "#e0f2fe", effect: "spooky" },
    { id: "sakura", name: "Sakura Blossom", mainBg: "#2b1224", sidebarBg: "#1f0c1a", loadingBg: "#240e1e", panelBg: "#3d1a33", accent: "#f472b6", text: "#fdf2f8", effect: "snow" }
  ];

  const DEFAULT_EXTRA = { bgMode: "solid", bgColor2: "#0f172a", bgImage: "", bgDim: 40, fxCount: 24, fxSpeed: 6, hideFxInGame: true };

  function buildPage() {
    killer.disconnect();

    const logoPng = createHdLogoPng();

    document.head.innerHTML = `<meta charset="UTF-8"><title>Bloxd theme creator</title><link rel="icon" type="image/png" href="${logoPng}"><style>
      *{box-sizing:border-box;margin:0;padding:0}
      html,body{width:100%;height:100%;background:#181d2c;color:#f1f5f9;font-family:"Segoe UI",system-ui,sans-serif;overflow:hidden;user-select:none}
      .app{display:flex;flex-direction:column;height:100vh;width:100vw}
      .topbar{height:56px;background:#1d2336;border-bottom:2px solid #2b3450;display:flex;align-items:center;justify-content:space-between;padding-left:16px;flex-shrink:0}
      .brand{display:flex;align-items:center;gap:10px;font-weight:800;font-size:15px}
      .brand-logo{width:30px;height:30px;display:inline-flex;flex-shrink:0}
      .brand-logo svg{width:100%;height:100%}
      .ver-pill{background:#28314c;border:1px solid #3f4c73;color:#facc15;font-size:11px;padding:2px 7px;border-radius:3px}
      .top-tabs{display:flex;height:100%;gap:22px;align-items:center}
      .t-tab{height:100%;display:flex;align-items:center;gap:7px;background:none;border:0;border-bottom:3px solid transparent;color:#e2e8f0;font-size:15px;font-weight:700;cursor:pointer;padding:0 6px}
      .t-tab:hover{color:#fff}
      .t-tab.active{color:#facc15;border-bottom-color:#facc15}
      .t-tab.rainbow span:first-child{background:linear-gradient(90deg,#f87171,#facc15,#4ade80,#38bdf8,#c084fc);-webkit-background-clip:text;color:transparent;font-weight:800}
      .keycap{background:#2d3652;border:1px solid #49567d;color:#cbd5e1;font-size:11px;padding:1px 6px;border-radius:3px;font-weight:800}
      .close-x{width:76px;height:100%;background:#e04444;border:0;border-bottom:4px solid #a82828;cursor:pointer;display:flex;align-items:center;justify-content:center}
      .close-x:hover{background:#ef5353}
      .body{display:flex;flex:1;min-height:0}
      .sidebar{width:230px;background:#161b29;border-right:2px solid #2b3450;padding:12px 10px;overflow-y:auto;display:flex;flex-direction:column;gap:4px;flex-shrink:0}
      .s-item{display:flex;align-items:center;gap:12px;width:100%;background:transparent;border:1px solid transparent;border-radius:4px;padding:10px 12px;color:#cbd5e1;font-size:14px;font-weight:700;cursor:pointer;text-align:left}
      .s-item:hover{background:#222a40;color:#fff}
      .s-item.active{background:#27314d;border-color:#44527a;color:#fff}
      .s-item svg{width:18px;height:18px;flex-shrink:0;opacity:0.9}
      .main{flex:1;background:#131824;padding:24px 36px;overflow-y:auto}
      .wrap{max-width:780px;margin:0 auto;display:flex;flex-direction:column;gap:14px}
      .card{background:#1b2234;border:1.5px solid #354061;border-radius:3px;padding:16px 18px}
      .card-title{font-size:14px;font-weight:700;color:#e2e8f0;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center}
      .sub{font-size:12px;color:#94a3b8;font-weight:600}
      .row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}
      .row:last-child{margin-bottom:0}
      .bloxd-inp{width:100%;background:#131824;border:1.5px solid #465378;color:#fff;padding:10px 12px;font-size:14px;font-weight:700;border-radius:2px;outline:none}
      .bloxd-inp:focus{border-color:#3b82f6}
      textarea.bloxd-inp{min-height:78px;resize:vertical;font-family:monospace;font-size:12px}
      select.bloxd-inp{cursor:pointer}
      .btn-blue{background:#3b82f6;border:0;border-bottom:4px solid #1d4ed8;color:#fff;font-size:14px;font-weight:800;padding:9px 20px;border-radius:3px;cursor:pointer;text-shadow:0 1px 2px #0008}
      .btn-blue:hover{background:#60a5fa}
      .btn-grey{background:#94a3b8;border:0;border-bottom:4px solid #64748b;color:#fff;font-size:14px;font-weight:800;padding:9px 20px;border-radius:3px;cursor:pointer;text-shadow:0 1px 2px #000a}
      .btn-grey:hover{background:#cbd5e1;color:#0f172a;text-shadow:none}
      .btn-out{background:#181d2c;border:1.5px solid #cbd5e1;color:#fff;font-size:12px;font-weight:700;padding:6px 14px;border-radius:2px;cursor:pointer}
      .btn-out:hover{background:#29334f}
      .btn-red{background:#dc2626;border:0;border-bottom:4px solid #991b1b;color:#fff;font-size:13px;font-weight:800;padding:8px 16px;border-radius:3px;cursor:pointer}
      .chk-row{display:flex;align-items:center;gap:12px;cursor:pointer;font-size:14px;font-weight:700}
      .chk-row input{width:18px;height:18px;accent-color:#3b82f6;cursor:pointer}
      .preview-box{height:95px;border:1.5px solid #465378;border-radius:3px;display:flex;align-items:center;justify-content:center;font-weight:800;text-shadow:0 2px 4px #000}
      .preset-list{display:flex;flex-direction:column;gap:8px}
      .p-row{display:flex;align-items:center;justify-content:space-between;background:#242d47;border:1px solid #3c486e;padding:10px 14px;border-radius:3px}
      .p-left{display:flex;align-items:center;gap:12px;font-size:14px;font-weight:800}
      .p-sw{width:28px;height:28px;border-radius:3px;border:2px solid #0f1320}
      .toast{position:fixed;bottom:20px;right:24px;background:#22c55e;color:#052e16;font-weight:800;font-size:13px;padding:10px 16px;border-radius:3px;box-shadow:0 4px 16px #0008;opacity:0;pointer-events:none;transition:opacity .2s}
      .toast.show{opacity:1}
      .log-item{padding:8px 0;border-bottom:1px solid #2b3450;font-size:13px;line-height:1.5;color:#cbd5e1}
      .log-item:last-child{border:0}
      .log-item b{color:#facc15}
      ::-webkit-scrollbar{width:7px}
      ::-webkit-scrollbar-track{background:#161b29}
      ::-webkit-scrollbar-thumb{background:#4b5882;border-radius:3px}
    </style>`;

    document.title = "Bloxd theme creator";

    // Refresca el ícono cuando la página termina de cargar por completo
    if (document.readyState === "complete") {
      setTabIcon(logoPng);
    } else {
      window.addEventListener("load", () => setTabIcon(logoPng), { once: true });
    }

    document.body.innerHTML = `
      <div class="app">
        <header class="topbar">
          <div class="brand">
            <span class="brand-logo">${LOGO_SVG}</span>
            <span>Bloxd Theme Studio</span>
            <span class="ver-pill">v2.0</span>
          </div>
          <nav class="top-tabs">
            <button class="t-tab active" data-sec="backgrounds"><span>Settings</span><span class="keycap">O</span></button>
            <button class="t-tab" data-sec="saved"><span>My Themes</span><span class="keycap">T</span></button>
            <button class="t-tab" data-sec="share"><span>Share</span><span class="keycap">S</span></button>
            <button class="t-tab rainbow" data-sec="presets"><span>Presets</span></button>
          </nav>
          <button id="btn-close-bloxd" class="close-x" title="Back to Bloxd.io (Esc)">
            <svg width="30" height="30" viewBox="0 0 24 24"><path d="M5 5 L19 19 M19 5 L5 19" stroke="#111" stroke-width="5.5" stroke-linecap="square"/><path d="M5 5 L19 19 M19 5 L5 19" stroke="#fff" stroke-width="3" stroke-linecap="square"/></svg>
          </button>
        </header>

        <div class="body">
          <aside class="sidebar">
            <button class="s-item active" data-sec="backgrounds">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              <span>Backgrounds</span>
            </button>
            <button class="s-item" data-sec="effects">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z"/></svg>
              <span>Effects &amp; Particles</span>
            </button>
            <button class="s-item" data-sec="presets">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 100 20c1.5 0 2.5-1 2.5-2.2 0-.6-.2-1.1-.6-1.5-.4-.4-.6-.9-.6-1.5 0-1.2 1-2.2 2.2-2.2H18a4 4 0 004-4c0-4.8-4.5-8.6-10-8.6z"/></svg>
              <span>Theme Presets</span>
            </button>
            <button class="s-item" data-sec="saved">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
              <span>Saved Themes</span>
            </button>
            <button class="s-item" data-sec="share">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></svg>
              <span>Import / Export</span>
            </button>
            <button class="s-item" data-sec="changelog">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
              <span>Update Log</span>
            </button>
            <button class="s-item" data-sec="info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></svg>
              <span>Info</span>
            </button>
          </aside>

          <main class="main">
            <div id="content-wrap" class="wrap"></div>
          </main>
        </div>
      </div>
      <div id="toast" class="toast">Saved!</div>
    `;

    let activeTheme = null;
    let savedThemes = [];
    let extra = { ...DEFAULT_EXTRA };
    let currentSection = "backgrounds";

    const wrap = document.getElementById("content-wrap");
    const toast = document.getElementById("toast");

    function showToast(msg) {
      toast.textContent = msg;
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 2000);
    }

    function goBackToBloxd() {
      window.location.href = "https://bloxd.io/";
    }

    document.getElementById("btn-close-bloxd").addEventListener("click", goBackToBloxd);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") goBackToBloxd();
    });

    function switchSection(sec) {
      currentSection = sec;
      document.querySelectorAll(".s-item").forEach((b) => b.classList.toggle("active", b.dataset.sec === sec));
      document.querySelectorAll(".t-tab").forEach((b) => {
        const match = b.dataset.sec === sec || (b.dataset.sec === "backgrounds" && sec === "effects");
        b.classList.toggle("active", match);
      });
      renderSection();
    }

    document.querySelectorAll("[data-sec]").forEach((btn) => {
      btn.addEventListener("click", () => switchSection(btn.dataset.sec));
    });

    function renderSection() {
      if (currentSection === "backgrounds") {
        const baseColor = activeTheme ? activeTheme.mainBg : "#1b2236";
        wrap.innerHTML = `
          <div class="card">
            <div class="card-title"><span>Custom Games Background</span><span class="sub">Applies behind Bloxd.io games</span></div>
            <div class="row">
              <span>Background Style</span>
              <select id="bg-mode" class="bloxd-inp" style="width:220px">
                <option value="solid" ${extra.bgMode === "solid" ? "selected" : ""}>Solid Color (From Theme)</option>
                <option value="gradient" ${extra.bgMode === "gradient" ? "selected" : ""}>2-Color Gradient</option>
                <option value="image" ${extra.bgMode === "image" ? "selected" : ""}>Custom Image (URL)</option>
              </select>
            </div>
            <div class="row">
              <span>Second Gradient Color</span>
              <input type="color" id="bg-c2" value="${extra.bgColor2 || "#0f172a"}" style="width:60px;height:32px;cursor:pointer">
            </div>
            <div class="row" style="flex-direction:column;align-items:stretch">
              <span>Image URL (https://...)</span>
              <input type="text" id="bg-url" class="bloxd-inp" placeholder="https://example.com/wallpaper.jpg" value="${extra.bgImage || ""}">
            </div>
            <div class="row">
              <span>Image Darkness (<span id="dim-val">${extra.bgDim}</span>%)</span>
              <input type="range" id="bg-dim" min="0" max="85" value="${extra.bgDim}" style="width:220px">
            </div>
            <div id="bg-preview" class="preview-box">Background Preview</div>
            <div class="row" style="margin-top:12px;justify-content:flex-end">
              <button id="btn-bg-reset" class="btn-grey">Reset</button>
              <button id="btn-bg-save" class="btn-blue">Save Background</button>
            </div>
          </div>
        `;
        const modeEl = document.getElementById("bg-mode");
        const c2El = document.getElementById("bg-c2");
        const urlEl = document.getElementById("bg-url");
        const dimEl = document.getElementById("bg-dim");
        const prev = document.getElementById("bg-preview");

        const updatePrev = () => {
          document.getElementById("dim-val").textContent = dimEl.value;
          if (modeEl.value === "gradient") {
            prev.style.background = `linear-gradient(135deg, ${baseColor}, ${c2El.value})`;
          } else if (modeEl.value === "image" && /^https?:\/\//i.test(urlEl.value.trim())) {
            const d = Number(dimEl.value) / 100;
            prev.style.background = `linear-gradient(rgba(0,0,0,${d}),rgba(0,0,0,${d})), url("${urlEl.value.trim()}") center/cover`;
          } else {
            prev.style.background = baseColor;
          }
        };
        [modeEl, c2El, urlEl, dimEl].forEach((el) => el.addEventListener("input", updatePrev));
        updatePrev();

        document.getElementById("btn-bg-save").addEventListener("click", async () => {
          extra = { ...extra, bgMode: modeEl.value, bgColor2: c2El.value, bgImage: urlEl.value.trim(), bgDim: Number(dimEl.value) };
          await chrome.storage.local.set({ extraSettings: extra });
          showToast("Background saved!");
        });
        document.getElementById("btn-bg-reset").addEventListener("click", async () => {
          extra = { ...extra, bgMode: "solid", bgImage: "", bgDim: 40 };
          await chrome.storage.local.set({ extraSettings: extra });
          renderSection();
          showToast("Background reset");
        });
        return;
      }

      if (currentSection === "effects") {
        wrap.innerHTML = `
          <div class="card">
            <div class="card-title"><span>Animated Particles</span><span class="sub">Snow, Sparks &amp; Bubbles</span></div>
            <div class="row">
              <span>Particle Amount (<span id="fx-c-val">${extra.fxCount}</span>)</span>
              <input type="range" id="fx-count" min="5" max="60" value="${extra.fxCount}" style="width:240px">
            </div>
            <div class="row">
              <span>Fall Speed (<span id="fx-s-val">${extra.fxSpeed}</span>)</span>
              <input type="range" id="fx-speed" min="1" max="10" value="${extra.fxSpeed}" style="width:240px">
            </div>
          </div>
          <div class="card">
            <label class="chk-row">
              <input type="checkbox" id="fx-hide" ${extra.hideFxInGame ? "checked" : ""}>
              <span>Hide animated particles while playing (Better FPS)</span>
            </label>
          </div>
          <div class="row" style="justify-content:flex-end">
            <button id="btn-fx-save" class="btn-blue">Save Effects</button>
          </div>
        `;
        const cEl = document.getElementById("fx-count");
        const sEl = document.getElementById("fx-speed");
        const hEl = document.getElementById("fx-hide");
        cEl.addEventListener("input", () => document.getElementById("fx-c-val").textContent = cEl.value);
        sEl.addEventListener("input", () => document.getElementById("fx-s-val").textContent = sEl.value);
        document.getElementById("btn-fx-save").addEventListener("click", async () => {
          extra = { ...extra, fxCount: Number(cEl.value), fxSpeed: Number(sEl.value), hideFxInGame: hEl.checked };
          await chrome.storage.local.set({ extraSettings: extra });
          showToast("Effects updated!");
        });
        return;
      }

      if (currentSection === "presets") {
        wrap.innerHTML = `
          <div class="card">
            <div class="card-title"><span>Instant &amp; Bonus Presets</span><span class="sub">Click Apply to equip on Bloxd.io</span></div>
            <div class="preset-list" id="preset-list"></div>
          </div>
        `;
        const list = document.getElementById("preset-list");
        BONUS_PRESETS.forEach((p) => {
          const isCur = activeTheme && activeTheme.id === p.id;
          const row = document.createElement("div");
          row.className = "p-row";
          row.innerHTML = `
            <div class="p-left">
              <span class="p-sw" style="background:linear-gradient(135deg,${p.mainBg} 50%,${p.accent} 50%)"></span>
              <span>${p.name}</span>
            </div>
            <button class="${isCur ? "btn-grey" : "btn-blue"}">${isCur ? "Active" : "Apply"}</button>
          `;
          row.querySelector("button").addEventListener("click", async () => {
            activeTheme = p;
            await chrome.storage.local.set({ activeTheme: p });
            renderSection();
            showToast(`${p.name} applied!`);
          });
          list.appendChild(row);
        });
        return;
      }

      if (currentSection === "saved") {
        wrap.innerHTML = `
          <div class="card">
            <div class="card-title"><span>Your Saved Themes (${savedThemes.length})</span><button id="btn-def" class="btn-out">Restore Default Bloxd</button></div>
            <div class="preset-list" id="saved-wrap"></div>
          </div>
        `;
        document.getElementById("btn-def").addEventListener("click", async () => {
          activeTheme = null;
          await chrome.storage.local.set({ activeTheme: null });
          renderSection();
          showToast("Default Bloxd theme restored");
        });
        const sw = document.getElementById("saved-wrap");
        if (!savedThemes.length) {
          sw.innerHTML = `<div class="sub" style="padding:12px 0">No saved themes yet. Create one in the extension popup or import a code!</div>`;
          return;
        }
        savedThemes.forEach((t) => {
          const row = document.createElement("div");
          row.className = "p-row";
          row.innerHTML = `
            <div class="p-left">
              <span class="p-sw" style="background:linear-gradient(135deg,${t.mainBg} 50%,${t.accent} 50%)"></span>
              <span>${t.name}</span>
            </div>
            <div style="display:flex;gap:8px">
              <button class="btn-blue b-use">Apply</button>
              <button class="btn-out b-cp">Copy Code</button>
              <button class="btn-red b-rm">Delete</button>
            </div>
          `;
          row.querySelector(".b-use").addEventListener("click", async () => {
            activeTheme = t;
            await chrome.storage.local.set({ activeTheme: t });
            showToast(`"${t.name}" applied!`);
          });
          row.querySelector(".b-cp").addEventListener("click", () => {
            navigator.clipboard.writeText(btoa(unescape(encodeURIComponent(JSON.stringify(t)))));
            showToast("Theme code copied!");
          });
          row.querySelector(".b-rm").addEventListener("click", async () => {
            savedThemes = savedThemes.filter((x) => x.id !== t.id);
            await chrome.storage.local.set({ savedThemes });
            renderSection();
            showToast("Theme deleted");
          });
          sw.appendChild(row);
        });
        return;
      }

      if (currentSection === "share") {
        const exportCode = activeTheme ? btoa(unescape(encodeURIComponent(JSON.stringify(activeTheme)))) : "";
        wrap.innerHTML = `
          <div class="card">
            <div class="card-title"><span>Export Active Theme</span><span class="sub">Share this code with friends</span></div>
            <textarea id="exp-box" class="bloxd-inp" readonly placeholder="Apply a theme first to export its code...">${exportCode}</textarea>
            <div class="row" style="margin-top:10px;justify-content:flex-end">
              <button id="btn-copy-exp" class="btn-blue">Copy Code</button>
            </div>
          </div>
          <div class="card">
            <div class="card-title"><span>Import Theme Code</span><span class="sub">Paste a friend's code below</span></div>
            <textarea id="imp-box" class="bloxd-inp" placeholder="Paste theme code here..."></textarea>
            <div class="row" style="margin-top:10px;justify-content:flex-end">
              <button id="btn-import" class="btn-blue">Import &amp; Apply</button>
            </div>
          </div>
        `;
        document.getElementById("btn-copy-exp").addEventListener("click", () => {
          if (!exportCode) return showToast("No active theme to export");
          navigator.clipboard.writeText(exportCode);
          showToast("Code copied to clipboard!");
        });
        document.getElementById("btn-import").addEventListener("click", async () => {
          try {
            const raw = document.getElementById("imp-box").value.trim();
            const parsed = JSON.parse(decodeURIComponent(escape(atob(raw))));
            if (!parsed.mainBg || !parsed.sidebarBg) throw new Error();
            parsed.id = "imp-" + Date.now();
            parsed.name = parsed.name || "Imported Theme";
            savedThemes.unshift(parsed);
            activeTheme = parsed;
            await chrome.storage.local.set({ savedThemes, activeTheme });
            showToast(`Imported "${parsed.name}"!`);
          } catch {
            showToast("Invalid theme code");
          }
        });
        return;
      }

      if (currentSection === "changelog") {
        wrap.innerHTML = `
          <div class="card">
            <div class="card-title"><span>Update Log</span><span class="sub">Bloxd Theme Studio</span></div>
            <div class="log-item"><b>v2.0</b> — Added <code>bloxd.io/more_settings</code> page in original Bloxd style, custom gradient &amp; image backgrounds, particle controls, bonus themes (Midnight Neon &amp; Sakura), and Import/Export theme codes.</div>
            <div class="log-item"><b>v1.0</b> — First release with Christmas, Halloween, and Summer instant themes, custom color creator, saved themes, and Bloxd-styled popup UI.</div>
          </div>
        `;
        return;
      }

      if (currentSection === "info") {
        wrap.innerHTML = `
          <div class="card">
            <div class="card-title"><span>Bloxd.io Theme Studio v2.0</span></div>
            <p class="sub" style="line-height:1.6">Custom browser extension for personalizing Bloxd.io without touching ads or game performance. Press the red <b>X</b> button or <b>Esc</b> at any time to return to Bloxd.io.</p>
          </div>
          <div class="card">
            <div class="card-title"><span>Danger Zone</span></div>
            <button id="btn-wipe" class="btn-red">Reset All Settings &amp; Saved Themes</button>
          </div>
        `;
        document.getElementById("btn-wipe").addEventListener("click", async () => {
          await chrome.storage.local.clear();
          activeTheme = null;
          savedThemes = [];
          extra = { ...DEFAULT_EXTRA };
          showToast("All extension data cleared");
        });
      }
    }

    chrome.storage.local.get(["activeTheme", "savedThemes", "extraSettings"], (data) => {
      activeTheme = data.activeTheme || null;
      savedThemes = data.savedThemes || [];
      if (data.extraSettings) extra = { ...DEFAULT_EXTRA, ...data.extraSettings };
      renderSection();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildPage, { once: true });
  } else {
    buildPage();
  }
})();