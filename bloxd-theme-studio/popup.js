const PRESETS = {
  navidad: {
    id: "navidad",
    name: "Christmas",
    mainBg: "#0d2b22",
    sidebarBg: "#2b0c12",
    loadingBg: "#0a221b",
    panelBg: "#174234",
    accent: "#ef4444",
    text: "#f8fafc",
    effect: "snow"
  },
  halloween: {
    id: "halloween",
    name: "Halloween",
    mainBg: "#180d26",
    sidebarBg: "#11081c",
    loadingBg: "#140a21",
    panelBg: "#2b1644",
    accent: "#f97316",
    text: "#ffedd5",
    effect: "spooky"
  },
  verano: {
    id: "verano",
    name: "Summer",
    mainBg: "#0369a1",
    sidebarBg: "#0c4a6e",
    loadingBg: "#0284c7",
    panelBg: "#075985",
    accent: "#facc15",
    text: "#ffffff",
    effect: "summer"
  }
};

const els = {
  name: document.getElementById("theme-name"),
  main: document.getElementById("c-main"),
  sidebar: document.getElementById("c-sidebar"),
  loading: document.getElementById("c-loading"),
  panel: document.getElementById("c-panel"),
  accent: document.getElementById("c-accent"),
  text: document.getElementById("c-text"),
  effect: document.getElementById("c-effect"),
  savedList: document.getElementById("saved-list"),
  status: document.getElementById("status")
};

function showStatus(msg) {
  els.status.textContent = msg;
  setTimeout(() => {
    if (els.status.textContent === msg) els.status.textContent = "";
  }, 2200);
}

function getFormTheme() {
  return {
    id: "custom-" + Date.now(),
    name: els.name.value.trim() || "My Theme",
    mainBg: els.main.value,
    sidebarBg: els.sidebar.value,
    loadingBg: els.loading.value,
    panelBg: els.panel.value,
    accent: els.accent.value,
    text: els.text.value,
    effect: els.effect.value
  };
}

function fillForm(theme) {
  if (!theme) return;
  els.main.value = theme.mainBg || "#1b2236";
  els.sidebar.value = theme.sidebarBg || "#131826";
  els.loading.value = theme.loadingBg || "#161c2e";
  els.panel.value = theme.panelBg || "#242c44";
  els.accent.value = theme.accent || "#38bdf8";
  els.text.value = theme.text || "#ffffff";
  els.effect.value = theme.effect || "none";
}

async function applyThemeToBloxd(theme) {
  await chrome.storage.local.set({ activeTheme: theme });
  const tabs = await chrome.tabs.query({
    url: ["https://bloxd.io/*", "https://*.bloxd.io/*"]
  });

  for (const tab of tabs) {
    try {
      await chrome.tabs.sendMessage(tab.id, { type: "APPLY_THEME", theme });
    } catch {
      // Applies on page reload if tab was open before installing
    }
  }
  highlightActivePreset(theme ? theme.id : null);
}

function highlightActivePreset(activeId) {
  document.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.preset === activeId);
  });
}

async function renderSavedThemes() {
  const data = await chrome.storage.local.get(["savedThemes"]);
  const saved = data.savedThemes || [];

  if (saved.length === 0) {
    els.savedList.innerHTML = '<p class="empty-msg">No saved themes yet.</p>';
    return;
  }

  els.savedList.innerHTML = "";
  saved.forEach((theme) => {
    const item = document.createElement("div");
    item.className = "saved-item";

    const info = document.createElement("div");
    info.className = "saved-info";

    const dot = document.createElement("span");
    dot.className = "mini-dot";
    dot.style.background = `linear-gradient(135deg, ${theme.mainBg}, ${theme.accent})`;

    const title = document.createElement("span");
    title.textContent = theme.name;

    info.append(dot, title);

    const btns = document.createElement("div");
    btns.className = "saved-btns";

    const applyBtn = document.createElement("button");
    applyBtn.className = "btn-apply";
    applyBtn.textContent = "Apply";
    applyBtn.addEventListener("click", () => {
      fillForm(theme);
      applyThemeToBloxd(theme);
      showStatus(`"${theme.name}" applied`);
    });

    const delBtn = document.createElement("button");
    delBtn.className = "btn-del";
    delBtn.textContent = "X";
    delBtn.title = "Delete theme";
    delBtn.addEventListener("click", async () => {
      const updated = saved.filter((t) => t.id !== theme.id);
      await chrome.storage.local.set({ savedThemes: updated });
      renderSavedThemes();
      showStatus("Theme deleted");
    });

    btns.append(applyBtn, delBtn);
    item.append(info, btns);
    els.savedList.appendChild(item);
  });
}

document.querySelectorAll(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const preset = PRESETS[btn.dataset.preset];
    if (!preset) return;
    fillForm(preset);
    applyThemeToBloxd(preset);
    showStatus(`${preset.name} theme activated`);
  });
});

document.getElementById("btn-preview").addEventListener("click", () => {
  const tempTheme = getFormTheme();
  applyThemeToBloxd(tempTheme);
  showStatus("Preview applied");
});

document.getElementById("btn-save").addEventListener("click", async () => {
  const newTheme = getFormTheme();
  const data = await chrome.storage.local.get(["savedThemes"]);
  const saved = data.savedThemes || [];
  saved.unshift(newTheme);

  await chrome.storage.local.set({ savedThemes: saved });
  await applyThemeToBloxd(newTheme);
  els.name.value = "";
  renderSavedThemes();
  showStatus(`"${newTheme.name}" saved`);
});

document.getElementById("btn-reset").addEventListener("click", () => {
  applyThemeToBloxd(null);
  showStatus("Default theme restored");
});

const moreBtn = document.getElementById("btn-more");
if (moreBtn) {
  moreBtn.addEventListener("click", (e) => {
    if (chrome.tabs && chrome.tabs.create) {
      e.preventDefault();
      chrome.tabs.create({ url: "https://bloxd.io/more_settings" });
    }
  });
}

(async () => {
  const data = await chrome.storage.local.get(["activeTheme"]);
  if (data.activeTheme) {
    fillForm(data.activeTheme);
    highlightActivePreset(data.activeTheme.id);
  }
  renderSavedThemes();
})();