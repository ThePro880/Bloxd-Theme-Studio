function parseYouTubeId(input) {
  const m = String(input || "").match(
    /(?:(?:www\.|m\.|music\.)?youtube\.com\/(?:watch\?.*v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

function extractJsonObject(text, startIdx) {
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = startIdx; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
    } else {
      if (ch === '"') inStr = true;
      else if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) return text.slice(startIdx, i + 1);
      }
    }
  }
  return null;
}

function extractInitialData(html) {
  const markers = [
    "var ytInitialData = ",
    'window["ytInitialData"] = ',
    "ytInitialData = "
  ];
  for (const marker of markers) {
    const idx = html.indexOf(marker);
    if (idx === -1) continue;
    const start = html.indexOf("{", idx + marker.length);
    if (start === -1) continue;
    const raw = extractJsonObject(html, start);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // Sigue con el siguiente marcador
      }
    }
  }
  return null;
}

function collectVideos(node, out, seen) {
  if (!node || typeof node !== "object" || out.length >= 12) return;
  if (Array.isArray(node)) {
    for (const item of node) {
      collectVideos(item, out, seen);
      if (out.length >= 12) break;
    }
    return;
  }

  if (node.videoRenderer && node.videoRenderer.videoId) {
    const vr = node.videoRenderer;
    const id = vr.videoId;
    if (!seen.has(id)) {
      seen.add(id);
      const title =
        vr.title?.runs?.map((r) => r.text).join("") ||
        vr.title?.simpleText ||
        "YouTube Video";
      const channel =
        vr.ownerText?.runs?.[0]?.text ||
        vr.longBylineText?.runs?.[0]?.text ||
        vr.shortBylineText?.runs?.[0]?.text ||
        "YouTube";
      const duration = vr.lengthText?.simpleText || "LIVE";
      out.push({
        videoId: id,
        title: title.trim(),
        channel: channel.trim(),
        duration,
        thumb: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`
      });
    }
    return;
  }

  for (const key of Object.keys(node)) {
    collectVideos(node[key], out, seen);
    if (out.length >= 12) break;
  }
}

async function searchViaApi(query) {
  const res = await fetch("https://www.youtube.com/youtubei/v1/search?prettyPrint=false", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      context: {
        client: {
          clientName: "WEB",
          clientVersion: "2.20250101.01.00",
          hl: "es"
        }
      },
      query
    })
  });
  if (!res.ok) return [];
  const data = await res.json();
  const results = [];
  collectVideos(data, results, new Set());
  return results;
}

async function searchViaHtml(query) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&hl=es`;
  const res = await fetch(url, { credentials: "omit" });
  const html = await res.text();
  const data = extractInitialData(html);
  const results = [];
  if (data) collectVideos(data, results, new Set());
  return results;
}

async function searchYouTube(rawQuery) {
  const query = String(rawQuery || "").trim();
  if (!query) return [];

  const directId = parseYouTubeId(query);
  if (directId) {
    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${directId}`)}&format=json`
      );
      if (oembedRes.ok) {
        const info = await oembedRes.json();
        return [{
          videoId: directId,
          title: info.title || "YouTube Video",
          channel: info.author_name || "YouTube",
          duration: "URL",
          thumb: `https://i.ytimg.com/vi/${directId}/mqdefault.jpg`
        }];
      }
    } catch {
      // Fallback básico si oEmbed falla
    }
    return [{
      videoId: directId,
      title: `YouTube Video (${directId})`,
      channel: "YouTube",
      duration: "URL",
      thumb: `https://i.ytimg.com/vi/${directId}/mqdefault.jpg`
    }];
  }

  try {
    const apiResults = await searchViaApi(query);
    if (apiResults.length) return apiResults;
  } catch {
    // Si falla el método JSON, usa respaldo HTML
  }

  return await searchViaHtml(query);
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "YT_SEARCH") {
    searchYouTube(msg.query)
      .then((results) => sendResponse({ ok: true, results }))
      .catch((err) => sendResponse({ ok: false, error: err?.message || "Search failed" }));
    return true;
  }
});