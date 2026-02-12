const inputEl = document.getElementById("jsonInput");
const outputEl = document.getElementById("output");
const parseBtn = document.getElementById("parseBtn");
const expandAllBtn = document.getElementById("expandAllBtn");
const collapseAllBtn = document.getElementById("collapseAllBtn");
const collapseAllChildBtn = document.getElementById("collapseAllChildBtn");
const hideJsonBtn = document.getElementById("hideJsonBtn");
const settingsBtn = document.getElementById("settingsBtn");
const settingsBackdrop = document.getElementById("settingsBackdrop");
const settingsDoneBtn = document.getElementById("settingsDoneBtn");
const arrayFilterBackdrop = document.getElementById("arrayFilterBackdrop");
const arrayFilterKeysEl = document.getElementById("arrayFilterKeys");
const arrayFilterConfirmBtn = document.getElementById("arrayFilterConfirm");
const arrayFilterCancelBtn = document.getElementById("arrayFilterCancel");
const panelLeft = document.getElementById("panelLeft");
const panelRight = document.getElementById("panelRight");
const errorEl = document.getElementById("error");

let rootNodeEl = null;
let jsonHidden = false;
let activeArrayNode = null;

// Preferences
let currentTheme = localStorage.getItem('json-theme') || 'dark';
let currentFont = localStorage.getItem('json-font') || 'medium';
let currentLang = localStorage.getItem('json-lang') || 'zh';

const strings = {
  zh: {
    parseBtn: "解析並格式化",
    expandAll: "全部展開",
    collapseAll: "全部收合",
    collapseChild: "收合子節點",
    hideJson: "隱藏 JSON 輸入",
    showJson: "顯示 JSON 輸入",
    settings: "偏好設定",
    placeholder: "在此貼上 JSON 程式碼...",
    themeLabel: "主題",
    fontLabel: "字體大小",
    langLabel: "介面語言",
    close: "關閉",
    filterTitle: "過濾欄位 (Array Filter)",
    filterCancel: "取消",
    filterConfirm: "執行過濾",
  },
  en: {
    parseBtn: "Parse & Beautify",
    expandAll: "Expand All",
    collapseAll: "Collapse All",
    collapseChild: "Collapse Children",
    hideJson: "Hide JSON Input",
    showJson: "Show JSON Input",
    settings: "Preferences",
    placeholder: "Paste JSON here...",
    themeLabel: "Theme",
    fontLabel: "Font Size",
    langLabel: "Language",
    close: "Close",
    filterTitle: "Filter Keys (Array Filter)",
    filterCancel: "Cancel",
    filterConfirm: "Apply Filter",
  },
};

function applyTheme(theme) {
  document.body.className = document.body.className.replace(/theme-\w+/, `theme-${theme}`);
  currentTheme = theme;
  localStorage.setItem('json-theme', theme);
  syncSettingsActiveState();
}

function applyFontSize(size) {
  document.body.className = document.body.className.replace(/font-\w+/, `font-${size}`);
  currentFont = size;
  localStorage.setItem('json-font', size);
  syncSettingsActiveState();
}

function applyLang(lang) {
  currentLang = lang;
  localStorage.setItem('json-lang', lang);
  syncSettingsActiveState();
  document.documentElement.lang = lang === 'zh' ? 'zh-HK' : 'en';
  updateUIText();
}

function syncSettingsActiveState() {
  document.querySelectorAll(".theme-opt").forEach(b => {
    b.classList.toggle("is-active", b.dataset.theme === currentTheme);
  });
  document.querySelectorAll(".font-opt").forEach(b => {
    b.classList.toggle("is-active", b.dataset.font === currentFont);
  });
  document.querySelectorAll(".lang-opt").forEach(b => {
    b.classList.toggle("is-active", b.dataset.lang === currentLang);
  });
}

function updateUIText() {
  const t = strings[currentLang] || strings.zh;
  parseBtn.textContent = t.parseBtn;
  expandAllBtn.textContent = t.expandAll;
  collapseAllBtn.textContent = t.collapseAll;
  collapseAllChildBtn.textContent = t.collapseChild;
  settingsBtn.textContent = t.settings;
  inputEl.placeholder = t.placeholder;
  document.getElementById("settingsTitle").textContent = t.settings;
  settingsDoneBtn.textContent = t.close;
  document.querySelector(".settings-row:nth-child(1) .settings-label").textContent = t.themeLabel;
  document.querySelector(".settings-row:nth-child(2) .settings-label").textContent = t.fontLabel;
  document.querySelector(".settings-row:nth-child(3) .settings-label").textContent = t.langLabel;
  arrayFilterBackdrop.querySelector("h2").textContent = t.filterTitle;
  arrayFilterCancelBtn.textContent = t.filterCancel;
  arrayFilterConfirmBtn.textContent = t.filterConfirm;
  applyJsonPanelState();
}

function applyJsonPanelState() {
  const t = strings[currentLang] || strings.zh;
  panelLeft.classList.toggle("hidden", jsonHidden);
  panelRight.classList.toggle("full-width", jsonHidden);
  hideJsonBtn.textContent = jsonHidden ? t.showJson : t.hideJson;
}

// 渲染節點
function createNode(key, value, isRoot = false) {
  const container = document.createElement("div");
  container.className = "node";

  const row = document.createElement("div");
  row.className = "node-row";

  const isObject = typeof value === "object" && value !== null;
  const isArray = Array.isArray(value);

  // 展開箭頭
  if (isObject) {
    const toggle = document.createElement("span");
    toggle.className = "toggle";
    toggle.textContent = "▼";
    toggle.onclick = (e) => {
      e.stopPropagation();
      const isCollapsed = container.classList.toggle("collapsed");
      toggle.textContent = isCollapsed ? "▶" : "▼";
    };
    row.appendChild(toggle);
  } else {
    const spacer = document.createElement("span");
    spacer.style.width = "14px";
    spacer.style.display = "inline-block";
    spacer.style.flexShrink = "0";
    row.appendChild(spacer);
  }

  // Key
  if (key !== null) {
    const keyEl = document.createElement("span");
    keyEl.className = typeof key === "number" ? "key-index" : "key";
    keyEl.textContent = typeof key === "number" ? `[${key}]` : `"${key}"`;
    row.appendChild(keyEl);

    const colon = document.createElement("span");
    colon.textContent = ": ";
    row.appendChild(colon);
  }

  const body = document.createElement("div");
  body.className = "node-body";

  if (isObject) {
    const bracketOpen = document.createElement("span");
    bracketOpen.textContent = isArray ? "[" : "{";
    row.appendChild(bracketOpen);

    const count = isArray ? value.length : Object.keys(value).length;
    const summary = document.createElement("span");
    summary.className = "collapse-summary";
    summary.textContent = ` ${count} ${isArray ? "items" : "keys"} `;
    row.appendChild(summary);
    const summaryBracketClose = document.createElement("span");
    summaryBracketClose.className = "collapse-summary-bracket";
    summaryBracketClose.textContent = isArray ? "]" : "}";
    row.appendChild(summaryBracketClose);

    // Filter 及 動作按鈕 (如果是物件陣列)
    if (isArray && value.length > 0 && typeof value[0] === 'object') {
      const btnGroup = document.createElement("div");
      btnGroup.style.display = "inline-flex";
      btnGroup.style.gap = "4px";
      btnGroup.style.marginLeft = "10px";

      const filterBtn = document.createElement("button");
      filterBtn.className = "secondary tiny-btn";
      filterBtn.textContent = "Filter";
      filterBtn.onclick = (e) => {
        e.stopPropagation();
        openArrayFilter(value, body, key);
      };

      const resetBtn = document.createElement("button");
      resetBtn.className = "secondary tiny-btn";
      resetBtn.textContent = "Reset";
      resetBtn.onclick = (e) => {
        e.stopPropagation();
        renderArrayItems(value, body);
      };

      btnGroup.appendChild(filterBtn);
      btnGroup.appendChild(resetBtn);
      row.appendChild(btnGroup);
    }

    renderArrayItems(value, body);
    container.appendChild(row);
    container.appendChild(body);

    const bracketClose = document.createElement("div");
    bracketClose.className = "bracket-close";
    bracketClose.textContent = isArray ? "]" : "}";
    container.appendChild(bracketClose);
  } else {
    // Value
    const valEl = document.createElement("span");
    valEl.className = typeof value;
    if (typeof value === "string") valEl.textContent = `"${value}"`;
    else valEl.textContent = String(value);
    row.appendChild(valEl);
    container.appendChild(row);
  }

  return container;
}

function renderArrayItems(data, container) {
  container.innerHTML = "";
  const isArray = Array.isArray(data);
  if (isArray) {
    data.forEach((v, i) => container.appendChild(createNode(i, v)));
  } else {
    Object.entries(data).forEach(([k, v]) => container.appendChild(createNode(k, v)));
  }
}

// Filter 邏輯
function openArrayFilter(data, bodyContainer, parentKey) {
  activeArrayNode = { data, bodyContainer, parentKey };
  arrayFilterKeysEl.innerHTML = "";

  const keys = new Set();
  data.forEach(item => {
    if (item && typeof item === 'object') {
      Object.keys(item).forEach(k => keys.add(k));
    }
  });

  // 全選控制項
  const controlDiv = document.createElement("div");
  controlDiv.style.gridColumn = "1 / -1";
  controlDiv.style.marginBottom = "10px";
  controlDiv.innerHTML = `
    <button class="secondary tiny-btn" onclick="toggleAllFilters(true)">Select All</button>
    <button class="secondary tiny-btn" onclick="toggleAllFilters(false)">Clear All</button>
  `;
  arrayFilterKeysEl.appendChild(controlDiv);

  keys.forEach(k => {
    const div = document.createElement("div");
    div.className = "filter-checkbox-item";
    div.innerHTML = `<label><input type="checkbox" checked value="${k}"> ${k}</label>`;
    arrayFilterKeysEl.appendChild(div);
  });

  arrayFilterBackdrop.classList.add("open");
}

window.toggleAllFilters = (checked) => {
  const cbs = arrayFilterKeysEl.querySelectorAll('input[type="checkbox"]');
  cbs.forEach(cb => cb.checked = checked);
};

arrayFilterConfirmBtn.onclick = () => {
  if (!activeArrayNode) return;
  const { data, bodyContainer } = activeArrayNode;
  const selectedKeys = Array.from(arrayFilterKeysEl.querySelectorAll("input:checked")).map(i => i.value);

  bodyContainer.innerHTML = "";
  data.forEach((item, index) => {
    if (typeof item === 'object' && item !== null) {
      const filtered = {};
      selectedKeys.forEach(k => { if (k in item) filtered[k] = item[k]; });
      bodyContainer.appendChild(createNode(index, filtered));
    } else {
      bodyContainer.appendChild(createNode(index, item));
    }
  });
  arrayFilterBackdrop.classList.remove("open");
};

arrayFilterCancelBtn.onclick = () => arrayFilterBackdrop.classList.remove("open");

// 全部展開 / 全部收合 / 收合子節點
function setAllExpanded(expand) {
  if (!rootNodeEl) return;
  rootNodeEl.querySelectorAll(".node").forEach((node) => {
    if (expand) {
      node.classList.remove("collapsed");
      const t = node.querySelector(".toggle");
      if (t) t.textContent = "▼";
    } else {
      node.classList.add("collapsed");
      const t = node.querySelector(".toggle");
      if (t) t.textContent = "▶";
    }
  });
}

function collapseAllChildrenOnly() {
  if (!rootNodeEl) return;
  const nodes = rootNodeEl.querySelectorAll(".node");
  nodes.forEach((node, i) => {
    if (i === 0) return;
    node.classList.add("collapsed");
    const t = node.querySelector(".toggle");
    if (t) t.textContent = "▶";
  });
}

// 其他 UI 控制
function parseAndRender() {
  const val = inputEl.value.trim();
  if (!val) return;
  try {
    const data = JSON.parse(val);
    outputEl.innerHTML = "";
    rootNodeEl = createNode(null, data, true);
    outputEl.appendChild(rootNodeEl);
    errorEl.textContent = "";
    jsonHidden = true;
    applyJsonPanelState();
  } catch (e) {
    errorEl.textContent = e.message;
  }
}

parseBtn.onclick = parseAndRender;
expandAllBtn.onclick = () => setAllExpanded(true);
collapseAllBtn.onclick = () => setAllExpanded(false);
collapseAllChildBtn.onclick = () => collapseAllChildrenOnly();
hideJsonBtn.onclick = () => {
  jsonHidden = !jsonHidden;
  applyJsonPanelState();
};
settingsBtn.onclick = () => {
  syncSettingsActiveState();
  settingsBackdrop.classList.add("open");
};
settingsDoneBtn.onclick = () => settingsBackdrop.classList.remove("open");
document.querySelectorAll(".theme-opt").forEach(b => b.onclick = () => applyTheme(b.dataset.theme));
document.querySelectorAll(".font-opt").forEach(b => b.onclick = () => applyFontSize(b.dataset.font));
document.querySelectorAll(".lang-opt").forEach(b => b.onclick = () => applyLang(b.dataset.lang));
updateUIText();