const inputEl = document.getElementById("jsonInput");
const outputEl = document.getElementById("output");
const parseBtn = document.getElementById("parseBtn");
const expandAllBtn = document.getElementById("expandAllBtn");
const collapseAllBtn = document.getElementById("collapseAllBtn");
const collapseAllChildBtn = document.getElementById("collapseAllChildBtn");
const hideJsonBtn = document.getElementById("hideJsonBtn");
const settingsBtn = document.getElementById("settingsBtn");
const settingsBackdrop = document.getElementById("settingsBackdrop");
const panelLeft = document.getElementById("panelLeft");
const panelRight = document.getElementById("panelRight");

let rootNodeEl = null;
let jsonHidden = false;
let isFirstParse = true;

// 記憶 Filter 狀態
const filterRegistry = new WeakMap();

// Preferences
let currentTheme = localStorage.getItem('json-theme') || 'dark';
let currentFont = localStorage.getItem('json-font') || 'medium';
let currentLang = localStorage.getItem('json-lang') || 'zh';

function setActiveSettingButtons(selector, dataKey, activeValue) {
  const buttons = document.querySelectorAll(selector);
  buttons.forEach((btn) => {
    const isActive = btn.dataset[dataKey] === activeValue;
    btn.classList.toggle("is-active", isActive);
    btn.style.pointerEvents = isActive ? "none" : "auto";
  });
}

const translations = {
  zh: { title: "JSON Beautifier", parse: "解析並格式化", expandAll: "全部展開", collapseAll: "全部收合", collapseChildren: "收合子節點", hideInput: "隱藏 JSON 輸入", showInput: "顯示 JSON 輸入", settings: "偏好設定", prefTitle: "偏好設定", theme: "主題", font: "字體大小", lang: "語言", done: "完成", placeholder: "在此貼上 JSON...", errorTitle: "錯誤： " },
  en: { title: "JSON Beautifier", parse: "Parse JSON", expandAll: "Expand All", collapseAll: "Collapse All", collapseChildren: "Collapse Children", hideInput: "Hide Input", showInput: "Show Input", settings: "Settings", prefTitle: "Preferences", theme: "Theme", font: "Font Size", lang: "Language", done: "Done", placeholder: "Paste JSON here...", errorTitle: "Error: " }
};

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('json-lang', lang);
  const t = translations[lang];
  document.querySelector("h1").textContent = t.title;
  parseBtn.textContent = t.parse;
  expandAllBtn.textContent = t.expandAll;
  collapseAllBtn.textContent = t.collapseAll;
  collapseAllChildBtn.textContent = t.collapseChildren;
  hideJsonBtn.textContent = jsonHidden ? t.showInput : t.hideInput;
  settingsBtn.textContent = t.settings;
  document.getElementById("settingsTitle").textContent = t.prefTitle;
  document.querySelectorAll(".btn-done").forEach(btn => btn.textContent = t.done);
  document.getElementById("jsonInput").placeholder = t.placeholder;
  setActiveSettingButtons(".lang-opt", "lang", lang);
}

function applyTheme(theme) {
  document.body.className = document.body.className.replace(/theme-\w+/, `theme-${theme}`);
  currentTheme = theme;
  localStorage.setItem('json-theme', theme);
  setActiveSettingButtons(".theme-opt", "theme", theme);
}

function applyFontSize(size) {
  document.body.className = document.body.className.replace(/font-\w+/, `font-${size}`);
  currentFont = size;
  localStorage.setItem('json-font', size);
  setActiveSettingButtons(".font-opt", "font", size);
}

function setError(msg) {
  const errorEl = document.getElementById("error");
  const prefix = translations[currentLang]?.errorTitle || "";
  errorEl.textContent = msg ? prefix + msg : "";
}

// --- Filter 邏輯 ---
function openFilterModal(data, bodyContainer) {
  const backdrop = document.getElementById("filterBackdrop");
  const optionsContainer = document.getElementById("filterOptions");
  const confirmBtn = document.getElementById("confirmFilterBtn");
  const toggleAllBtn = document.getElementById("toggleAllFilterBtn");

  optionsContainer.innerHTML = "";
  const allKeys = new Set();
  data.forEach(item => {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      Object.keys(item).forEach(k => allKeys.add(k));
    }
  });

  const savedSelection = filterRegistry.get(bodyContainer) || ["all", ...allKeys];

  const createCheckbox = (val, label) => {
    const isChecked = savedSelection.includes(val);
    const lbl = document.createElement("label");
    lbl.className = "filter-item";
    lbl.innerHTML = `<input type="checkbox" value="${val}" ${isChecked ? 'checked' : ''}> <span>${label}</span>`;
    optionsContainer.appendChild(lbl);
  };

  createCheckbox("all", "All (全部顯示)");
  allKeys.forEach(k => createCheckbox(k, k));

  toggleAllBtn.onclick = () => {
    const cbs = optionsContainer.querySelectorAll('input[type="checkbox"]');
    const allChecked = Array.from(cbs).every(cb => cb.checked);
    cbs.forEach(cb => cb.checked = !allChecked);
  };

  backdrop.classList.add("open");
  document.body.classList.add("modal-open");
    confirmBtn.onclick = () => {
    const selected = Array.from(optionsContainer.querySelectorAll("input:checked")).map(i => i.value);
    filterRegistry.set(bodyContainer, selected);
    applyFilterToUI(bodyContainer, selected);

    // 關閉彈窗時：解除捲動鎖定
    backdrop.classList.remove("open");
    document.body.classList.remove("modal-open");
  };

  backdrop.onclick = (e) => {
      if (e.target === backdrop) {
        backdrop.classList.remove("open");
        document.body.classList.remove("modal-open");
      }
    };
}

function applyFilterToUI(bodyContainer, selectedKeys) {
  const isAll = selectedKeys.includes("all");

  Array.from(bodyContainer.children).forEach(itemNode => {
    const itemBody = itemNode.querySelector(":scope > .node-body");
    const itemHead = itemNode.querySelector(":scope > .node-head");

    if (itemBody) {
      let visibleCount = 0;
      Array.from(itemBody.children).forEach(pair => {
        const keyName = pair.getAttribute("data-key");
        const show = isAll || selectedKeys.includes(keyName);
        pair.style.display = show ? "block" : "none";
        if (show) visibleCount++;
      });

      // 如果 Filter 後沒東西，顯示 { ... }
      const ellipsis = itemHead.querySelector(".ellipsis");
      const closeSmall = itemHead.querySelector(".bracket-close-small");
      const toggle = itemHead.querySelector(".toggle");

      if (visibleCount === 0) {
        if (ellipsis) ellipsis.style.display = "inline";
        if (closeSmall) closeSmall.style.display = "inline";
        itemBody.style.display = "none";
        itemNode.querySelector(":scope > .node-footer").style.display = "none";
        if (toggle) {
            toggle.classList.remove("expanded");
            toggle.classList.add("collapsed");
        }
      } else {
        // 恢復原本狀態（預設展開）
        if (ellipsis) ellipsis.style.display = "none";
        if (closeSmall) closeSmall.style.display = "none";
        itemBody.style.display = "block";
        itemNode.querySelector(":scope > .node-footer").style.display = "block";
        if (toggle) {
            toggle.classList.add("expanded");
            toggle.classList.remove("collapsed");
        }
      }
    }
  });
}

// --- 建立節點 ---
function createNode(key, value, isLast = true, keyIndex = null) {
  const node = document.createElement("div");
  node.className = "node";
  if (key !== null) node.setAttribute("data-key", key);

  const head = document.createElement("div");
  head.className = "node-head";

  // 1. 先放 Index 數字
  if (keyIndex !== null) {
    const idxSpan = document.createElement("span");
    idxSpan.className = "key-index";
    idxSpan.textContent = keyIndex;
    head.appendChild(idxSpan);
    const colon = document.createElement("span");
    colon.textContent = ": ";
    head.appendChild(colon);
  }

  const isContainer = value !== null && typeof value === "object";

  if (isContainer) {
    const isArray = Array.isArray(value);
    const openBr = isArray ? "[" : "{";
    const closeBr = isArray ? "]" : "}";

    // 2. 接著放箭頭 (toggle)
    const toggle = document.createElement("span");
    toggle.className = "toggle expanded";
    head.appendChild(toggle);

    // 3. 如果是 Object Key (非 Array Index)，放在箭頭後
    if (key !== null && keyIndex === null) {
      const keySpan = document.createElement("span");
      keySpan.className = "key";
      keySpan.textContent = `"${key}"`;
      head.appendChild(keySpan);
      const colon = document.createElement("span");
      colon.textContent = ": ";
      head.appendChild(colon);
    }

    // 4. 開啟括號
    const bracketOpen = document.createElement("span");
    bracketOpen.className = "bracket";
    bracketOpen.textContent = openBr;
    head.appendChild(bracketOpen);

    // 收合或 Filter 完沒東西時顯示的內容
    const ellipsis = document.createElement("span");
    ellipsis.className = "ellipsis";
    ellipsis.textContent = " ... ";
    ellipsis.style.display = "none";
    head.appendChild(ellipsis);

    const bracketCloseSmall = document.createElement("span");
    bracketCloseSmall.className = "bracket bracket-close-small";
    bracketCloseSmall.textContent = closeBr + (isLast ? "" : ",");
    bracketCloseSmall.style.display = "none";
    head.appendChild(bracketCloseSmall);

    // Body 內容
    const body = document.createElement("div");
    body.className = "node-body";
    if (isArray) {
      const controls = document.createElement("span");
      controls.className = "array-controls";
      const fBtn = document.createElement("button"); fBtn.className = "array-btn"; fBtn.textContent = "Filter";
      fBtn.onclick = (e) => { e.stopPropagation(); openFilterModal(value, body); };
      const eBtn = document.createElement("button"); eBtn.className = "array-btn"; eBtn.textContent = "+";
      eBtn.onclick = (e) => { e.stopPropagation(); setExpandRecursive(node, true); };
      const cBtn = document.createElement("button"); cBtn.className = "array-btn"; cBtn.textContent = "-";
      cBtn.onclick = (e) => { e.stopPropagation(); setExpandRecursive(node, false); };
      controls.append(fBtn, eBtn, cBtn);
      head.appendChild(controls);

      value.forEach((v, i) => body.appendChild(createNode(null, v, i === value.length - 1, i)));
    } else {
      const keys = Object.keys(value);
      keys.forEach((k, i) => body.appendChild(createNode(k, value[k], i === keys.length - 1)));
    }

    const footer = document.createElement("div");
    footer.className = "node-footer";
    const bracketCloseLarge = document.createElement("span");
    bracketCloseLarge.className = "bracket";
    bracketCloseLarge.textContent = closeBr + (isLast ? "" : ",");
    footer.appendChild(bracketCloseLarge);

    head.onclick = (e) => {
      e.stopPropagation();
      const willExpand = !toggle.classList.contains("expanded");
      setNodeExpand(node, willExpand);
    };

    node.appendChild(head);
    node.appendChild(body);
    node.appendChild(footer);
  } else {
    // 非容器 (String, Number, etc.)
    if (key !== null && keyIndex === null) {
      const keySpan = document.createElement("span");
      keySpan.className = "key";
      keySpan.textContent = `"${key}"`;
      head.appendChild(keySpan);
      const colon = document.createElement("span");
      colon.textContent = ": ";
      head.appendChild(colon);
    }
    const valSpan = document.createElement("span");
    valSpan.className = typeof value;
    if (value === null) valSpan.className = "null";
    valSpan.textContent = typeof value === "string" ? `"${value}"` : String(value);
    head.appendChild(valSpan);
    if (!isLast) {
      const comma = document.createElement("span");
      comma.className = "comma";
      comma.textContent = ",";
      head.appendChild(comma);
    }
    node.appendChild(head);
  }
  return node;
}

function setNodeExpand(node, expand) {
  const toggle = node.querySelector(":scope > .node-head > .toggle");
  const body = node.querySelector(":scope > .node-body");
  const footer = node.querySelector(":scope > .node-footer");
  const ellipsis = node.querySelector(":scope > .node-head > .ellipsis");
  const closeSmall = node.querySelector(":scope > .node-head > .bracket-close-small");

  if (!toggle) return;
  toggle.classList.toggle("expanded", expand);
  toggle.classList.toggle("collapsed", !expand);
  body.style.display = expand ? "block" : "none";
  footer.style.display = expand ? "block" : "none";
  if (ellipsis) ellipsis.style.display = expand ? "none" : "inline";
  if (closeSmall) closeSmall.style.display = expand ? "none" : "inline";
}

function setExpandRecursive(node, expand) {
  setNodeExpand(node, expand);
  const body = node.querySelector(":scope > .node-body");
  if (body) {
    Array.from(body.children).forEach(child => setExpandRecursive(child, expand));
  }
}

function collapseAllChild(node) {
  const body = node.querySelector(":scope > .node-body");
  if (body) {
    Array.from(body.children).forEach(child => setExpandRecursive(child, false));
  }
}

function parseAndRender(skipAutoHide = false) {
  const raw = inputEl.value.trim();
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    setError("");
    outputEl.innerHTML = "";
    rootNodeEl = createNode(null, data, true);
    outputEl.appendChild(rootNodeEl);
    if (isFirstParse && !skipAutoHide) {
      jsonHidden = true;
      panelLeft.classList.add("hidden");
      panelRight.classList.add("full-width");
      const t = translations[currentLang];
      hideJsonBtn.textContent = t.showInput;
    }
    if (!skipAutoHide) isFirstParse = false;
  } catch (err) {
    setError(err.message);
    outputEl.innerHTML = "";
  }
}

// Global Listeners
parseBtn.onclick = () => parseAndRender();
expandAllBtn.onclick = () => rootNodeEl && setExpandRecursive(rootNodeEl, true);
collapseAllBtn.onclick = () => rootNodeEl && setExpandRecursive(rootNodeEl, false);
collapseAllChildBtn.onclick = () => rootNodeEl && collapseAllChild(rootNodeEl);
hideJsonBtn.onclick = () => {
  jsonHidden = !jsonHidden;
  panelLeft.classList.toggle("hidden", jsonHidden);
  panelRight.classList.toggle("full-width", jsonHidden);
  hideJsonBtn.textContent = jsonHidden ? translations[currentLang].showInput : translations[currentLang].hideInput;
};
const settingsDoneBtn = document.getElementById("settingsDoneBtn");
settingsBtn.onclick = () => {
    settingsBackdrop.classList.add("open");
    document.body.classList.add("modal-open");
};
document.querySelectorAll(".settings-backdrop").forEach(bg => {
  bg.onclick = (e) => { if (e.target === bg) bg.classList.remove("open"); };
});
document.querySelectorAll(".theme-opt").forEach(btn => btn.onclick = () => applyTheme(btn.dataset.theme));
document.querySelectorAll(".font-opt").forEach(btn => btn.onclick = () => applyFontSize(btn.dataset.font));
document.querySelectorAll(".lang-opt").forEach(btn => btn.onclick = () => applyLanguage(btn.dataset.lang));

function closeSettings() {
    settingsBackdrop.classList.remove("open");
    document.body.classList.remove("modal-open");
}

// 點擊「完成」
settingsDoneBtn.onclick = closeSettings;

// 點擊黑色背景
settingsBackdrop.onclick = (e) => {
    if (e.target === settingsBackdrop) closeSettings();
};

// Init
applyTheme(currentTheme);
applyFontSize(currentFont);
applyLanguage(currentLang);