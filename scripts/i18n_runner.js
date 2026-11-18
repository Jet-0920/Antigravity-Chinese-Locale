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

    var RUNNER_VERSION = 2.4;
    if (window.__antigravity_runner_version && window.__antigravity_runner_version >= RUNNER_VERSION) {
        if (typeof window.__antigravity_translateWholePage === 'function') {
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
                if (EXCLUDED_TAGS[tag]) return true;
                if (curr.isContentEditable) return true;
                var cls = curr.className;
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
        connector: "连接器", connectors: "连接器", voice: "音色",
        steps: "步骤", step: "步骤", history: "历史", audit: "审查",
        subagent: "子智能体", subagents: "子智能体", workspace: "工作区",
        tool: "工具", tools: "工具", rule: "规则", rules: "规则",
        skill: "技能", skills: "技能", plugin: "插件", plugins: "插件",
        conversation: "会话", conversations: "会话", sort: "排序",
        group: "分组", filter: "筛选", sidebar: "侧边栏", pane: "面板",
        archive: "归档", unarchive: "取消归档", settings: "设置", setting: "设置",
        name: "名称", copy: "复制", rename: "重命名", pin: "置顶", unpin: "取消置顶",
        duplicate: "副本", path: "路径",
        edit: "编辑", title: "标题", titles: "标题",
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

        // C2. 简写相对时间
        if (trimmed === "now") {
            return lead + "刚刚" + trail;
        }
        var mCompactTime = trimmed.match(/^(\d+)\s*(s|m|h|d|w|mo|y)$/);
        if (mCompactTime) {
            var num = mCompactTime[1];
            var unit = mCompactTime[2];
            var unitMap = {
                "s": "秒前", "m": "分钟前", "h": "小时前",
                "d": "天前", "w": "周前", "mo": "个月前", "y": "年前"
            };
            if (unitMap[unit]) {
                return lead + num + unitMap[unit] + trail;
            }
        }

        var exactMap = window.__ANTIGRAVITY_EXACT__ || EXACT;
        var regexList = window.__ANTIGRAVITY_REGEX_RULES__ || REGEX_RULES;

        // D. 精确查表
        if (exactMap[trimmed]) {
            return lead + exactMap[trimmed] + trail;
        }

        // D2. 空白折叠规范化查表 (处理长句子、换行 \n 或连续空格段落)
        var collapsed = trimmed.replace(/\s+/g, " ");
        if (exactMap[collapsed]) {
            return lead + exactMap[collapsed] + trail;
        }

        // D3. 小写自愈查表
        var lowerKey = trimmed.toLowerCase();
        if (exactMap[lowerKey]) {
            return lead + exactMap[lowerKey] + trail;
        }
        var lowerCollapsed = collapsed.toLowerCase();
        if (exactMap[lowerCollapsed]) {
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
        var exactMap = window.__ANTIGRAVITY_EXACT__ || EXACT;
        var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
        var node;
        while ((node = walker.nextNode())) {
            var val = node.nodeValue;
            if (val && val.trim()) {
                var trimmed = val.trim();
                var translated = exactMap[trimmed] || exactMap[trimmed.toLowerCase()];
                if (translated && translated !== val) {
                    node.nodeValue = val.replace(trimmed, translated);
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
        var tips = document.querySelectorAll('[role="tooltip"], .compact-tooltip');
        for (var i = 0; i < tips.length; i++) {
            hookTooltipContainer(tips[i]);
            fastTranslateTooltip(tips[i]);
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
        syncCorrectTooltips();
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
    document.addEventListener("click", scheduleAutoHeal, true);
    document.addEventListener("pointerdown", scheduleAutoHeal, true);
    document.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === "Escape" || e.key === "ArrowDown" || e.key === "ArrowUp") {
            scheduleAutoHeal();
        }
    }, true);

    // 指针滑动与悬停双重捕获，实现 0ms 即时校准
    document.addEventListener("pointermove", syncCorrectTooltips, { passive: true, capture: true });
    document.addEventListener("mouseover", syncCorrectTooltips, { passive: true, capture: true });

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

    console.log("[Antigravity i18n] Localization runner v2.4 successfully initialized and active.");
})();
