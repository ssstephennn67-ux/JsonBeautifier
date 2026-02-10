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

let rootNodeEl = null;
let jsonHidden = false;
let isFirstParse = true;
let activeArrayNode = null;

// Preferences
let currentTheme = localStorage.getItem('json-theme') || 'dark';
let currentFont = localStorage.getItem('json-font') || 'medium';
let currentLang = localStorage.getItem('json-lang') || 'zh';

function applyTheme(theme) {
  document.body.className = document.body.className.replace(/theme-\w+/, `theme-${theme}`);
  currentTheme = theme;
  localStorage.setItem('json-theme', theme);
}

function applyFontSize(size) {
  document.body.className = document.body.className.replace(/font-\w+/, `font-${size}`);
  currentFont = size;
  localStorage.setItem('json-font', size);
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
    spacer.style.width = "18px";
    spacer.style.display = "inline-block";
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

// 其他 UI 控制
function parseAndRender() {
  const val = inputEl.value.trim();
  if (!val) return;
  try {
    const data = JSON.parse(val);
    outputEl.innerHTML = "";
    rootNodeEl = createNode(null, data, true);
    outputEl.appendChild(rootNodeEl);
    if (isFirstParse) {
      panelLeft.classList.add("hidden");
      panelRight.classList.add("full-width");
      isFirstParse = false;
    }
  } catch (e) {
    document.getElementById("error").textContent = e.message;
  }
}

parseBtn.onclick = parseAndRender;
settingsBtn.onclick = () => settingsBackdrop.classList.add("open");
settingsDoneBtn.onclick = () => settingsBackdrop.classList.remove("open");
document.querySelectorAll(".theme-opt").forEach(b => b.onclick = () => applyTheme(b.dataset.theme));
document.querySelectorAll(".font-opt").forEach(b => b.onclick = () => applyFontSize(b.dataset.font));