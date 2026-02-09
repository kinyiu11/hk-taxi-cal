const API_BASE = "https://api.tfl.gov.uk";
const STORAGE_KEY = "tfl_app_key";

const apiKeyInput = document.getElementById("api-key");
const queryInput = document.getElementById("stop-query");
const routeQueryInput = document.getElementById("route-query");
const searchButton = document.getElementById("search");
const routeSearchButton = document.getElementById("route-search");
const clearButton = document.getElementById("clear");
const refreshButton = document.getElementById("refresh");
const langToggle = document.getElementById("lang-toggle");
const testKeyButton = document.getElementById("test-key");
const testKeyResult = document.getElementById("api-test-result");
const statusEl = document.getElementById("status");
const stopListEl = document.getElementById("stop-list");
const routeListEl = document.getElementById("route-list");
const arrivalListEl = document.getElementById("arrival-list");
const selectedStopEl = document.getElementById("selected-stop");
const heroStopEl = document.getElementById("hero-stop");
const stopSuggestionsEl = document.getElementById("stop-suggestions");
const routeSuggestionsEl = document.getElementById("route-suggestions");

let selectedStop = null;
let selectedLine = null;
let currentLang = "zh";
let suggestionTimer = null;
let suggestionAbort = null;
let routeSuggestionTimer = null;
let routeSuggestionAbort = null;
let routeSuggestionItems = [];
let routeSuggestionIndex = -1;

const LINE_COLORS = {
  bakerloo: "#B26300",
  central: "#DC241F",
  circle: "#FFD329",
  district: "#007D32",
  elizabeth: "#6950A1",
  hammersmithcity: "#F4A9BE",
  jubilee: "#A1A5A7",
  metropolitan: "#9B0056",
  northern: "#000000",
  piccadilly: "#0019A8",
  victoria: "#0098D4",
  waterloocity: "#76D0BD",
  dlr: "#00AFAD",
  overground: "#EE7C0E",
  tram: "#00BD19",
  bus: "#E41F1F",
  riverbus: "#00A4A7",
  cablecar: "#E21836",
  cycle: "#00A3E0",
};

const getLineColor = (lineId = "", mode = "") => {
  const key = String(lineId).toLowerCase().replace(/\s+/g, "");
  if (LINE_COLORS[key]) return LINE_COLORS[key];
  if (LINE_COLORS[mode]) return LINE_COLORS[mode];
  return "#cbd5e1";
};

const isDarkLine = (lineId = "", mode = "") => {
  const color = getLineColor(lineId, mode).toLowerCase();
  return color === "#000000" || color === "#0019a8";
};

const i18n = {
  zh: {
    langToggle: "English",
    eyebrow: "London TfL",
    title: "到站時間查詢",
    subtitle: "輸入站名，快速查看下一班車到站時間。",
    heroLabel: "已選站點",
    heroNote: "只限倫敦 TfL",
    searchTitle: "搜尋站點",
    clear: "清除",
    apiLabel: "API Key（可選，但建議）",
    apiPlaceholder: "填入 TfL app_key",
    apiHint: "只會儲存在你瀏覽器內。",
    apiTestLabel: "測試 API Key",
    apiTestButton: "測試",
    apiTestOk: "API Key 有效。",
    apiTestFail: "API Key 無效或已被限制。",
    routeLabel: "路線名稱",
    routePlaceholder: "例如 Victoria 或 38",
    routeHint: "先搜路線，再揀站。",
    stopLabel: "站名（可直接搜尋）",
    stopPlaceholder: "例如 Waterloo",
    stopHint: "唔揀路線都可以直接查站。",
    routeSearch: "搜尋路線",
    stopSearch: "搜尋站名",
    quickLabel: "快速站名：",
    routeResults: "路線結果",
    stopResults: "站點列表（會顯示月台 / 方向 / 終點提示）",
    arrivalsTitle: "到站時間",
    refresh: "刷新",
    noStopSelected: "尚未選擇站點",
    tipsTitle: "使用提示",
    tip1: "先搜尋路線（例如 38 或 Victoria），再揀站會更精準。",
    tip2: "如果無 API key，仍然可以嘗試查詢，但有機會被限制。",
    tip3: "到站時間以分鐘顯示，資料來自 TfL 實時預測。",
    tip4: "可加到手機主畫面當作 App 使用。",
    statusSearchStops: "搜尋中...",
    statusStopMissing: "請輸入站名。",
    statusPickStop: "請選擇站點",
    statusNoStops: "沒有找到站點。",
    statusSearchFail: "搜尋失敗，請稍後再試。",
    statusRouteMissing: "請輸入路線名稱。",
    statusRouteSearching: "搜尋路線中...",
    statusPickRoute: "請選擇路線",
    statusNoRoute: "沒有找到路線。",
    statusRouteFail: "路線搜尋失敗。",
    statusLoadingStops: "讀取路線站點...",
    statusNoStopsForRoute: "路線沒有站點資料。",
    statusStopsFail: "讀取路線站點失敗。",
    statusNeedStop: "請先選擇站點。",
    statusUpdating: "更新到站時間...",
    statusUpdated: "已更新到站時間。",
    statusArrivalsFail: "到站資料讀取失敗。",
    statusNoArrivals: "暫時沒有到站資料。",
    stopMetaFallback: "方向／終點未提供",
    labelPlatform: "月台",
    labelStop: "站牌",
    labelDirection: "方向",
    labelTowards: "往",
    testing: "測試中...",
    apiKeyMissing: "請先填入 API Key。",
    arrivalMinutes: "分鐘",
    arrivalMinute: "分鐘",
    arrivalTo: "往",
    groupTube: "Underground Lines",
    groupDlr: "DLR",
    groupOverground: "Overground",
    groupElizabeth: "Elizabeth line",
    groupTram: "Tram",
    groupBus: "Bus",
    groupRiver: "River Bus",
    groupNational: "National Rail",
    groupOther: "Other",
  },
  en: {
    langToggle: "中文",
    eyebrow: "London TfL",
    title: "Arrivals Checker",
    subtitle: "Search a stop and see when the next services arrive.",
    heroLabel: "Selected Stop",
    heroNote: "London TfL only",
    searchTitle: "Search Stops",
    clear: "Clear",
    apiLabel: "API key (optional, recommended)",
    apiPlaceholder: "Paste your TfL app_key",
    apiHint: "Stored only in this browser.",
    apiTestLabel: "Test API key",
    apiTestButton: "Test",
    apiTestOk: "API key is valid.",
    apiTestFail: "API key is invalid or rate-limited.",
    routeLabel: "Route name",
    routePlaceholder: "e.g. Victoria or 38",
    routeHint: "Search a route, then choose a stop.",
    stopLabel: "Stop name (direct search)",
    stopPlaceholder: "e.g. Waterloo",
    stopHint: "You can search a stop directly.",
    routeSearch: "Search route",
    stopSearch: "Search stop",
    quickLabel: "Quick stops:",
    routeResults: "Route results",
    stopResults: "Stops (platform / direction / destination hint)",
    arrivalsTitle: "Arrivals",
    refresh: "Refresh",
    noStopSelected: "No stop selected",
    tipsTitle: "Tips",
    tip1: "Search a route (e.g. 38 or Victoria), then choose a stop.",
    tip2: "Without an API key, requests may be rate-limited.",
    tip3: "Arrivals are shown in minutes from TfL live predictions.",
    tip4: "Add it to your phone home screen for app-like use.",
    statusSearchStops: "Searching stops...",
    statusStopMissing: "Please enter a stop name.",
    statusPickStop: "Pick a stop",
    statusNoStops: "No stops found.",
    statusSearchFail: "Search failed. Try again later.",
    statusRouteMissing: "Please enter a route name.",
    statusRouteSearching: "Searching routes...",
    statusPickRoute: "Pick a route",
    statusNoRoute: "No routes found.",
    statusRouteFail: "Route search failed.",
    statusLoadingStops: "Loading route stops...",
    statusNoStopsForRoute: "No stops for this route.",
    statusStopsFail: "Failed to load route stops.",
    statusNeedStop: "Please pick a stop first.",
    statusUpdating: "Updating arrivals...",
    statusUpdated: "Arrivals updated.",
    statusArrivalsFail: "Failed to load arrivals.",
    statusNoArrivals: "No arrivals yet.",
    stopMetaFallback: "Direction / destination not provided",
    labelPlatform: "Platform",
    labelStop: "Stop",
    labelDirection: "Direction",
    labelTowards: "To",
    testing: "Testing...",
    apiKeyMissing: "Please enter an API key.",
    arrivalMinutes: "mins",
    arrivalMinute: "min",
    arrivalTo: "To",
    groupTube: "Underground Lines",
    groupDlr: "DLR",
    groupOverground: "Overground",
    groupElizabeth: "Elizabeth line",
    groupTram: "Tram",
    groupBus: "Bus",
    groupRiver: "River Bus",
    groupNational: "National Rail",
    groupOther: "Other",
  },
};

const applyI18n = (lang) => {
  const strings = i18n[lang];
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (strings[key]) el.textContent = strings[key];
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    if (strings[key]) el.setAttribute("placeholder", strings[key]);
  });

  langToggle.textContent = strings.langToggle;
};

const t = (key, fallback = "") => i18n[currentLang][key] || fallback;

const setStatus = (message, type = "") => {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`.trim();
};

const setTestResult = (message, type = "") => {
  testKeyResult.textContent = message;
  testKeyResult.className = `status ${type}`.trim();
};

const getApiKey = () => apiKeyInput.value.trim();

const saveApiKey = () => {
  const key = getApiKey();
  if (key) {
    localStorage.setItem(STORAGE_KEY, key);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
};

const loadApiKey = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) apiKeyInput.value = saved;
};

const buildUrl = (path, params = {}) => {
  const url = new URL(`${API_BASE}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  const key = getApiKey();
  if (key) url.searchParams.set("app_key", key);
  return url.toString();
};

const formatStopHint = (stop) => {
  const parts = [];
  if (stop.platformName) parts.push(`${t("labelPlatform")} ${stop.platformName}`);
  if (stop.stopLetter) parts.push(`${t("labelStop")} ${stop.stopLetter}`);
  if (stop.indicator) parts.push(`${t("labelDirection")} ${stop.indicator}`);
  if (stop.towards) parts.push(`${t("labelTowards")} ${stop.towards}`);
  if (!parts.length) parts.push(t("stopMetaFallback"));
  return parts.join(" · ");
};

const extractAdditional = (item, name) => {
  const props = Array.isArray(item.additionalProperties) ? item.additionalProperties : [];
  const hit = props.find((prop) => prop?.key?.toLowerCase() === name.toLowerCase());
  return hit?.value || "";
};

const renderStops = (matches) => {
  stopListEl.innerHTML = "";

  if (!matches.length) {
    stopListEl.innerHTML = `<div class="status">${t("statusNoStops")}</div>`;
    return;
  }

  matches.forEach((stop) => {
    const card = document.createElement("div");
    card.className = "stop-card";
    card.innerHTML = `
      <p class="stop-name">${stop.name}</p>
      <p class="stop-meta">${formatStopHint(stop)}</p>
    `;
    card.addEventListener("click", () => selectStop(stop));
    stopListEl.appendChild(card);
  });
};

const renderSuggestions = (matches) => {
  stopSuggestionsEl.innerHTML = "";

  if (!matches.length) {
    stopSuggestionsEl.classList.remove("visible");
    return;
  }

  matches.forEach((stop) => {
    const item = document.createElement("div");
    item.className = "suggestion-item";
    item.innerHTML = `
      <div class="suggestion-name">${stop.name}</div>
      <div class="suggestion-meta">${formatStopHint(stop)}</div>
    `;
    item.addEventListener("click", () => {
      queryInput.value = stop.name;
      stopSuggestionsEl.classList.remove("visible");
      selectStop(stop);
    });
    stopSuggestionsEl.appendChild(item);
  });

  stopSuggestionsEl.classList.add("visible");
};

const renderLines = (matches) => {
  routeListEl.innerHTML = "";

  if (!matches.length) {
    routeListEl.innerHTML = `<div class="status">${t("statusNoRoute")}</div>`;
    return;
  }

  matches.forEach((line) => {
    const card = document.createElement("div");
    card.className = "stop-card line-card";
    card.style.setProperty("--line-color", getLineColor(line.lineId, line.mode));
    card.innerHTML = `
      <p class="stop-name">${line.lineName}</p>
      <p class="stop-meta">${line.lineId} · ${line.mode}</p>
    `;
    card.addEventListener("click", () => selectLine(line));
    routeListEl.appendChild(card);
  });
};

const renderRouteSuggestions = (matches) => {
  routeSuggestionsEl.innerHTML = "";
  routeSuggestionItems = [];
  routeSuggestionIndex = -1;

  if (!matches.length) {
    routeSuggestionsEl.classList.remove("visible");
    return;
  }

  const order = ["tube", "dlr", "overground", "elizabeth-line", "tram", "bus", "river-bus", "national-rail"];
  const modeLabels = {
    tube: t("groupTube"),
    dlr: t("groupDlr"),
    overground: t("groupOverground"),
    "elizabeth-line": t("groupElizabeth"),
    tram: t("groupTram"),
    bus: t("groupBus"),
    "river-bus": t("groupRiver"),
    "national-rail": t("groupNational"),
    other: t("groupOther"),
  };
  const grouped = matches.reduce((acc, line) => {
    const key = line.mode || "other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(line);
    return acc;
  }, {});

  const keys = Object.keys(grouped).sort((a, b) => {
    const aIndex = order.indexOf(a);
    const bIndex = order.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  keys.forEach((mode) => {
    const heading = document.createElement("div");
    heading.className = "suggestion-group";
    heading.textContent = modeLabels[mode] || mode.replace("-", " ");
    routeSuggestionsEl.appendChild(heading);

    grouped[mode].forEach((line) => {
      const item = document.createElement("div");
      item.className = "suggestion-item";
      item.style.setProperty("--line-color", getLineColor(line.lineId, line.mode));
      item.dataset.lineId = line.lineId;
      item.innerHTML = `
        <div class="suggestion-name">${line.lineName}</div>
        <div class="suggestion-meta">${line.lineId} · ${line.mode}</div>
      `;
      item.addEventListener("click", () => {
        routeQueryInput.value = line.lineName;
        routeSuggestionsEl.classList.remove("visible");
        selectLine(line);
      });
      routeSuggestionsEl.appendChild(item);
      routeSuggestionItems.push({ element: item, line });
    });
  });

  routeSuggestionsEl.classList.add("visible");
};

const renderArrivals = (arrivals) => {
  arrivalListEl.innerHTML = "";

  if (!arrivals.length) {
    arrivalListEl.innerHTML = `<div class="status">${t("statusNoArrivals")}</div>`;
    return;
  }

  arrivals.forEach((item) => {
    const mins = Math.max(0, Math.round(item.timeToStation / 60));
    const row = document.createElement("div");
    row.className = "arrival-row";
    const lineColor = getLineColor(item.lineId || item.lineName, item.modeName || "");
    row.style.setProperty("--line-color", lineColor);
    row.innerHTML = `
      <div class="arrival-line">
        <span class="badge">${mins} ${mins === 1 ? t("arrivalMinute") : t("arrivalMinutes")}</span>
        <span class="line-badge ${isDarkLine(item.lineId || item.lineName, item.modeName || "") ? "line-badge-light" : ""}">${item.lineName || ""}</span>
      </div>
      <div class="arrival-dest">${t("arrivalTo")} ${item.destinationName || item.towards || (currentLang === "zh" ? "未知目的地" : "Unknown destination")}</div>
      <div class="arrival-meta">${item.platformName || item.stationName || ""}</div>
    `;
    arrivalListEl.appendChild(row);
  });
};

const searchStops = async () => {
  const query = queryInput.value.trim();
  if (!query) {
    setStatus(t("statusStopMissing"), "error");
    return;
  }

  setStatus(t("statusSearchStops"));
  stopListEl.innerHTML = "";

  try {
    saveApiKey();
    const url = buildUrl("/StopPoint/Search", { query });
    const res = await fetch(url);
    const data = await res.json();
    const matches = Array.isArray(data.matches) ? data.matches.slice(0, 12) : [];
    setStatus(matches.length ? t("statusPickStop") : t("statusNoStops"));
    selectedLine = null;
    renderStops(matches);
  } catch (err) {
    setStatus(t("statusSearchFail"), "error");
  }
};

const fetchStopSuggestions = async () => {
  const query = queryInput.value.trim();
  if (query.length < 2) {
    stopSuggestionsEl.classList.remove("visible");
    return;
  }

  if (suggestionAbort) suggestionAbort.abort();
  suggestionAbort = new AbortController();

  try {
    const url = buildUrl("/StopPoint/Search", { query });
    const res = await fetch(url, { signal: suggestionAbort.signal });
    const data = await res.json();
    const matches = Array.isArray(data.matches) ? data.matches.slice(0, 6) : [];
    renderSuggestions(matches);
  } catch (err) {
    if (err.name !== "AbortError") {
      stopSuggestionsEl.classList.remove("visible");
    }
  }
};

const fetchRouteSuggestions = async () => {
  const query = routeQueryInput.value.trim();
  if (query.length < 1) {
    routeSuggestionsEl.classList.remove("visible");
    return;
  }

  if (routeSuggestionAbort) routeSuggestionAbort.abort();
  routeSuggestionAbort = new AbortController();

  try {
    const url = buildUrl(`/Line/Search/${encodeURIComponent(query)}`);
    const res = await fetch(url, { signal: routeSuggestionAbort.signal });
    const data = await res.json();
    const matches = Array.isArray(data.searchMatches) ? data.searchMatches : [];
    const normalized = matches
      .map((item) => ({
        lineId: item.lineId || item.id || "",
        lineName: item.lineName || item.name || "",
        mode: item.mode || item.modeName || "unknown",
      }))
      .filter((item) => item.lineId && item.lineName)
      .slice(0, 6);
    renderRouteSuggestions(normalized);
  } catch (err) {
    if (err.name !== "AbortError") {
      routeSuggestionsEl.classList.remove("visible");
    }
  }
};

const searchLines = async () => {
  const query = routeQueryInput.value.trim();
  if (!query) {
    setStatus(t("statusRouteMissing"), "error");
    return;
  }

  setStatus(t("statusRouteSearching"));
  routeListEl.innerHTML = "";
  stopListEl.innerHTML = "";
  selectedLine = null;
  selectedStop = null;
  selectedStopEl.textContent = t("noStopSelected");
  heroStopEl.textContent = t("noStopSelected");

  try {
    saveApiKey();
    const url = buildUrl(`/Line/Search/${encodeURIComponent(query)}`);
    const res = await fetch(url);
    const data = await res.json();
    const matches = Array.isArray(data.searchMatches) ? data.searchMatches : [];
    const normalized = matches.map((item) => ({
      lineId: item.lineId || item.id || "",
      lineName: item.lineName || item.name || "",
      mode: item.mode || item.modeName || "unknown",
    })).filter((item) => item.lineId && item.lineName);

    setStatus(normalized.length ? t("statusPickRoute") : t("statusNoRoute"));
    renderLines(normalized.slice(0, 12));
  } catch (err) {
    setStatus(t("statusRouteFail"), "error");
  }
};

const fetchStopsForLine = async (lineId) => {
  stopListEl.innerHTML = "";
  setStatus(t("statusLoadingStops"));

  try {
    const url = buildUrl(`/Line/${encodeURIComponent(lineId)}/StopPoints`);
    const res = await fetch(url);
    const data = await res.json();
    const stops = Array.isArray(data) ? data : [];
    const normalized = stops
      .map((item) => ({
        id: item.naptanId || item.id || "",
        name: item.commonName || item.name || item.stationName || "Unknown",
        platformName: item.platformName || extractAdditional(item, "PlatformName") || extractAdditional(item, "Platform"),
        stopLetter: item.stopLetter || extractAdditional(item, "StopLetter"),
        indicator: item.indicator || extractAdditional(item, "Direction") || extractAdditional(item, "Indicator"),
        towards: item.towards || extractAdditional(item, "Towards"),
      }))
      .filter((item) => item.id);

    setStatus(normalized.length ? t("statusPickStop") : t("statusNoStopsForRoute"));
    renderStops(normalized);
  } catch (err) {
    setStatus(t("statusStopsFail"), "error");
  }
};

const fetchArrivals = async () => {
  if (!selectedStop) {
    arrivalListEl.innerHTML = `<div class="status">${t("statusNeedStop")}</div>`;
    return;
  }

  setStatus(t("statusUpdating"));

  try {
    saveApiKey();
    const url = selectedLine
      ? buildUrl(`/Line/${encodeURIComponent(selectedLine.lineId)}/Arrivals/${encodeURIComponent(selectedStop.id)}`)
      : buildUrl(`/StopPoint/${encodeURIComponent(selectedStop.id)}/Arrivals`);
    const res = await fetch(url);
    const data = await res.json();
    const arrivals = Array.isArray(data) ? data : [];
    arrivals.sort((a, b) => a.timeToStation - b.timeToStation);
    renderArrivals(arrivals);
    setStatus(t("statusUpdated"));
  } catch (err) {
    setStatus(t("statusArrivalsFail"), "error");
  }
};

const selectStop = (stop) => {
  selectedStop = stop;
  selectedStopEl.textContent = `${stop.name} (${stop.id})`;
  heroStopEl.textContent = stop.name;
  fetchArrivals();
};

const selectLine = (line) => {
  selectedLine = line;
  routeQueryInput.value = line.lineName;
  fetchStopsForLine(line.lineId);
};

const clearAll = () => {
  routeQueryInput.value = "";
  queryInput.value = "";
  stopListEl.innerHTML = "";
  routeListEl.innerHTML = "";
  arrivalListEl.innerHTML = "";
  stopSuggestionsEl.classList.remove("visible");
  routeSuggestionsEl.classList.remove("visible");
  selectedStopEl.textContent = t("noStopSelected");
  heroStopEl.textContent = t("noStopSelected");
  selectedStop = null;
  selectedLine = null;
  setStatus("");
  setTestResult("");
};

searchButton.addEventListener("click", searchStops);
routeSearchButton.addEventListener("click", searchLines);
queryInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") searchStops();
});
queryInput.addEventListener("input", () => {
  clearTimeout(suggestionTimer);
  suggestionTimer = setTimeout(fetchStopSuggestions, 250);
});
queryInput.addEventListener("blur", () => {
  setTimeout(() => stopSuggestionsEl.classList.remove("visible"), 150);
});
routeQueryInput.addEventListener("input", () => {
  clearTimeout(routeSuggestionTimer);
  routeSuggestionTimer = setTimeout(fetchRouteSuggestions, 250);
});
routeQueryInput.addEventListener("blur", () => {
  setTimeout(() => routeSuggestionsEl.classList.remove("visible"), 150);
});
routeQueryInput.addEventListener("keydown", (event) => {
  if (!routeSuggestionsEl.classList.contains("visible")) return;
  if (!routeSuggestionItems.length) return;

  if (event.key === "ArrowDown") {
    event.preventDefault();
    routeSuggestionIndex = (routeSuggestionIndex + 1) % routeSuggestionItems.length;
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    routeSuggestionIndex =
      (routeSuggestionIndex - 1 + routeSuggestionItems.length) % routeSuggestionItems.length;
  } else if (event.key === "Enter") {
    if (routeSuggestionIndex >= 0) {
      event.preventDefault();
      const target = routeSuggestionItems[routeSuggestionIndex];
      routeQueryInput.value = target.line.lineName;
      routeSuggestionsEl.classList.remove("visible");
      selectLine(target.line);
    }
    return;
  } else if (event.key === "Escape") {
    routeSuggestionsEl.classList.remove("visible");
    return;
  } else {
    return;
  }

  routeSuggestionItems.forEach(({ element }, index) => {
    element.classList.toggle("active", index === routeSuggestionIndex);
  });
});
routeQueryInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") searchLines();
});

clearButton.addEventListener("click", clearAll);
refreshButton.addEventListener("click", fetchArrivals);

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    queryInput.value = chip.dataset.query;
    searchStops();
  });
});

loadApiKey();
applyI18n(currentLang);
setStatus(t("statusPickStop"));

langToggle.addEventListener("click", () => {
  currentLang = currentLang === "zh" ? "en" : "zh";
  applyI18n(currentLang);
  if (!selectedStop) {
    selectedStopEl.textContent = t("noStopSelected");
    heroStopEl.textContent = t("noStopSelected");
  }
});

testKeyButton.addEventListener("click", async () => {
  setTestResult("");
  saveApiKey();
  const key = getApiKey();
  if (!key) {
    setTestResult(t("apiKeyMissing"), "error");
    return;
  }

  setTestResult(t("testing"));
  try {
    const url = buildUrl("/Line/Meta/Modes");
    const res = await fetch(url);
    if (res.ok) {
      setTestResult(t("apiTestOk"));
    } else {
      setTestResult(t("apiTestFail"), "error");
    }
  } catch (err) {
    setTestResult(t("apiTestFail"), "error");
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js");
  });
}
