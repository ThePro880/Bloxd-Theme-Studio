(() => {
  window.BLOXD_V3_DEFAULTS = {
    hudSettings: {
      crosshairEnabled: false,
      crosshairOnlyInGame: true,
      crosshairType: "cross",
      crosshairColor: "#00f5d4",
      crosshairOutline: true,
      crosshairSize: 14,
      crosshairThickness: 2,
      crosshairGap: 4,
      crosshairOpacity: 100,
      keystrokesEnabled: false,
      keystrokesShowCps: true,
      keystrokesShowSpace: true,
      keystrokesPosX: 16,
      keystrokesPosY: 16,
      fpsEnabled: false,
      fpsPosX: 16,
      fpsPosY: 185,
      timerEnabled: false,
      timerMode: "session",
      timerPosX: 16,
      timerPosY: 230
    },
    visualV3: {
      glassMode: false,
      glassOpacity: 68,
      rgbBorders: false,
      fontStyle: "default",
      cursorStyle: "default",
      particleShape: "circle",
      localBgActive: false,
      localBgDim: 40,
      localBgUpdatedAt: 0,
      customCrosshairUpdatedAt: 0
    }
  };

  window.BLOXD_V3_FONTS = {
    default: "",
    pixel: '"Consolas", "Lucida Console", "Courier New", monospace',
    futuristic: '"Bahnschrift", "Segoe UI Semibold", "Trebuchet MS", sans-serif',
    rounded: '"Trebuchet MS", "Comic Sans MS", "Segoe UI", sans-serif'
  };

  function svgToCursor(svg, hotX, hotY) {
    const q = String.fromCharCode(34);
    return "url(" + q + "data:image/svg+xml;utf8," + encodeURIComponent(svg) + q + ") " + hotX + " " + hotY + ", auto";
  }

  window.BLOXD_V3_CURSORS = {
    default: "",
    neon_arrow: svgToCursor(
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 28 28">' +
      '<path d="M3 2 L22 14 L14 16 L18 24 L14 26 L10 18 L4 23 Z" fill="#00f5d4" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>' +
      '</svg>',
      2, 2
    ),
    pixel_sword: svgToCursor(
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 8 8" shape-rendering="crispEdges">' +
      '<g transform="translate(8,0) scale(-1,1)">' +
      '<path fill="#000000" d="M5 0h3v1H5zM4 1h1v1H4zM7 1h1v2H7zM3 2h1v1H3zM0 3h3v1H0zM6 3h1v1H6zM0 4h1v1H0zM2 4h1v1H2zM5 4h1v1H5zM1 5h1v1H1zM3 5h2v1H3zM0 6h1v2H0zM2 6h1v1H2zM4 6h1v2H4zM1 7h1v1H1zM3 7h1v1H3z"/>' +
      '<path fill="#33f2cc" d="M5 1h2v1H5zM4 2h3v1H4zM3 3h3v1H3zM4 4h1v1H4z"/>' +
      '<path fill="#1ea3b8" d="M1 4h1v1H1zM3 4h1v1H3zM2 5h1v1H2zM3 6h1v1H3z"/>' +
      '<rect x="1" y="6" width="1" height="1" fill="#785231"/>' +
      '</g>' +
      '</svg>',
      1, 1
    ),
    cross_aim: svgToCursor(
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
      '<circle cx="12" cy="12" r="8" fill="none" stroke="#facc15" stroke-width="2"/>' +
      '<path d="M12 2 V7 M12 17 V22 M2 12 H7 M17 12 H22" stroke="#ffffff" stroke-width="2"/>' +
      '<circle cx="12" cy="12" r="1.8" fill="#ef4444"/>' +
      '</svg>',
      12, 12
    ),
    diamond_pick: svgToCursor(
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 8 8" shape-rendering="crispEdges">' +
      '<g transform="translate(8,0) scale(-1,1)">' +
      '<path fill="#000000" d="M2 0h4v1H2zM1 1h1v1H1zM6 1h1v1H6zM1 2h4v1H1zM7 2h1v4H7zM3 3h1v1H3zM5 3h1v4H5zM2 4h1v1H2zM4 4h1v1H4zM1 5h1v1H1zM3 5h1v1H3zM0 6h1v2H0zM2 6h1v1H2zM6 6h1v1H6zM1 7h1v1H1z"/>' +
      '<path fill="#33f2cc" d="M2 1h4v1H2zM6 2h1v4H6z"/>' +
      '<rect x="5" y="2" width="1" height="1" fill="#1ea3b8"/>' +
      '<path fill="#785231" d="M4 3h1v1H4zM3 4h1v1H3zM2 5h1v1H2zM1 6h1v1H1z"/>' +
      '</g>' +
      '</svg>',
      3, 3
    )
  };

  function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const hex = (x) => Math.round(x * 255).toString(16).padStart(2, "0");
    return "#" + hex(f(0)) + hex(f(8)) + hex(f(4));
  }

  window.generateRandomBloxdTheme = function () {
    const baseH = Math.floor(Math.random() * 360);
    const accentH = (baseH + 90 + Math.floor(Math.random() * 170)) % 360;
    const sat = 35 + Math.floor(Math.random() * 35);
    const effects = ["none", "snow", "spooky", "summer"];
    const prefixes = ["Cyber", "Void", "Galaxy", "Frost", "Ember", "Hyper", "Neon", "Pixel", "Lunar", "Turbo"];
    const nouns = ["Craft", "Block", "Vibe", "Wave", "Core", "Night", "Sky", "Pulse", "Realm", "Spark"];
    const name = prefixes[Math.floor(Math.random() * prefixes.length)] + " " + nouns[Math.floor(Math.random() * nouns.length)];

    return {
      id: "rnd-" + Date.now(),
      name,
      mainBg: hslToHex(baseH, sat, 14),
      sidebarBg: hslToHex((baseH + 12) % 360, sat + 5, 10),
      loadingBg: hslToHex(baseH, sat, 11),
      panelBg: hslToHex(baseH, sat, 21),
      accent: hslToHex(accentH, 88, 58),
      text: "#f8fafc",
      effect: effects[Math.floor(Math.random() * effects.length)]
    };
  };

  window.BLOXD_V3_ASSETS_DB = (() => {
    const DB_NAME = "BloxdThemeStudioAssetsDB";
    const STORE = "assets";

    function openDB() {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE)) {
            db.createObjectStore(STORE, { keyPath: "key" });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }

    async function get(key) {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    }

    async function set(key, file) {
      if (!file) return null;
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        const item = {
          key,
          name: file.name || key,
          type: file.type || "",
          size: file.size || 0,
          blob: file,
          updatedAt: Date.now()
        };
        tx.objectStore(STORE).put(item);
        tx.oncomplete = () => resolve(item);
        tx.onerror = () => reject(tx.error);
      });
    }

    async function remove(key) {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }

    async function clear() {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }

    return { get, set, remove, clear };
  })();
})();