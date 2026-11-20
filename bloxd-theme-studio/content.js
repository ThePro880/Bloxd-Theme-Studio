(() => {
  if (location.pathname.startsWith("/more_settings")) return;

  const STYLE_ID = "bloxd-theme-studio-css";
  const FX_ID = "bloxd-theme-studio-fx";
  let currentTheme = null;
  let extra = { bgMode: "solid", bgColor2: "#0f172a", bgImage: "", bgDim: 40, fxCount: 24, fxSpeed: 6, hideFxInGame: true };
  let scanTimer = null;

  function shouldIgnore(el) {
    if (!el || el.nodeType !== 1) return true;
    const tag = el.tagName;
    if (["CANVAS", "IFRAME", "IMG", "VIDEO", "INS", "SCRIPT", "STYLE", "SVG", "PATH"].includes(tag)) return true;
    if (el.id === FX_ID || el.closest(`#${FX_ID}`)) return true;
    const cls = typeof el.className === "string" ? el.className : (el.getAttribute("class") || "");
    if (/(^|[\s_-])(ad|ads|advert|banner|sponsor|adinplay|playwire|cpmstar|google|remove-?ads)([\s_-]|$)/i.test(`${el.id || ""} ${cls}`)) return true;
    return false;
  }

  function isBloxdDarkUI(bgColor) {
    if (!bgColor || bgColor === "transparent" || bgColor === "rgba(0, 0, 0, 0)") return false;
    const m = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!m) return false;
    const a = m[4] !== undefined ? Number(m[4]) : 1;
    return a >= 0.45 && Number(m[1]) <= 85 && Number(m[2]) <= 95 && Number(m[3]) <= 135;
  }

  function isLoadingProgressBar(el, bgColor, rect) {
    if (rect.height < 4 || rect.height > 26 || rect.width < 40) return false;
    const cls = typeof el.className === "string" ? el.className : "";
    if (/progress|load.*bar|bar.*fill/i.test(cls)) return true;
    const m = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    return m ? (Number(m[1]) > 180 && Number(m[2]) > 120 && Number(m[3]) < 80) : false;
  }

  function isLoadingScreenVisible() {
    const text = document.body ? document.body.innerText : "";
    return /Loading Player Info|Loading\.\.\.|Back to Games|Connecting/i.test(text);
  }

  function buildMainBgCSS(theme) {
    const base = theme ? theme.mainBg : "#1b2236";
    if (extra.bgMode === "gradient") {
      return `background: linear-gradient(135deg, ${base}, ${extra.bgColor2 || "#0f172a"}) !important;`;
    }
    if (extra.bgMode === "image" && extra.bgImage && /^https?:\/\//i.test(extra.bgImage)) {
      const dim = Math.min(0.85, Math.max(0, (Number(extra.bgDim) || 40) / 100));
      const safeUrl = extra.bgImage.replace(/"/g, "");
      return `background: linear-gradient(rgba(0,0,0,${dim}), rgba(0,0,0,${dim})), url("${safeUrl}") center/cover fixed no-repeat !important;`;
    }
    return `background-color: ${base} !important; background-image: none !important;`;
  }

  function injectStyles(theme) {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }

    const t = theme || { mainBg: "#1b2236", sidebarBg: "#181d2c", loadingBg: "#181d2c", panelBg: "#242c44", accent: "#38bdf8", text: "#ffffff" };
    const mainBgRule = buildMainBgCSS(t);

    style.textContent = `
      :root {
        --bt-main: ${t.mainBg};
        --bt-sidebar: ${t.sidebarBg};
        --bt-loading: ${t.loadingBg};
        --bt-panel: ${t.panelBg};
        --bt-accent: ${t.accent};
        --bt-text: ${t.text};
      }
      html, body, #root { ${mainBgRule} color: var(--bt-text) !important; }
      [data-bt-zone="main"] { ${mainBgRule} }
      ${theme ? `
      [data-bt-zone="sidebar"] { background-color: var(--bt-sidebar) !important; border-right: 2px solid color-mix(in srgb, var(--bt-accent) 45%, transparent) !important; }
      [data-bt-zone="loading"] { background-color: var(--bt-loading) !important; }
      [data-bt-zone="progress"] { background-color: var(--bt-accent) !important; box-shadow: 0 0 12px var(--bt-accent) !important; }
      [data-bt-zone="panel"] { background-color: var(--bt-panel) !important; border-color: color-mix(in srgb, var(--bt-accent) 55%, transparent) !important; }
      [data-bt-zone="sidebar"] input, [data-bt-zone="main"] input { background-color: var(--bt-panel) !important; color: var(--bt-text) !important; border: 1px solid var(--bt-accent) !important; }
      [data-bt-zone="sidebar"] button, [data-bt-zone="loading"] button { border-color: color-mix(in srgb, var(--bt-accent) 70%, transparent) !important; }
      [data-bt-zone="main"] h1,[data-bt-zone="main"] h2,[data-bt-zone="loading"] h1,[data-bt-zone="loading"] h2,[data-bt-zone="sidebar"] h1,[data-bt-zone="sidebar"] h2 { color: var(--bt-text) !important; }
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-track { background: var(--bt-sidebar); }
      ::-webkit-scrollbar-thumb { background: var(--bt-accent); border-radius: 4px; }
      ` : ""}
      #${FX_ID} { position: fixed; inset: 0; pointer-events: none; z-index: 999999; overflow: hidden; }
      .bt-particle { position: absolute; top: -20px; border-radius: 50%; opacity: 0.75; animation: bt-fall linear infinite; }
      @keyframes bt-fall {
        0% { transform: translateY(-20px) translateX(0); opacity: 0; }
        15% { opacity: 0.85; }
        85% { opacity: 0.75; }
        100% { transform: translateY(105vh) translateX(25px); opacity: 0; }
      }
    `;
  }

  function renderEffect(effectType) {
    const existing = document.getElementById(FX_ID);
    if (existing) existing.remove();
    if (!effectType || effectType === "none") return;

    const container = document.createElement("div");
    container.id = FX_ID;
    const colors = { snow: ["#fff", "#e0f2fe"], spooky: ["#f97316", "#a855f7", "#fde047"], summer: ["#fde047", "#7dd3fc", "#fff"] };
    const palette = colors[effectType] || ["#fff"];
    const count = Math.min(70, Math.max(5, Number(extra.fxCount) || 24));
    const baseSpeed = Math.max(2, 13 - (Number(extra.fxSpeed) || 6));

    for (let i = 0; i < count; i++) {
      const p = document.createElement("span");
      p.className = "bt-particle";
      const size = 4 + Math.random() * 6;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.left = `${Math.random() * 100}%`;
      p.style.background = palette[i % palette.length];
      p.style.animationDuration = `${baseSpeed + Math.random() * 5}s`;
      p.style.animationDelay = `${Math.random() * 5}s`;
      container.appendChild(p);
    }
    document.body.appendChild(container);
  }

  function clearTheme() {
    document.getElementById(STYLE_ID)?.remove();
    document.getElementById(FX_ID)?.remove();
    document.querySelectorAll("[data-bt-zone]").forEach((el) => el.removeAttribute("data-bt-zone"));
  }

  function scanAndTag() {
    const hasCustomBg = extra.bgMode && extra.bgMode !== "solid";
    if (!currentTheme && !hasCustomBg) return;
    if (!document.body) return;

    const fx = document.getElementById(FX_ID);
    if (fx) fx.style.display = (extra.hideFxInGame && document.pointerLockElement) ? "none" : "block";

    const loadingActive = isLoadingScreenVisible();
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    document.querySelectorAll("div, section, aside, nav, main, header").forEach((el) => {
      if (shouldIgnore(el) || el.closest("iframe, ins")) return;
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const bg = window.getComputedStyle(el).backgroundColor;

      if (loadingActive && isLoadingProgressBar(el, bg, rect)) {
        el.setAttribute("data-bt-zone", "progress");
        return;
      }
      if (!isBloxdDarkUI(bg)) return;
      if (el.querySelector("img") && rect.width < 320 && rect.height < 220 && rect.left > 240) return;

      if (rect.left <= 15 && rect.width >= 180 && rect.width <= 380 && rect.height >= winH * 0.6) {
        el.setAttribute("data-bt-zone", "sidebar");
      } else if (loadingActive && rect.width >= winW * 0.5 && rect.height >= winH * 0.5) {
        el.setAttribute("data-bt-zone", "loading");
      } else if (rect.width >= winW * 0.45 && rect.height >= winH * 0.45) {
        el.setAttribute("data-bt-zone", "main");
      } else if (el.closest('[data-bt-zone="sidebar"]') || rect.height < 180) {
        el.setAttribute("data-bt-zone", "panel");
      }
    });
  }

  function scheduleScan() {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(scanAndTag, 120);
  }

  function applyAll() {
    const hasCustomBg = extra.bgMode && extra.bgMode !== "solid";
    if (!currentTheme && !hasCustomBg) {
      clearTheme();
      return;
    }
    injectStyles(currentTheme);
    renderEffect(currentTheme ? currentTheme.effect : "none");
    scanAndTag();
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === "APPLY_THEME") {
      currentTheme = msg.theme;
      applyAll();
    }
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes.activeTheme) currentTheme = changes.activeTheme.newValue || null;
    if (changes.extraSettings) extra = { ...extra, ...(changes.extraSettings.newValue || {}) };
    applyAll();
  });

  new MutationObserver(scheduleScan).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("pointerlockchange", scheduleScan);
  window.addEventListener("resize", scheduleScan);

  chrome.storage.local.get(["activeTheme", "extraSettings"], (data) => {
    currentTheme = data.activeTheme || null;
    if (data.extraSettings) extra = { ...extra, ...data.extraSettings };
    applyAll();
  });
})();