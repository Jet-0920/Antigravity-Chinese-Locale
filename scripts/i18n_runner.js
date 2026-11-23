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
    window.__ANTIGRAVITY_EXACT__ = Object.assign(window.__ANTIGRAVITY_EXACT__ || {}, EXACT);
    window.__ANTIGRAVITY_REVERSE_MAP__ = Object.assign(window.__ANTIGRAVITY_REVERSE_MAP__ || {}, REVERSE_MAP);
    window.__ANTIGRAVITY_REGEX_RULES__ = REGEX_RULES;
    window.__ANTIGRAVITY_EXEMPTIONS__ = EXEMPTIONS;

    var RUNNER_VERSION = 2.9;
    if (window.__antigravity_runner_version && window.__antigravity_runner_version >= RUNNER_VERSION) {
        if (typeof window.__antigravity_reload_i18n === 'function') {
            window.__antigravity_reload_i18n(data);
        } else if (typeof window.__antigravity_translateWholePage === 'function') {
            window.__antigravity_translateWholePage();
        }
        return;
    }
    window.__antigravity_runner_version = RUNNER_VERSION;
    window.__antigravity_i18n_runner_active = true;

    // 1. Controlled Component Reverse Map Hook (Protects Base UI / Radix Select states)
    if (!window.__antigravity_map_hooked) {
        window.__antigravity_map_hooked = true;
        var origHas = Map.prototype.has;
        var origGet = Map.prototype.get;

        Map.prototype.has = function (key) {
            if (origHas.call(this, key)) return true;
            var rev = window.__ANTIGRAVITY_REVERSE_MAP__ || REVERSE_MAP;
            if (typeof key === "string" && rev[key]) {
                return origHas.call(this, rev[key]);
            }
            return false;
        };

        Map.prototype.get = function (key) {
            var val = origGet.call(this, key);
            if (val !== undefined) return val;
            var rev = window.__ANTIGRAVITY_REVERSE_MAP__ || REVERSE_MAP;
            if (typeof key === "string" && rev[key]) {
                return origGet.call(this, rev[key]);
            }
            return undefined;
        };
    }

    // 2. Isolation & Exemption Checks
    var EXCLUDED_TAGS = {
        "SCRIPT": true,
        "STYLE": true,
        "PRE": true,
        "CODE": true,
        "TEXTAREA": true
    };

    function isInsideExcluded(node) {
        var curr = node;
        while (curr && curr !== document.body && curr !== document.documentElement) {
            if (curr.nodeType === 1) {
                var tag = curr.tagName;
                // 若当前节点或其父级是按钮或明确的 UI 控制控件（如代码块右上角的复制按钮），绝不排除
                if (tag === "BUTTON" || (curr.getAttribute && curr.getAttribute("role") === "button")) {
                    return false;
                }
                var cls = curr.className;
                if (typeof cls === "string" && (
                    cls.indexOf("copy") !== -1 ||
                    cls.indexOf("overlay") !== -1 ||
                    cls.indexOf("popup") !== -1 ||
                    cls.indexOf("tooltip") !== -1
                )) {
                    return false;
                }
                if (EXCLUDED_TAGS[tag]) return true;
                if (curr.isContentEditable) return true;
                if (typeof cls === "string" && (
                    cls.indexOf("monaco-editor") !== -1 ||
                    cls.indexOf("token") !== -1 ||
                    cls.indexOf("syntax") !== -1
                )) {
                    return true;
                }
            }
            curr = curr.parentNode;
        }
        return false;
    }

    function isExempt(text) {
        var exemptions = window.__ANTIGRAVITY_EXEMPTIONS__ || EXEMPTIONS;
        for (var i = 0; i < exemptions.length; i++) {
            if (text.indexOf(exemptions[i]) !== -1) {
                return true;
            }
        }
        return false;
    }

    // 辅助格式化英文动态时长
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

    // F. 侧边栏与高频开发场景智能短语自动汉化引擎 (Phrase Auto-Translator)
    var SIDEBAR_VOCAB = {
        review: "审查", check: "检查", setup: "配置", initialize: "初始化", init: "初始化",
        create: "创建", build: "构建", generate: "生成", make: "制作", debug: "调试",
        debugging: "调试", fix: "修复", resolve: "解决", analyze: "分析", analysis: "分析",
        explore: "探索", exploration: "探索", optimize: "优化", optimization: "优化",
        refactor: "重构", refactoring: "重构", test: "测试", testing: "测试",
        deploy: "部署", deployment: "部署", update: "更新", upgrade: "升级",
        install: "安装", installation: "安装", configure: "配置", configuration: "配置",
        migrate: "迁移", migration: "迁移", study: "学习", learn: "学习",
        guide: "指南", tutorial: "教程", inquire: "咨询", inquiry: "咨询",
        consult: "咨询", consultation: "咨询", summarize: "总结", summary: "总结",
        prepare: "准备", preparation: "准备", replicate: "复现", replication: "复现",
        sunset: "下线", farewell: "致别", folder: "文件夹", directory: "目录",
        contents: "内容", content: "内容", file: "文件", files: "文件",
        document: "文档", documents: "文档", doc: "文档", docs: "文档",
        code: "代码", codebase: "代码库", repo: "仓库", repository: "仓库",
        assistant: "助手", agent: "智能体", bot: "机器人", model: "模型",
        prompt: "提示词", context: "上下文", project: "项目", task: "任务",
        tasks: "任务", workflow: "工作流", error: "错误", errors: "错误",
        bug: "缺陷", bugs: "缺陷", issue: "问题", issues: "问题",
        restriction: "限制", location: "区域", region: "区域", network: "网络",
        paper: "论文", ppt: "PPT", slide: "幻灯片", slides: "幻灯片",
        course: "课程", homework: "作业", exam: "考试", database: "数据库",
        server: "服务端", client: "客户端", management: "管理", script: "脚本",
        production: "生产环境", memory: "内存", leak: "泄漏", data: "数据",
        state: "状态", bayesian: "贝叶斯", claude: "Claude", gemini: "Gemini",
        docker: "Docker", compose: "Compose", react: "React", vue: "Vue",
        python: "Python", node: "Node", git: "Git", github: "GitHub",
        api: "API", sdk: "SDK", cli: "CLI", ui: "UI",
        in: "在", and: "与", for: "的", with: "带", to: "到",
        now: "刚刚", today: "今天", yesterday: "昨天",
        checkout: "检出", worktree: "工作树", verbose: "详细",
        connector: "连接器", connectors: "连接器", voice: "音色", speed: "语速",
        steps: "步骤", step: "步骤", history: "历史", audit: "审查",
        subagent: "子智能体", subagents: "子智能体", workspace: "工作区",
        tool: "工具", tools: "工具", rule: "规则", rules: "规则",
        skill: "技能", skills: "技能", plugin: "插件", plugins: "插件",
        conversation: "会话", conversations: "会话", sort: "排序",
        group: "分组", filter: "筛选", sidebar: "侧边栏", pane: "面板",
        archive: "归档", unarchive: "取消归档", settings: "设置", setting: "设置",
        name: "名称", copy: "复制", rename: "重命名", pin: "置顶", unpin: "取消置顶",
        duplicate: "副本", path: "路径",
        quote: "引用", delete: "删除", edit: "编辑", title: "标题", titles: "标题",
        downloads: "下载", download: "下载", screenshot: "截图", external: "外部",
        forward: "前进", reload: "刷新", certificate: "证书", secure: "安全",
        stop: "停止", execution: "执行", record: "录制", audio: "音频",
        finishes: "完成", finish: "完成", working: "工作", queue: "排队", queued: "排队",
        pattern: "规则", deny: "禁止", allow: "允许", urls: "URL",
        trigger: "触发条件", scheduled: "定时计划", untitled: "未命名", instructions: "指令",
        budget: "预算", exceeded: "超出", breakdown: "明细", pointer: "指针",
        marketplace: "插件市场", publisher: "发布者", partner: "伙伴", official: "官方",
        overview: "概览", features: "特性", changelog: "日志", license: "许可"
    };

    function autoTranslateTitle(str, node) {
        if (!str || str.length < 3 || str.length > 70) return null;
        if (/[\u4e00-\u9fa5]/.test(str)) return null;

        var lowerStr = str.trim().toLowerCase();
        if (lowerStr === "voice speed") {
            return "语速";
        }

        var words = str.trim().split(/[\s_-]+/);
        if (words.length < 2 || words.length > 8) return null;

        var translatedParts = [];
        var matchedCount = 0;

        for (var i = 0; i < words.length; i++) {
            var raw = words[i];
            var lower = raw.toLowerCase();
            if (SIDEBAR_VOCAB[lower]) {
                translatedParts.push(SIDEBAR_VOCAB[lower]);
                matchedCount++;
            } else if (/^[A-Z0-9]+$/.test(raw)) {
                translatedParts.push(raw);
                matchedCount++;
            } else {
                translatedParts.push(raw);
            }
        }

        if (matchedCount / words.length >= 0.5) {
            return translatedParts.join(" ")
                .replace(/(\b[a-zA-Z0-9]+)\s+([\u4e00-\u9fa5])/g, "$1 $2")
                .replace(/([\u4e00-\u9fa5])\s+([\u4e00-\u9fa5])/g, "$1$2")
                .replace(/([\u4e00-\u9fa5])\s+([a-zA-Z0-9]+\b)/g, "$1 $2");
        }

        return null;
    }

    function getTranslatedText(original, contextNode) {
        var trimmed = original.trim();
        if (!trimmed) return null;
        if (isExempt(original)) return null;

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

        // B. 动态滑动窗口与额度刷新文案智能匹配
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

        // C. 动态剩余百分比与重置时间 (支持独立节点与组合节点)
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

        // C2. 相对时间智能识别 (支持 19m ago, 2h ago, 5s ago, 19m, just now 等全量变体)
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

        // C3. 语音对话状态与提示词正则拦截 (Started voice chat · 15:42 等)
        var mVoiceChat = trimmed.match(/^(Started|Stopped|Ended)\s+voice\s+chat(?:\s*([·\.\u00b7\-–—])\s*(.+))?$/i);
        if (mVoiceChat) {
            var act = mVoiceChat[1].toLowerCase();
            var actZh = (act === "started") ? "已开启语音对话" : "已结束语音对话";
            var sep = mVoiceChat[2] || "·";
            var timePart = mVoiceChat[3] ? (" " + sep + " " + mVoiceChat[3]) : "";
            return lead + actZh + timePart + trail;
        }

        // C4. 语速浮层与气泡正则拦截 (Voice speed, 1x / Voice speed 1.5x)
        var mVoiceSpeedX = trimmed.match(/^Voice\s+speed,?\s*([\d\.]+)x$/i);
        if (mVoiceSpeedX) {
            return lead + "语速：" + mVoiceSpeedX[1] + "x" + trail;
        }

        // C5. 麦克风与快捷键气泡正则拦截 (Mute mic (Alt+M) / Unmute mic (Alt+M))
        var mMuteWithKey = trimmed.match(/^(Mute|Unmute)\s+mic(?:\s*(\([^)]+\)))?$/i);
        if (mMuteWithKey) {
            var isMute = mMuteWithKey[1].toLowerCase() === "mute";
            var mZh = isMute ? "静音麦克风" : "取消麦克风静音";
            var keyPart = mMuteWithKey[2] ? (" " + mMuteWithKey[2]) : "";
            return lead + mZh + keyPart + trail;
        }

        // C6. 带图标符号的前置操作按钮 (如 ✕ End, × End 等)
        var mIconAction = trimmed.match(/^([✕×x\u2715\u00d7]\s*)(End|Stop|Cancel|Close)$/i);
        if (mIconAction) {
            var actionLower = mIconAction[2].toLowerCase();
            var actionZh = actionLower === "end" ? "结束" : (actionLower === "stop" ? "停止" : (actionLower === "cancel" ? "取消" : "关闭"));
            return lead + mIconAction[1] + actionZh + trail;
        }

        // C7. 语音面板组合词自愈 (如 音色 speed -> 音色 语速)
        if (/^音色\s+speed$/i.test(trimmed)) {
            return lead + "音色 语速" + trail;
        }

        // C8. 编辑状态括号标注正则 ( (all agent edits) 等)
        var mEdits = trimmed.match(/^(.+?)\s*\((all\s+agent\s+edits|all\s+edits|agent\s+edits|user\s+edits)\)$/i);
        if (mEdits) {
            var prefix = mEdits[1];
            var editType = mEdits[2].toLowerCase();
            var editZh = editType.indexOf("user") !== -1 ? "(用户编辑)" : "(所有智能体编辑)";
            var tPrefix = getTranslatedText(prefix, contextNode) || prefix;
            return lead + tPrefix + " " + editZh + trail;
        }

        // C9. 快捷键浮动操作按钮正则 (Comment C / Quote Ctrl+L)
        var mActKey = trimmed.match(/^(Comment|Quote|Copy|Edit)\s+([A-Za-z0-9\+\-]+)$/i);
        if (mActKey) {
            var act = mActKey[1].toLowerCase();
            var actZh = act === "comment" ? "评论" : (act === "quote" ? "引用" : (act === "copy" ? "复制" : "编辑"));
            return lead + actZh + " " + mActKey[2] + trail;
        }

        // C10. 半汉化自愈 (如 "下载 File" -> "下载文件")
        if (/^下载\s+file$/i.test(trimmed)) {
            return lead + "下载文件" + trail;
        }

        var exactMap = window.__ANTIGRAVITY_EXACT__ || EXACT;
        var regexList = window.__ANTIGRAVITY_REGEX_RULES__ || REGEX_RULES;

        // D. 精确查表
        if (exactMap[trimmed] !== undefined) {
            return lead + exactMap[trimmed] + trail;
        }

        // D2. 空白折叠规范化查表 (处理长句子、换行 \n 或连续空格段落)
        var collapsed = trimmed.replace(/\s+/g, " ");
        if (exactMap[collapsed] !== undefined) {
            return lead + exactMap[collapsed] + trail;
        }

        // D3. 小写自愈查表
        var lowerKey = trimmed.toLowerCase();
        if (exactMap[lowerKey] !== undefined) {
            return lead + exactMap[lowerKey] + trail;
        }
        var lowerCollapsed = collapsed.toLowerCase();
        if (exactMap[lowerCollapsed] !== undefined) {
            return lead + exactMap[lowerCollapsed] + trail;
        }

        // E. 正则规则匹配
        for (var i = 0; i < regexList.length; i++) {
            if (regexList[i].re.test(trimmed)) {
                var replaced = trimmed.replace(regexList[i].re, regexList[i].rep);
                return lead + replaced + trail;
            }
        }

        // F. 启发式英文短语与会话标题兜底汉化
        var autoTitle = autoTranslateTitle(trimmed, contextNode);
        if (autoTitle !== null) {
            return lead + autoTitle + trail;
        }

        return null;
    }

    // 2.8 原生系统上下文菜单深度拦截 Hook (Native Context Menu Hook)
    function translateNativeItems(items) {
        if (!Array.isArray(items)) return;
        for (var i = 0; i < items.length; i++) {
            var it = items[i];
            if (!it) continue;
            if (typeof it.label === "string" && it.label) {
                var translated = getTranslatedText(it.label, null);
                if (translated) {
                    it.label = translated;
                }
            }
            if (Array.isArray(it.submenu)) {
                translateNativeItems(it.submenu);
            }
        }
    }

    function hookElectronNativeContextMenu() {
        try {
            if (window.electronNative && typeof window.electronNative.showContextMenu === "function" && !window.electronNative.__i18n_hooked) {
                window.electronNative.__i18n_hooked = true;
                var origShow = window.electronNative.showContextMenu;
                window.electronNative.showContextMenu = function (items) {
                    try {
                        if (Array.isArray(items)) {
                            translateNativeItems(items);
                        }
                    } catch (e) {
                        console.error("[Antigravity i18n] Error translating context menu items:", e);
                    }
                    return origShow.apply(this, arguments);
                };
            }
        } catch (e) {}
    }
    hookElectronNativeContextMenu();
    setInterval(hookElectronNativeContextMenu, 500);

    // 3. Node Translation Engine
    function translateTextNode(textNode) {
        if (!textNode || textNode.nodeType !== 3) return;
        var val = textNode.nodeValue;
        if (!val || !val.trim()) return;

        if (isInsideExcluded(textNode)) return;

        var translated = getTranslatedText(val, textNode);
        if (translated !== null && translated !== val) {
            textNode.nodeValue = translated;
        }
    }

    function translateElementAttributes(el) {
        if (!el || el.nodeType !== 1) return;
        var tag = el.tagName;
        if (tag === "SCRIPT" || tag === "STYLE") return;

        // placeholder (包括 textarea 和 input)
        if (el.hasAttribute("placeholder")) {
            var ph = el.getAttribute("placeholder");
            var tPh = getTranslatedText(ph, el);
            if (tPh !== null && tPh !== ph) el.setAttribute("placeholder", tPh);
        }
        // title
        if (el.hasAttribute("title")) {
            var tit = el.getAttribute("title");
            var tTit = getTranslatedText(tit, el);
            if (tTit !== null && tTit !== tit) el.setAttribute("title", tTit);
        }
        // aria-label
        if (el.hasAttribute("aria-label")) {
            var al = el.getAttribute("aria-label");
            var tAl = getTranslatedText(al, el);
            if (tAl !== null && tAl !== al) el.setAttribute("aria-label", tAl);
        }
        // data-tooltip-content
        if (el.hasAttribute("data-tooltip-content")) {
            var dtc = el.getAttribute("data-tooltip-content");
            var tDtc = getTranslatedText(dtc, el);
            if (tDtc !== null && tDtc !== dtc) el.setAttribute("data-tooltip-content", tDtc);
        }
        // data-placeholder
        if (el.hasAttribute("data-placeholder")) {
            var dph = el.getAttribute("data-placeholder");
            var tDph = getTranslatedText(dph, el);
            if (tDph !== null && tDph !== dph) el.setAttribute("data-placeholder", tDph);
        }
        // aria-description
        if (el.hasAttribute("aria-description")) {
            var ad = el.getAttribute("aria-description");
            var tAd = getTranslatedText(ad, el);
            if (tAd !== null && tAd !== ad) el.setAttribute("aria-description", tAd);
        }
        // data-tooltip
        if (el.hasAttribute("data-tooltip")) {
            var dt = el.getAttribute("data-tooltip");
            var tDt = getTranslatedText(dt, el);
            if (tDt !== null && tDt !== dt) el.setAttribute("data-tooltip", tDt);
        }
        // data-title
        if (el.hasAttribute("data-title")) {
            var dtit = el.getAttribute("data-title");
            var tDtit = getTranslatedText(dtit, el);
            if (tDtit !== null && tDtit !== dtit) el.setAttribute("data-title", tDtit);
        }
    }

    // 3.5 专属 Tooltip 毫秒级防漏自愈引擎（独立私有锁，绝不与主页面全局锁冲突）
    function fastTranslateTooltip(el) {
        if (!el) return;
        var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
        var node;
        while ((node = walker.nextNode())) {
            var val = node.nodeValue;
            if (val && val.trim()) {
                var translated = getTranslatedText(val, node);
                if (translated !== null && translated !== val) {
                    node.nodeValue = translated;
                }
            }
        }
    }

    function hookTooltipContainer(el) {
        if (!el || el.nodeType !== 1 || el.__antigravity_tooltip_hooked) return;
        el.__antigravity_tooltip_hooked = true;

        var isTooltipBusy = false;
        var obs = new MutationObserver(function () {
            if (isTooltipBusy) return;
            isTooltipBusy = true;
            try {
                fastTranslateTooltip(el);
            } finally {
                isTooltipBusy = false;
            }
        });

        obs.observe(el, {
            characterData: true,
            childList: true,
            subtree: true
        });

        fastTranslateTooltip(el);
    }

    function syncCorrectTooltips() {
        var tips = document.querySelectorAll('[role="tooltip"], .compact-tooltip, [class*="tooltip"], [data-tooltip], [data-radix-popper-content-wrapper], [data-floating-ui-portal] div');
        for (var i = 0; i < tips.length; i++) {
            hookTooltipContainer(tips[i]);
            fastTranslateTooltip(tips[i]);
        }
    }

    // 3.6 专属右键上下文菜单与浮动浮层毫秒级捕获引擎 (Context Menu & Overlay Engine)
    function fastTranslateOverlay(el) {
        if (!el) return;
        translateSubtree(el);
    }

    function hookOverlayContainer(el) {
        if (!el || el.nodeType !== 1 || el.__antigravity_overlay_hooked) return;
        el.__antigravity_overlay_hooked = true;

        var isOverlayBusy = false;
        var obs = new MutationObserver(function () {
            if (isOverlayBusy) return;
            isOverlayBusy = true;
            try {
                fastTranslateOverlay(el);
            } finally {
                isOverlayBusy = false;
            }
        });

        obs.observe(el, {
            characterData: true,
            childList: true,
            subtree: true
        });

        fastTranslateOverlay(el);
    }

    function syncCorrectOverlays() {
        // 全量侦测右键上下文菜单、Portal 浮层、弹出菜单项、弹窗
        var overlays = document.querySelectorAll(
            '[data-testid="context-menu-popup"], .agy-overlay, .agy-overlay-item, [role="menu"], [role="menuitem"], [role="dialog"], [data-radix-popper-content-wrapper], [data-floating-ui-portal]'
        );
        for (var i = 0; i < overlays.length; i++) {
            hookOverlayContainer(overlays[i]);
            fastTranslateOverlay(overlays[i]);
        }
        syncCorrectTooltips();
    }

    function translateSubtree(root) {
        if (!root) return;
        if (root.nodeType === 3) {
            translateTextNode(root);
            return;
        }
        if (root.nodeType === 1) {
            if (isInsideExcluded(root)) return;
            
            // 自动侦测并挂载 Tooltip 容器专属微型监听器
            if (root.getAttribute && (root.getAttribute("role") === "tooltip" || (root.className && typeof root.className === "string" && root.className.indexOf("tooltip") !== -1))) {
                hookTooltipContainer(root);
            }
            if (root.querySelectorAll) {
                var nestedTooltips = root.querySelectorAll('[role="tooltip"], .compact-tooltip');
                for (var nt = 0; nt < nestedTooltips.length; nt++) {
                    hookTooltipContainer(nestedTooltips[nt]);
                }
            }

            // 自动侦测右键上下文菜单与浮层容器
            if (root.getAttribute && (root.getAttribute("data-testid") === "context-menu-popup" || (root.className && typeof root.className === "string" && root.className.indexOf("agy-overlay") !== -1))) {
                hookOverlayContainer(root);
            }

            translateElementAttributes(root);
            var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
            var node;
            while ((node = walker.nextNode())) {
                translateTextNode(node);
            }
            var elementsWithAttrs = root.querySelectorAll("[placeholder], [data-placeholder], [title], [aria-label], [aria-description], [data-tooltip-content], [data-tooltip], [data-title]");
            for (var i = 0; i < elementsWithAttrs.length; i++) {
                translateElementAttributes(elementsWithAttrs[i]);
            }
        }
    }

    // 4. Initial Full Page Translation & Lifecycle Hooks
    function translateWholePage() {
        var target = document.body || document.documentElement;
        if (target) {
            translateSubtree(target);
        }
        syncCorrectOverlays();
    }
    window.__antigravity_translateWholePage = translateWholePage;

    translateWholePage();

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", translateWholePage);
    }
    window.addEventListener("load", translateWholePage);

    // SPA client-side routing triggers
    window.addEventListener("popstate", function() { setTimeout(translateWholePage, 50); });
    window.addEventListener("hashchange", function() { setTimeout(translateWholePage, 50); });

    // Progressive lightweight scans for React initial async rendering
    var scanDelays = [80, 400];
    for (var k = 0; k < scanDelays.length; k++) {
        setTimeout(translateWholePage, scanDelays[k]);
    }

    // User interaction auto-healing triggers (for modals, dropdowns, tab switches)
    var debounceTimer = null;
    function scheduleAutoHeal() {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
            translateWholePage();
        }, 50);
    }

    // 右键上下文菜单与浮层专属即时捕获触发器 (捕获阶段拦截，0ms/20ms/80ms/200ms 四级递进，确保 React Portal 动画与挂载 100% 捕获)
    function triggerOverlayHeal() {
        syncCorrectOverlays();
        if (typeof requestAnimationFrame === "function") {
            requestAnimationFrame(syncCorrectOverlays);
        }
        setTimeout(syncCorrectOverlays, 20);
        setTimeout(syncCorrectOverlays, 80);
        setTimeout(syncCorrectOverlays, 200);
    }

    document.addEventListener("contextmenu", triggerOverlayHeal, true);
    document.addEventListener("pointerdown", triggerOverlayHeal, true);
    document.addEventListener("mousedown", triggerOverlayHeal, true);
    document.addEventListener("click", triggerOverlayHeal, true);
    document.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === "Escape" || e.key === "ArrowDown" || e.key === "ArrowUp") {
            triggerOverlayHeal();
        }
    }, true);

    // 指针滑动与悬停双重捕获，实现 0ms 即时校准
    document.addEventListener("pointermove", syncCorrectOverlays, { passive: true, capture: true });
    document.addEventListener("mouseover", syncCorrectOverlays, { passive: true, capture: true });
    document.addEventListener("pointerenter", syncCorrectOverlays, { passive: true, capture: true });
    document.addEventListener("mouseenter", syncCorrectOverlays, { passive: true, capture: true });

    // 5. High-Performance MutationObserver (childList only, strictly prevents characterData recursion)
    var isTranslating = false;
    var observer = new MutationObserver(function (mutations) {
        if (isTranslating) return;
        isTranslating = true;
        try {
            for (var i = 0; i < mutations.length; i++) {
                var m = mutations[i];
                if (m.type === "childList") {
                    for (var j = 0; j < m.addedNodes.length; j++) {
                        translateSubtree(m.addedNodes[j]);
                    }
                }
            }
        } finally {
            isTranslating = false;
        }
    });

    function startObserving() {
        var root = document.documentElement || document.body;
        if (root) {
            observer.observe(root, {
                childList: true,
                subtree: true
            });
        } else {
            setTimeout(startObserving, 30);
        }
    }
    startObserving();

    /**
     * 闭环自愈平滑重译算法 (Heal and Re-translate DOM)
     * 利用 reverseMap 反查界面上已呈现的旧中文回英文，再匹配新词库就地热纠偏，实现 0 页面重载即时更新
     */
    function healAndReTranslateDOM(root, reverseMap, exactMap) {
        if (!root) return;
        try {
            var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
            var node;
            while ((node = walker.nextNode())) {
                var val = node.nodeValue;
                if (!val || !val.trim()) continue;
                var trimmed = val.trim();

                // 1. 若为旧中文，通过 reverseMap 反查出英文 Key
                var engKey = reverseMap[trimmed];
                if (engKey && exactMap[engKey]) {
                    var targetZh = exactMap[engKey];
                    if (targetZh !== trimmed) {
                        var lead = val.match(/^\s*/)[0];
                        var trail = val.match(/\s*$/)[0];
                        node.nodeValue = lead + targetZh + trail;
                    }
                } else if (exactMap[trimmed] && exactMap[trimmed] !== trimmed) {
                    // 2. 直接支持针对当前中文的纠偏映射（如 "音色 speed" -> "语速"）
                    var lead2 = val.match(/^\s*/)[0];
                    var trail2 = val.match(/\s*$/)[0];
                    node.nodeValue = lead2 + exactMap[trimmed] + trail2;
                }
            }

            // 同步就地纠偏属性
            var attrNodes = root.querySelectorAll("[placeholder], [title], [aria-label], [data-tooltip-content]");
            for (var i = 0; i < attrNodes.length; i++) {
                var el = attrNodes[i];
                var attrs = ["placeholder", "title", "aria-label", "data-tooltip-content"];
                for (var a = 0; a < attrs.length; a++) {
                    var attr = attrs[a];
                    if (el.hasAttribute(attr)) {
                        var attrVal = el.getAttribute(attr);
                        if (attrVal) {
                            var tAttr = attrVal.trim();
                            var eng = reverseMap[tAttr];
                            if (eng && exactMap[eng] && exactMap[eng] !== tAttr) {
                                el.setAttribute(attr, exactMap[eng]);
                            } else if (exactMap[tAttr] && exactMap[tAttr] !== tAttr) {
                                el.setAttribute(attr, exactMap[tAttr]);
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error("[Antigravity i18n] healAndReTranslateDOM error:", e);
        }
    }

    /**
     * 全局无感热重载入口函数 (0 页面刷新，0 状态丢失)
     */
    window.__antigravity_reload_i18n = function(newData) {
        if (!newData || typeof newData !== 'object') return;
        try {
            var oldExact = window.__ANTIGRAVITY_EXACT__ || {};
            var oldReverse = window.__ANTIGRAVITY_REVERSE_MAP__ || {};

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

            // 1. 原子更新核心全局存储
            window.__ANTIGRAVITY_EXACT__ = newExact;
            window.__ANTIGRAVITY_REGEX_RULES__ = newRules;
            window.__ANTIGRAVITY_EXEMPTIONS__ = newExemptions;

            // 2. 双向融合保留反向映射表（保留旧反向映射作为自愈桥梁）
            window.__ANTIGRAVITY_REVERSE_MAP__ = Object.assign({}, oldReverse, newReverse);

            // 3. 执行闭环自愈平滑重译与全页扫描
            healAndReTranslateDOM(document.body || document.documentElement, oldReverse, newExact);
            translateWholePage();

            console.log("[Antigravity i18n Hot-Reload] Successfully reloaded live dictionary and healed DOM.");
        } catch(e) {
            console.error("[Antigravity i18n Hot-Reload] Reload error:", e);
        }
    };

    // 暴露核心方法供主进程与外部调用
    window.__antigravity_getTranslatedText = getTranslatedText;
    window.__antigravity_translateWholePage = translateWholePage;
    window.__antigravity_healAndReTranslateDOM = healAndReTranslateDOM;

    console.log("[Antigravity i18n] Localization runner v2.9 successfully initialized and active.");
})();
