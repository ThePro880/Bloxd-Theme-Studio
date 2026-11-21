window.BLOXD_OST_PLAYLISTS = [
  {
    id: "all",
    name: "all bloxd osts",
    tracks: [
      { title: "Progress (Main Menu)", file: "progress.mp3" },
      { title: "Pirates", file: "Mojo Productions - Pirates.mp3" },
      { title: "A Place To Be Free", file: "Adigold - A Place To Be Free.mp3" },
      { title: "Butterfly Effect", file: "Adigold - Butterfly Effect.mp3" },
      { title: "Dreamless Sleep", file: "Adigold - Dreamless Sleep.mp3" },
      { title: "Frozen Skies", file: "Adigold - Frozen Skies.mp3" },
      { title: "Frozen Pulse", file: "Adigold - Frozen Pulse.mp3" },
      { title: "Healing Thoughts", file: "Adigold - Healing Thoughts.mp3" },
      { title: "Here Forever", file: "Adigold - Here Forever.mp3" },
      { title: "Just Like Heaven", file: "Adigold - Just Like Heaven.mp3" },
      { title: "Memories Remain", file: "Adigold - Memories Remain.mp3" },
      { title: "The Riverside", file: "Adigold - The Riverside.mp3" },
      { title: "The Wonder", file: "Adigold - The Wonder.mp3" }
    ]
  },
  {
    id: "survival",
    name: "survival & open worlds",
    tracks: [
      { title: "A Place To Be Free", file: "Adigold - A Place To Be Free.mp3" },
      { title: "Butterfly Effect", file: "Adigold - Butterfly Effect.mp3" },
      { title: "Dreamless Sleep", file: "Adigold - Dreamless Sleep.mp3" },
      { title: "Frozen Skies", file: "Adigold - Frozen Skies.mp3" },
      { title: "Frozen Pulse", file: "Adigold - Frozen Pulse.mp3" },
      { title: "Healing Thoughts", file: "Adigold - Healing Thoughts.mp3" },
      { title: "Here Forever", file: "Adigold - Here Forever.mp3" },
      { title: "Just Like Heaven", file: "Adigold - Just Like Heaven.mp3" },
      { title: "Memories Remain", file: "Adigold - Memories Remain.mp3" },
      { title: "The Riverside", file: "Adigold - The Riverside.mp3" },
      { title: "The Wonder", file: "Adigold - The Wonder.mp3" }
    ]
  },
  {
    id: "pirates",
    name: "pirates & menu",
    tracks: [
      { title: "Pirates", file: "Mojo Productions - Pirates.mp3" },
      { title: "Progress (Main Menu)", file: "progress.mp3" }
    ]
  }
];

window.getBloxdTrackUrls = function (file) {
  if (/^https?:\/\//i.test(file)) return [file];
  const enc = encodeURIComponent(file);
  const ogg = encodeURIComponent(file.replace(/\.mp3$/i, ".ogg"));
  return [
    `https://static2.bloxd.io/sounds/music/${enc}`,
    `https://static2.bloxd.io/sounds/music/${ogg}`,
    `https://bloxd.io/sounds/music/${enc}`
  ];
};

window.BLOXD_CUSTOM_DB = (() => {
  const DB_NAME = "BloxdThemeStudioMusicDB";
  const STORE = "tracks";

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function getAll() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => {
        const items = req.result || [];
        items.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async function addFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return [];
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const added = [];
      const now = Date.now();
      files.forEach((f, idx) => {
        const cleanTitle = f.name.replace(/\.[^/.]+$/, "").trim() || "Custom Track";
        const item = {
          id: `local-${now}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
          title: cleanTitle,
          size: f.size || 0,
          blob: f,
          createdAt: now + idx
        };
        store.put(item);
        added.push(item);
      });
      tx.oncomplete = () => resolve(added);
      tx.onerror = () => reject(tx.error);
    });
  }

  async function remove(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
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

  return { getAll, addFiles, remove, clear };
})();