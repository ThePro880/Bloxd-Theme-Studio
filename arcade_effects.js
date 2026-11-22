(() => {
  const q = String.fromCharCode(34);
  const svgUrl = (svg) => "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  const svgCur = (svg, hx, hy) => "url(" + q + svgUrl(svg) + q + ") " + hx + " " + hy + ", auto";

  const COIN_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 8 8" shape-rendering="crispEdges">' +
    '<path fill="#000" d="M2 0h4v1H2zM1 1h1v1H1zM6 1h1v1H6zM0 2h1v4H0zM7 2h1v4H7zM1 6h1v1H1zM6 6h1v1H6zM2 7h4v1H2z"/>' +
    '<path fill="#facc15" d="M2 1h4v1H2zM1 2h6v4H1zM2 6h4v1H2z"/>' +
    '<path fill="#fef08a" d="M2 2h2v1H2zM2 3h1v2H2z"/>' +
    '<path fill="#ca8a04" d="M5 3h1v3H5zM3 5h2v1H3z"/>' +
    '</svg>';

  const CROWN_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 8 8" shape-rendering="crispEdges">' +
    '<path fill="#000" d="M0 1h2v1H0zM3 1h2v1H3zM6 1h2v1H6zM0 2h1v5H0zM7 2h1v5H7zM2 2h1v2H2zM5 2h1v2H5zM1 6h6v1H1z"/>' +
    '<path fill="#facc15" d="M1 2h1v4H1zM3 2h2v4H3zM6 2h1v4H6zM2 4h1v2H2zM5 4h1v2H5z"/>' +
    '<rect x="3" y="4" width="2" height="1" fill="#ef4444"/>' +
    '</svg>';

  function makeSwordSvg(blade, shade, hilt) {
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 8 8" shape-rendering="crispEdges">' +
      '<g transform="translate(8,0) scale(-1,1)">' +
      '<path fill="#000" d="M5 0h3v1H5zM4 1h1v1H4zM7 1h1v2H7zM3 2h1v1H3zM0 3h3v1H0zM6 3h1v1H6zM0 4h1v1H0zM2 4h1v1H2zM5 4h1v1H5zM1 5h1v1H1zM3 5h2v1H3zM0 6h1v2H0zM2 6h1v1H2zM4 6h1v2H4zM1 7h1v1H1zM3 7h1v1H3z"/>' +
      '<path fill="' + blade + '" d="M5 1h2v1H5zM4 2h3v1H4zM3 3h3v1H3zM4 4h1v1H4z"/>' +
      '<path fill="' + shade + '" d="M1 4h1v1H1zM3 4h1v1H3zM2 5h1v1H2zM3 6h1v1H3z"/>' +
      '<rect x="1" y="6" width="1" height="1" fill="' + hilt + '"/>' +
      '</g></svg>'
    );
  }

  const AXE_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 8 8" shape-rendering="crispEdges">' +
    '<path fill="#000" d="M1 0h4v1H1zM1 1h1v3H1zM5 1h1v2H5zM6 3h1v2H6zM2 4h2v1H2zM1 5h1v1H1zM3 5h3v1H3zM0 6h1v2H0zM2 6h1v1H2zM1 7h1v1H1z"/>' +
    '<path fill="#38f9c8" d="M2 1h3v1H2zM2 2h1v2H2z"/>' +
    '<path fill="#22a7c0" d="M3 2h2v1H3zM3 3h3v1H3zM4 4h2v1H4z"/>' +
    '<rect x="2" y="5" width="1" height="1" fill="#734f2f"/>' +
    '<rect x="1" y="6" width="1" height="1" fill="#8c6239"/>' +
    '</svg>';

  window.BLOXD_ARCADE_COIN_URL = svgUrl(COIN_SVG);
  window.BLOXD_ARCADE_CROWN_URL = svgUrl(CROWN_SVG);

  window.BLOXD_ARCADE_DEFAULTS = {
    coins: 0,
    owned: [],
    equipped: { cursor: "", trail: "", sound: "", crown: false, goldBorder: false }
  };

  window.BLOXD_ARCADE_CATALOG = [
    { id: "cur_gold_sword", cat: "cursor", name: "Golden Sword", price: 6, svg: makeSwordSvg("#fde047", "#ca8a04", "#785231"), hx: 1, hy: 1 },
    { id: "cur_diamond_axe", cat: "cursor", name: "Diamond Axe", price: 9, svg: AXE_SVG, hx: 3, hy: 1 },
    { id: "cur_obsidian_blade", cat: "cursor", name: "Obsidian Blade", price: 12, svg: makeSwordSvg("#c084fc", "#6b21a8", "#312e81"), hx: 1, hy: 1 },
    { id: "cur_fire_sword", cat: "cursor", name: "Fire Sword", price: 15, svg: makeSwordSvg("#fef08a", "#f97316", "#991b1b"), hx: 1, hy: 1 },

    { id: "trail_rgb", cat: "trail", name: "Rainbow RGB Trail", price: 9, colors: ["#f87171", "#facc15", "#4ade80", "#38bdf8", "#c084fc"] },
    { id: "trail_fire", cat: "trail", name: "Pixel Fire Sparks", price: 12, colors: ["#fef08a", "#fb923c", "#ef4444"] },
    { id: "trail_diamond", cat: "trail", name: "Diamond Shards", price: 12, colors: ["#a5f3fc", "#33f2cc", "#0ea5e9"] },

    { id: "hud_crown", cat: "hud", name: "Pixel Crown (Watermark)", price: 6, preview: CROWN_SVG },
    { id: "hud_gold_border", cat: "hud", name: "Shiny Gold Border", price: 15, colors: ["#fde047", "#eab308", "#a16207"] },

    { id: "sound_8bit", cat: "sound", name: "8-Bit Arcade Pack", price: 6, colors: ["#4ade80", "#22c55e"] },
    { id: "sound_hitmarker", cat: "sound", name: "PvP Hitmarker Pack", price: 9, colors: ["#f87171", "#ffffff"] },

    { id: "theme_matrix", cat: "theme", name: "Matrix Hacker", price: 15, theme: { id: "shop-matrix", name: "Matrix Hacker", mainBg: "#050d07", sidebarBg: "#030804", loadingBg: "#020603", panelBg: "#0a1c10", accent: "#22c55e", text: "#dcfce7", effect: "none" } },
    { id: "theme_gold", cat: "theme", name: "Gold Royale", price: 18, theme: { id: "shop-gold", name: "Gold Royale", mainBg: "#14110b", sidebarBg: "#0d0b07", loadingBg: "#0a0805", panelBg: "#211b10", accent: "#facc15", text: "#fef9c3", effect: "none" } },
    { id: "theme_void", cat: "theme", name: "Void Galaxy", price: 18, theme: { id: "shop-void", name: "Void Galaxy", mainBg: "#0e081a", sidebarBg: "#080410", loadingBg: "#06030d", panelBg: "#1a1030", accent: "#38bdf8", text: "#f3e8ff", effect: "snow" } }
  ];

  let state = { coins: 0, owned: [], equipped: { ...window.BLOXD_ARCADE_DEFAULTS.equipped } };
  let audioCtx = null;

  function playShopSound(id) {
    if (!id || document.pointerLockElement) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!audioCtx) audioCtx = new AC();
      if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      if (id === "sound_8bit") {
        osc.type = "square";
        osc.frequency.setValueAtTime(987, now);
        osc.frequency.setValueAtTime(1318, now + 0.045);
        gain.gain.setValueAtTime(0.055, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
        osc.start(now); osc.stop(now + 0.12);
      } else if (id === "sound_hitmarker") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(1850, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.035);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now); osc.stop(now + 0.045);
      }
    } catch (e) {}
  }

  document.addEventListener("click", (e) => {
    const s = state.equipped && state.equipped.sound;
    if (!s) return;
    if (e.target && e.target.closest && e.target.closest('button, a, select, input[type="checkbox"], [role="button"]')) {
      playShopSound(s);
    }
  }, true);

  function loadState(raw) {
    const d = raw || {};
    state = {
      coins: Number(d.coins) || 0,
      owned: Array.isArray(d.owned) ? d.owned : [],
      equipped: { ...window.BLOXD_ARCADE_DEFAULTS.equipped, ...(d.equipped || {}) }
    };
  }

  if (location.pathname.startsWith("/more_settings")) {
    chrome.storage.local.get(["arcadeShopV3"], (d) => loadState(d.arcadeShopV3));
    chrome.storage.onChanged.addListener((ch, area) => {
      if (area === "local" && ch.arcadeShopV3) loadState(ch.arcadeShopV3.newValue);
    });
    return;
  }

  const STYLE_ID = "bt-shop-fx-style";
  const CUR_ID = "bt-shop-cursor-style";
  let lastTrail = 0, trailCnt = 0, hueIdx = 0;

  function ensureFxStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const st = document.createElement("style");
    st.id = STYLE_ID;
    st.textContent =
      "html.bt-shop-crown #bloxd-x3-watermark .bt-wm-txt::before{content:'';display:inline-block;width:14px;height:14px;margin-right:5px;vertical-align:-2px;background:url(" + q + svgUrl(CROWN_SVG) + q + ") center/contain no-repeat;image-rendering:pixelated}" +
      "@keyframes bt-gold-pulse{0%{border-color:#fde047;box-shadow:0 0 10px rgba(250,204,21,.55)}50%{border-color:#f59e0b;box-shadow:0 0 18px rgba(253,224,71,.85)}100%{border-color:#fde047;box-shadow:0 0 10px rgba(250,204,21,.55)}}" +
      "html.bt-shop-gold-border .bt-x3-pill,html.bt-shop-gold-border .bt-v3-pill,html.bt-shop-gold-border .bt-x3-coords-box,html.bt-shop-gold-border #bloxd-ost-widget{border-color:#facc15!important;animation:bt-gold-pulse 2.2s ease-in-out infinite!important}" +
      ".bt-shop-px{position:fixed!important;pointer-events:none!important;z-index:2147483646!important;border:1px solid #000!important;transform:translate(-50%,-50%);animation:bt-shop-px-out .45s ease-out forwards!important}" +
      "@keyframes bt-shop-px-out{0%{opacity:.95;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-85%) scale(.2)}}";
    document.head.appendChild(st);
  }

  function applyEquipped() {
    ensureFxStyles();
    const eq = state.equipped || {};
    document.documentElement.classList.toggle("bt-shop-crown", Boolean(eq.crown));
    document.documentElement.classList.toggle("bt-shop-gold-border", Boolean(eq.goldBorder));

    let cst = document.getElementById(CUR_ID);
    const curItem = window.BLOXD_ARCADE_CATALOG.find((x) => x.cat === "cursor" && x.id === eq.cursor);
    if (curItem) {
      if (!cst) { cst = document.createElement("style"); cst.id = CUR_ID; document.head.appendChild(cst); }
      cst.textContent = "html, body, div, button, a, input, select { cursor: " + svgCur(curItem.svg, curItem.hx, curItem.hy) + " !important; }";
    } else if (cst) {
      cst.remove();
    }
  }

  window.addEventListener("mousemove", (e) => {
    const tId = state.equipped && state.equipped.trail;
    if (!tId || document.pointerLockElement || !document.body) return;
    const now = performance.now();
    if (now - lastTrail < 28 || trailCnt >= 16) return;
    lastTrail = now; trailCnt++;
    ensureFxStyles();
    const el = document.createElement("div");
    el.className = "bt-shop-px";
    el.setAttribute("data-bt-ignore", "1");
    let color = "#38bdf8", size = 7, rot = "0deg";
    if (tId === "trail_rgb") {
      hueIdx = (hueIdx + 28) % 360;
      color = "hsl(" + hueIdx + ",95%,60%)";
    } else if (tId === "trail_fire") {
      const fc = ["#fef08a", "#fb923c", "#ef4444"];
      color = fc[Math.floor(Math.random() * fc.length)];
      size = 6 + Math.floor(Math.random() * 4);
    } else if (tId === "trail_diamond") {
      const dc = ["#a5f3fc", "#33f2cc", "#0ea5e9"];
      color = dc[Math.floor(Math.random() * dc.length)];
      rot = "45deg";
    }
    el.style.width = size + "px";
    el.style.height = size + "px";
    el.style.background = color;
    el.style.boxShadow = "0 0 6px " + color;
    el.style.left = (e.clientX + (Math.random() * 8 - 4)) + "px";
    el.style.top = (e.clientY + (Math.random() * 8 - 4)) + "px";
    el.style.rotate = rot;
    document.body.appendChild(el);
    setTimeout(() => { el.remove(); trailCnt = Math.max(0, trailCnt - 1); }, 460);
  }, { passive: true });

  chrome.storage.onChanged.addListener((ch, area) => {
    if (area === "local" && ch.arcadeShopV3) { loadState(ch.arcadeShopV3.newValue); applyEquipped(); }
  });
  chrome.storage.local.get(["arcadeShopV3"], (d) => { loadState(d.arcadeShopV3); applyEquipped(); });
})();