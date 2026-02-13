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

const FILTER_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg>';

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
    fontSmall: "小",
    fontMedium: "中",
    fontLarge: "大",
    langLabel: "介面語言",
    langZh: "繁體中文",
    langEn: "English",
    close: "關閉",
    filterTitle: "過濾欄位",
    filterCancel: "取消",
    filterConfirm: "執行過濾",
    filterWarningEmpty: "請至少選擇一個欄位",
    collapseArray: "收合",
    expandArray: "展開",
    filter: "過濾",
    filtering: "過濾中",
    selectAll: "全選",
    clearAll: "清除",
    items: "項",
    keys: "鍵",
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
    fontSmall: "Small",
    fontMedium: "Medium",
    fontLarge: "Large",
    langLabel: "Language",
    langZh: "繁體中文",
    langEn: "English",
    close: "Close",
    filterTitle: "Array Filter",
    filterCancel: "Cancel",
    filterConfirm: "Apply Filter",
    filterWarningEmpty: "Please select at least one key",
    collapseArray: "Collapse",
    expandArray: "Expand",
    filter: "Filter",
    filtering: "Filtering",
    selectAll: "Select All",
    clearAll: "Clear All",
    items: "Items",
    keys: "Keys",
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
  if (rootNodeEl) parseAndRender(true);
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
  const settingsTitle = document.getElementById("settingsTitle");
  if (settingsTitle) settingsTitle.textContent = t.settings;
  settingsDoneBtn.textContent = t.close;
  document.querySelector(".settings-row:nth-child(1) .settings-label").textContent = t.themeLabel;
  document.querySelector(".settings-row:nth-child(2) .settings-label").textContent = t.fontLabel;
  document.querySelector(".settings-row:nth-child(3) .settings-label").textContent = t.langLabel;
  document.querySelector('[data-font="small"]').textContent = t.fontSmall;
  document.querySelector('[data-font="medium"]').textContent = t.fontMedium;
  document.querySelector('[data-font="large"]').textContent = t.fontLarge;
  document.querySelector('[data-lang="zh"]').textContent = t.langZh;
  document.querySelector('[data-lang="en"]').textContent = t.langEn;
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

  // 展開箭頭 + 成行可 click
  if (isObject) {
    row.classList.add("collapsible");
    const toggle = document.createElement("span");
    toggle.className = "toggle";
    toggle.textContent = "▼";
    row.appendChild(toggle);
    row.onclick = (e) => {
      if (e.target.closest("button")) return;
      const isCollapsed = container.classList.toggle("collapsed");
      const t = row.querySelector(".toggle");
      if (t) t.textContent = isCollapsed ? "▶" : "▼";
    };
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
    const txt = strings[currentLang] || strings.zh;
    summary.textContent = ` ${count} ${isArray ? txt.items : txt.keys} `;
    row.appendChild(summary);
    const summaryBracketClose = document.createElement("span");
    summaryBracketClose.className = "collapse-summary-bracket";
    summaryBracketClose.textContent = isArray ? "]" : "}";
    row.appendChild(summaryBracketClose);

    // Filter 及 動作按鈕 (陣列內至少有一個 object 就可 filter)
    const hasObjectItems = isArray && value.length > 0 && value.some(item => item != null && typeof item === 'object' && !Array.isArray(item));
    if (hasObjectItems) {
      const keys = new Set();
      value.forEach(item => {
        if (item && typeof item === 'object') Object.keys(item).forEach(k => keys.add(k));
      });
      const totalKeys = keys.size;

      const btnGroup = document.createElement("div");
      btnGroup.style.display = "inline-flex";
      btnGroup.style.gap = "4px";
      btnGroup.style.marginLeft = "10px";

      const filterBtn = document.createElement("button");
      filterBtn.className = "secondary tiny-btn array-filter-btn";
      filterBtn.dataset.totalKeys = String(totalKeys);
      filterBtn.innerHTML = `<span class="btn-icon">${FILTER_ICON}</span><span>${(strings[currentLang] || strings.zh).filter}</span>`;
      filterBtn.onclick = (e) => {
        e.stopPropagation();
        openArrayFilter(value, body, key);
      };

      const collapseChildrenBtn = document.createElement("button");
      collapseChildrenBtn.className = "secondary tiny-btn array-collapse-children-btn";
      const t2 = strings[currentLang] || strings.zh;
      collapseChildrenBtn.innerHTML = `<span class="btn-icon">▼</span><span>${t2.collapseArray}</span>`;
      collapseChildrenBtn.onclick = (e) => {
        e.stopPropagation();
        const nodes = body.querySelectorAll(".node");
        const allChildrenCollapsed = Array.from(nodes).every(n => n.classList.contains("collapsed"));
        const txt = strings[currentLang] || strings.zh;
        if (allChildrenCollapsed) {
          container.classList.remove("collapsed");
          const rowToggle = row.querySelector(".toggle");
          if (rowToggle) rowToggle.textContent = "▼";
          nodes.forEach(node => {
            node.classList.remove("collapsed");
            const t = node.querySelector(".toggle");
            if (t) t.textContent = "▼";
          });
          collapseChildrenBtn.innerHTML = `<span class="btn-icon">▼</span><span>${txt.collapseArray}</span>`;
        } else {
          nodes.forEach(node => {
            node.classList.add("collapsed");
            const t = node.querySelector(".toggle");
            if (t) t.textContent = "▶";
          });
          container.classList.add("collapsed");
          const rowToggle = row.querySelector(".toggle");
          if (rowToggle) rowToggle.textContent = "▶";
          collapseChildrenBtn.innerHTML = `<span class="btn-icon">▶</span><span>${txt.expandArray}</span>`;
        }
      };

      btnGroup.appendChild(filterBtn);
      btnGroup.appendChild(collapseChildrenBtn);
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

function getFilterStorageKey(parentKey, keysArray) {
  const keyPart = String(parentKey ?? "root");
  const keysPart = keysArray.sort().join(",");
  return `json-filter-${keyPart}-${keysPart}`;
}

// Filter 邏輯：第一次入去（無 saved state）preselect 全部；之後用 saved state
function openArrayFilter(data, bodyContainer, parentKey) {
  const keys = new Set();
  data.forEach(item => {
    if (item && typeof item === 'object') {
      Object.keys(item).forEach(k => keys.add(k));
    }
  });
  const keysArray = Array.from(keys);
  const storageKey = getFilterStorageKey(parentKey, [...keysArray]);
  const raw = localStorage.getItem(storageKey);
  const savedKeys = raw ? JSON.parse(raw) : null;
  activeArrayNode = { data, bodyContainer, parentKey, storageKey };
  arrayFilterKeysEl.innerHTML = "";

  const txt = strings[currentLang] || strings.zh;
  const controlDiv = document.createElement("div");
  controlDiv.style.gridColumn = "1 / -1";
  controlDiv.style.display = "flex";
  controlDiv.style.gap = "4px";
  controlDiv.style.marginBottom = "10px";
  const selectAllBtn = document.createElement("button");
  selectAllBtn.className = "secondary filter-dialog-control-btn";
  selectAllBtn.textContent = txt.selectAll;
  selectAllBtn.onclick = () => toggleAllFilters(true);
  const clearAllBtn = document.createElement("button");
  clearAllBtn.className = "secondary filter-dialog-control-btn";
  clearAllBtn.textContent = txt.clearAll;
  clearAllBtn.onclick = () => toggleAllFilters(false);
  controlDiv.appendChild(selectAllBtn);
  controlDiv.appendChild(clearAllBtn);
  arrayFilterKeysEl.appendChild(controlDiv);

  keys.forEach(k => {
    const checked = true;
    const div = document.createElement("div");
    div.className = "filter-checkbox-item";
    div.innerHTML = `<label><input type="checkbox" ${checked ? "checked" : ""} value="${k}"> ${k}</label>`;
    arrayFilterKeysEl.appendChild(div);
  });

  arrayFilterWarningEl.style.display = "none";
  arrayFilterWarningEl.textContent = "";
  arrayFilterBackdrop.classList.add("open");
}

window.toggleAllFilters = (checked) => {
  const cbs = arrayFilterKeysEl.querySelectorAll('input[type="checkbox"]');
  cbs.forEach(cb => cb.checked = checked);
};

const arrayFilterWarningEl = document.getElementById("arrayFilterWarning");

arrayFilterConfirmBtn.onclick = () => {
  if (!activeArrayNode) return;
  const { data, bodyContainer, storageKey } = activeArrayNode;
  const selectedKeys = Array.from(arrayFilterKeysEl.querySelectorAll("input:checked")).map(i => i.value);
  const totalKeys = arrayFilterKeysEl.querySelectorAll("input[type='checkbox']").length;
  if (selectedKeys.length === 0) {
    const t = strings[currentLang] || strings.zh;
    arrayFilterWarningEl.textContent = t.filterWarningEmpty;
    arrayFilterWarningEl.style.display = "block";
    return;
  }
  arrayFilterWarningEl.style.display = "none";
  arrayFilterWarningEl.textContent = "";
  if (storageKey) {
    localStorage.setItem(storageKey, JSON.stringify(selectedKeys));
  }

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

  const nodeEl = bodyContainer.parentElement;
  const filterBtn = nodeEl?.querySelector(".array-filter-btn");
  const collapseBtn = nodeEl?.querySelector(".array-collapse-children-btn");
  const txt = strings[currentLang] || strings.zh;
  if (filterBtn && totalKeys > 0) {
    if (selectedKeys.length < totalKeys) {
      filterBtn.innerHTML = `<span class="btn-icon">${FILTER_ICON}</span><span>${txt.filtering} (${selectedKeys.length}/${totalKeys})</span>`;
      filterBtn.classList.add("is-filtering");
    } else {
      filterBtn.innerHTML = `<span class="btn-icon">${FILTER_ICON}</span><span>${txt.filter}</span>`;
      filterBtn.classList.remove("is-filtering");
    }
  }
  if (collapseBtn) {
    const txt = strings[currentLang] || strings.zh;
    collapseBtn.innerHTML = `<span class="btn-icon">▼</span><span>${txt.collapseArray}</span>`;
  }
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

function clearFilterStorage() {
  const keys = Object.keys(localStorage);
  keys.forEach(k => { if (k.startsWith("json-filter-")) localStorage.removeItem(k); });
}

// 其他 UI 控制；skipClearFilter = true 時不清理 filter state（如切換語言）
function parseAndRender(skipClearFilter = false) {
  const val = inputEl.value.trim();
  if (!val) return;
  try {
    if (!skipClearFilter) {
      clearFilterStorage();
      arrayFilterBackdrop.classList.remove("open");
      settingsBackdrop.classList.remove("open");
      activeArrayNode = null;
    }
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
applyTheme(currentTheme);
applyFontSize(currentFont);
applyLang(currentLang);