(() => {
  if (location.pathname.startsWith("/more_settings")) return;

  const STYLE_ID = "bloxd-theme-studio-css";
  const FX_ID = "bloxd-theme-studio-fx";
  const OST_ID = "bloxd-ost-widget";
  const YT_SUPPORTED_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  let currentTheme = null;
  let extra = { bgMode: "solid", bgColor2: "#0f172a", bgImage: "", bgDim: 40, fxCount: 24, fxSpeed: 6, hideFxInGame: true };
  let musicCfg = { enabled: true, minimized: false, activePlaylistId: "survival", enabledPlaylists: ["youtube", "custom", "all", "survival", "pirates"], volume: 0.5, playbackRate: 1, posX: null, posY: null, customUpdatedAt: 0 };
  let customTracks = [];
  let ytTracks = [];
  let scanTimer = null;

  // --- MOTOR DE TEMAS ---
  function shouldIgnore(el) {
    if (!el || el.nodeType !== 1) return true;
    const tag = el.tagName;
    if (["CANVAS", "IFRAME", "IMG", "VIDEO", "AUDIO", "INS", "SCRIPT", "STYLE", "SVG", "PATH"].includes(tag)) return true;
    if (el.id === FX_ID || el.closest(`#${FX_ID}`) || el.id === OST_ID || el.closest(`#${OST_ID}`)) return true;
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
      #${FX_ID} { position: fixed; inset: 0; pointer-events: none; z-index: 999990; overflow: hidden; }
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
    document.getElementById(FX_ID)?.remove();
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

  // --- MINI REPRODUCTOR FLOTANTE: OSTS + MP3 LOCALES + YOUTUBE + VELOCIDAD ---
  const audio = new Audio();
  let currentBlobUrl = null;
  let ytIframe = null;
  let ytReady = false;
  let ytCurrentVideoId = null;
  let showYtVideo = false;
  let trackIdx = 0;
  let urlTry = 0;
  let failCount = 0;
  let isPlaying = false;
  let wantPlay = false;
  let stepDir = 1;
  let drawerOpen = false;

  function getConfiguredRate() {
    const r = Number(musicCfg.playbackRate);
    if (Number.isNaN(r) || r <= 0) return 1;
    return Math.min(2, Math.max(0.05, r));
  }

  function getClosestYtRate(rate) {
    let best = 1;
    let minDiff = Infinity;
    for (const r of YT_SUPPORTED_RATES) {
      const diff = Math.abs(r - rate);
      if (diff < minDiff) {
        minDiff = diff;
        best = r;
      }
    }
    return best;
  }

  function applyPlaybackSpeed() {
    const rate = getConfiguredRate();
    const safeAudioRate = Math.min(2, Math.max(0.0625, rate));
    try {
      audio.playbackRate = safeAudioRate;
    } catch {
      audio.playbackRate = 1;
    }
    ytCmd("setPlaybackRate", [getClosestYtRate(rate)]);
  }

  function buildMiniSpeedOptions(selectedRate) {
    const cur = Math.round((Number(selectedRate) || 1) * 100);
    let html = "";
    for (let p = 5; p <= 200; p += 5) {
      const val = (p / 100).toFixed(2);
      const label = p === 100 ? "1.00x (Normal)" : `${val}x`;
      html += `<option value="${val}" ${p === cur ? "selected" : ""}>${label}</option>`;
    }
    return html;
  }

  audio.addEventListener("loadedmetadata", applyPlaybackSpeed);

  async function refreshCustomTracks() {
    if (!window.BLOXD_CUSTOM_DB) return;
    try {
      customTracks = await window.BLOXD_CUSTOM_DB.getAll();
    } catch {
      customTracks = [];
    }
  }

  function getAllPlaylists() {
    const builtIn = window.BLOXD_OST_PLAYLISTS || [];
    const list = [];
    if (ytTracks.length) {
      list.push({
        id: "youtube",
        name: "youtube",
        tracks: ytTracks.map((t) => ({
          id: t.id,
          videoId: t.videoId,
          title: t.title,
          isYouTube: true
        }))
      });
    }
    if (customTracks.length) {
      list.push({
        id: "custom",
        name: "my music",
        tracks: customTracks.map((t) => ({
          id: t.id,
          title: t.title,
          blob: t.blob,
          isLocal: true
        }))
      });
    }
    return [...list, ...builtIn];
  }

  function getEnabledPlaylists() {
    const all = getAllPlaylists();
    const allowed = Array.isArray(musicCfg.enabledPlaylists) && musicCfg.enabledPlaylists.length
      ? musicCfg.enabledPlaylists
      : all.map((p) => p.id);
    const list = all.filter((p) => allowed.includes(p.id));
    return list.length ? list : all;
  }

  function getActivePlaylist() {
    const list = getEnabledPlaylists();
    return list.find((p) => p.id === musicCfg.activePlaylistId) || list[0] || { id: "none", name: "no playlist", tracks: [] };
  }

  function revokeBlobUrl() {
    if (currentBlobUrl) {
      URL.revokeObjectURL(currentBlobUrl);
      currentBlobUrl = null;
    }
  }

  function resetAudioSource() {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    revokeBlobUrl();
  }

  function ytCmd(func, args = []) {
    if (!ytIframe || !ytIframe.contentWindow) return;
    ytIframe.contentWindow.postMessage(JSON.stringify({ event: "command", func, args }), "*");
  }

  function destroyYtIframe() {
    if (ytIframe) {
      ytIframe.remove();
      ytIframe = null;
    }
    ytReady = false;
    ytCurrentVideoId = null;
  }

  function stopAllPlayback() {
    wantPlay = false;
    isPlaying = false;
    resetAudioSource();
    destroyYtIframe();
  }

  function buildYtEmbedUrl(videoId) {
    const params = new URLSearchParams({
      autoplay: "1",
      enablejsapi: "1",
      controls: "1",
      rel: "0",
      modestbranding: "1",
      playsinline: "1",
      origin: location.origin
    });
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  }

  function sendYtHandshake() {
    if (!ytIframe || !ytIframe.contentWindow) return;
    ytIframe.contentWindow.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), "*");
    ytCmd("addEventListener", ["onStateChange"]);
    ytCmd("addEventListener", ["onError"]);
    ytCmd("addEventListener", ["onReady"]);
  }

  function mountYtVideo(videoId) {
    const root = document.getElementById(OST_ID);
    const ytHost = root ? root.querySelector(".bt-yt-wrap") : null;
    if (!ytHost) return;

    ytCurrentVideoId = videoId;
    const volPct = Math.round(Math.min(1, Math.max(0, Number(musicCfg.volume ?? 0.5))) * 100);
    const ytRate = getClosestYtRate(getConfiguredRate());

    if (ytIframe && ytReady) {
      ytCmd("loadVideoById", [videoId]);
      ytCmd("setVolume", [volPct]);
      ytCmd("setPlaybackRate", [ytRate]);
      return;
    }

    destroyYtIframe();
    ytCurrentVideoId = videoId;

    const iframe = document.createElement("iframe");
    iframe.className = "bt-yt-frame";
    iframe.allow = "autoplay; encrypted-media; picture-in-picture";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.src = buildYtEmbedUrl(videoId);
    iframe.addEventListener("load", () => {
      sendYtHandshake();
      setTimeout(sendYtHandshake, 450);
      setTimeout(() => {
        ytCmd("setVolume", [volPct]);
        ytCmd("setPlaybackRate", [getClosestYtRate(getConfiguredRate())]);
      }, 750);
    });

    ytHost.innerHTML = "";
    ytHost.appendChild(iframe);
    ytIframe = iframe;
  }

  function handleYtState(state) {
    if (state === 1) {
      ytReady = true;
      isPlaying = true;
      failCount = 0;
      const volPct = Math.round(Math.min(1, Math.max(0, Number(musicCfg.volume ?? 0.5))) * 100);
      ytCmd("setVolume", [volPct]);
      ytCmd("setPlaybackRate", [getClosestYtRate(getConfiguredRate())]);
      updatePlayerUI();
    } else if (state === 2) {
      isPlaying = false;
      updatePlayerUI();
    } else if (state === 0 && wantPlay) {
      trackIdx++;
      stepDir = 1;
      failCount = 0;
      loadAndPlayTrack(true);
    }
  }

  function handleYtError() {
    const pl = getActivePlaylist();
    failCount++;
    if (wantPlay && failCount < pl.tracks.length) {
      updatePlayerUI("Video blocked, next...");
      trackIdx += stepDir;
      setTimeout(() => {
        if (wantPlay) loadAndPlayTrack(true);
      }, 900);
    } else {
      wantPlay = false;
      isPlaying = false;
      updatePlayerUI("Video blocked by YouTube");
    }
  }

  window.addEventListener("message", (e) => {
    if (!e.origin || !e.origin.includes("youtube.com")) return;
    if (!ytIframe || e.source !== ytIframe.contentWindow) return;
    let data = e.data;
    if (typeof data === "string") {
      try { data = JSON.parse(data); } catch { return; }
    }
    if (!data || typeof data !== "object") return;

    if (data.event === "onReady") {
      ytReady = true;
      const volPct = Math.round(Math.min(1, Math.max(0, Number(musicCfg.volume ?? 0.5))) * 100);
      ytCmd("setVolume", [volPct]);
      ytCmd("setPlaybackRate", [getClosestYtRate(getConfiguredRate())]);
    }
    if (data.event === "infoDelivery" && data.info) {
      if (typeof data.info.playerState === "number") handleYtState(data.info.playerState);
    }
    if (data.event === "onStateChange" && typeof data.info === "number") {
      handleYtState(data.info);
    }
    if (data.event === "onError") {
      handleYtError();
    }
  });

  function loadAndPlayTrack(autoPlay) {
    const pl = getActivePlaylist();
    if (!pl.tracks.length) return;
    trackIdx = ((trackIdx % pl.tracks.length) + pl.tracks.length) % pl.tracks.length;
    const track = pl.tracks[trackIdx];

    wantPlay = !!autoPlay;
    urlTry = 0;

    if (track.isYouTube) {
      resetAudioSource();
      if (autoPlay) {
        isPlaying = true;
        mountYtVideo(track.videoId);
      } else {
        destroyYtIframe();
        isPlaying = false;
      }
      updatePlayerUI();
      return;
    }

    destroyYtIframe();
    revokeBlobUrl();
    audio.volume = Math.min(1, Math.max(0, Number(musicCfg.volume ?? 0.5)));

    if (track.isLocal && track.blob) {
      currentBlobUrl = URL.createObjectURL(track.blob);
      audio.src = currentBlobUrl;
    } else {
      const urls = window.getBloxdTrackUrls ? window.getBloxdTrackUrls(track.file) : [];
      if (!urls.length) return;
      audio.src = urls[0];
    }

    applyPlaybackSpeed();
    updatePlayerUI();

    if (autoPlay) {
      audio.play().then(() => {
        isPlaying = true;
        failCount = 0;
        applyPlaybackSpeed();
        updatePlayerUI();
      }).catch(() => {
        isPlaying = false;
        updatePlayerUI();
      });
    }
  }

  audio.addEventListener("ended", () => {
    trackIdx++;
    stepDir = 1;
    failCount = 0;
    loadAndPlayTrack(true);
  });

  audio.addEventListener("error", () => {
    if (!audio.getAttribute("src")) return;
    const pl = getActivePlaylist();
    const track = pl.tracks[trackIdx];
    if (!track || track.isYouTube) return;

    if (!track.isLocal && window.getBloxdTrackUrls) {
      const urls = window.getBloxdTrackUrls(track.file);
      urlTry++;
      if (urlTry < urls.length) {
        audio.src = urls[urlTry];
        applyPlaybackSpeed();
        if (wantPlay) {
          audio.play().then(() => {
            isPlaying = true;
            failCount = 0;
            applyPlaybackSpeed();
            updatePlayerUI();
          }).catch(() => {});
        }
        return;
      }
    }

    failCount++;
    if (wantPlay && failCount < pl.tracks.length) {
      trackIdx += stepDir;
      setTimeout(() => {
        if (wantPlay) loadAndPlayTrack(true);
      }, 200);
    } else {
      wantPlay = false;
      isPlaying = false;
      updatePlayerUI("Track unavailable");
    }
  });

  function ensureOstStyles() {
    if (document.getElementById("bloxd-ost-style")) return;
    const st = document.createElement("style");
    st.id = "bloxd-ost-style";
    st.textContent = `
      #${OST_ID} {
        position: fixed;
        z-index: 2147483647;
        font-family: "Segoe UI", system-ui, sans-serif;
        user-select: none;
        color: #f8fafc;
      }
      #${OST_ID} * { box-sizing: border-box; }
      .bt-yt-wrap {
        width: 210px;
        height: 118px;
        margin-bottom: 5px;
        background: #0b0f1c;
        border: 2px solid #44527a;
        border-radius: 4px;
        overflow: hidden;
        box-shadow: 0 6px 20px rgba(0,0,0,0.55);
      }
      .bt-yt-wrap.hidden-vid {
        position: fixed;
        left: -9999px;
        top: -9999px;
        width: 200px;
        height: 120px;
        opacity: 0.01;
        pointer-events: none;
        margin: 0;
        border: 0;
      }
      .bt-yt-frame { width: 100%; height: 100%; border: 0; display: block; }
      .bt-ost-card {
        width: 210px;
        background: #181d2c;
        border: 2px solid #44527a;
        border-radius: 4px;
        box-shadow: 0 6px 20px rgba(0,0,0,0.55);
        padding: 7px 9px 8px;
      }
      .bt-ost-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 4px;
        cursor: grab;
        padding-bottom: 5px;
        border-bottom: 1px solid #2b3450;
        margin-bottom: 6px;
      }
      .bt-ost-head:active { cursor: grabbing; }
      .bt-ost-pl {
        font-size: 10px;
        font-weight: 700;
        color: #94a3b8;
        text-transform: lowercase;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
      }
      .bt-ost-mini-btns { display: flex; gap: 3px; flex-shrink: 0; }
      .bt-ost-ibtn {
        background: #252e47;
        border: 1px solid #3f4c73;
        color: #e2e8f0;
        width: 19px;
        height: 18px;
        font-size: 10px;
        font-weight: 800;
        border-radius: 2px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        line-height: 1;
      }
      .bt-ost-ibtn:hover { background: #354266; color: #fff; }
      .bt-ost-ibtn.active { background: #3b82f6; border-color: #60a5fa; color: #fff; }
      .bt-ost-title {
        font-size: 12px;
        font-weight: 800;
        color: #ffffff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 7px;
        text-align: center;
      }
      .bt-ost-ctrls {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
      }
      .bt-ost-cbtn {
        background: #242d47;
        border: 1.5px solid #495782;
        color: #f8fafc;
        width: 30px;
        height: 26px;
        border-radius: 3px;
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
      }
      .bt-ost-cbtn:hover { background: #334066; }
      .bt-ost-play {
        background: #3b82f6;
        border-color: #60a5fa;
        width: 36px;
      }
      .bt-ost-play:hover { background: #60a5fa; }
      .bt-ost-spd-row {
        margin-top: 6px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 5px;
      }
      .bt-ost-spd-lbl {
        font-size: 10px;
        font-weight: 700;
        color: #94a3b8;
        text-transform: lowercase;
      }
      .bt-ost-spd {
        flex: 1;
        background: #20273b;
        border: 1px solid #44527a;
        color: #f8fafc;
        font-family: inherit;
        font-size: 11px;
        font-weight: 700;
        padding: 2px 4px;
        border-radius: 2px;
        outline: none;
        cursor: pointer;
      }
      .bt-ost-spd:focus { border-color: #60a5fa; }
      .bt-ost-spd-rst {
        background: #252e47;
        border: 1px solid #495782;
        color: #cbd5e1;
        font-family: inherit;
        font-size: 10px;
        font-weight: 800;
        padding: 2px 6px;
        border-radius: 2px;
        cursor: pointer;
      }
      .bt-ost-spd-rst:hover { background: #354266; color: #fff; }
      .bt-ost-drawer {
        margin-top: 7px;
        padding-top: 6px;
        border-top: 1px solid #2b3450;
        max-height: 135px;
        overflow-y: auto;
        display: none;
        flex-direction: column;
        gap: 3px;
      }
      .bt-ost-drawer.open { display: flex; }
      .bt-ost-song {
        background: #20273b;
        border: 1px solid #303b59;
        color: #cbd5e1;
        font-size: 11px;
        font-weight: 700;
        padding: 4px 6px;
        border-radius: 2px;
        text-align: left;
        cursor: pointer;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .bt-ost-song:hover { background: #2c3654; color: #fff; }
      .bt-ost-song.playing { background: #1d4ed8; border-color: #60a5fa; color: #fff; }
      .bt-ost-back {
        background: #22c55e;
        border: 1.5px solid #86efac;
        border-bottom: 3px solid #15803d;
        color: #ffffff;
        font-family: inherit;
        font-size: 12px;
        font-weight: 800;
        padding: 6px 14px;
        border-radius: 4px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.45);
        text-shadow: 0 1px 2px rgba(0,0,0,0.5);
      }
      .bt-ost-back:hover { background: #4ade80; }
    `;
    document.head.appendChild(st);
  }

  function makeDraggable(root, handle, onClickIfNotDragged) {
    let startX = 0, startY = 0, origL = 0, origT = 0, dragging = false, moved = false;

    handle.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      if (e.target.closest("button, select") && handle !== e.target) return;
      const rect = root.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      origL = rect.left;
      origT = rect.top;
      dragging = true;
      moved = false;
      root.style.right = "auto";
      root.style.bottom = "auto";
      root.style.left = `${origL}px`;
      root.style.top = `${origT}px`;
      e.preventDefault();
    });

    window.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
      const maxX = Math.max(8, window.innerWidth - root.offsetWidth - 8);
      const maxY = Math.max(8, window.innerHeight - root.offsetHeight - 8);
      root.style.left = `${Math.min(maxX, Math.max(8, origL + dx))}px`;
      root.style.top = `${Math.min(maxY, Math.max(8, origT + dy))}px`;
    });

    window.addEventListener("mouseup", () => {
      if (!dragging) return;
      dragging = false;
      if (moved) {
        const rect = root.getBoundingClientRect();
        musicCfg.posX = Math.round(rect.left);
        musicCfg.posY = Math.round(rect.top);
        chrome.storage.local.set({ musicSettings: musicCfg });
      } else if (onClickIfNotDragged) {
        onClickIfNotDragged();
      }
    });
  }

  function updatePlayerUI(customTitle) {
    const root = document.getElementById(OST_ID);
    if (!root) return;

    const card = root.querySelector(".bt-ost-card");
    const backBtn = root.querySelector(".bt-ost-back");
    const ytWrap = root.querySelector(".bt-yt-wrap");

    const pl = getActivePlaylist();
    if (trackIdx >= pl.tracks.length) trackIdx = 0;
    const track = pl.tracks[trackIdx] || { title: "No tracks" };
    const isYt = !!track.isYouTube;

    const shouldShowVid = isYt && showYtVideo && !musicCfg.minimized && !!ytIframe;
    ytWrap.classList.toggle("hidden-vid", !shouldShowVid);

    if (musicCfg.minimized) {
      card.style.display = "none";
      backBtn.style.display = "inline-block";
      return;
    }

    card.style.display = "block";
    backBtn.style.display = "none";

    root.querySelector(".bt-ost-pl").textContent = (pl.name || "playlist").toLowerCase();
    root.querySelector(".bt-ost-title").textContent = customTitle || track.title;
    root.querySelector(".bt-ost-play").textContent = isPlaying ? "⏸" : "▶";
    root.querySelector(".bt-ost-list-btn").classList.toggle("active", drawerOpen);

    const spdSel = root.querySelector(".bt-ost-spd");
    if (spdSel) {
      const targetVal = getConfiguredRate().toFixed(2);
      if (spdSel.value !== targetVal) spdSel.value = targetVal;
    }

    const tvBtn = root.querySelector(".bt-ost-tv-btn");
    tvBtn.style.display = isYt ? "inline-flex" : "none";
    tvBtn.classList.toggle("active", showYtVideo);

    const drawer = root.querySelector(".bt-ost-drawer");
    drawer.classList.toggle("open", drawerOpen);
    drawer.innerHTML = "";
    pl.tracks.forEach((tr, i) => {
      const b = document.createElement("button");
      b.className = "bt-ost-song" + (i === trackIdx ? " playing" : "");
      b.textContent = `${i + 1}. ${tr.title}`;
      b.addEventListener("click", () => {
        trackIdx = i;
        stepDir = 1;
        failCount = 0;
        loadAndPlayTrack(true);
      });
      drawer.appendChild(b);
    });
  }

  function mountMiniPlayer() {
    if (!document.body) return;
    const existing = document.getElementById(OST_ID);

    if (!musicCfg.enabled) {
      stopAllPlayback();
      if (existing) existing.remove();
      return;
    }

    ensureOstStyles();
    if (existing) {
      updatePlayerUI();
      return;
    }

    const root = document.createElement("div");
    root.id = OST_ID;
    if (typeof musicCfg.posX === "number" && typeof musicCfg.posY === "number") {
      root.style.left = `${Math.min(window.innerWidth - 90, Math.max(8, musicCfg.posX))}px`;
      root.style.top = `${Math.min(window.innerHeight - 50, Math.max(8, musicCfg.posY))}px`;
    } else {
      root.style.right = "16px";
      root.style.bottom = "16px";
    }

    root.innerHTML = `
      <div class="bt-yt-wrap hidden-vid"></div>
      <div class="bt-ost-card">
        <div class="bt-ost-head" title="Drag to move">
          <span class="bt-ost-pl">survival &amp; open worlds</span>
          <div class="bt-ost-mini-btns">
            <button class="bt-ost-ibtn bt-ost-tv-btn" style="display:none" title="Show / Hide YouTube video">📺</button>
            <button class="bt-ost-ibtn bt-ost-list-btn" title="Songs in this playlist">☰</button>
            <button class="bt-ost-ibtn bt-ost-sw-btn" title="Switch playlist">⇄</button>
            <button class="bt-ost-ibtn bt-ost-hide-btn" title="Hide player">—</button>
          </div>
        </div>
        <div class="bt-ost-title">A Place To Be Free</div>
        <div class="bt-ost-ctrls">
          <button class="bt-ost-cbtn bt-ost-prev" title="Previous">⏮</button>
          <button class="bt-ost-cbtn bt-ost-play" title="Play / Pause">▶</button>
          <button class="bt-ost-cbtn bt-ost-next" title="Next">⏭</button>
        </div>
        <div class="bt-ost-spd-row">
          <span class="bt-ost-spd-lbl">speed</span>
          <select class="bt-ost-spd" title="Playback speed">${buildMiniSpeedOptions(getConfiguredRate())}</select>
          <button class="bt-ost-spd-rst" title="Normal speed (1.00x)">1x</button>
        </div>
        <div class="bt-ost-drawer"></div>
      </div>
      <button class="bt-ost-back" style="display:none" title="Show music player">Back</button>
    `;

    document.body.appendChild(root);

    makeDraggable(root, root.querySelector(".bt-ost-head"));
    makeDraggable(root, root.querySelector(".bt-ost-back"), () => {
      musicCfg.minimized = false;
      chrome.storage.local.set({ musicSettings: musicCfg });
      updatePlayerUI();
    });

    root.querySelector(".bt-ost-tv-btn").addEventListener("click", () => {
      showYtVideo = !showYtVideo;
      updatePlayerUI();
    });

    root.querySelector(".bt-ost-list-btn").addEventListener("click", () => {
      drawerOpen = !drawerOpen;
      updatePlayerUI();
    });

    root.querySelector(".bt-ost-sw-btn").addEventListener("click", () => {
      const list = getEnabledPlaylists();
      if (list.length <= 1) return;
      const cur = list.findIndex((p) => p.id === musicCfg.activePlaylistId);
      const nextPl = list[(cur + 1) % list.length];
      musicCfg.activePlaylistId = nextPl.id;
      trackIdx = 0;
      failCount = 0;
      stepDir = 1;
      chrome.storage.local.set({ musicSettings: musicCfg });
      if (isPlaying || wantPlay) loadAndPlayTrack(true);
      else {
        stopAllPlayback();
        updatePlayerUI();
      }
    });

    root.querySelector(".bt-ost-hide-btn").addEventListener("click", () => {
      drawerOpen = false;
      musicCfg.minimized = true;
      chrome.storage.local.set({ musicSettings: musicCfg });
      updatePlayerUI();
    });

    const spdSel = root.querySelector(".bt-ost-spd");
    spdSel.addEventListener("change", () => {
      musicCfg.playbackRate = Number(spdSel.value) || 1;
      applyPlaybackSpeed();
      chrome.storage.local.set({ musicSettings: musicCfg });
    });

    root.querySelector(".bt-ost-spd-rst").addEventListener("click", () => {
      musicCfg.playbackRate = 1;
      spdSel.value = "1.00";
      applyPlaybackSpeed();
      chrome.storage.local.set({ musicSettings: musicCfg });
    });

    root.querySelector(".bt-ost-play").addEventListener("click", () => {
      const pl = getActivePlaylist();
      const track = pl.tracks[trackIdx];
      if (!track) return;

      if (track.isYouTube) {
        if (isPlaying) {
          wantPlay = false;
          isPlaying = false;
          ytCmd("pauseVideo");
          updatePlayerUI();
        } else {
          failCount = 0;
          stepDir = 1;
          wantPlay = true;
          if (ytIframe && ytCurrentVideoId === track.videoId && ytReady) {
            isPlaying = true;
            ytCmd("playVideo");
            applyPlaybackSpeed();
            updatePlayerUI();
          } else {
            loadAndPlayTrack(true);
          }
        }
        return;
      }

      if (isPlaying) {
        wantPlay = false;
        audio.pause();
        isPlaying = false;
        updatePlayerUI();
      } else {
        failCount = 0;
        stepDir = 1;
        if (!audio.getAttribute("src")) {
          loadAndPlayTrack(true);
        } else {
          wantPlay = true;
          audio.volume = Math.min(1, Math.max(0, Number(musicCfg.volume ?? 0.5)));
          applyPlaybackSpeed();
          audio.play().then(() => {
            isPlaying = true;
            applyPlaybackSpeed();
            updatePlayerUI();
          }).catch(() => loadAndPlayTrack(true));
        }
      }
    });

    root.querySelector(".bt-ost-prev").addEventListener("click", () => {
      trackIdx--;
      stepDir = -1;
      failCount = 0;
      loadAndPlayTrack(true);
    });

    root.querySelector(".bt-ost-next").addEventListener("click", () => {
      trackIdx++;
      stepDir = 1;
      failCount = 0;
      loadAndPlayTrack(true);
    });

    updatePlayerUI();
  }

  // --- SINCRONIZACIÓN ---
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === "APPLY_THEME") {
      currentTheme = msg.theme;
      applyAll();
    }
  });

  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area !== "local") return;
    if (changes.activeTheme) {
      currentTheme = changes.activeTheme.newValue || null;
      applyAll();
    }
    if (changes.extraSettings) {
      extra = { ...extra, ...(changes.extraSettings.newValue || {}) };
      applyAll();
    }
    if (changes.ytTracks) {
      ytTracks = Array.isArray(changes.ytTracks.newValue) ? changes.ytTracks.newValue : [];
      mountMiniPlayer();
    }
    if (changes.musicSettings) {
      const prevPl = musicCfg.activePlaylistId;
      const prevCustomTs = musicCfg.customUpdatedAt;
      musicCfg = { ...musicCfg, ...(changes.musicSettings.newValue || {}) };

      const vol = Math.min(1, Math.max(0, Number(musicCfg.volume ?? 0.5)));
      audio.volume = vol;
      ytCmd("setVolume", [Math.round(vol * 100)]);
      applyPlaybackSpeed();

      if (prevCustomTs !== musicCfg.customUpdatedAt) {
        await refreshCustomTracks();
      }
      if (prevPl !== musicCfg.activePlaylistId || prevCustomTs !== musicCfg.customUpdatedAt) {
        trackIdx = 0;
        failCount = 0;
        stepDir = 1;
        if (isPlaying || wantPlay) loadAndPlayTrack(true);
        else stopAllPlayback();
      }
      mountMiniPlayer();
    }
  });

  new MutationObserver(scheduleScan).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("pointerlockchange", scheduleScan);
  window.addEventListener("resize", scheduleScan);

  chrome.storage.local.get(["activeTheme", "extraSettings", "musicSettings", "ytTracks"], async (data) => {
    currentTheme = data.activeTheme || null;
    ytTracks = Array.isArray(data.ytTracks) ? data.ytTracks : [];
    if (data.extraSettings) extra = { ...extra, ...data.extraSettings };
    if (data.musicSettings) musicCfg = { ...musicCfg, ...data.musicSettings };
    await refreshCustomTracks();
    applyAll();
    mountMiniPlayer();
  });
})();