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

    // Preferences
    let currentTheme = localStorage.getItem('json-theme') || 'dark';
    let currentFont = localStorage.getItem('json-font') || 'medium';
    let currentLang = localStorage.getItem('json-lang') || 'zh';

    const translations = {
      zh: {
        title: "JSON Beautifier",
        parse: "解析並格式化",
        expandAll: "全部展開",
        collapseAll: "全部收合",
        collapseAllChild: "收合子節點",
        hideJson: "隱藏 JSON 輸入",
        showJson: "顯示 JSON 輸入",
        settings: "偏好設定",
        wait: "等待輸入...",
        settingsTitle: "偏好設定",
        labelTheme: "色彩主題",
        labelFont: "字體大小"
      },
      en: {
        title: "JSON Beautifier",
        parse: "Parse & Format",
        expandAll: "Expand All",
        collapseAll: "Collapse All",
        collapseAllChild: "Collapse Child Nodes",
        hideJson: "Hide JSON Input",
        showJson: "Show JSON Input",
        settings: "Settings",
        wait: "Waiting for input...",
        settingsTitle: "Preferences",
        labelTheme: "Color Theme",
        labelFont: "Font Size"
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
      collapseAllChildBtn.textContent = t.collapseAllChild;
      settingsBtn.textContent = t.settings;
      document.getElementById("settingsTitle").textContent = t.settingsTitle;
      document.getElementById("labelTheme").textContent = t.labelTheme;
      document.getElementById("labelFont").textContent = t.labelFont;
      updateHideJsonBtnText();
      if (!rootNodeEl) {
        outputEl.innerHTML = `<div style="color: var(--muted); padding: 20px;">${t.wait}</div>`;
      }
    }

    function updateHideJsonBtnText() {
      hideJsonBtn.textContent = jsonHidden ? translations[currentLang].showJson : translations[currentLang].hideJson;
    }

    function applyTheme(theme) {
      document.body.classList.remove('theme-dark', 'theme-light', 'theme-dracula', 'theme-nord', 'theme-gruvbox', 'theme-onedark', 'theme-rose');
      document.body.classList.add('theme-' + theme);
      currentTheme = theme;
      localStorage.setItem('json-theme', theme);
    }

    function applyFontSize(size) {
      document.body.classList.remove('font-small', 'font-medium', 'font-large', 'font-xlarge');
      document.body.classList.add('font-' + size);
      currentFont = size;
      localStorage.setItem('json-font', size);
    }

    function setError(msg) {
      outputEl.innerHTML = `<div class="error">Error: ${msg}</div>`;
    }

    function renderNode(key, value, isLast, isArrayIndex = false) {
      const node = document.createElement("div");
      node.className = "node";

      const head = document.createElement("div");
      head.className = "node-head";

      const isObject = value !== null && typeof value === 'object';
      const isArray = Array.isArray(value);

      // Toggle
      if (isObject) {
        const toggle = document.createElement("span");
        toggle.className = "toggle expanded";
        head.appendChild(toggle);
      } else {
        const spacer = document.createElement("span");
        spacer.className = "toggle";
        head.appendChild(spacer);
      }

      // Key
      if (key !== null) {
        const keySpan = document.createElement("span");
        keySpan.className = isArrayIndex ? "key-index" : "key";
        keySpan.textContent = isArrayIndex ? `[${key}]` : `"${key}"`;
        head.appendChild(keySpan);
        const colon = document.createElement("span");
        colon.className = "comma";
        colon.textContent = ": ";
        head.appendChild(colon);
      }

      if (isObject) {
        const bracketOpen = document.createElement("span");
        bracketOpen.className = "bracket";
        bracketOpen.textContent = isArray ? "[" : "{";
        head.appendChild(bracketOpen);

        const body = document.createElement("div");
        body.className = "node-body";
        const keys = Object.keys(value);
        keys.forEach((k, i) => {
          body.appendChild(renderNode(k, value[k], i === keys.length - 1, isArray));
        });
        node.appendChild(head);
        node.appendChild(body);

        const footer = document.createElement("div");
        footer.style.paddingLeft = "22px";
        const bracketClose = document.createElement("span");
        bracketClose.className = "bracket";
        bracketClose.textContent = isArray ? "]" : "}";
        footer.appendChild(bracketClose);
        if (!isLast) {
          const comma = document.createElement("span");
          comma.className = "comma";
          comma.textContent = ",";
          footer.appendChild(comma);
        }
        node.appendChild(footer);

        head.onclick = (e) => {
          e.stopPropagation();
          const toggle = head.querySelector(".toggle");
          const isExpanded = toggle.classList.contains("expanded");
          if (isExpanded) {
            toggle.classList.replace("expanded", "collapsed");
            body.style.display = "none";
            footer.style.display = "none";
            const summary = document.createElement("span");
            summary.className = "muted summary-text";
            summary.style.marginLeft = "8px";
            summary.style.fontSize = "11px";
            summary.textContent = isArray ? `// ${keys.length} items` : `// ${keys.length} keys`;
            head.appendChild(summary);
          } else {
            toggle.classList.replace("collapsed", "expanded");
            body.style.display = "block";
            footer.style.display = "block";
            const summary = head.querySelector(".summary-text");
            if (summary) summary.remove();
          }
        };
      } else {
        const valSpan = document.createElement("span");
        const type = value === null ? 'null' : typeof value;
        valSpan.className = type;
        valSpan.textContent = JSON.stringify(value);
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

    function setExpandRecursive(element, expand) {
      const toggles = element.querySelectorAll(".toggle");
      toggles.forEach(t => {
        const head = t.parentElement;
        const body = head.nextElementSibling;
        const footer = body ? body.nextElementSibling : null;
        if (!body || !footer) return;

        const summary = head.querySelector(".summary-text");

        if (expand) {
          t.classList.replace("collapsed", "expanded");
          body.style.display = "block";
          footer.style.display = "block";
          if (summary) summary.remove();
        } else {
          t.classList.replace("expanded", "collapsed");
          body.style.display = "none";
          footer.style.display = "none";
          if (!summary) {
            const keysCount = body.children.length;
            const isArray = head.querySelector(".bracket").textContent === "[";
            const newSummary = document.createElement("span");
            newSummary.className = "muted summary-text";
            newSummary.style.marginLeft = "8px";
            newSummary.style.fontSize = "11px";
            newSummary.textContent = isArray ? `// ${keysCount} items` : `// ${keysCount} keys`;
            head.appendChild(newSummary);
          }
        }
      });
    }

    function collapseAllChild(element) {
        const bodies = element.querySelectorAll(".node-body");
        bodies.forEach(body => {
            const head = body.previousElementSibling;
            const toggle = head.querySelector(".toggle");
            const footer = body.nextElementSibling;
            const summary = head.querySelector(".summary-text");

            if (toggle.classList.contains("expanded")) {
                toggle.classList.replace("expanded", "collapsed");
                body.style.display = "none";
                footer.style.display = "none";
                if (!summary) {
                    const keysCount = body.children.length;
                    const isArray = head.querySelector(".bracket").textContent === "[";
                    const newSummary = document.createElement("span");
                    newSummary.className = "muted summary-text";
                    newSummary.style.marginLeft = "8px";
                    newSummary.style.fontSize = "11px";
                    newSummary.textContent = isArray ? `// ${keysCount} items` : `// ${keysCount} keys`;
                    head.appendChild(newSummary);
                }
            }
        });
    }

    function parseAndRender(skipAutoHide = false) {
      const val = inputEl.value.trim();
      if (!val) return;
      try {
        const data = JSON.parse(val);
        outputEl.innerHTML = "";
        rootNodeEl = renderNode(null, data, true);
        outputEl.appendChild(rootNodeEl);

        if (isFirstParse && !skipAutoHide) {
          jsonHidden = true;
          panelLeft.classList.add("hidden");
          panelRight.classList.add("full-width");
          updateHideJsonBtnText();
        }
        if (!skipAutoHide) isFirstParse = false;
      } catch (err) { setError(err.message); outputEl.innerHTML = ""; }
    }

    parseBtn.onclick = parseAndRender;
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
    settingsBackdrop.onclick = (e) => { if (e.target === settingsBackdrop) settingsBackdrop.classList.remove("open"); };
    document.querySelectorAll(".lang-opt").forEach(btn => {
      btn.onclick = () => { applyLanguage(btn.dataset.lang); };
    });
    document.querySelectorAll(".theme-opt").forEach(btn => {
      btn.onclick = () => { applyTheme(btn.dataset.theme); };
    });
    document.querySelectorAll(".font-opt").forEach(btn => {
      btn.onclick = () => { applyFontSize(btn.dataset.font); };
    });

    applyTheme(currentTheme);
    applyFontSize(currentFont);
    applyLanguage(currentLang);