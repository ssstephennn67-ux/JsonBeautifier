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

// 用於 Filter 功能的變量
let currentFilteringBody = null;

// Preferences
let currentTheme = localStorage.getItem('json-theme') || 'dark';
let currentFont = localStorage.getItem('json-font') || 'medium';
let currentLang = localStorage.getItem('json-lang') || 'zh';

function setActiveSettingButtons(selector, dataKey, activeValue) {
  const buttons = document.querySelectorAll(selector);
  buttons.forEach((btn) => {
    const isActive = btn.dataset[dataKey] === activeValue;
    if (isActive) {
      btn.classList.add("is-active");
      btn.style.pointerEvents = "none";
    } else {
      btn.classList.remove("is-active");
      btn.style.pointerEvents = "auto";
    }
  });
}

const translations = {
  zh: {
    title: "JSON Beautifier",
    parse: "解析並格式化",
    expandAll: "全部展開",
    collapseAll: "全部收合",
    collapseChildren: "收合子節點",
    hideInput: "隱藏 JSON 輸入",
    showInput: "顯示 JSON 輸入",
    settings: "偏好設定",
    prefTitle: "偏好設定",
    theme: "主題",
    font: "字體大小",
    lang: "語言",
    done: "完成",
    placeholder: "在此貼上 JSON...",
    errorTitle: "錯誤： "
  },
  en: {
    title: "JSON Beautifier",
    parse: "Parse JSON",
    expandAll: "Expand All",
    collapseAll: "Collapse All",
    collapseChildren: "Collapse Children",
    hideInput: "Hide Input",
    showInput: "Show Input",
    settings: "Settings",
    prefTitle: "Preferences",
    theme: "Theme",
    font: "Font Size",
    lang: "Language",
    done: "Done",
    placeholder: "Paste JSON here...",
    errorTitle: "Error: "
  }
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
  document.querySelector(".btn-done").textContent = t.done;
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

function updateHideJsonBtnText() {
  const t = translations[currentLang];
  hideJsonBtn.textContent = jsonHidden ? t.showInput : t.hideInput;
}

function setError(msg) {
  const errorEl = document.getElementById("error");
  if (!errorEl) return;
  const prefix = translations[currentLang]?.errorTitle || "";
  errorEl.textContent = msg ? prefix + msg : "";
}

// --- Filter 相關邏輯 ---
function openFilterModal(data, bodyContainer) {
  const backdrop = document.getElementById("filterBackdrop");
  const optionsContainer = document.getElementById("filterOptions");
  const confirmBtn = document.getElementById("confirmFilterBtn");

  currentFilteringBody = bodyContainer;
  optionsContainer.innerHTML = "";

  // 1. 提取陣列中所有物件的 Keys
  const allKeys = new Set();
  data.forEach(item => {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      Object.keys(item).forEach(k => allKeys.add(k));
    }
  });

  // 2. 建立選項
  const createCheckbox = (val, label) => {
    const lbl = document.createElement("label");
    lbl.className = "filter-item";
    lbl.innerHTML = `<input type="checkbox" value="${val}" checked> <span>${label}</span>`;
    optionsContainer.appendChild(lbl);
  };

  createCheckbox("all", "All (全部)");
  allKeys.forEach(k => createCheckbox(k, k));

  backdrop.classList.add("open");

  confirmBtn.onclick = () => {
    const selected = Array.from(optionsContainer.querySelectorAll("input:checked")).map(i => i.value);
    const isAll = selected.includes("all");

    // 遍歷陣列元素，隱藏不匹配的 key 節點
    Array.from(bodyContainer.children).forEach(itemNode => {
      const itemBody = itemNode.querySelector(".node-body");
      if (itemBody) {
        Array.from(itemBody.children).forEach(pair => {
          const keyName = pair.getAttribute("data-key");
          pair.style.display = (isAll || selected.includes(keyName)) ? "block" : "none";
        });
      }
    });
    backdrop.classList.remove("open");
  };
}

// --- 核心 Node 建立函數 ---
function createNode(key, value, isLast = true, keyIndex = null) {
  const node = document.createElement("div");
  node.className = "node";
  if (key !== null) node.setAttribute("data-key", key); // 加入 data-key 方便過濾

  const head = document.createElement("div");
  head.className = "node-head";

  const toggle = document.createElement("span");
  toggle.className = "toggle";

  const keySpan = document.createElement("span");
  if (keyIndex !== null) {
    keySpan.className = "key-index";
    keySpan.textContent = keyIndex;
    head.appendChild(keySpan);
  } else if (key !== null) {
    keySpan.className = "key";
    keySpan.textContent = `"${key}"`;
    head.appendChild(keySpan);
    const colon = document.createElement("span");
    colon.textContent = ": ";
    head.appendChild(colon);
  }

  const isContainer = value !== null && typeof value === "object";

  if (isContainer) {
    const isArray = Array.isArray(value);
    const openBracket = isArray ? "[" : "{";
    const closeBracket = isArray ? "]" : "}";
    const len = isArray ? value.length : Object.keys(value).length;

    toggle.classList.add("expanded");
    head.prepend(toggle);

    const bracketOpen = document.createElement("span");
    bracketOpen.className = "bracket";
    bracketOpen.textContent = openBracket;
    head.appendChild(bracketOpen);

    // 如果是陣列，加入 Filter/Expand/Collapse 按鈕
    if (isArray) {
      const controls = document.createElement("span");
      controls.className = "array-controls";

      const fBtn = document.createElement("button");
      fBtn.className = "array-btn"; fBtn.textContent = "Filter";
      fBtn.onclick = (e) => { e.stopPropagation(); openFilterModal(value, body); };

      const eBtn = document.createElement("button");
      eBtn.className = "array-btn"; eBtn.textContent = "+";
      eBtn.onclick = (e) => { e.stopPropagation(); setExpandRecursive(node, true); };

      const cBtn = document.createElement("button");
      cBtn.className = "array-btn"; cBtn.textContent = "-";
      cBtn.onclick = (e) => { e.stopPropagation(); setExpandRecursive(node, false); };

      controls.append(fBtn, eBtn, cBtn);
      head.appendChild(controls);
    }

    const body = document.createElement("div");
    body.className = "node-body";

    if (isArray) {
      value.forEach((v, i) => body.appendChild(createNode(null, v, i === len - 1, i)));
    } else {
      const keys = Object.keys(value);
      keys.forEach((k, i) => body.appendChild(createNode(k, value[k], i === len - 1)));
    }

    const footer = document.createElement("div");
    footer.className = "node-footer";
    const bracketClose = document.createElement("span");
    bracketClose.className = "bracket";
    bracketClose.textContent = closeBracket + (isLast ? "" : ",");
    footer.appendChild(bracketClose);

    head.onclick = (e) => {
      e.stopPropagation();
      const isExpanded = toggle.classList.contains("expanded");
      toggle.classList.toggle("expanded", !isExpanded);
      toggle.classList.toggle("collapsed", isExpanded);
      body.style.display = isExpanded ? "none" : "block";
      footer.style.display = isExpanded ? "none" : "block";
    };

    node.appendChild(head);
    node.appendChild(body);
    node.appendChild(footer);
  } else {
    const valSpan = document.createElement("span");
    if (typeof value === "string") {
      valSpan.className = "string";
      valSpan.textContent = `"${value}"`;
    } else if (typeof value === "number") {
      valSpan.className = "number";
      valSpan.textContent = value;
    } else if (typeof value === "boolean") {
      valSpan.className = "boolean";
      valSpan.textContent = value;
    } else if (value === null) {
      valSpan.className = "null";
      valSpan.textContent = "null";
    }
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

function setExpandRecursive(node, expand) {
  const toggle = node.querySelector(".toggle");
  const body = node.querySelector(".node-body");
  const footer = node.querySelector(".node-footer");
  if (toggle && body && footer) {
    toggle.classList.toggle("expanded", expand);
    toggle.classList.toggle("collapsed", !expand);
    body.style.display = expand ? "block" : "none";
    footer.style.display = expand ? "block" : "none";
    Array.from(body.children).forEach(child => setExpandRecursive(child, expand));
  }
}

function collapseAllChild(node) {
  const body = node.querySelector(".node-body");
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
      updateHideJsonBtnText();
    }
    if (!skipAutoHide) isFirstParse = false;
  } catch (err) {
    setError(err.message);
    outputEl.innerHTML = "";
  }
}

// Event Listeners
parseBtn.onclick = () => parseAndRender();
expandAllBtn.onclick = () => rootNodeEl && setExpandRecursive(rootNodeEl, true);
collapseAllBtn.onclick = () => rootNodeEl && setExpandRecursive(rootNodeEl, false);
collapseAllChildBtn.onclick = () => rootNodeEl && collapseAllChild(rootNodeEl);
hideJsonBtn.onclick = () => {
  jsonHidden = !jsonHidden;
  panelLeft.classList.toggle("hidden", jsonHidden);
  panelRight.classList.toggle("full-width", jsonHidden);
  updateHideJsonBtnText();
};
settingsBtn.onclick = () => settingsBackdrop.classList.add("open");

// 點擊背景關閉 Modal (通用)
document.querySelectorAll(".settings-backdrop").forEach(bg => {
  bg.onclick = (e) => { if (e.target === bg) bg.classList.remove("open"); };
});

document.querySelectorAll(".theme-opt").forEach(btn => btn.onclick = () => applyTheme(btn.dataset.theme));
document.querySelectorAll(".font-opt").forEach(btn => btn.onclick = () => applyFontSize(btn.dataset.font));
document.querySelectorAll(".lang-opt").forEach(btn => btn.onclick = () => applyLanguage(btn.dataset.lang));

// Init
applyTheme(currentTheme);
applyFontSize(currentFont);
applyLanguage(currentLang);