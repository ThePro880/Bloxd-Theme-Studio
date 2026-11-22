(() => {
  if (location.pathname.startsWith("/more_settings")) return;

  const STYLE_ID = "bloxd-theme-studio-css";
  const FX_ID = "bloxd-theme-studio-fx";
  const OST_ID = "bloxd-ost-widget";
  const YT_SUPPORTED_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  const DEFAULT_MUSIC = {
    enabled: true,
    minimized: false,
    activePlaylistId: "survival",
    enabledPlaylists: ["youtube", "custom", "all", "survival", "pirates"],
    volume: 0.5,
    playbackRate: 1,
    shuffle: false,
    repeat: false,
    bassBoost: false,
    audioMode: "normal",
    visualizer: true,
    posX: null,
    posY: null,
    customUpdatedAt: 0
  };

  let currentTheme = null;
  let extra = { bgMode: "solid", bgColor2: "#0f172a", bgImage: "", bgDim: 40, fxCount: 24, fxSpeed: 6, hideFxInGame: true };
  let musicCfg = { ...DEFAULT_MUSIC };
  let customTracks = [];
  let ytTracks = [];
  let scanTimer = null;

  // --- MOTOR DE TEMAS ---
  function shouldIgnore(el) {
    if (!el || el.nodeType !== 1) return true;
    const tag = el.tagName;
    if (["CANVAS", "IFRAME", "IMG", "VIDEO", "AUDIO", "INS", "SCRIPT", "STYLE", "SVG", "PATH"].includes(tag)) return true;
    if (el.getAttribute("data-bt-ignore") === "1" || el.closest('[data-bt-ignore="1"]')) return true;
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
    if (musicCfg.enabled && document.body && !document.getElementById(OST_ID)) {
      mountMiniPlayer();
    }

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

  // --- MINI REPRODUCTOR FLOTANTE v3.0: DOBLE CANAL + SHUFFLE + REPEAT + VISUALIZER + BASS/NC ---
  // Canal 1 (MP3 locales): conectado a Web Audio API para Bass Boost y visualizador real sin bloqueos CORS
  const localAudio = new Audio();
  // Canal 2 (Bloxd OST remotos): independiente de Web Audio para que CORS nunca silencie los OST
  const remoteAudio = new Audio();

  let audioCtx = null;
  let bassFilter = null;
  let gainComp = null;
  let analyser = null;
  let freqData = null;

  let currentChannel = "none"; // "local" | "remote" | "yt" | "none"
  let currentBlobUrl = null;
  let ytIframe = null;
  let ytReady = false;
  let ytCurrentVideoId = null;
  let showYtVideo = true;
  let trackIdx = 0;
  let urlTry = 0;
  let failCount = 0;
  let isPlaying = false;
  let wantPlay = false;
  let stepDir = 1;
  let drawerOpen = false;
  let vizRaf = null;

  function ensureLocalAudioGraph() {
    if (audioCtx) {
      if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
      applyBassBoost();
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audioCtx = new AC();
      const src = audioCtx.createMediaElementSource(localAudio);
      bassFilter = audioCtx.createBiquadFilter();
      bassFilter.type = "lowshelf";
      bassFilter.frequency.value = 120;
      bassFilter.gain.value = musicCfg.bassBoost ? 11 : 0;

      gainComp = audioCtx.createGain();
      gainComp.gain.value = musicCfg.bassBoost ? 0.85 : 1;

      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.78;
      freqData = new Uint8Array(analyser.frequencyBinCount);

      src.connect(bassFilter);
      bassFilter.connect(gainComp);
      gainComp.connect(analyser);
      analyser.connect(audioCtx.destination);
    } catch {
      audioCtx = null;
    }
  }

  function applyBassBoost() {
    if (!bassFilter || !gainComp) return;
    const on = !!musicCfg.bassBoost;
    bassFilter.gain.value = on ? 11 : 0;
    gainComp.gain.value = on ? 0.85 : 1;
  }

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

  function setPitchPreserve(el, keepPitch) {
    try {
      if ("preservesPitch" in el) el.preservesPitch = keepPitch;
      if ("webkitPreservesPitch" in el) el.webkitPreservesPitch = keepPitch;
    } catch {
      // Ignora si el navegador no soporta la propiedad
    }
  }

  function applyPlaybackSpeed() {
    const rate = getConfiguredRate();
    const safeAudioRate = Math.min(2, Math.max(0.0625, rate));
    const keepPitch = (musicCfg.audioMode || "normal") === "normal";

    [localAudio, remoteAudio].forEach((el) => {
      setPitchPreserve(el, keepPitch);
      try {
        el.playbackRate = safeAudioRate;
      } catch {
        el.playbackRate = 1;
      }
    });

    ytCmd("setPlaybackRate", [getClosestYtRate(rate)]);
  }

  function applyVolume() {
    const vol = Math.min(1, Math.max(0, Number(musicCfg.volume ?? 0.5)));
    localAudio.volume = vol;
    remoteAudio.volume = vol;
    ytCmd("setVolume", [Math.round(vol * 100)]);
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

  localAudio.addEventListener("loadedmetadata", applyPlaybackSpeed);
  remoteAudio.addEventListener("loadedmetadata", applyPlaybackSpeed);

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

  function pickNextIndex(len, dir) {
    if (len <= 1) return 0;
    if (musicCfg.shuffle) {
      let next = trackIdx;
      for (let tries = 0; tries < 6 && next === trackIdx; tries++) {
        next = Math.floor(Math.random() * len);
      }
      if (next === trackIdx) next = (trackIdx + 1) % len;
      return next;
    }
    return ((trackIdx + dir) % len + len) % len;
  }

  function revokeBlobUrl() {
    if (currentBlobUrl) {
      URL.revokeObjectURL(currentBlobUrl);
      currentBlobUrl = null;
    }
  }

  function resetAudioElements() {
    localAudio.pause();
    localAudio.removeAttribute("src");
    localAudio.load();
    remoteAudio.pause();
    remoteAudio.removeAttribute("src");
    remoteAudio.load();
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
    currentChannel = "none";
    resetAudioElements();
    destroyYtIframe();
    stopVisualizer();
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

  function handleTrackFinished() {
    const pl = getActivePlaylist();
    if (!pl.tracks.length) return;
    if (musicCfg.repeat) {
      if (currentChannel === "yt") {
        ytCmd("seekTo", [0, true]);
        ytCmd("playVideo");
      } else {
        const el = currentChannel === "local" ? localAudio : remoteAudio;
        el.currentTime = 0;
        el.play().catch(() => loadAndPlayTrack(true));
      }
      return;
    }
    trackIdx = pickNextIndex(pl.tracks.length, 1);
    stepDir = 1;
    failCount = 0;
    loadAndPlayTrack(true);
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
      handleTrackFinished();
    }
  }

  function handleYtError() {
    const pl = getActivePlaylist();
    failCount++;
    if (wantPlay && failCount < pl.tracks.length) {
      updatePlayerUI("Video blocked, next...");
      trackIdx = pickNextIndex(pl.tracks.length, stepDir);
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
      resetAudioElements();
      currentChannel = "yt";
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
    resetAudioElements();

    const vol = Math.min(1, Math.max(0, Number(musicCfg.volume ?? 0.5)));

    if (track.isLocal && track.blob) {
      currentChannel = "local";
      ensureLocalAudioGraph();
      currentBlobUrl = URL.createObjectURL(track.blob);
      localAudio.volume = vol;
      localAudio.src = currentBlobUrl;
      applyPlaybackSpeed();
      updatePlayerUI();

      if (autoPlay) {
        localAudio.play().then(() => {
          isPlaying = true;
          failCount = 0;
          applyPlaybackSpeed();
          applyBassBoost();
          updatePlayerUI();
        }).catch(() => {
          isPlaying = false;
          updatePlayerUI();
        });
      }
      return;
    }

    currentChannel = "remote";
    const urls = window.getBloxdTrackUrls ? window.getBloxdTrackUrls(track.file) : [];
    if (!urls.length) return;
    remoteAudio.volume = vol;
    remoteAudio.src = urls[0];
    applyPlaybackSpeed();
    updatePlayerUI();

    if (autoPlay) {
      remoteAudio.play().then(() => {
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

  localAudio.addEventListener("ended", () => {
    if (currentChannel === "local") handleTrackFinished();
  });

  remoteAudio.addEventListener("ended", () => {
    if (currentChannel === "remote") handleTrackFinished();
  });

  function handleAudioError(channel) {
    const el = channel === "local" ? localAudio : remoteAudio;
    if (!el.getAttribute("src") || currentChannel !== channel) return;
    const pl = getActivePlaylist();
    const track = pl.tracks[trackIdx];
    if (!track || track.isYouTube) return;

    if (channel === "remote" && window.getBloxdTrackUrls) {
      const urls = window.getBloxdTrackUrls(track.file);
      urlTry++;
      if (urlTry < urls.length) {
        remoteAudio.src = urls[urlTry];
        applyPlaybackSpeed();
        if (wantPlay) {
          remoteAudio.play().then(() => {
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
      trackIdx = pickNextIndex(pl.tracks.length, stepDir);
      setTimeout(() => {
        if (wantPlay) loadAndPlayTrack(true);
      }, 200);
    } else {
      wantPlay = false;
      isPlaying = false;
      updatePlayerUI("Track unavailable");
    }
  }

  localAudio.addEventListener("error", () => handleAudioError("local"));
  remoteAudio.addEventListener("error", () => handleAudioError("remote"));

  // --- VISUALIZADOR DE RITMO EN VIVO ---
  function stopVisualizer() {
    if (vizRaf) {
      cancelAnimationFrame(vizRaf);
      vizRaf = null;
    }
    const canvas = document.querySelector(`#${OST_ID} .bt-ost-viz`);
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function startVisualizerIfNeeded() {
    const shouldRun = isPlaying && !musicCfg.minimized && musicCfg.visualizer !== false && musicCfg.enabled;
    if (!shouldRun) {
      stopVisualizer();
      return;
    }
    if (vizRaf) return;

    const draw = (now) => {
      if (!isPlaying || musicCfg.minimized || musicCfg.visualizer === false || !musicCfg.enabled) {
        stopVisualizer();
        return;
      }
      const canvas = document.querySelector(`#${OST_ID} .bt-ost-viz`);
      if (!canvas) {
        vizRaf = null;
        return;
      }
      const ctx = canvas.getContext("2d");
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const bars = 16;
      const gap = 2;
      const bw = (w - gap * (bars - 1)) / bars;
      const accent = getComputedStyle(document.documentElement).getPropertyValue("--bt-accent").trim() || "#38bdf8";
      ctx.fillStyle = accent;

      const useRealFft = currentChannel === "local" && analyser && freqData;
      if (useRealFft) {
        analyser.getByteFrequencyData(freqData);
      }

      const speedMul = Math.max(0.4, getConfiguredRate());
      const volScale = Math.max(0.25, Number(musicCfg.volume ?? 0.5));
      const t = (now / 1000) * speedMul;

      for (let i = 0; i < bars; i++) {
        let level = 0.15;
        if (useRealFft) {
          const bin = Math.min(freqData.length - 1, Math.floor((i / bars) * (freqData.length * 0.78)));
          level = Math.max(0.08, freqData[bin] / 255);
        } else {
          const wave1 = Math.sin(t * 5.2 + i * 0.65);
          const wave2 = Math.cos(t * 3.1 - i * 0.42);
          const beat = Math.abs(Math.sin(t * 2.6 + (i % 3)));
          level = Math.max(0.1, Math.min(1, (0.28 + 0.35 * Math.abs(wave1 + wave2) * 0.5 + 0.25 * beat) * volScale));
        }
        const bh = Math.max(2, Math.round(level * (h - 2)));
        ctx.fillRect(i * (bw + gap), h - bh, bw, bh);
      }

      vizRaf = requestAnimationFrame(draw);
    };

    vizRaf = requestAnimationFrame(draw);
  }

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
        width: 226px;
        height: 127px;
        margin-bottom: 5px;
        background: #0b0f1c;
        border: 2px solid #44527a;
        border-radius: 4px;
        overflow: hidden;
        box-shadow: 0 6px 20px rgba(0,0,0,0.55);
      }
      .bt-yt-wrap.hidden-vid {
        position: fixed;
        right: 0;
        bottom: 0;
        width: 1px;
        height: 1px;
        opacity: 0.01;
        pointer-events: none;
        margin: 0;
        border: 0;
      }
      .bt-yt-frame { width: 100%; height: 100%; border: 0; display: block; }
      .bt-ost-card {
        width: 226px;
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
        margin-bottom: 5px;
        text-align: center;
      }
      .bt-ost-viz {
        display: block;
        width: 100%;
        height: 18px;
        margin-bottom: 6px;
        background: rgba(10, 14, 26, 0.55);
        border: 1px solid #2b3450;
        border-radius: 2px;
      }
      .bt-ost-ctrls {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 5px;
      }
      .bt-ost-cbtn {
        background: #242d47;
        border: 1.5px solid #495782;
        color: #f8fafc;
        width: 28px;
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
      .bt-ost-cbtn.toggle-on {
        background: #1d4ed8;
        border-color: #60a5fa;
        color: #ffffff;
      }
      .bt-ost-play {
        background: #3b82f6;
        border-color: #60a5fa;
        width: 34px;
      }
      .bt-ost-play:hover { background: #60a5fa; }
      .bt-ost-fx-row {
        margin-top: 6px;
        display: flex;
        align-items: center;
        gap: 5px;
      }
      .bt-ost-fx-btn {
        flex: 1;
        background: #20273b;
        border: 1px solid #44527a;
        color: #cbd5e1;
        font-family: inherit;
        font-size: 10px;
        font-weight: 800;
        padding: 3px 4px;
        border-radius: 2px;
        cursor: pointer;
        text-transform: uppercase;
      }
      .bt-ost-fx-btn:hover { background: #2c3654; color: #fff; }
      .bt-ost-fx-btn.active {
        background: #7c3aed;
        border-color: #c4b5fd;
        color: #ffffff;
      }
      .bt-ost-spd-row {
        margin-top: 5px;
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
      stopVisualizer();
      return;
    }

    card.style.display = "block";
    backBtn.style.display = "none";

    root.querySelector(".bt-ost-pl").textContent = (pl.name || "playlist").toLowerCase();
    root.querySelector(".bt-ost-title").textContent = customTitle || track.title;
    root.querySelector(".bt-ost-play").textContent = isPlaying ? "⏸" : "▶";
    root.querySelector(".bt-ost-list-btn").classList.toggle("active", drawerOpen);
    root.querySelector(".bt-ost-shuf").classList.toggle("toggle-on", !!musicCfg.shuffle);
    root.querySelector(".bt-ost-rep").classList.toggle("toggle-on", !!musicCfg.repeat);

    const vizEl = root.querySelector(".bt-ost-viz");
    if (vizEl) vizEl.style.display = musicCfg.visualizer === false ? "none" : "block";

    const bassBtn = root.querySelector(".bt-ost-bass");
    if (bassBtn) {
      bassBtn.classList.toggle("active", !!musicCfg.bassBoost);
      bassBtn.textContent = musicCfg.bassBoost ? "BASS: ON" : "BASS";
    }

    const modeBtn = root.querySelector(".bt-ost-mode");
    if (modeBtn) {
      const mode = musicCfg.audioMode || "normal";
      modeBtn.classList.toggle("active", mode !== "normal");
      modeBtn.textContent = mode === "nightcore" ? "NIGHTCORE" : (mode === "slowed" ? "SLOWED" : "FX: OFF");
    }

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

    startVisualizerIfNeeded();
  }

  function applyWidgetPosition(root) {
    if (typeof musicCfg.posX === "number" && typeof musicCfg.posY === "number") {
      root.style.right = "auto";
      root.style.bottom = "auto";
      root.style.left = `${Math.min(Math.max(8, window.innerWidth - 236), Math.max(8, musicCfg.posX))}px`;
      root.style.top = `${Math.min(Math.max(8, window.innerHeight - 170), Math.max(8, musicCfg.posY))}px`;
    } else {
      root.style.left = "auto";
      root.style.top = "auto";
      root.style.right = "16px";
      root.style.bottom = "16px";
    }
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
      applyWidgetPosition(existing);
      updatePlayerUI();
      return;
    }

    const root = document.createElement("div");
    root.id = OST_ID;
    applyWidgetPosition(root);

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
        <canvas class="bt-ost-viz" width="204" height="18"></canvas>
        <div class="bt-ost-ctrls">
          <button class="bt-ost-cbtn bt-ost-shuf" title="Shuffle">🔀</button>
          <button class="bt-ost-cbtn bt-ost-prev" title="Previous">⏮</button>
          <button class="bt-ost-cbtn bt-ost-play" title="Play / Pause">▶</button>
          <button class="bt-ost-cbtn bt-ost-next" title="Next">⏭</button>
          <button class="bt-ost-cbtn bt-ost-rep" title="Repeat current song">🔁</button>
        </div>
        <div class="bt-ost-fx-row">
          <button class="bt-ost-fx-btn bt-ost-bass" title="Bass Boost (local MP3s)">BASS</button>
          <button class="bt-ost-fx-btn bt-ost-mode" title="Cycle: Normal / Nightcore / Slowed">FX: OFF</button>
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

    root.querySelector(".bt-ost-shuf").addEventListener("click", () => {
      musicCfg.shuffle = !musicCfg.shuffle;
      chrome.storage.local.set({ musicSettings: musicCfg });
      updatePlayerUI();
    });

    root.querySelector(".bt-ost-rep").addEventListener("click", () => {
      musicCfg.repeat = !musicCfg.repeat;
      chrome.storage.local.set({ musicSettings: musicCfg });
      updatePlayerUI();
    });

    root.querySelector(".bt-ost-bass").addEventListener("click", () => {
      musicCfg.bassBoost = !musicCfg.bassBoost;
      if (currentChannel === "local") ensureLocalAudioGraph();
      applyBassBoost();
      chrome.storage.local.set({ musicSettings: musicCfg });
      updatePlayerUI();
    });

    root.querySelector(".bt-ost-mode").addEventListener("click", () => {
      const order = ["normal", "nightcore", "slowed"];
      const nextMode = order[(order.indexOf(musicCfg.audioMode || "normal") + 1) % order.length];
      musicCfg.audioMode = nextMode;
      if (nextMode === "nightcore") musicCfg.playbackRate = 1.25;
      else if (nextMode === "slowed") musicCfg.playbackRate = 0.80;
      else musicCfg.playbackRate = 1.00;
      applyPlaybackSpeed();
      chrome.storage.local.set({ musicSettings: musicCfg });
      updatePlayerUI();
    });

    const spdSel = root.querySelector(".bt-ost-spd");
    spdSel.addEventListener("change", () => {
      musicCfg.playbackRate = Number(spdSel.value) || 1;
      musicCfg.audioMode = "normal";
      applyPlaybackSpeed();
      chrome.storage.local.set({ musicSettings: musicCfg });
      updatePlayerUI();
    });

    root.querySelector(".bt-ost-spd-rst").addEventListener("click", () => {
      musicCfg.playbackRate = 1;
      musicCfg.audioMode = "normal";
      spdSel.value = "1.00";
      applyPlaybackSpeed();
      chrome.storage.local.set({ musicSettings: musicCfg });
      updatePlayerUI();
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

      const targetEl = track.isLocal ? localAudio : remoteAudio;
      const targetChannel = track.isLocal ? "local" : "remote";

      if (isPlaying) {
        wantPlay = false;
        targetEl.pause();
        isPlaying = false;
        updatePlayerUI();
      } else {
        failCount = 0;
        stepDir = 1;
        if (currentChannel !== targetChannel || !targetEl.getAttribute("src")) {
          loadAndPlayTrack(true);
        } else {
          wantPlay = true;
          if (track.isLocal) ensureLocalAudioGraph();
          applyVolume();
          applyPlaybackSpeed();
          applyBassBoost();
          targetEl.play().then(() => {
            isPlaying = true;
            applyPlaybackSpeed();
            updatePlayerUI();
          }).catch(() => loadAndPlayTrack(true));
        }
      }
    });

    root.querySelector(".bt-ost-prev").addEventListener("click", () => {
      const pl = getActivePlaylist();
      if (!pl.tracks.length) return;
      trackIdx = pickNextIndex(pl.tracks.length, -1);
      stepDir = -1;
      failCount = 0;
      loadAndPlayTrack(true);
    });

    root.querySelector(".bt-ost-next").addEventListener("click", () => {
      const pl = getActivePlaylist();
      if (!pl.tracks.length) return;
      trackIdx = pickNextIndex(pl.tracks.length, 1);
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

    let ytAdded = false;
    if (changes.ytTracks) {
      const prevLen = ytTracks.length;
      ytTracks = Array.isArray(changes.ytTracks.newValue) ? changes.ytTracks.newValue : [];
      if (ytTracks.length > prevLen) {
        ytAdded = true;
        musicCfg.activePlaylistId = "youtube";
        musicCfg.enabled = true;
        musicCfg.minimized = false;
        if (!Array.isArray(musicCfg.enabledPlaylists)) musicCfg.enabledPlaylists = ["youtube"];
        if (!musicCfg.enabledPlaylists.includes("youtube")) musicCfg.enabledPlaylists.unshift("youtube");
        trackIdx = ytTracks.length - 1;
      }
    }

    if (changes.musicSettings) {
      const prevPl = musicCfg.activePlaylistId;
      const prevCustomTs = musicCfg.customUpdatedAt;
      musicCfg = { ...DEFAULT_MUSIC, ...musicCfg, ...(changes.musicSettings.newValue || {}) };
      if (ytAdded) {
        musicCfg.activePlaylistId = "youtube";
        musicCfg.minimized = false;
      }

      applyVolume();
      applyPlaybackSpeed();
      applyBassBoost();

      if (prevCustomTs !== musicCfg.customUpdatedAt) {
        await refreshCustomTracks();
        musicCfg.minimized = false;
      }
      if (prevPl !== musicCfg.activePlaylistId || prevCustomTs !== musicCfg.customUpdatedAt || ytAdded) {
        if (!ytAdded) trackIdx = 0;
        failCount = 0;
        stepDir = 1;
        if (isPlaying || wantPlay) loadAndPlayTrack(true);
        else stopAllPlayback();
      }
    }

    if (changes.ytTracks || changes.musicSettings) {
      mountMiniPlayer();
    }
  });

  new MutationObserver(scheduleScan).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("pointerlockchange", scheduleScan);
  window.addEventListener("resize", () => {
    const root = document.getElementById(OST_ID);
    if (root) applyWidgetPosition(root);
    scheduleScan();
  });

  chrome.storage.local.get(["activeTheme", "extraSettings", "musicSettings", "ytTracks"], async (data) => {
    currentTheme = data.activeTheme || null;
    ytTracks = Array.isArray(data.ytTracks) ? data.ytTracks : [];
    if (data.extraSettings) extra = { ...extra, ...data.extraSettings };
    if (data.musicSettings) musicCfg = { ...DEFAULT_MUSIC, ...data.musicSettings };
    await refreshCustomTracks();
    applyAll();
    mountMiniPlayer();
  });
})();