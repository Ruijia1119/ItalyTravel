(() => {
  if (!window.L) return;

  const maps = new Map();
  const loaded = new Set();
  let geocodeChain = Promise.resolve();

  const fallbackCenters = {
    "2026-09-25": [22.3080, 113.9185],
    "2026-09-26": [41.9028, 12.4964],
    "2026-09-27": [41.9028, 12.4964],
    "2026-09-28": [43.7696, 11.2558],
    "2026-09-29": [43.7696, 11.2558],
    "2026-09-30": [44.00, 10.05],
    "2026-10-01": [45.4408, 12.3155],
    "2026-10-02": [46.705, 12.16],
    "2026-10-03": [46.675, 11.60],
    "2026-10-04": [46.575, 11.67],
    "2026-10-05": [45.4642, 9.1900],
    "2026-10-06": [45.63, 8.72],
    "2026-10-07": [60.3172, 24.9633]
  };

  const iconEmoji = { attraction: "🏛️", food: "🍴", hotel: "🏨" };
  const categoryLabel = { attraction: "景点", food: "餐饮", hotel: "住宿" };

  function makeIcon(category) {
    return L.divIcon({
      className: "map-marker",
      html: `<span>${iconEmoji[category] || "📍"}</span>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15]
    });
  }

  function queryFromGoogleMaps(url) {
    try {
      const u = new URL(url, window.location.href);
      if (!u.hostname.includes("google.com")) return null;
      if (u.pathname.includes("/maps/search")) return u.searchParams.get("query");
      return null;
    } catch (_) {
      return null;
    }
  }

  function cleanName(text) {
    return (text || "")
      .replace(/↗/g, "")
      .replace(/📍\s*Google Maps/g, "")
      .replace(/🗺️\s*打开地图/g, "")
      .trim();
  }

  function categoryFor(anchor) {
    if (anchor.closest(".food-box")) return "food";
    const txt = `${anchor.textContent} ${anchor.closest(".summary-chip")?.textContent || ""}`.toLowerCase();
    if (/hotel|住宿|parkhotel|jarolim|osteria della pista|b&b/.test(txt)) return "hotel";
    return "attraction";
  }

  function nameFor(anchor, category, query) {
    if (category === "food") {
      return anchor.closest(".food-item")?.querySelector("b")?.textContent.trim() || query;
    }
    if (category === "hotel") {
      const summary = anchor.closest(".summary-chip")?.querySelector("small")?.textContent.trim();
      if (summary) return summary.split("·")[0].trim();
    }
    return cleanName(anchor.textContent) || query;
  }

  function collectPlaces(day) {
    const candidates = [
      ...day.querySelectorAll(".food-box a.food-map[href*='google.com/maps/search']"),
      ...day.querySelectorAll(".timeline a.map-link[href*='google.com/maps/search']"),
      ...day.querySelectorAll(".day-summary a.map-link[href*='google.com/maps/search']"),
      ...day.querySelectorAll(".action-row a[href*='google.com/maps/search']")
    ];

    const seen = new Set();
    const places = [];
    candidates.forEach(anchor => {
      const query = queryFromGoogleMaps(anchor.href);
      if (!query) return;
      const key = query.toLowerCase().replace(/\s+/g, " ").trim();
      if (seen.has(key)) return;
      seen.add(key);
      const category = categoryFor(anchor);
      places.push({
        query,
        name: nameFor(anchor, category, query),
        category,
        google: anchor.href
      });
    });
    return places;
  }

  function cacheKey(query) {
    return `italytrip:geo:${query.toLowerCase().trim()}`;
  }

  function readCache(query) {
    try {
      const raw = localStorage.getItem(cacheKey(query));
      return raw ? JSON.parse(raw) : undefined;
    } catch (_) {
      return undefined;
    }
  }

  function writeCache(query, value) {
    try { localStorage.setItem(cacheKey(query), JSON.stringify(value)); } catch (_) {}
  }

  function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

  async function geocodeNow(query) {
    const cached = readCache(query);
    if (cached !== undefined) return cached;
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=en&q=${encodeURIComponent(query)}`;
    try {
      const response = await fetch(url, { headers: { "Accept": "application/json" } });
      if (!response.ok) throw new Error(`Geocoder ${response.status}`);
      const rows = await response.json();
      const value = rows[0] ? {
        lat: Number(rows[0].lat),
        lon: Number(rows[0].lon),
        display: rows[0].display_name
      } : null;
      writeCache(query, value);
      return value;
    } catch (err) {
      console.warn("Map geocoding failed:", query, err);
      return null;
    }
  }

  function geocode(query) {
    const cached = readCache(query);
    if (cached !== undefined) return Promise.resolve(cached);
    const task = geocodeChain.then(async () => {
      const result = await geocodeNow(query);
      await sleep(1050);
      return result;
    });
    geocodeChain = task.catch(() => null);
    return task;
  }

  function createCard(day) {
    if (day.querySelector(".daily-map-card")) return day.querySelector(".daily-map-card");
    const date = day.dataset.date;
    const card = document.createElement("section");
    card.className = "daily-map-card";
    card.innerHTML = `
      <div class="daily-map-head">
        <div>
          <div class="daily-map-title">🗺️ 今日地图</div>
          <div class="daily-map-subtitle">当天景点、餐饮和住宿 · 点击标记可跳转 Google Maps</div>
        </div>
        <div class="daily-map-legend"><span>🏛️ 景点</span><span>🍴 餐饮</span><span>🏨 住宿</span></div>
      </div>
      <div class="daily-map" id="map-${date}" aria-label="${date} 行程地图"></div>
      <div class="daily-map-status">正在准备地图…</div>
      <div class="daily-map-list"></div>`;
    const summary = day.querySelector(".day-summary");
    if (summary) summary.after(card);
    else day.querySelector(".day-head")?.after(card);
    return card;
  }

  function addPlaceListItem(list, place) {
    const a = document.createElement("a");
    a.className = `daily-map-place ${place.category}`;
    a.href = place.google;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = `${iconEmoji[place.category]} ${place.name}`;
    list.appendChild(a);
  }

  async function loadDayMap(date) {
    const day = document.querySelector(`article.day[data-date="${date}"]`);
    if (!day || loaded.has(date)) {
      const existing = maps.get(date);
      if (existing) setTimeout(() => existing.invalidateSize(), 80);
      return;
    }
    loaded.add(date);

    const card = createCard(day);
    const mapEl = card.querySelector(".daily-map");
    const status = card.querySelector(".daily-map-status");
    const list = card.querySelector(".daily-map-list");
    const fallback = fallbackCenters[date] || [42.8, 12.5];
    const map = L.map(mapEl, { scrollWheelZoom: false }).setView(fallback, 12);
    maps.set(date, map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    const places = collectPlaces(day);
    if (!places.length) {
      status.textContent = "这一天暂时没有可定位的景点、餐饮或住宿。";
      return;
    }

    places.forEach(place => addPlaceListItem(list, place));
    status.textContent = `正在定位 ${places.length} 个地点，第一次打开可能需要几秒…`;

    const points = [];
    let complete = 0;
    for (const place of places) {
      const geo = await geocode(place.query);
      complete += 1;
      status.textContent = `正在定位 ${complete}/${places.length}…`;
      if (!geo || !Number.isFinite(geo.lat) || !Number.isFinite(geo.lon)) continue;
      points.push([geo.lat, geo.lon]);
      const marker = L.marker([geo.lat, geo.lon], { icon: makeIcon(place.category) }).addTo(map);
      marker.bindPopup(`<div class="map-popup"><b>${iconEmoji[place.category]} ${escapeHtml(place.name)}</b><small>${categoryLabel[place.category]}</small><a href="${place.google}" target="_blank" rel="noopener">在 Google Maps 打开 ↗</a></div>`);
    }

    if (points.length === 1) map.setView(points[0], 15);
    else if (points.length > 1) map.fitBounds(points, { padding: [30, 30], maxZoom: 15 });

    const failed = places.length - points.length;
    status.textContent = failed
      ? `已显示 ${points.length} 个地点；${failed} 个地点未能自动定位，可在下方直接打开 Google Maps。`
      : `已显示当天全部 ${points.length} 个地点。地图坐标会缓存在此设备。`;
    setTimeout(() => map.invalidateSize(), 100);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    }[ch]));
  }

  document.querySelectorAll("article.day").forEach(createCard);
  const active = document.querySelector("article.day.is-active-day") || document.querySelector("article.day:not(.day-hidden)");
  if (active?.dataset.date) loadDayMap(active.dataset.date);

  window.addEventListener("tripdaychange", event => {
    const date = event.detail?.date;
    if (date) loadDayMap(date);
  });
})();