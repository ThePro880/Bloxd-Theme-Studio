(() => {
  if (!location.pathname.startsWith("/more_settings")) return;

  const STYLE_ID = "bt-arc-style";
  const BTN_ID = "bt-arc-open-btn";
  const MODAL_ID = "bt-arc-modal";

  let shopState = { coins: 0, owned: [], equipped: { cursor: "", trail: "", sound: "", crown: false, goldBorder: false } };
  let activeThemeId = "";
  let activeTab = "games";
  let activeGame = "aim";
  let shopFilter = "all";
  let stopCurrentGame = null;

  function loadShop(cb) {
    chrome.storage.local.get(["arcadeShopV3", "activeTheme"], (d) => {
      const def = window.BLOXD_ARCADE_DEFAULTS || { coins: 0, owned: [], equipped: {} };
      const raw = d.arcadeShopV3 || {};
      shopState = {
        coins: Number(raw.coins) || 0,
        owned: Array.isArray(raw.owned) ? raw.owned : [],
        equipped: { ...def.equipped, ...(raw.equipped || {}) }
      };
      activeThemeId = (d.activeTheme && d.activeTheme.id) || "";
      updateCoinDisplays();
      if (cb) cb();
    });
  }

  function saveShop(cb) {
    chrome.storage.local.set({ arcadeShopV3: shopState }, () => {
      updateCoinDisplays();
      if (cb) cb();
    });
  }

  function awardWinCoins() {
    shopState.coins += 3;
    saveShop();
  }

  function updateCoinDisplays() {
    const b = document.getElementById(BTN_ID);
    if (b) {
      const sp = b.querySelector(".bt-arc-cnum");
      if (sp) sp.textContent = String(shopState.coins);
    }
    const m = document.querySelector("#" + MODAL_ID + " .bt-arc-mc");
    if (m) m.textContent = shopState.coins + " Coins";
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const st = document.createElement("style");
    st.id = STYLE_ID;
    st.textContent =
      "#" + BTN_ID + "{display:inline-flex!important;align-items:center!important;gap:6px!important;white-space:nowrap!important}" +
      "#" + BTN_ID + ".bt-arc-inline{background:linear-gradient(135deg,#d97706,#ea580c)!important;color:#fff!important;border-color:#fde047!important}" +
      "#" + BTN_ID + ".bt-arc-float{position:fixed;bottom:20px;left:20px;z-index:2147483640;background:linear-gradient(135deg,#d97706,#ea580c);color:#fff;border:2px solid #fde047;border-radius:8px;padding:9px 14px;font-weight:800;font-size:13px;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.5)}" +
      ".bt-arc-cico{width:15px;height:15px;image-rendering:pixelated;vertical-align:middle}" +
      "#" + MODAL_ID + "{position:fixed;inset:0;z-index:2147483646;background:rgba(9,13,24,.84);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;font-family:'Segoe UI',system-ui,sans-serif;color:#f1f5f9}" +
      "#" + MODAL_ID + " *{box-sizing:border-box}" +
      ".bt-arc-box{width:min(860px,96vw);max-height:92vh;overflow-y:auto;background:#131824;border:2px solid #354061;border-radius:10px;padding:16px;box-shadow:0 18px 50px rgba(0,0,0,.7)}" +
      ".bt-arc-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;border-bottom:1.5px solid #28324d;padding-bottom:10px;margin-bottom:12px}" +
      ".bt-arc-head h2{margin:0;font-size:18px;font-weight:800;color:#fff}" +
      ".bt-arc-badge{display:inline-flex;align-items:center;gap:6px;background:#1e293b;border:1.5px solid #facc15;border-radius:6px;padding:5px 10px;font-weight:800;font-size:13px;color:#fde047}" +
      ".bt-arc-nav{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap}" +
      ".bt-arc-tab{border:1.5px solid #3d4a6e;background:#1b2234;color:#cbd5e1;font-weight:800;font-size:12.5px;padding:7px 14px;border-radius:6px;cursor:pointer}" +
      ".bt-arc-tab.on{background:#2563eb;border-color:#60a5fa;color:#fff}" +
      ".bt-arc-tab.gold.on{background:#d97706;border-color:#fde047;color:#fff}" +
      ".bt-arc-close{background:#dc2626;border:0;color:#fff;font-weight:800;font-size:12px;padding:7px 12px;border-radius:5px;cursor:pointer}" +
      ".bt-arc-glist{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}" +
      ".bt-arc-gbtn{background:#1b2234;border:1.5px solid #334155;color:#e2e8f0;font-weight:800;font-size:12px;padding:6px 11px;border-radius:5px;cursor:pointer}" +
      ".bt-arc-gbtn.on{background:#16a34a;border-color:#4ade80;color:#fff}" +
      ".bt-arc-bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;background:#1b2234;border:1.5px solid #303b59;border-radius:6px;padding:8px 12px;margin-bottom:10px;font-size:12.5px;font-weight:700}" +
      ".bt-arc-start{background:#2563eb;border:0;border-bottom:3px solid #1d4ed8;color:#fff;font-weight:800;font-size:12px;padding:6px 14px;border-radius:5px;cursor:pointer}" +
      ".bt-arc-cvwrap{display:flex;justify-content:center;background:#0b101b;border:2px solid #303b59;border-radius:8px;padding:8px}" +
      "#bt-arc-cv{width:560px;max-width:100%;height:auto;aspect-ratio:560/320;background:#0f172a;border:2px solid #000;cursor:crosshair;display:block}" +
      ".bt-arc-sgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(185px,1fr));gap:10px}" +
      ".bt-arc-scard{background:#1b2234;border:1.5px solid #303b59;border-radius:8px;padding:11px;display:flex;flex-direction:column;justify-content:space-between;gap:8px}" +
      ".bt-arc-scard.eq{border-color:#4ade80;box-shadow:0 0 10px rgba(74,222,128,.25)}" +
      ".bt-arc-prev{height:44px;display:flex;align-items:center;justify-content:center;gap:5px;background:#0f1420;border:1px solid #28324d;border-radius:5px}" +
      ".bt-arc-prev img{width:28px;height:28px;image-rendering:pixelated}" +
      ".bt-arc-sw{width:14px;height:14px;border:1.5px solid #000}" +
      ".bt-arc-sname{font-size:12.5px;font-weight:800;color:#fff}" +
      ".bt-arc-scat{font-size:10.5px;color:#94a3b8;text-transform:uppercase;font-weight:700}" +
      ".bt-arc-sbtn{border:0;border-radius:5px;padding:7px;font-size:12px;font-weight:800;color:#fff;cursor:pointer;background:#d97706;border-bottom:3px solid #b45309}" +
      ".bt-arc-sbtn.own{background:#2563eb;border-bottom-color:#1d4ed8}" +
      ".bt-arc-sbtn.eq{background:#16a34a;border-bottom-color:#15803d}" +
      ".bt-arc-sbtn:disabled{opacity:.45;cursor:not-allowed}" +
      ".bt-arc-msg{min-height:18px;font-size:12px;font-weight:800;color:#4ade80;margin-top:8px;text-align:center}";
    document.head.appendChild(st);
  }

  function drawTargetHD(ctx, x, y, s) {
    const u = s / 8;
    ctx.fillStyle = "#080808";
    ctx.fillRect(x, y, s, s);

    ctx.fillStyle = "#ef0000";
    ctx.fillRect(x + u, y + u, s - u * 2, s - u * 2);
    ctx.fillStyle = "#ff4d4d";
    ctx.fillRect(x + u, y + u, s - u * 2, 2);
    ctx.fillRect(x + u, y + u, 2, s - u * 2);
    ctx.fillStyle = "#990000";
    ctx.fillRect(x + u, y + s - u - 2, s - u * 2, 2);
    ctx.fillRect(x + s - u - 2, y + u, 2, s - u * 2);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + u * 2, y + u * 2, s - u * 4, s - u * 4);
    ctx.fillStyle = "#d8e1ec";
    ctx.fillRect(x + u * 2, y + s - u * 2 - 1.5, s - u * 4, 1.5);
    ctx.fillRect(x + s - u * 2 - 1.5, y + u * 2, 1.5, s - u * 4);

    ctx.fillStyle = "#e60000";
    ctx.fillRect(x + u * 3, y + u * 3, u * 2, u * 2);
    ctx.fillStyle = "#ff6666";
    ctx.fillRect(x + u * 3, y + u * 3, u * 2, 1.5);
    ctx.fillRect(x + u * 3, y + u * 3, 1.5, u * 2);
    ctx.fillStyle = "#990000";
    ctx.fillRect(x + u * 3, y + u * 5 - 1.5, u * 2, 1.5);
    ctx.fillRect(x + u * 5 - 1.5, y + u * 3, 1.5, u * 2);
  }

  function drawDiamondOre(ctx, x, y, s) {
    const u = s / 8;
    ctx.fillStyle = "#8e898a";
    ctx.fillRect(x, y, s, s);

    ctx.fillStyle = "#6f6b6c";
    [[2, 2], [6, 1], [5, 5], [1, 6]].forEach((p) => {
      ctx.fillRect(x + p[0] * u, y + p[1] * u, u * 2, u * 2);
    });

    ctx.fillStyle = "#38f9c8";
    [[1, 1], [5, 0], [4, 4], [0, 5]].forEach((p) => {
      ctx.fillRect(x + p[0] * u, y + p[1] * u, u * 2, u * 2);
    });
  }

  function clearGame() {
    if (stopCurrentGame) { stopCurrentGame(); stopCurrentGame = null; }
  }

  function startSelectedGame(cv, statEl, msgEl) {
    clearGame();
    const ctx = cv.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    const W = cv.width, H = cv.height;
    let raf = 0, alive = true, finished = false;
    const timers = [];
    const listeners = [];

    const on = (target, ev, fn, opt) => {
      target.addEventListener(ev, fn, opt);
      listeners.push(() => target.removeEventListener(ev, fn, opt));
    };
    const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };

    stopCurrentGame = () => {
      alive = false;
      cancelAnimationFrame(raf);
      timers.forEach((t) => clearTimeout(t));
      listeners.forEach((off) => off());
    };

    const getPos = (e) => {
      const r = cv.getBoundingClientRect();
      return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) };
    };

    const drawBanner = (win, sub) => {
      ctx.fillStyle = "rgba(7, 11, 20, 0.86)";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = win ? "#4ade80" : "#f87171";
      ctx.lineWidth = 4;
      ctx.strokeRect(64, 80, W - 128, 160);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = win ? "#4ade80" : "#f87171";
      ctx.font = "bold 26px Consolas, monospace";
      ctx.fillText(win ? "VICTORY! +3 COINS" : "DEFEAT", W / 2, 128);
      ctx.fillStyle = "#f1f5f9";
      ctx.font = "bold 15px Segoe UI, sans-serif";
      ctx.fillText(sub, W / 2, 170);
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "bold 13px Segoe UI, sans-serif";
      ctx.fillText("Press Restart to play again", W / 2, 206);
      ctx.textBaseline = "alphabetic";
    };

    const endGame = (win, sub) => {
      if (finished) return;
      finished = true;
      if (win) { awardWinCoins(); msgEl.textContent = "You won +3 Coins! Total: " + shopState.coins + " Coins"; }
      else { msgEl.textContent = "Try again!"; }
      drawBanner(win, sub);
    };

    msgEl.textContent = "";

    // 1. AIM TRAINER PVP
    if (activeGame === "aim") {
      let score = 0, goal = 15, tEnd = performance.now() + 15000, parts = [];
      let tx = 260, ty = 140, ts = 40;
      const moveTarget = () => { tx = Math.round(20 + Math.random() * (W - ts - 40)); ty = Math.round(20 + Math.random() * (H - ts - 40)); };
      moveTarget();
      on(cv, "mousedown", (e) => {
        if (finished) return;
        const p = getPos(e);
        if (p.x >= tx && p.x <= tx + ts && p.y >= ty && p.y <= ty + ts) {
          score++;
          for (let i = 0; i < 8; i++) parts.push({ x: tx + ts / 2, y: ty + ts / 2, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, c: i % 2 ? "#ff4d4d" : "#ffffff", l: 16 });
          if (score >= goal) {
            const left = Math.max(0, (tEnd - performance.now()) / 1000);
            statEl.textContent = "Targets: " + score + "/" + goal + "  |  Time: " + left.toFixed(1) + "s";
            return endGame(true, "You destroyed all 15 targets!");
          }
          moveTarget();
        }
      });
      const loop = () => {
        if (!alive || finished) return;
        const left = Math.max(0, (tEnd - performance.now()) / 1000);
        statEl.textContent = "Targets: " + score + "/" + goal + "  |  Time: " + left.toFixed(1) + "s";
        if (left <= 0) return endGame(false, "You hit " + score + "/" + goal + " targets");
        ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 1;
        for (let gx = 0; gx < W; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
        for (let gy = 0; gy < H; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
        drawTargetHD(ctx, tx, ty, ts);
        parts = parts.filter((pt) => pt.l > 0);
        parts.forEach((pt) => { pt.x += pt.vx; pt.y += pt.vy; pt.l--; ctx.fillStyle = pt.c; ctx.fillRect(pt.x, pt.y, 5, 5); });
        raf = requestAnimationFrame(loop);
      };
      loop();
      return;
    }

    // 2. MINING RUSH (CPS)
    if (activeGame === "mine") {
      let broken = 0, goal = 4, hp = 10, maxHp = 10, tEnd = performance.now() + 12000, shake = 0, chunks = [];
      const bx = W / 2 - 56, by = H / 2 - 56, bs = 112;
      on(cv, "mousedown", (e) => {
        if (finished) return;
        const p = getPos(e);
        if (p.x >= bx && p.x <= bx + bs && p.y >= by && p.y <= by + bs) {
          hp--; shake = 6;
          for (let i = 0; i < 6; i++) chunks.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 7, vy: -Math.random() * 5, c: i % 2 ? "#38f9c8" : "#8e898a", l: 20 });
          if (hp <= 0) {
            broken++; hp = maxHp;
            if (broken >= goal) {
              const left = Math.max(0, (tEnd - performance.now()) / 1000);
              statEl.textContent = "Blocks: " + broken + "/" + goal + "  |  Time: " + left.toFixed(1) + "s";
              return endGame(true, "You mined all 4 diamond blocks!");
            }
          }
        }
      });
      const loop = () => {
        if (!alive || finished) return;
        const left = Math.max(0, (tEnd - performance.now()) / 1000);
        statEl.textContent = "Blocks: " + broken + "/" + goal + "  |  Time: " + left.toFixed(1) + "s";
        if (left <= 0) return endGame(false, "You mined " + broken + "/" + goal + " blocks");
        ctx.fillStyle = "#111827"; ctx.fillRect(0, 0, W, H);
        const ox = shake > 0 ? Math.round((Math.random() - 0.5) * 8) : 0;
        const oy = shake > 0 ? Math.round((Math.random() - 0.5) * 8) : 0;
        if (shake > 0) shake--;
        drawDiamondOre(ctx, bx + ox, by + oy, bs);
        const dmg = maxHp - hp;
        if (dmg > 0) {
          ctx.strokeStyle = "#000"; ctx.lineWidth = 3; ctx.beginPath();
          ctx.moveTo(bx + ox + 56, by + oy + 56); ctx.lineTo(bx + ox + 56 - dmg * 4, by + oy + 56 - dmg * 3);
          ctx.moveTo(bx + ox + 56, by + oy + 56); ctx.lineTo(bx + ox + 56 + dmg * 4, by + oy + 56 + dmg * 3);
          if (dmg > 4) { ctx.moveTo(bx + ox + 56, by + oy + 56); ctx.lineTo(bx + ox + 56 + dmg * 3, by + oy + 56 - dmg * 4); }
          ctx.stroke();
        }
        ctx.strokeStyle = "#000"; ctx.lineWidth = 4; ctx.strokeRect(bx + ox, by + oy, bs, bs);
        ctx.fillStyle = "#1e293b"; ctx.fillRect(W / 2 - 70, by + bs + 18, 140, 12);
        ctx.fillStyle = "#38f9c8"; ctx.fillRect(W / 2 - 70, by + bs + 18, (hp / maxHp) * 140, 12);
        ctx.strokeStyle = "#000"; ctx.lineWidth = 2; ctx.strokeRect(W / 2 - 70, by + bs + 18, 140, 12);
        chunks = chunks.filter((c) => c.l > 0);
        chunks.forEach((c) => { c.x += c.vx; c.y += c.vy; c.vy += 0.35; c.l--; ctx.fillStyle = c.c; ctx.fillRect(c.x, c.y, 6, 6); });
        raf = requestAnimationFrame(loop);
      };
      loop();
      return;
    }

    // 3. BLOCK DODGE
    if (activeGame === "dodge") {
      let px = W / 2 - 14, py = H - 44, ps = 28, keys = {}, obs = [], spawn = 0, tStart = performance.now();
      on(window, "keydown", (e) => { if (["ArrowLeft", "ArrowRight", "KeyA", "KeyD"].includes(e.code)) { keys[e.code] = true; e.preventDefault(); } });
      on(window, "keyup", (e) => { keys[e.code] = false; });
      on(cv, "mousemove", (e) => { const p = getPos(e); px = Math.max(4, Math.min(W - ps - 4, p.x - ps / 2)); });
      const loop = () => {
        if (!alive || finished) return;
        const sec = (performance.now() - tStart) / 1000;
        statEl.textContent = "Survive: " + Math.min(20, sec).toFixed(1) + "s / 20.0s  (A/D, Arrows or Mouse)";
        if (sec >= 20) return endGame(true, "You dodged everything for 20 seconds!");
        if (keys.ArrowLeft || keys.KeyA) px -= 6;
        if (keys.ArrowRight || keys.KeyD) px += 6;
        px = Math.max(4, Math.min(W - ps - 4, px));
        spawn--;
        if (spawn <= 0) {
          obs.push({ x: Math.random() * (W - 28), y: -30, s: 26, vy: 3.4 + sec * 0.14, tnt: Math.random() > 0.5 });
          spawn = Math.max(11, 24 - Math.floor(sec * 0.6));
        }
        ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#1e293b"; ctx.fillRect(0, H - 16, W, 16);
        for (let i = obs.length - 1; i >= 0; i--) {
          const o = obs[i]; o.y += o.vy;
          if (o.tnt) {
            ctx.fillStyle = "#dc2626"; ctx.fillRect(o.x, o.y, o.s, o.s);
            ctx.fillStyle = "#fff"; ctx.fillRect(o.x, o.y + 8, o.s, 10);
          } else {
            ctx.fillStyle = "#475569"; ctx.fillRect(o.x, o.y, o.s, 10);
            ctx.fillRect(o.x + 6, o.y + 10, o.s - 12, 8); ctx.fillRect(o.x + 2, o.y + 18, o.s - 4, 8);
          }
          ctx.strokeStyle = "#000"; ctx.lineWidth = 2; ctx.strokeRect(o.x, o.y, o.s, o.s);
          if (px < o.x + o.s - 3 && px + ps > o.x + 3 && py < o.y + o.s - 3 && py + ps > o.y + 3) {
            return endGame(false, "You survived " + sec.toFixed(1) + " seconds");
          }
          if (o.y > H + 10) obs.splice(i, 1);
        }
        ctx.fillStyle = "#38bdf8"; ctx.fillRect(px, py, ps, ps);
        ctx.fillStyle = "#0f172a"; ctx.fillRect(px + 5, py + 7, 6, 6); ctx.fillRect(px + 17, py + 7, 6, 6);
        ctx.strokeStyle = "#000"; ctx.lineWidth = 3; ctx.strokeRect(px, py, ps, ps);
        raf = requestAnimationFrame(loop);
      };
      loop();
      return;
    }

    // 4. PARKOUR JUMP
    if (activeGame === "parkour") {
      const ground = H - 46;
      let py = ground - 30, vy = 0, onG = true, score = 0, goal = 12, obs = [], spawn = 45;
      const jump = () => { if (onG && !finished) { vy = -11.8; onG = false; } };
      on(window, "keydown", (e) => { if (["Space", "ArrowUp", "KeyW"].includes(e.code)) { e.preventDefault(); jump(); } });
      on(cv, "mousedown", jump);
      const loop = () => {
        if (!alive || finished) return;
        statEl.textContent = "Jumps: " + score + "/" + goal + "  (Space / Click to jump)";
        vy += 0.65; py += vy;
        if (py >= ground - 30) { py = ground - 30; vy = 0; onG = true; }
        spawn--;
        if (spawn <= 0) {
          const h = 24 + Math.floor(Math.random() * 18);
          obs.push({ x: W + 20, w: 22, h, passed: false });
          spawn = 55 + Math.floor(Math.random() * 35);
        }
        ctx.fillStyle = "#0b132b"; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#16a34a"; ctx.fillRect(0, ground, W, 8);
        ctx.fillStyle = "#78350f"; ctx.fillRect(0, ground + 8, W, H - ground);
        for (let i = obs.length - 1; i >= 0; i--) {
          const o = obs[i]; o.x -= 5.2 + score * 0.15;
          ctx.fillStyle = "#f97316"; ctx.fillRect(o.x, ground - o.h, o.w, o.h);
          ctx.fillStyle = "#fde047"; ctx.fillRect(o.x + 4, ground - o.h + 4, o.w - 8, 8);
          ctx.strokeStyle = "#000"; ctx.lineWidth = 2; ctx.strokeRect(o.x, ground - o.h, o.w, o.h);
          if (!o.passed && o.x + o.w < 74) {
            o.passed = true; score++;
            if (score >= goal) {
              statEl.textContent = "Jumps: " + score + "/" + goal + "  (Space / Click to jump)";
              return endGame(true, "You cleared all 12 jumps!");
            }
          }
          if (74 < o.x + o.w - 3 && 104 > o.x + 3 && py + 30 > ground - o.h + 3) {
            return endGame(false, "You reached " + score + "/" + goal + " points");
          }
          if (o.x < -40) obs.splice(i, 1);
        }
        ctx.fillStyle = "#33f2cc"; ctx.fillRect(74, py, 30, 30);
        ctx.fillStyle = "#000"; ctx.fillRect(92, py + 7, 6, 6);
        ctx.strokeStyle = "#000"; ctx.lineWidth = 3; ctx.strokeRect(74, py, 30, 30);
        raf = requestAnimationFrame(loop);
      };
      loop();
      return;
    }

    // 5. MEMORY BLOCKS
    if (activeGame === "memory") {
      const pads = [
        { x: 145, y: 36, w: 125, h: 112, c: "#16a34a", lit: "#86efac" },
        { x: 290, y: 36, w: 125, h: 112, c: "#dc2626", lit: "#fca5a5" },
        { x: 145, y: 168, w: 125, h: 112, c: "#0284c7", lit: "#7dd3fc" },
        { x: 290, y: 168, w: 125, h: 112, c: "#ca8a04", lit: "#fef08a" }
      ];
      let seq = [Math.floor(Math.random() * 4)], step = 0, locked = true, litIdx = -1;
      const drawPads = () => {
        if (!alive || finished) return;
        ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, W, H);
        pads.forEach((p, idx) => {
          ctx.fillStyle = litIdx === idx ? p.lit : p.c;
          ctx.fillRect(p.x, p.y, p.w, p.h);
          ctx.strokeStyle = "#000"; ctx.lineWidth = 4; ctx.strokeRect(p.x, p.y, p.w, p.h);
        });
      };
      const playSeq = () => {
        locked = true; step = 0;
        statEl.textContent = "Round " + seq.length + "/5  |  Watch the sequence...";
        drawPads();
        seq.forEach((id, i) => {
          later(() => { litIdx = id; drawPads(); }, 450 + i * 620);
          later(() => { litIdx = -1; drawPads(); }, 850 + i * 620);
        });
        later(() => {
          locked = false;
          statEl.textContent = "Round " + seq.length + "/5  |  Your turn!";
        }, 450 + seq.length * 620);
      };
      on(cv, "mousedown", (e) => {
        if (locked || finished) return;
        const p = getPos(e);
        const idx = pads.findIndex((b) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h);
        if (idx === -1) return;
        litIdx = idx; drawPads();
        later(() => { litIdx = -1; drawPads(); }, 180);
        if (idx !== seq[step]) return endGame(false, "Missed on round " + seq.length + "/5");
        step++;
        if (step >= seq.length) {
          if (seq.length >= 5) return endGame(true, "You completed the 5-step sequence!");
          seq.push(Math.floor(Math.random() * 4));
          locked = true;
          later(playSeq, 550);
        }
      });
      seq.push(Math.floor(Math.random() * 4));
      playSeq();
    }
  }

  function renderModalBody(wrap) {
    clearGame();
    const body = wrap.querySelector(".bt-arc-body");
    const msgEl = wrap.querySelector(".bt-arc-msg");
    msgEl.textContent = "";

    if (activeTab === "games") {
      body.innerHTML =
        '<div class="bt-arc-glist">' +
        '  <button type="button" class="bt-arc-gbtn' + (activeGame === "aim" ? " on" : "") + '" data-g="aim">Aim Trainer</button>' +
        '  <button type="button" class="bt-arc-gbtn' + (activeGame === "mine" ? " on" : "") + '" data-g="mine">Mining Rush</button>' +
        '  <button type="button" class="bt-arc-gbtn' + (activeGame === "dodge" ? " on" : "") + '" data-g="dodge">Block Dodge</button>' +
        '  <button type="button" class="bt-arc-gbtn' + (activeGame === "parkour" ? " on" : "") + '" data-g="parkour">Parkour Jump</button>' +
        '  <button type="button" class="bt-arc-gbtn' + (activeGame === "memory" ? " on" : "") + '" data-g="memory">Memory Blocks</button>' +
        '</div>' +
        '<div class="bt-arc-bar">' +
        '  <span id="bt-arc-stat">Ready to play</span>' +
        '  <button type="button" class="bt-arc-start" id="bt-arc-restart">Restart</button>' +
        '</div>' +
        '<div class="bt-arc-cvwrap"><canvas id="bt-arc-cv" width="560" height="320"></canvas></div>';

      const cv = body.querySelector("#bt-arc-cv");
      const stat = body.querySelector("#bt-arc-stat");
      body.querySelectorAll("[data-g]").forEach((b) => {
        b.addEventListener("click", () => { activeGame = b.getAttribute("data-g"); renderModalBody(wrap); });
      });
      body.querySelector("#bt-arc-restart").addEventListener("click", () => startSelectedGame(cv, stat, msgEl));
      startSelectedGame(cv, stat, msgEl);
      return;
    }

    const catNames = { all: "All", cursor: "Cursors", trail: "Trails", hud: "HUD", sound: "Sounds", theme: "Themes" };
    const items = (window.BLOXD_ARCADE_CATALOG || []).filter((it) => shopFilter === "all" || it.cat === shopFilter);
    const filtersHtml = Object.keys(catNames).map((k) =>
      '<button type="button" class="bt-arc-gbtn' + (shopFilter === k ? " on" : "") + '" data-f="' + k + '">' + catNames[k] + '</button>'
    ).join("");

    body.innerHTML = '<div class="bt-arc-glist">' + filtersHtml + '</div><div class="bt-arc-sgrid"></div>';
    body.querySelectorAll("[data-f]").forEach((b) => {
      b.addEventListener("click", () => { shopFilter = b.getAttribute("data-f"); renderModalBody(wrap); });
    });

    const grid = body.querySelector(".bt-arc-sgrid");
    items.forEach((it) => {
      const owned = shopState.owned.includes(it.id);
      const eq = shopState.equipped || {};
      const isThemeActive = it.cat === "theme" && it.theme && activeThemeId === it.theme.id;
      const isEq = isThemeActive ||
        (it.cat === "cursor" && eq.cursor === it.id) ||
        (it.cat === "trail" && eq.trail === it.id) ||
        (it.cat === "sound" && eq.sound === it.id) ||
        (it.id === "hud_crown" && eq.crown) ||
        (it.id === "hud_gold_border" && eq.goldBorder);

      const card = document.createElement("div");
      card.className = "bt-arc-scard" + (isEq ? " eq" : "");

      let prevHtml = "";
      if (it.svg) prevHtml = '<img src="data:image/svg+xml;utf8,' + encodeURIComponent(it.svg) + '" alt="">';
      else if (it.preview) prevHtml = '<img src="data:image/svg+xml;utf8,' + encodeURIComponent(it.preview) + '" alt="">';
      else if (it.theme) prevHtml = [it.theme.mainBg, it.theme.panelBg, it.theme.accent].map((c) => '<span class="bt-arc-sw" style="background:' + c + '"></span>').join("");
      else if (it.colors) prevHtml = it.colors.map((c) => '<span class="bt-arc-sw" style="background:' + c + '"></span>').join("");

      card.innerHTML =
        '<div class="bt-arc-prev">' + prevHtml + '</div>' +
        '<div><div class="bt-arc-scat">' + (catNames[it.cat] || it.cat) + '</div><div class="bt-arc-sname">' + it.name + '</div></div>' +
        '<button type="button" class="bt-arc-sbtn"></button>';

      const btn = card.querySelector(".bt-arc-sbtn");
      if (!owned) {
        btn.textContent = "Buy (" + it.price + " Coins)";
        if (shopState.coins < it.price) btn.disabled = true;
        btn.addEventListener("click", () => {
          if (shopState.coins < it.price) return;
          shopState.coins -= it.price;
          shopState.owned.push(it.id);
          saveShop(() => { msgEl.textContent = "Purchased: " + it.name + "!"; renderModalBody(wrap); });
        });
      } else if (it.cat === "theme") {
        btn.className = "bt-arc-sbtn " + (isThemeActive ? "eq" : "own");
        btn.textContent = isThemeActive ? "Active Theme" : "Apply Theme";
        btn.addEventListener("click", () => {
          chrome.storage.local.set({ activeTheme: it.theme }, () => {
            activeThemeId = it.theme.id;
            msgEl.textContent = "Theme applied: " + it.name + "!";
            renderModalBody(wrap);
          });
        });
      } else {
        btn.className = "bt-arc-sbtn " + (isEq ? "eq" : "own");
        btn.textContent = isEq ? "Equipped (Unequip)" : "Equip";
        btn.addEventListener("click", () => {
          if (it.cat === "cursor") shopState.equipped.cursor = isEq ? "" : it.id;
          else if (it.cat === "trail") shopState.equipped.trail = isEq ? "" : it.id;
          else if (it.cat === "sound") shopState.equipped.sound = isEq ? "" : it.id;
          else if (it.id === "hud_crown") shopState.equipped.crown = !isEq;
          else if (it.id === "hud_gold_border") shopState.equipped.goldBorder = !isEq;
          saveShop(() => { msgEl.textContent = (isEq ? "Unequipped: " : "Equipped: ") + it.name; renderModalBody(wrap); });
        });
      }
      grid.appendChild(card);
    });
  }

  function openArcadeModal() {
    ensureStyles();
    const old = document.getElementById(MODAL_ID);
    if (old) { clearGame(); old.remove(); }

    loadShop(() => {
      const wrap = document.createElement("div");
      wrap.id = MODAL_ID;
      wrap.innerHTML =
        '<div class="bt-arc-box">' +
        '  <div class="bt-arc-head">' +
        '    <h2>Arcade &amp; Shop</h2>' +
        '    <div style="display:flex;align-items:center;gap:8px">' +
        '      <div class="bt-arc-badge"><img class="bt-arc-cico" src="' + (window.BLOXD_ARCADE_COIN_URL || "") + '" alt=""><span class="bt-arc-mc">' + shopState.coins + ' Coins</span></div>' +
        '      <button type="button" class="bt-arc-close">Close [Esc]</button>' +
        '    </div>' +
        '  </div>' +
        '  <div class="bt-arc-nav">' +
        '    <button type="button" class="bt-arc-tab' + (activeTab === "games" ? " on" : "") + '" data-atab="games">Minigames (+3 Coins)</button>' +
        '    <button type="button" class="bt-arc-tab gold' + (activeTab === "shop" ? " on" : "") + '" data-atab="shop">Shop</button>' +
        '  </div>' +
        '  <div class="bt-arc-body"></div>' +
        '  <div class="bt-arc-msg"></div>' +
        '</div>';

      document.body.appendChild(wrap);
      wrap.querySelectorAll("[data-atab]").forEach((b) => {
        b.addEventListener("click", () => {
          activeTab = b.getAttribute("data-atab");
          wrap.querySelectorAll("[data-atab]").forEach((x) => x.classList.toggle("on", x === b));
          renderModalBody(wrap);
        });
      });

      const close = () => { clearGame(); wrap.remove(); window.removeEventListener("keydown", onEsc); };
      const onEsc = (e) => { if (e.key === "Escape") close(); };
      wrap.querySelector(".bt-arc-close").addEventListener("click", close);
      wrap.addEventListener("click", (e) => { if (e.target === wrap) close(); });
      window.addEventListener("keydown", onEsc);
      renderModalBody(wrap);
    });
  }

  function injectButton() {
    if (!document.body) return;
    ensureStyles();
    const anchor = document.getElementById("bt-x3-open-btn") || Array.from(document.querySelectorAll("[data-tab]")).pop();
    let btn = document.getElementById(BTN_ID);
    if (!btn) {
      btn = document.createElement("button");
      btn.id = BTN_ID;
      btn.type = "button";
      btn.innerHTML = 'Arcade &amp; Shop <img class="bt-arc-cico" src="' + (window.BLOXD_ARCADE_COIN_URL || "") + '" alt=""><span class="bt-arc-cnum">' + shopState.coins + '</span>';
      btn.addEventListener("click", openArcadeModal);
    }
    if (anchor && anchor.parentElement && !anchor.classList.contains("bt-x3-float")) {
      if (btn.parentElement !== anchor.parentElement) {
        const tabs = document.querySelectorAll("[data-tab]");
        const baseCls = tabs.length ? (tabs[0].className || "").replace(/\bactive\b/g, "").trim() : "";
        btn.className = (baseCls + " bt-arc-inline").trim();
        anchor.parentElement.style.flexWrap = "wrap";
        anchor.insertAdjacentElement("afterend", btn);
      }
    } else if (!btn.parentElement) {
      btn.className = "bt-arc-float";
      document.body.appendChild(btn);
    }
  }

  loadShop(() => injectButton());
  new MutationObserver(() => {
    const btn = document.getElementById(BTN_ID);
    const hasTabs = Boolean(document.querySelector("[data-tab]"));
    if (!btn || (hasTabs && btn.classList.contains("bt-arc-float"))) injectButton();
  }).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(injectButton, 900);
})();