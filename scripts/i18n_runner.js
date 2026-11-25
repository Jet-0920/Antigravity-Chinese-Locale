(function () {
    var data = window.__ANTIGRAVITY_I18N_DATA__ || {};
    var EXACT = data.exact || {};
    var REVERSE_MAP = data.reverse_map || {};
    var REGEX_RULES = [];
    if (Array.isArray(data.regex_rules)) {
        for (var i = 0; i < data.regex_rules.length; i++) {
            try {
                REGEX_RULES.push({
                    re: new RegExp(data.regex_rules[i].pattern),
                    rep: data.regex_rules[i].replacement
                });
            } catch (e) {}
        }
    }
    var EXEMPTIONS = data.exemptions || [];

    // Always update global store on new data injection
    window.__ANTIGRAVITY_EXACT__ = EXACT;
    window.__ANTIGRAVITY_REVERSE_MAP__ = REVERSE_MAP;
    window.__ANTIGRAVITY_REGEX_RULES__ = REGEX_RULES;
    window.__ANTIGRAVITY_EXEMPTIONS__ = EXEMPTIONS;

    // Execute previous runner cleanup if registered (enables live script hot-reload without deadlocks)
    if (typeof window.__antigravity_cleanup_i18n === 'function') {
        try {
            window.__antigravity_cleanup_i18n();
        } catch (e) {
            console.error("[Antigravity i18n] Error executing previous cleanup:", e);
        }
    }

    var RUNNER_VERSION = 4.0;
    window.__antigravity_runner_version = RUNNER_VERSION;
    window.__antigravity_i18n_runner_active = true;

    // Track active resources for hot teardown and reload
    var activeCleanups = [];

    // 1. WeakMap Immutable Source Text & Attribute Stores
    window.__ANTIGRAVITY_ORIG_TEXT_STORE__ = window.__ANTIGRAVITY_ORIG_TEXT_STORE__ || new WeakMap();
    window.__ANTIGRAVITY_ORIG_ATTR_STORE__ = window.__ANTIGRAVITY_ORIG_ATTR_STORE__ || new WeakMap();

    // 2. High-Performance Base UI / Radix Controlled Component Reverse Map Hook
    if (!window.__antigravity_map_hooked) {
        window.__antigravity_map_hooked = true;
        var origHas = Map.prototype.has;
        var origGet = Map.prototype.get;
        var zhCharRegex = /[\u4e00-\u9fa5]/;

        Map.prototype.has = function (key) {
            if (origHas.call(this, key)) return true;
            // 快路径：非字符串或不含汉字直接返回 false，保证 99.9% 内部英文/代码 Map 查询零损耗
            if (typeof key !== "string" || !zhCharRegex.test(key)) return false;

            var rev = window.__ANTIGRAVITY_REVERSE_MAP__ || REVERSE_MAP;
            var cand = rev[key];
            if (cand) {
                if (Array.isArray(cand)) {
                    for (var i = 0; i < cand.length; i++) {
                        if (origHas.call(this, cand[i])) return true;
                    }
                } else if (typeof cand === "string") {
                    if (origHas.call(this, cand)) return true;
                }
            }
            return false;
        };

        Map.prototype.get = function (key) {
            // 严守 JS 规范：若原生 Map 存有该 key（即使值为 undefined），优先返回原生值
            if (origHas.call(this, key)) {
                return origGet.call(this, key);
            }
            // 快路径拦截
            if (typeof key !== "string" || !zhCharRegex.test(key)) {
                return undefined;
            }

            var rev = window.__ANTIGRAVITY_REVERSE_MAP__ || REVERSE_MAP;
            var cand = rev[key];
            if (cand) {
                if (Array.isArray(cand)) {
                    for (var i = 0; i < cand.length; i++) {
                        if (origHas.call(this, cand[i])) {
                            return origGet.call(this, cand[i]);
                        }
                    }
                } else if (typeof cand === "string") {
                    if (origHas.call(this, cand)) {
                        return origGet.call(this, cand);
                    }
                }
            }
            return undefined;
        };
    }

    // 3. Strict Layered Exclusion & Isolation Engine
    var EXCLUDED_TAGS = {
        "SCRIPT": true,
        "STYLE": true,
        "CODE": true,
        "PRE": true,
        "TEXTAREA": true,
        "INPUT": true,
        "KBD": true
    };

    function isInsideExcluded(node) {
        if (!node) return false;
        var curr = node.nodeType === 3 ? node.parentNode : node;
        while (curr && curr !== document.body && curr !== document.documentElement) {
            if (curr.nodeType === 1) {
                var tag = curr.tagName;
                var cls = curr.className;
                var clsStr = typeof cls === "string" ? cls : "";

                // 第一优先级（绝对物理禁区，只要向上碰到任意一个即立刻 return true 阻断，不可绕过）：
                if (EXCLUDED_TAGS[tag]) return true;
                if (curr.isContentEditable) return true;
                if (clsStr && (
                    clsStr.indexOf("view-line") !== -1 ||
                    clsStr.indexOf("view-lines") !== -1 ||
                    clsStr.indexOf("lines-content") !== -1 ||
                    clsStr.indexOf("overflow-guard") !== -1 ||
                    clsStr.indexOf("mtk") !== -1 ||
                    clsStr.indexOf("xterm") !== -1 ||
                    clsStr.indexOf("terminal") !== -1 ||
                    clsStr.indexOf("token") !== -1 ||
                    clsStr.indexOf("syntax") !== -1
                )) {
                    return true;
                }

                // 第二优先级（安全 UI 控件放行，此时已确保不在代码行/输入框内）：
                var isUiControl = false;
                if (tag === "BUTTON" || (typeof curr.getAttribute === "function" && (
                    curr.getAttribute("role") === "button" ||
                    curr.getAttribute("role") === "menuitem" ||
                    curr.getAttribute("role") === "tooltip" ||
                    curr.getAttribute("role") === "menu" ||
                    curr.getAttribute("role") === "tab" ||
                    curr.getAttribute("role") === "option"
                ))) {
                    isUiControl = true;
                } else if (clsStr && (
                    clsStr.indexOf("monaco-hover") !== -1 ||
                    clsStr.indexOf("overlayWidgets") !== -1 ||
                    clsStr.indexOf("agy-overlay") !== -1 ||
                    clsStr.indexOf("viewing-diff-badge") !== -1 ||
                    clsStr.indexOf("viewing-diff-title") !== -1 ||
                    clsStr.indexOf("copy-code-button") !== -1
                )) {
                    isUiControl = true;
                } else if (typeof curr.getAttribute === "function" && curr.getAttribute("data-testid") === "context-menu-popup") {
                    isUiControl = true;
                } else if (typeof curr.hasAttribute === "function" && (
                    curr.hasAttribute("data-radix-popper-content-wrapper") ||
                    curr.hasAttribute("data-floating-ui-portal")
                )) {
                    isUiControl = true;
                }

                if (isUiControl) {
                    return false;
                }

                // 第三优先级（外层编辑区兜底阻断）：
                if (clsStr && (
                    clsStr.indexOf("monaco-editor") !== -1 ||
                    clsStr.indexOf("monaco-diff-editor") !== -1 ||
                    clsStr.indexOf("chat-code-block") !== -1
                )) {
                    return true;
                }
            }
            curr = curr.parentNode;
        }
        return false;
    }

    // 4. Technical Entity & Code Identifier Protection Gatekeeper
    function isTechnicalEntity(text) {
        if (!text || text.length > 250) return false;
        // URL
        if (/[a-zA-Z]+:\/\/[^\s]+/.test(text)) return true;
        // Local file system path (Windows drive letter or Unix absolute path)
        if (/^[A-Za-z]:[\\\/]/.test(text) || /^\/[a-zA-Z0-9_\-\.]+\/[a-zA-Z0-9_\-\.]+/.test(text)) return true;
        // Common code / config file names with extensions
        if (/^[a-zA-Z0-9_\-\.\/\\]+\.(py|js|ts|tsx|jsx|json|ya?ml|md|sh|ps1|sql|html?|css|rs|go|cpp?|c|h|txt|log|lock|toml|env|gitignore)$/i.test(text)) return true;
        // Semantic versioning (e.g. v1.2.3, 2.0.0-beta)
        if (/^v?\d+\.\d+(\.\d+)?(-[a-zA-Z0-9\.]+)?$/i.test(text)) return true;
        // CLI commands and arguments
        if (/^(git|npm|npx|docker|python3?|node|yarn|pnpm|cargo|go|kubectl|agy)\s+[a-zA-Z0-9\-_]/i.test(text)) return true;
        // Code identifiers (snake_case with 2+ parts or camelCase)
        if (/^[a-zA-Z0-9]+_[a-zA-Z0-9_]+$/.test(text) || /^[a-z]+[A-Z][a-zA-Z0-9]*$/.test(text)) return true;
        return false;
    }

    // 5. Prose Flow & UI Control Context Gatekeepers
    function isInsideProseFlow(node) {
        if (!node) return false;
        var curr = node.nodeType === 3 ? node.parentNode : node;
        while (curr && curr !== document.body && curr !== document.documentElement) {
            if (curr.nodeType === 1) {
                var tag = curr.tagName;
                // If explicitly an interactive button or toolbar widget inside prose, treat as UI control
                if (tag === "BUTTON" || tag === "NAV") return false;
                if (typeof curr.getAttribute === "function") {
                    var role = curr.getAttribute("role");
                    if (role === "button" || role === "tooltip" || role === "tab" || role === "menuitem") {
                        return false;
                    }
                }
                var cls = curr.className;
                var clsStr = typeof cls === "string" ? cls : "";
                if (clsStr && (
                    clsStr.indexOf("copy-code-button") !== -1 ||
                    clsStr.indexOf("monaco-hover") !== -1 ||
                    clsStr.indexOf("badge") !== -1
                )) {
                    return false;
                }

                // If inside prose containers or chat message text
                if (tag === "ARTICLE" || (clsStr && (
                    clsStr.indexOf("markdown-body") !== -1 ||
                    clsStr.indexOf("prose") !== -1 ||
                    clsStr.indexOf("chat-message-content") !== -1 ||
                    clsStr.indexOf("conversation-turn") !== -1
                )) || (typeof curr.hasAttribute === "function" && curr.hasAttribute("data-message-id"))) {
                    return true;
                }
            }
            curr = curr.parentNode;
        }
        return false;
    }

    function isInUIControlContext(node) {
        if (!node) return true; // Native menus or headless calls without DOM context default to allowed
        var curr = node.nodeType === 3 ? node.parentNode : node;
        while (curr && curr !== document.body && curr !== document.documentElement) {
            if (curr.nodeType === 1) {
                var tag = curr.tagName;
                var cls = curr.className;
                var clsStr = typeof cls === "string" ? cls : "";

                // Message body prose containers: block single-word translation unless directly in a button
                if (clsStr && (
                    clsStr.indexOf("markdown-body") !== -1 ||
                    clsStr.indexOf("prose") !== -1 ||
                    clsStr.indexOf("chat-message-content") !== -1 ||
                    clsStr.indexOf("conversation-turn") !== -1
                )) {
                    if (tag === "BUTTON" || (typeof curr.getAttribute === "function" && curr.getAttribute("role") === "button")) {
                        return true;
                    }
                    return false;
                }

                if (tag === "BUTTON" || tag === "NAV" || tag === "LABEL" || tag === "LEGEND") {
                    return true;
                }
                if (typeof curr.getAttribute === "function") {
                    var role = curr.getAttribute("role");
                    if (role === "button" || role === "menuitem" || role === "menu" || role === "tab" ||
                        role === "tooltip" || role === "switch" || role === "status" || role === "option" ||
                        role === "dialog" || role === "navigation") {
                        return true;
                    }
                }
                if (clsStr && (
                    clsStr.indexOf("tooltip") !== -1 ||
                    clsStr.indexOf("menu") !== -1 ||
                    clsStr.indexOf("badge") !== -1 ||
                    clsStr.indexOf("setting") !== -1 ||
                    clsStr.indexOf("dialog") !== -1 ||
                    clsStr.indexOf("modal") !== -1 ||
                    clsStr.indexOf("header") !== -1 ||
                    clsStr.indexOf("sidebar") !== -1 ||
                    clsStr.indexOf("toolbar") !== -1 ||
                    clsStr.indexOf("status-bar") !== -1 ||
                    clsStr.indexOf("nav") !== -1
                )) {
                    return true;
                }
            }
            curr = curr.parentNode;
        }
        return false;
    }

    var HIGH_AMBIGUITY_SINGLE_WORDS = {
        "width": true, "height": true, "file": true, "changes": true,
        "open": true, "close": true, "default": true, "run": true, "new": true
    };

    function isExempt(text) {
        var exemptions = window.__ANTIGRAVITY_EXEMPTIONS__ || EXEMPTIONS;
        if (!Array.isArray(exemptions) || exemptions.length === 0) return false;
        for (var i = 0; i < exemptions.length; i++) {
            if (text.indexOf(exemptions[i]) !== -1) {
                return true;
            }
        }
        return false;
    }

    // 格式化英文动态时长
    function formatDuration(dur) {
        if (!dur) return "";
        return dur
            .replace(/(\d+)\s*days?,?\s*(\d+)\s*hours?/gi, "$1 天 $2 小时")
            .replace(/(\d+)\s*hours?,?\s*(\d+)\s*minutes?/gi, "$1 小时 $2 分钟")
            .replace(/(\d+)\s*minutes?,?\s*(\d+)\s*seconds?/gi, "$1 分钟 $2 秒")
            .replace(/(\d+)\s*days?/gi, "$1 天")
            .replace(/(\d+)\s*hours?/gi, "$1 小时")
            .replace(/(\d+)\s*minutes?/gi, "$1 分钟")
            .replace(/(\d+)\s*seconds?/gi, "$1 秒")
            .replace(/(\d+)\s*d(?![a-zA-Z])/gi, "$1 天")
            .replace(/(\d+)\s*h(?![a-zA-Z])/gi, "$1 小时")
            .replace(/(\d+)\s*m(?![a-zA-Z])/gi, "$1 分钟")
            .replace(/(\d+)\s*s(?![a-zA-Z])/gi, "$1 秒")
            .replace(/,\s*/g, " ")
            .trim();
    }

    // 6. Core Translation Resolver Engine
    function getTranslatedText(original, contextNode) {
        if (!original || typeof original !== "string") return null;
        var trimmed = original.trim();
        if (!trimmed) return null;
        if (isExempt(original)) return null;

        // 技术实体直接拦截，保护文件名、路径、CLI 命令与变量
        if (isTechnicalEntity(trimmed)) {
            return null;
        }

        var lead = original.match(/^\s*/)[0];
        var trail = original.match(/\s*$/)[0];

        // A. 上下文敏感词汇消歧：Usage
        if (trimmed === "Usage") {
            if (contextNode) {
                var curr = contextNode.nodeType === 3 ? contextNode.parentNode : contextNode;
                var isHeader = false;
                var chk = curr;
                for (var depth = 0; depth < 3 && chk; depth++) {
                    if (chk.tagName && /^H[1-6]$/i.test(chk.tagName)) {
                        isHeader = true;
                        break;
                    }
                    chk = chk.parentNode;
                }
                if (isHeader || (curr && curr.closest && (
                    curr.closest('section[aria-label="Readme"], .markdown, .prose, article') &&
                    !curr.closest('[class*="quota"], [class*="metric"], [class*="usage-card"]')
                ))) {
                    return lead + "使用说明" + trail;
                }
            }
            return lead + "用量" + trail;
        }

        // B. 动态滑动窗口与额度刷新文案匹配
        var mWeekly = trimmed.match(/^You have used some of your weekly limit, it will fully refresh in (.+?)\.?$/i);
        if (mWeekly) {
            return lead + "您已消耗了部分本周额度，将在 " + formatDuration(mWeekly[1]) + " 后完全刷新。" + trail;
        }
        var m5h = trimmed.match(/^You have used some of your 5-hour limit, it will fully refresh in (.+?)\.?$/i);
        if (m5h) {
            return lead + "您已消耗了部分 5 小时滑动窗口额度，将在 " + formatDuration(m5h[1]) + " 后完全刷新。" + trail;
        }
        var mReachWeekly = trimmed.match(/^You have reached your weekly limit, it will fully refresh in (.+?)\.?$/i);
        if (mReachWeekly) {
            return lead + "您已达到本周额度上限，将在 " + formatDuration(mReachWeekly[1]) + " 后完全刷新。" + trail;
        }
        var mReach5h = trimmed.match(/^You have reached your 5-hour limit, it will fully refresh in (.+?)\.?$/i);
        if (mReach5h) {
            return lead + "您已达到 5 小时滑动窗口额度上限，将在 " + formatDuration(mReach5h[1]) + " 后完全刷新。" + trail;
        }

        // C. 动态剩余百分比与重置时间
        if (trimmed === "% left" || trimmed === "%left") {
            return lead + "% 剩余" + trail;
        }
        var mLeft = trimmed.match(/^(\d+(?:\.\d+)?)%\s*left$/i);
        if (mLeft) {
            return lead + mLeft[1] + "% 剩余" + trail;
        }
        var mNumLeft = trimmed.match(/^(\d+)\s*left$/i);
        if (mNumLeft) {
            return lead + "剩余 " + mNumLeft[1] + trail;
        }
        var mResetDH = trimmed.match(/^Resets in\s+(\d+)d\s+(\d+)h$/i);
        if (mResetDH) {
            return lead + mResetDH[1] + "天" + mResetDH[2] + "小时后重置" + trail;
        }
        var mResetHM = trimmed.match(/^Resets in\s+(\d+)h\s+(\d+)m$/i);
        if (mResetHM) {
            return lead + mResetHM[1] + "小时" + mResetHM[2] + "分钟后重置" + trail;
        }
        var mResetGen = trimmed.match(/^Resets in\s+(.+)$/i);
        if (mResetGen) {
            return lead + formatDuration(mResetGen[1]) + "后重置" + trail;
        }

        // C2. 相对时间识别 (如 19m ago, 2h ago, 5s ago, just now 等)
        if (trimmed === "now" || trimmed === "just now") {
            return lead + "刚刚" + trail;
        }
        if (trimmed === "yesterday") {
            return lead + "昨天" + trail;
        }
        var mCompactTime = trimmed.match(/^(\d+)\s*(s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|wk|wks|week|weeks|mo|mon|mons|month|months|y|yr|yrs|year|years)(?:\s+ago)?$/i);
        if (mCompactTime) {
            var num = mCompactTime[1];
            var u = mCompactTime[2].toLowerCase();
            var unitZh = "";
            if (u === "s" || u.startsWith("sec")) unitZh = "秒前";
            else if (u === "m" || u.startsWith("min")) unitZh = "分钟前";
            else if (u === "h" || u.startsWith("hr") || u.startsWith("hour")) unitZh = "小时前";
            else if (u === "d" || u.startsWith("day")) unitZh = "天前";
            else if (u === "w" || u.startsWith("wk") || u.startsWith("week")) unitZh = "周前";
            else if (u === "mo" || u.startsWith("mon") || u.startsWith("month")) unitZh = "个月前";
            else if (u === "y" || u.startsWith("yr") || u.startsWith("year")) unitZh = "年前";
            if (unitZh) {
                return lead + num + " " + unitZh + trail;
            }
        }

        // C3. 语音对话状态与提示词拦截 (严谨区分 Started / Stopped / Ended)
        var mVoiceChat = trimmed.match(/^(Started|Stopped|Ended)\s+voice\s+chat(?:\s*([·\.\u00b7\-–—])\s*(.+))?$/i);
        if (mVoiceChat) {
            var act = mVoiceChat[1].toLowerCase();
            var actZh = (act === "started") ? "已开启语音对话" : "已结束语音对话";
            var sep = mVoiceChat[2] || "·";
            var timePart = mVoiceChat[3] ? (" " + sep + " " + mVoiceChat[3]) : "";
            return lead + actZh + timePart + trail;
        }

        // C4. 语速浮层与气泡拦截
        var mVoiceSpeedX = trimmed.match(/^Voice\s+speed,?\s*([\d\.]+)x$/i);
        if (mVoiceSpeedX) {
            return lead + "语速：" + mVoiceSpeedX[1] + "x" + trail;
        }

        // C5. 麦克风与快捷键气泡拦截
        var mMuteWithKey = trimmed.match(/^(Mute|Unmute)\s+mic(?:\s*(\([^)]+\)))?$/i);
        if (mMuteWithKey) {
            var isMute = mMuteWithKey[1].toLowerCase() === "mute";
            var mZh = isMute ? "静音麦克风" : "取消麦克风静音";
            var keyPart = mMuteWithKey[2] ? (" " + mMuteWithKey[2]) : "";
            return lead + mZh + keyPart + trail;
        }

        // C6. 带图标符号的前置操作按钮 (✕ End, × End 等)
        var mIconAction = trimmed.match(/^([✕×x\u2715\u00d7]\s*)(End|Stop|Cancel|Close)$/i);
        if (mIconAction) {
            var actionLower = mIconAction[2].toLowerCase();
            var actionZh = actionLower === "end" ? "结束" : (actionLower === "stop" ? "停止" : (actionLower === "cancel" ? "取消" : "关闭"));
            return lead + mIconAction[1] + actionZh + trail;
        }

        // C8. 编辑状态括号标注正则
        var mEdits = trimmed.match(/^(.+?)\s*\((all\s+agent\s+edits|all\s+edits|agent\s+edits|user\s+edits)\)$/i);
        if (mEdits) {
            var prefix = mEdits[1];
            var editType = mEdits[2].toLowerCase();
            var editZh = editType.indexOf("user") !== -1 ? "(用户编辑)" : "(所有智能体编辑)";
            var tPrefix = getTranslatedText(prefix, contextNode) || prefix;
            return lead + tPrefix + " " + editZh + trail;
        }

        // C11. 方案名称精准拦截 (收紧长度与字符集，杜绝误伤包含谓词的英文聊天长句)
        var mPlan = trimmed.match(/^Your\s+plan:\s*([A-Za-z0-9\s\+\-\.]+?)$/i);
        if (mPlan && mPlan[1].length <= 35 && !/\b(failed|refactor|database|error|bug|issue|task)\b/i.test(mPlan[1])) {
            var pName = mPlan[1].trim();
            var exactMapQuick = window.__ANTIGRAVITY_EXACT__ || EXACT;
            var tPName = exactMapQuick[pName] || pName;
            return lead + "当前方案：" + tPName + trail;
        }

        // C12. 运行状态禁用提示正则 (严格限制受控词集)
        var mCannotChange = trimmed.match(/^(Model|Permissions?|Workspace|Settings?)\s+cannot\s+be\s+changed\s+while\s+(?:the\s+)?agent\s+is\s+running\.?$/i);
        if (mCannotChange) {
            var subject = mCannotChange[1];
            var tSubject = /^Model$/i.test(subject) ? "模型" : (/^Permissions?$/i.test(subject) ? "权限设置" : (/^Workspace$/i.test(subject) ? "工作区" : "设置"));
            return lead + "智能体运行过程中无法更改" + tSubject + trail;
        }

        var exactMap = window.__ANTIGRAVITY_EXACT__ || EXACT;
        var regexList = window.__ANTIGRAVITY_REGEX_RULES__ || REGEX_RULES;

        // 单英文单词闸门与正文流隔离检测
        var isSingleWord = (trimmed.indexOf(" ") === -1 && trimmed.indexOf("\t") === -1 && trimmed.indexOf("\n") === -1);
        var isIsolatedStateWord = /^(Working\.\.\.|Analyzed|Thinking\.\.\.|Live|Active|Waiting|Killed|Retired|Done|Blocked|Stuck|Running|Paused|Moving|Connecting|Connected|Offline|Online)$/i.test(trimmed);

        var inProse = contextNode !== null && isInsideProseFlow(contextNode);

        // 策略1：若处于普通正文流中，绝不翻译任何纯单字（除非明确孤立状态词）
        if (inProse && isSingleWord && !isIsolatedStateWord) {
            return null;
        }

        // D. 精确查表
        if (exactMap[trimmed] !== undefined) {
            // 若为高歧义参数单字 (width, height, file, changes, open, close, default, run, new)，在正文流外仍须处于 UI 控制上下文
            if (isSingleWord && !isIsolatedStateWord) {
                var lowerWord = trimmed.toLowerCase();
                if (HIGH_AMBIGUITY_SINGLE_WORDS[lowerWord]) {
                    if (contextNode !== null && !isInUIControlContext(contextNode)) {
                        return null;
                    }
                }
            }
            return lead + exactMap[trimmed] + trail;
        }

        // D2. 空白折叠规范化查表 (针对长文案或换行)
        var collapsed = trimmed.replace(/\s+/g, " ");
        if (exactMap[collapsed] !== undefined) {
            return lead + exactMap[collapsed] + trail;
        }

        // D3. 小写自愈查表 (仅在正文流外部且处于 UI 控制上下文或原生菜单放行)
        if (!inProse && (contextNode === null || isInUIControlContext(contextNode))) {
            var lowerKey = trimmed.toLowerCase();
            if (exactMap[lowerKey] !== undefined) {
                return lead + exactMap[lowerKey] + trail;
            }
            var lowerCollapsed = collapsed.toLowerCase();
            if (exactMap[lowerCollapsed] !== undefined) {
                return lead + exactMap[lowerCollapsed] + trail;
            }
        }

        // D4. 快捷键浮动操作按钮正则 (仅匹配单键或组合键如 Comment C / Quote Ctrl+L)
        var mActKey = trimmed.match(/^(Comment|Quote|Copy|Edit)\s+([A-Z0-9]|Ctrl\+[A-Za-z0-9]|Cmd\+[A-Za-z0-9]|Alt\+[A-Za-z0-9]|Shift\+[A-Za-z0-9])$/i);
        if (mActKey) {
            var actKeyLower = mActKey[1].toLowerCase();
            var actZhKey = actKeyLower === "comment" ? "评论" : (actKeyLower === "quote" ? "引用" : (actKeyLower === "copy" ? "复制" : "编辑"));
            return lead + actZhKey + " " + mActKey[2] + trail;
        }

        // E. 正则规则匹配 (长于 250 字符且不在 UI 控件内的长文直接跳过，保护 CPU)
        if (trimmed.length > 250 && !isInUIControlContext(contextNode)) {
            return null;
        }
        for (var i = 0; i < regexList.length; i++) {
            if (regexList[i].re.test(trimmed)) {
                var replaced = trimmed.replace(regexList[i].re, regexList[i].rep);
                return lead + replaced + trail;
            }
        }

        return null;
    }

    // 7. Text Node & Attribute Translation with Dual-Tracking WeakMap Snapshot
    function translateTextNode(textNode) {
        if (!textNode || textNode.nodeType !== 3) return;
        var currentVal = textNode.nodeValue;
        if (!currentVal || !currentVal.trim()) return;

        if (isInsideExcluded(textNode)) return;

        var origStore = window.__ANTIGRAVITY_ORIG_TEXT_STORE__;
        var rec = origStore.get(textNode);
        if (!rec) {
            rec = { orig: currentVal, lastZh: "" };
            origStore.set(textNode, rec);
        } else {
            // React 就地复用更新检查：当 DOM 文本既不是已翻译的中文，也不是初始英文时，更新为新英文
            if (currentVal !== rec.lastZh && currentVal !== rec.orig) {
                rec.orig = currentVal;
                rec.lastZh = "";
            }
        }

        var translated = getTranslatedText(rec.orig, textNode);
        if (translated !== null) {
            if (currentVal !== translated) {
                textNode.nodeValue = translated;
            }
            rec.lastZh = translated;
        } else if (rec.lastZh && currentVal === rec.lastZh) {
            // 热重载无损自愈：若新规则不再翻译该项，恢复无损原始英文
            textNode.nodeValue = rec.orig;
            rec.lastZh = "";
        }
    }

    var ATTRS_TO_TRANSLATE = [
        "placeholder",
        "data-placeholder",
        "title",
        "aria-label",
        "aria-description",
        "data-tooltip-content",
        "data-tooltip",
        "data-title"
    ];

    function translateElementAttributes(el) {
        if (!el || el.nodeType !== 1 || typeof el.getAttribute !== "function") return;
        var tag = el.tagName;
        if (tag === "SCRIPT" || tag === "STYLE") return;
        if (isInsideExcluded(el)) return;

        var origAttrStore = window.__ANTIGRAVITY_ORIG_ATTR_STORE__;
        var elAttrStore = origAttrStore.get(el);
        if (!elAttrStore) {
            elAttrStore = {};
            origAttrStore.set(el, elAttrStore);
        }

        var hasAttrFn = typeof el.hasAttribute === "function";
        for (var a = 0; a < ATTRS_TO_TRANSLATE.length; a++) {
            var attr = ATTRS_TO_TRANSLATE[a];
            var hasThisAttr = hasAttrFn ? el.hasAttribute(attr) : (el.getAttribute(attr) !== null);
            if (hasThisAttr) {
                var currentAttrVal = el.getAttribute(attr);
                if (!currentAttrVal || !currentAttrVal.trim()) continue;

                var attrRec = elAttrStore[attr];
                if (!attrRec) {
                    attrRec = { orig: currentAttrVal, lastZh: "" };
                    elAttrStore[attr] = attrRec;
                } else {
                    if (currentAttrVal !== attrRec.lastZh && currentAttrVal !== attrRec.orig) {
                        attrRec.orig = currentAttrVal;
                        attrRec.lastZh = "";
                    }
                }

                var tAttr = getTranslatedText(attrRec.orig, el);
                if (tAttr !== null) {
                    if (currentAttrVal !== tAttr) {
                        el.setAttribute(attr, tAttr);
                    }
                    attrRec.lastZh = tAttr;
                } else if (attrRec.lastZh && currentAttrVal === attrRec.lastZh) {
                    el.setAttribute(attr, attrRec.orig);
                    attrRec.lastZh = "";
                }
            }
        }
    }

    function translateSubtree(root) {
        if (!root) return;
        if (root.nodeType === 3) {
            translateTextNode(root);
            return;
        }
        if (root.nodeType === 1) {
            if (isInsideExcluded(root)) return;

            translateElementAttributes(root);

            var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
            var node;
            while ((node = walker.nextNode())) {
                translateTextNode(node);
            }

            if (typeof root.querySelectorAll === "function") {
                var elementsWithAttrs = root.querySelectorAll(
                    "[placeholder], [data-placeholder], [title], [aria-label], [aria-description], [data-tooltip-content], [data-tooltip], [data-title]"
                );
                for (var i = 0; i < elementsWithAttrs.length; i++) {
                    translateElementAttributes(elementsWithAttrs[i]);
                }
            }
        }
    }

    // 8. 144fps Lightweight Overlay Synchronization (Single rAF + 30ms Debounced)
    var overlayDebounceTimer = null;
    function scheduleActiveOverlays() {
        if (overlayDebounceTimer) return;
        overlayDebounceTimer = setTimeout(function () {
            overlayDebounceTimer = null;
            if (typeof requestAnimationFrame === "function") {
                requestAnimationFrame(syncActiveOverlays);
            } else {
                syncActiveOverlays();
            }
        }, 30);
    }

    function syncActiveOverlays() {
        // 仅精准扫描顶层 Portal 容器，彻底废除 [role="menuitem"] 与 [class*="overlay"] 等耗时全量选择器
        var popups = document.querySelectorAll(
            '[data-radix-popper-content-wrapper], [data-floating-ui-portal] > div, [data-testid="context-menu-popup"], [role="tooltip"], .monaco-hover'
        );
        for (var i = 0; i < popups.length; i++) {
            translateSubtree(popups[i]);
        }
    }

    // 9. Initial Full Page Translation & Lifecycle Hooks
    function translateWholePage() {
        var target = document.body || document.documentElement;
        if (target) {
            translateSubtree(target);
        }
        syncActiveOverlays();
    }
    window.__antigravity_translateWholePage = translateWholePage;

    translateWholePage();

    // Event hooks with unmount tracking
    function addTrackedListener(target, eventName, handler, options) {
        target.addEventListener(eventName, handler, options);
        activeCleanups.push(function () {
            target.removeEventListener(eventName, handler, options);
        });
    }

    if (document.readyState === "loading") {
        addTrackedListener(document, "DOMContentLoaded", translateWholePage);
    }
    addTrackedListener(window, "load", translateWholePage);
    addTrackedListener(window, "popstate", function () {
        var tid = setTimeout(translateWholePage, 50);
        activeCleanups.push(function () { clearTimeout(tid); });
    });
    addTrackedListener(window, "hashchange", function () {
        var tid = setTimeout(translateWholePage, 50);
        activeCleanups.push(function () { clearTimeout(tid); });
    });

    // Progressive lightweight scans for React initial async rendering
    var scanDelays = [80, 400];
    for (var k = 0; k < scanDelays.length; k++) {
        (function (delay) {
            var tid = setTimeout(translateWholePage, delay);
            activeCleanups.push(function () {
                clearTimeout(tid);
            });
        })(scanDelays[k]);
    }

    // 交互触发轻量同步 (彻底消灭 mousedown/pointerdown 连发，仅保留轻量安全事件)
    addTrackedListener(document, "click", scheduleActiveOverlays, true);
    addTrackedListener(document, "contextmenu", scheduleActiveOverlays, true);
    addTrackedListener(document, "keydown", function (e) {
        if (e.key === "Enter" || e.key === "Escape" || e.key === "ArrowDown" || e.key === "ArrowUp") {
            scheduleActiveOverlays();
        }
    }, true);

    // 悬停感知：当指针移入按钮、菜单项或 Tooltip 触发源（支持包含内部 svg/icon 子节点）时进行 50ms 极轻防抖同步
    var hoverDebounceTimer = null;
    addTrackedListener(document, "mouseover", function (e) {
        var t = e.target;
        if (!t) return;
        if (typeof t.closest === "function" && t.closest('button, [role="button"], [role="tooltip"], [role="menuitem"], [data-state]')) {
            if (hoverDebounceTimer) clearTimeout(hoverDebounceTimer);
            hoverDebounceTimer = setTimeout(scheduleActiveOverlays, 50);
        }
    }, { passive: true, capture: true });

    // 10. High-Performance Global MutationObserver (childList only, 0-DOM-Query Fast Path)
    var isTranslating = false;
    var observer = new MutationObserver(function (mutations) {
        if (isTranslating) return;
        isTranslating = true;
        try {
            for (var i = 0; i < mutations.length; i++) {
                var m = mutations[i];
                if (m.type === "childList") {
                    for (var j = 0; j < m.addedNodes.length; j++) {
                        var node = m.addedNodes[j];
                        if (node.nodeType === 3) {
                            translateTextNode(node);
                        } else if (node.nodeType === 1) {
                            translateSubtree(node);
                        }
                    }
                }
            }
        } finally {
            isTranslating = false;
        }
    });

    var rootToObserve = document.documentElement || document.body;
    if (rootToObserve) {
        observer.observe(rootToObserve, {
            childList: true,
            subtree: true
        });
        activeCleanups.push(function () {
            observer.disconnect();
        });
    }

    // 11. Global Self-Teardown Handler for Hot Script Reloading
    window.__antigravity_cleanup_i18n = function () {
        if (observer) {
            try { observer.disconnect(); } catch (e) {}
        }
        if (overlayDebounceTimer) {
            try { clearTimeout(overlayDebounceTimer); } catch (e) {}
            overlayDebounceTimer = null;
        }
        if (hoverDebounceTimer) {
            try { clearTimeout(hoverDebounceTimer); } catch (e) {}
            hoverDebounceTimer = null;
        }
        for (var c = 0; c < activeCleanups.length; c++) {
            try { activeCleanups[c](); } catch (e) {}
        }
        activeCleanups = [];
        console.log("[Antigravity i18n] Localization runner v" + RUNNER_VERSION + " successfully cleaned up.");
    };

    // 12. Loss-free Hot Reload Entry Point
    window.__antigravity_reload_i18n = function (newData) {
        if (!newData || typeof newData !== "object") return;
        try {
            var newExact = newData.exact || {};
            var newReverse = newData.reverse_map || {};
            var newRules = [];
            if (Array.isArray(newData.regex_rules)) {
                for (var i = 0; i < newData.regex_rules.length; i++) {
                    try {
                        newRules.push({
                            re: new RegExp(newData.regex_rules[i].pattern),
                            rep: newData.regex_rules[i].replacement
                        });
                    } catch (e) {}
                }
            }
            var newExemptions = newData.exemptions || [];

            window.__ANTIGRAVITY_EXACT__ = newExact;
            window.__ANTIGRAVITY_REVERSE_MAP__ = newReverse;
            window.__ANTIGRAVITY_REGEX_RULES__ = newRules;
            window.__ANTIGRAVITY_EXEMPTIONS__ = newExemptions;

            // 基于 WeakMap 中的原版英文快照进行 100% 无损重新评估与翻译
            translateWholePage();
            console.log("[Antigravity i18n Hot-Reload] Successfully reloaded dictionary and updated UI.");
        } catch (e) {
            console.error("[Antigravity i18n Hot-Reload] Reload error:", e);
        }
    };

    // 暴露核心方法
    window.__antigravity_getTranslatedText = getTranslatedText;
    window.__antigravity_translateWholePage = translateWholePage;

    console.log("[Antigravity i18n] Localization runner v4.0 (Zero-Distortion High-FPS Architecture) initialized.");
})();
