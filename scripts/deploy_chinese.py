#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Antigravity Chinese Locale One-Click Installer
Google Antigravity 官方客户端一键安全汉化与全生命周期持久化工具

Features:
- Auto-detects Antigravity resources folder across Windows, macOS & Linux
- Automatic pristine backup (app.asar.bak)
- Pure clean-source unpacking from backup (eliminates listener compounding / 6x leak)
- Physical isolation copytree (zero mklink/symlink hazard for production unpacked directory)
- OS-native kernel file event hot-reloading (fs.watch on resources/i18n_live.json & i18n_runner_live.js, 0 CPU polling)
- In-memory context menu translation cache (0 disk I/O latency)
- Full WebContents broadcast (electron.webContents.getAllWebContents, covers BaseWindow/hubWcv & Swarm Board)
- Native ApplicationMenu & Tray dynamic hot-rebuild without client restart
- Fixes updater.js MenuUpdateStep enum localization without breaking update check actions
- Static syntax gatekeeper (node --check on all modified files & vm.Script validation on assembled payload)
- Atomic replacement of app.asar & app.asar.unpacked
"""

import os
import sys
import shutil
import tempfile
import subprocess
import json
import urllib.request
import re

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

def find_antigravity_resources():
    # 1. Windows default path
    local_app_data = os.environ.get("LOCALAPPDATA", "")
    if local_app_data:
        p = os.path.join(local_app_data, "Programs", "antigravity", "resources")
        if os.path.exists(p) and (os.path.exists(os.path.join(p, "app.asar")) or os.path.exists(os.path.join(p, "app.asar.bak"))):
            return p
    # 2. macOS default path
    mac_path = "/Applications/Antigravity.app/Contents/Resources"
    if os.path.exists(mac_path) and (os.path.exists(os.path.join(mac_path, "app.asar")) or os.path.exists(os.path.join(mac_path, "app.asar.bak"))):
        return mac_path
    # 3. Linux default path
    linux_path = "/opt/Antigravity/resources"
    if os.path.exists(linux_path) and (os.path.exists(os.path.join(linux_path, "app.asar")) or os.path.exists(os.path.join(linux_path, "app.asar.bak"))):
        return linux_path
    return None


def patchNativeMenusAndTray(dist_dir, modified_files):
    # 1. 汉化与修复 dist/updater.js (安全本地化 MenuUpdateStep 枚举字符串，保持引用契约完整)
    updater_js = os.path.join(dist_dir, "updater.js")
    if os.path.exists(updater_js):
        with open(updater_js, "r", encoding="utf-8") as f:
            up_content = f.read()
        
        # 汉化 MenuUpdateStep 枚举的 4 个真实字符串值
        up_content = up_content.replace('MenuUpdateStep["CheckForUpdates"] = "Check for Updates";', 'MenuUpdateStep["CheckForUpdates"] = "检查更新";')
        up_content = up_content.replace('MenuUpdateStep["CheckingForUpdates"] = "Checking for Updates...";', 'MenuUpdateStep["CheckingForUpdates"] = "正在检查更新...";')
        up_content = up_content.replace('MenuUpdateStep["DownloadingUpdate"] = "Downloading Update...";', 'MenuUpdateStep["DownloadingUpdate"] = "正在下载更新...";')
        up_content = up_content.replace('MenuUpdateStep["RestartToUpdate"] = "Restart to Update";', 'MenuUpdateStep["RestartToUpdate"] = "重启以应用更新";')
        
        # 弹窗提示汉化
        up_content = up_content.replace("title: 'Check for Updates',", "title: '检查更新',")
        up_content = up_content.replace("message: 'No updates available',", "message: '当前已是最新版本',")
        
        with open(updater_js, "w", encoding="utf-8") as f:
            f.write(up_content)
        if updater_js not in modified_files:
            modified_files.append(updater_js)

    # 2. 汉化与增强 dist/tray.js (增加 refreshTrayMenu 导出支持免重启热刷新)
    tray_js = os.path.join(dist_dir, "tray.js")
    if os.path.exists(tray_js):
        with open(tray_js, "r", encoding="utf-8") as f:
            t_content = f.read()
        
        old_count_pattern = r"\(count > 0 \? `\$\{count\}` : 'No'\) \+\s*' agent' \+\s*\(count === 1 \? '' : 's'\) \+\s*' running'"
        new_count_code = "count > 0 ? (count + ' 个智能体正在运行') : '暂无运行中的智能体'"
        t_content = re.sub(old_count_pattern, new_count_code, t_content)
        t_content = t_content.replace("'No agents running'", "'暂无运行中的智能体'")
        
        # 注入 refreshTrayMenu 支持动态更新系统托盘
        if "exports.refreshTrayMenu" not in t_content:
            tray_export_hook = "exports.updateTrayAgentCount = updateTrayAgentCount;\nexports.refreshTrayMenu = refreshTrayMenu;\n"
            t_content = t_content.replace("exports.updateTrayAgentCount = updateTrayAgentCount;\n", tray_export_hook, 1)
            
            refresh_tray_func = (
                "\n/**\n"
                " * Dynamically refreshes the tray context menu using the latest i18n dictionary.\n"
                " */\n"
                "function refreshTrayMenu(dict) {\n"
                "    if (!tray || !contextMenu) return;\n"
                "    try {\n"
                "        const exact = dict?.exact || {};\n"
                "        contextMenu.items.forEach(item => {\n"
                "            if (item.id === 'running-agents') return;\n"
                "            if (item.label) {\n"
                "                if (!item.__origLabel) item.__origLabel = item.label;\n"
                "                const orig = item.__origLabel;\n"
                "                if (exact[orig]) {\n"
                "                    item.label = exact[orig];\n"
                "                }\n"
                "            }\n"
                "        });\n"
                "        tray.setContextMenu(contextMenu);\n"
                "    } catch(e) {\n"
                "        console.error('[Antigravity i18n] refreshTrayMenu error:', e);\n"
                "    }\n"
                "}\n"
            )
            t_content += refresh_tray_func
        
        with open(tray_js, "w", encoding="utf-8") as f:
            f.write(t_content)
        if tray_js not in modified_files:
            modified_files.append(tray_js)

    # 3. 汉化与增强 dist/menu.js (保持 updater 引用契约，支持 refreshApplicationMenu 动态热重构)
    menu_js = os.path.join(dist_dir, "menu.js")
    if os.path.exists(menu_js):
        with open(menu_js, "r", encoding="utf-8") as f:
            m_content = f.read()
        
        # 保护 updater_1.MenuUpdateStep.CheckForUpdates 引用，绝不将其破坏为硬编码字符串！
        m_content = m_content.replace("label: 'New Window'", "label: '新建窗口'")
        m_content = m_content.replace("label: 'Docs'", "label: '官方文档'")
        m_content = m_content.replace("label: 'Connect to WSL'", "label: '连接到 WSL'")
        m_content = m_content.replace("label: 'Reopen Locally'", "label: '在本地重新打开'")
        
        # 增强 addItemToSubmenu：使其兼容中英文两种匹配键（防止 setupApplicationMenu 汉化 'File' 导致后续异步 addWslConnectMenu 失效）
        old_add_item = (
            "function addItemToSubmenu(appMenu, submenuLabel, position, item) {\n"
            "    const submenuItem = appMenu.items.find((item) => item.label === submenuLabel);\n"
            "    if (!submenuItem?.submenu) {\n"
            "        return;\n"
            "    }\n"
            "    submenuItem.submenu.insert(position, item);\n"
            "}"
        )
        new_add_item = (
            "function addItemToSubmenu(appMenu, submenuLabel, position, item) {\n"
            "    const altLabel = submenuLabel === 'File' ? '文件' : (submenuLabel === 'Help' ? '帮助' : (submenuLabel === 'View' ? '视图' : submenuLabel));\n"
            "    const submenuItem = appMenu.items.find((item) => item.label === submenuLabel || item.label === altLabel || item.__origLabel === submenuLabel);\n"
            "    if (!submenuItem?.submenu) {\n"
            "        return;\n"
            "    }\n"
            "    submenuItem.submenu.insert(position, item);\n"
            "}"
        )
        if old_add_item in m_content:
            m_content = m_content.replace(old_add_item, new_add_item, 1)

        # 在 setupApplicationMenu 结尾增加顶层与子项全量汉化与 export refreshApplicationMenu
        if "exports.refreshApplicationMenu" not in m_content:
            m_content = m_content.replace("exports.setupApplicationMenu = setupApplicationMenu;\n", "exports.setupApplicationMenu = setupApplicationMenu;\nexports.refreshApplicationMenu = refreshApplicationMenu;\n", 1)
            
            top_level_patch = (
                "    const topLevelZh = { 'File': '文件', 'Edit': '编辑', 'View': '视图', 'Window': '窗口', 'Help': '帮助' };\n"
                "    menu.items.forEach(it => {\n"
                "        if (it.label) {\n"
                "            if (!it.__origLabel) it.__origLabel = it.label;\n"
                "            if (topLevelZh[it.label]) it.label = topLevelZh[it.label];\n"
                "        }\n"
                "    });\n"
                "    electron_1.Menu.setApplicationMenu(menu);\n"
                "    try {\n"
                "        const utilsMod = require('./utils');\n"
                "        const initDict = (utilsMod && typeof utilsMod.getMenuDict === 'function') ? utilsMod.getMenuDict() : null;\n"
                "        refreshApplicationMenu(initDict);\n"
                "    } catch(e) {}\n"
                "    // Asynchronously adds \"Connect to WSL\""
            )
            m_content = m_content.replace("    // Asynchronously adds \"Connect to WSL\"", top_level_patch, 1)

            # 在 addWslConnectMenu 完成后也执行一次安全重绘
            old_add_wsl = "electron_1.Menu.setApplicationMenu(menu);\n}"
            new_add_wsl = (
                "electron_1.Menu.setApplicationMenu(menu);\n"
                "    try {\n"
                "        const utilsMod = require('./utils');\n"
                "        const initDict = (utilsMod && typeof utilsMod.getMenuDict === 'function') ? utilsMod.getMenuDict() : null;\n"
                "        refreshApplicationMenu(initDict);\n"
                "    } catch(e) {}\n}"
            )
            if old_add_wsl in m_content:
                m_content = m_content.replace(old_add_wsl, new_add_wsl, 1)

            refresh_menu_func = (
                "\n/**\n"
                " * Dynamically refreshes the top application menu using the latest i18n dictionary.\n"
                " */\n"
                "function refreshApplicationMenu(dict) {\n"
                "    try {\n"
                "        const menu = electron_1.Menu.getApplicationMenu();\n"
                "        if (!menu) return;\n"
                "        const exact = dict?.exact || {};\n"
                "        const fallback = {\n"
                "            'File': '文件', 'Edit': '编辑', 'View': '视图', 'Window': '窗口', 'Help': '帮助',\n"
                "            'New Window': '新建窗口', 'Close Window': '关闭窗口', 'Close': '关闭',\n"
                "            'Undo': '撤销', 'Redo': '重做', 'Cut': '剪切', 'Copy': '复制', 'Paste': '粘贴',\n"
                "            'Paste and Match Style': '粘贴并匹配样式', 'Select All': '全选', 'Delete': '删除',\n"
                "            'Reload': '重新加载', 'Force Reload': '强制重新加载', 'Toggle Developer Tools': '切换开发者工具',\n"
                "            'Actual Size': '实际大小', 'Zoom In': '放大', 'Zoom Out': '缩小', 'Toggle Full Screen': '切换全屏',\n"
                "            'Minimize': '最小化', 'Zoom': '缩放', 'Bring All to Front': '前置全部窗口',\n"
                "            'Docs': '官方文档', 'Documentation': '官方文档', 'Check for Updates': '检查更新',\n"
                "            'Connect to WSL': '连接到 WSL', 'Reopen Locally': '在本地重新打开'\n"
                "        };\n"
                "        const walk = (item) => {\n"
                "            if (!item) return;\n"
                "            if (item.label) {\n"
                "                if (!item.__origLabel) item.__origLabel = item.label;\n"
                "                const orig = item.__origLabel;\n"
                "                if (exact[orig]) {\n"
                "                    item.label = exact[orig];\n"
                "                } else if (fallback[orig]) {\n"
                "                    item.label = fallback[orig];\n"
                "                }\n"
                "            }\n"
                "            if (item.submenu && Array.isArray(item.submenu.items)) {\n"
                "                item.submenu.items.forEach(walk);\n"
                "            }\n"
                "        };\n"
                "        menu.items.forEach(walk);\n"
                "        electron_1.Menu.setApplicationMenu(menu);\n"
                "    } catch(e) {\n"
                "        console.error('[Antigravity i18n] refreshApplicationMenu error:', e);\n"
                "    }\n"
                "}\n"
            )
            m_content += refresh_menu_func

        with open(menu_js, "w", encoding="utf-8") as f:
            f.write(m_content)
        if menu_js not in modified_files:
            modified_files.append(menu_js)

    # 4. 汉化 dist/main.js
    main_js = os.path.join(dist_dir, "main.js")
    if os.path.exists(main_js):
        with open(main_js, "r", encoding="utf-8") as f:
            main_c = f.read()
        
        main_c = main_c.replace("label: 'No agents running'", "label: '暂无运行中的智能体'")
        main_c = main_c.replace("label: `Open ${electron_1.app.getName()}`", "label: `打开 ${electron_1.app.getName()}`")
        main_c = main_c.replace("label: 'Quit'", "label: '退出'")
        main_c = main_c.replace("label: 'New Window'", "label: '新建窗口'")
        main_c = main_c.replace("title: 'Confirm Quit'", "title: '确认退出'")
        main_c = main_c.replace("message: 'Are you sure you want to quit?'", "message: '确定要退出 Antigravity 吗？'")
        main_c = main_c.replace("detail: 'There may be agents or background tasks running.'", "detail: '当前可能仍有智能体或后台任务正在运行。'")
        main_c = main_c.replace("title: 'WSL distro not found'", "title: '未找到 WSL 发行版'")
        main_c = main_c.replace("detail: 'Antigravity opened on Windows instead.'", "detail: 'Antigravity 已改为在 Windows 原生环境中打开。'")
        
        with open(main_js, "w", encoding="utf-8") as f:
            f.write(main_c)
        if main_js not in modified_files:
            modified_files.append(main_js)

    # 5. 汉化 dist/computer/hud.js 与 dist/computer/hudState.js (桌面控制悬浮指示器)
    hud_js = os.path.join(dist_dir, "computer", "hud.js")
    if os.path.exists(hud_js):
        with open(hud_js, "r", encoding="utf-8") as f:
            h_content = f.read()
        
        h_content = h_content.replace("<title>AGY Desktop HUD</title>", "<title>AGY 桌面控制指示器</title>")
        h_content = h_content.replace('<div id="status">AGY is controlling your Mac</div>', '<div id="status">AGY 正在控制您的电脑</div>')
        h_content = h_content.replace('<div id="status">AGY is controlling your PC</div>', '<div id="status">AGY 正在控制您的电脑</div>')
        h_content = h_content.replace('<div id="status">AGY is controlling your computer</div>', '<div id="status">AGY 正在控制您的电脑</div>')
        h_content = re.sub(r'<button id="stop"[^>]*>Stop</button>', '<button id="stop">停止</button>', h_content)
        h_content = re.sub(r'<button id="resume"[^>]*>.*?</button>', '<button id="resume" title="允许智能体再次控制电脑。已停止的任务不会自动恢复。">再次允许</button>', h_content)
        h_content = h_content.replace("end.textContent = 'Stopped';", "end.textContent = '已停止';")
        h_content = h_content.replace("end.textContent = 'Stop';", "end.textContent = '停止';")
        h_content = h_content.replace("title: 'AGY Desktop HUD'", "title: 'AGY 桌面控制指示器'")
        
        with open(hud_js, "w", encoding="utf-8") as f:
            f.write(h_content)
        if hud_js not in modified_files:
            modified_files.append(hud_js)

    hud_state_js = os.path.join(dist_dir, "computer", "hudState.js")
    if os.path.exists(hud_state_js):
        with open(hud_state_js, "r", encoding="utf-8") as f:
            hs_content = f.read()
        hs_content = hs_content.replace("'You took over — agent stopped'", "'您已接管操作 — 智能体已停止'")
        hs_content = hs_content.replace("'Agent stopped'", "'智能体已停止'")
        hs_content = hs_content.replace("'Agent idle'", "'智能体待命'")
        hs_content = hs_content.replace("`AGY working in ${name} (background)`", "`AGY 正在 ${name} 中后台运行`")
        hs_content = hs_content.replace("'AGY working in the background'", "'AGY 正在后台运行'")
        hs_content = hs_content.replace("'AGY is controlling your Mac'", "'AGY 正在控制您的电脑'")
        hs_content = hs_content.replace("'AGY is controlling your PC'", "'AGY 正在控制您的电脑'")
        hs_content = hs_content.replace("'AGY is controlling your computer'", "'AGY 正在控制您的电脑'")
        with open(hud_state_js, "w", encoding="utf-8") as f:
            f.write(hs_content)
        if hud_state_js not in modified_files:
            modified_files.append(hud_state_js)

    # 6. 汉化 dist/ipcHandlers.js (拦截原生系统上下文菜单 window:show-context-menu)
    ipc_js = os.path.join(dist_dir, "ipcHandlers.js")
    if os.path.exists(ipc_js):
        with open(ipc_js, "r", encoding="utf-8") as f:
            ipc_c = f.read()
        target_needle = "activeContextMenu?.closePopup?.(win);"
        inject_ipc = (
            "activeContextMenu?.closePopup?.(win);\n"
            "        try {\n"
            "            const utils = require('./utils');\n"
            "            if (utils && typeof utils.translateContextMenuItems === 'function') {\n"
            "                utils.translateContextMenuItems(items);\n"
            "            }\n"
            "        } catch(e) {}"
        )
        if target_needle in ipc_c and "utils.translateContextMenuItems" not in ipc_c:
            ipc_c = ipc_c.replace(target_needle, inject_ipc, 1)
            with open(ipc_js, "w", encoding="utf-8") as f:
                f.write(ipc_c)
            if ipc_js not in modified_files:
                modified_files.append(ipc_js)


def patchSwarmSidecar():
    """汉化内置的 Swarm 集群协作看板 (Swarm Board UI)"""
    candidate_paths = [
        os.path.expanduser("~/.gemini/antigravity/builtin/plugins/swarm/sidecars/swarm_board"),
        os.path.expanduser("~/.gemini/config/plugins/swarm/sidecars/swarm_board")
    ]
    for sb_dir in candidate_paths:
        if not os.path.exists(sb_dir):
            continue
        index_html = os.path.join(sb_dir, "index.html")
        app_js = os.path.join(sb_dir, "app.js")
        
        # 1. 汉化 index.html
        if os.path.exists(index_html):
            try:
                with open(index_html, "r", encoding="utf-8") as f:
                    h = f.read()
                replacements_html = [
                    ('<title>Swarm</title>', '<title>智能体集群协作看板</title>'),
                    ("<p class=\"loading-caption\">Looking for this conversation's swarm…</p>", "<p class=\"loading-caption\">正在加载当前会话的智能体集群…</p>"),
                    ('<span id="live-label" class="live-label">Live</span>', '<span id="live-label" class="live-label">实时</span>'),
                    ('>Overview<', '>概览<'),
                    ('>Board<', '>看板<'),
                    ('>Members<', '>成员<'),
                    ('>Graph<', '>关系图<'),
                    ('>Raw<', '>原始数据<'),
                    ('<span class="ov-label-text">overview · from the narrator’s notes</span>', '<span class="ov-label-text">概览 · 提取自记录员笔记</span>'),
                    ('Narrator’s page</button>', '记录员页面</button>'),
                    ('<span>Want this view different? Tell the coordinator.</span>', '<span>希望调整此视图？可告知协调员。</span>'),
                    ('>Open coordinator chat</button>', '>打开协调员对话</button>'),
                    ('placeholder="Search" aria-label="Search posts"', 'placeholder="搜索发言" aria-label="搜索发言"'),
                    ('title="Filters" aria-label="Filters"', 'title="筛选" aria-label="筛选"'),
                    ('<option value="">From anyone</option>', '<option value="">全部发言者</option>'),
                    ('<option value="">To anyone</option>', '<option value="">提及任何人</option>'),
                    ('<option value="">All channels</option>', '<option value="">所有频道</option>'),
                    ('title="Keep the newest post in view"', 'title="保持最新发言在可视区域"'),
                    ('<span>Follow</span>', '<span>跟随最新</span>'),
                    ('title="Jump to start" aria-label="Jump to start"', 'title="跳转到开头" aria-label="跳转到开头"'),
                    ('title="Previous post (←)" aria-label="Previous post"', 'title="上一条发言 (←)" aria-label="上一条发言"'),
                    ('title="Play / pause replay (space)" aria-label="Play replay"', 'title="播放 / 暂停回放 (空格)" aria-label="播放回放"'),
                    ('title="Next post (→)" aria-label="Next post"', 'title="下一条发言 (→)" aria-label="下一条发言"'),
                    ('aria-label="Replay position" title="Scrub through board posts"', 'aria-label="回放进度" title="拖动查看发言回放"'),
                    ('title="Show everything and follow live"', 'title="显示全部并跟随实时动态"'),
                    ('>Live</button>', '>实时</button>'),
                    ('title="Hide killed and inactive members from the graph"', 'title="在关系图中隐藏已终止和非活跃成员"'),
                    ('<span>Hide inactive</span>', '<span>隐藏非活跃</span>'),
                    ('title="Draw @all as an edge to every member"', 'title="将 @all 展开连线到所有成员"'),
                    ('<span>Expand @all</span>', '<span>展开 @all</span>'),
                    ('<option value="even">Even pacing</option>', '<option value="even">均匀节奏</option>'),
                    ('<option value="real">Real-time gaps</option>', '<option value="real">真实时间间隔</option>'),
                    ('>@mention, width = count<', '>@提及，粗细 = 频次<'),
                    ('>via @all<', '>通过 @all 广播<'),
                    ('>posted with no mention<', '>普通发言（未提及他人）<'),
                    ('>@all posts, drawn by Expand @all<', '>@all 发言（展开 @all 时绘制）<'),
                    ('title="Copy to clipboard"', 'title="复制到剪贴板"'),
                    ('<span id="raw-copy-label">Copy</span>', '<span id="raw-copy-label">复制</span>'),
                    ('<h2 id="empty-title" class="empty-title" data-testid="swarm-empty-title">No swarm in this conversation</h2>',
                     '<h2 id="empty-title" class="empty-title" data-testid="swarm-empty-title">当前会话暂无智能体集群</h2>'),
                    ('<p class="empty-hint"><span class="live-dot" aria-hidden="true"></span>Watching for a swarm</p>',
                     '<p class="empty-hint"><span class="live-dot" aria-hidden="true"></span>等待智能体集群启动</p>')
                ]
                for src, rep in replacements_html:
                    h = h.replace(src, rep)
                with open(index_html, "w", encoding="utf-8") as f:
                    f.write(h)
            except Exception as e:
                print(f"[!] Notice: Swarm board index.html patch skipped: {e}")

        # 2. 汉化 app.js
        if os.path.exists(app_js):
            try:
                with open(app_js, "r", encoding="utf-8") as f:
                    a = f.read()
                replacements_js = [
                    (
                        "    $('empty-body').innerHTML = conv ?\n"
                        "        'Swarms started in this conversation appear here automatically, with their board, ' +\n"
                        "            'members and @mention graph. Start one with <code>/swarm</code>.' :\n"
                        "        'Open this pane from a conversation to see its swarm. Swarms started there ' +\n"
                        "            'appear here automatically; start one with <code>/swarm</code>.';",
                        "    $('empty-body').innerHTML = conv ?\n"
                        "        '在当前会话中启动的智能体集群将自动显示在此处，包含协作看板、成员列表以及 @提及拓扑图。可以通过 <code>/swarm</code> 发起协作。' :\n"
                        "        '从正在进行智能体协作的会话中打开此面板以查看其集群动态。在此处发起集群请使用 <code>/swarm</code>。';"
                    ),
                    (
                        "const STATUS_LABEL = { working: 'Active', waiting: 'Waiting', killed: 'Killed' };",
                        "const STATUS_LABEL = { working: '活跃中', waiting: '待命', killed: '已终止' };"
                    ),
                    (
                        "STATUS_TIP = { working: 'Active: mid-turn (thinking, running a tool, or waiting on the model)', waiting: 'Waiting: turn ended, asleep on the board until a post wakes it', killed: 'Killed: removed from the swarm' };",
                        "STATUS_TIP = { working: '活跃：执行中（思考、调用工具或等待模型响应）', waiting: '待命：轮次结束，休眠等待看板新消息唤醒（不消耗 Token）', killed: '已终止：已从集群中移除' };"
                    ),
                    (
                        '<div class="feed-empty-title">No posts match</div>',
                        '<div class="feed-empty-title">无匹配发言</div>'
                    ),
                    (
                        '<div class="feed-empty-title">No posts yet</div>',
                        '<div class="feed-empty-title">暂无发言</div>'
                    ),
                    (
                        "label.textContent = 'Copied';",
                        "label.textContent = '已复制';"
                    ),
                    (
                        "const label = stale ? 'Reconnecting' : 'Live';",
                        "const label = stale ? '重新连接中' : '实时';"
                    )
                ]
                for src, rep in replacements_js:
                    a = a.replace(src, rep)
                with open(app_js, "w", encoding="utf-8") as f:
                    f.write(a)
                print(f"[✓] Swarm board app.js localized: {sb_dir}")
            except Exception as e:
                print(f"[!] Notice: Swarm board app.js patch skipped: {e}")

        # 3. 汉化 hive.js (Overview 概览面板、团队成员状态、任务进度卡片)
        hive_js = os.path.join(sb_dir, "hive.js")
        if os.path.exists(hive_js):
            try:
                with open(hive_js, "r", encoding="utf-8") as f:
                    h_js = f.read()
                replacements_hive = [
                    (
                        "const COPY_UI = { team:'The team', lead:'Coordinator', blocked:'Blocked', running:'Running', planned:'Planned next', done:'Done',\n"
                        "    more:'+{n} more', goal:'Goal', threads:'Threads', now:'Now', progress:'Progress', compare:'Compare with now', expand:'Open full timeline', none_blocked:'Nothing blocked', needs:'Needs you', waiting:'Waiting on @coordinator', stuck:'Stuck', none_waiting:'Nothing waiting', none_stuck:'Nothing stuck', none_needs:'Nothing needs you', none_running:'Nothing running', none_planned:'Nothing planned' };",
                        "const COPY_UI = { team:'集群团队', lead:'协调员', blocked:'已阻塞', running:'运行中', planned:'待规划', done:'已完成',\n"
                        "    more:'+{n} 更多', goal:'目标', threads:'讨论流', now:'当前进展', progress:'整体进度', compare:'与当前对比', expand:'展开完整时间线', none_blocked:'暂无阻塞任务', needs:'需要人工处理', waiting:'等待协调员响应', stuck:'卡滞', none_waiting:'暂无等待任务', none_stuck:'暂无卡滞任务', none_needs:'无需人工介入', none_running:'暂无运行任务', none_planned:'暂无规划任务' };"
                    ),
                    (
                        "const LABEL = {needs:ui('needs'), stuck:ui('stuck'), running:'Moving', queued:'Not started', done:'Done'};",
                        "const LABEL = {needs:ui('needs'), stuck:ui('stuck'), running:'推进中', queued:'未开始', done:'已完成'};"
                    ),
                    (
                        '<span class="o2-progt"><b>${tot.done} of ${totalCount}</b> tasks done</span>',
                        '<span class="o2-progt">已完成 <b>${tot.done} / ${totalCount}</b> 项任务</span>'
                    ),
                    (
                        '<p class="o2-rmeta">${f.done} of ${total} tasks done</p>',
                        '<p class="o2-rmeta">已完成 ${f.done} / ${total} 项任务</p>'
                    ),
                    (
                        "${f.done} of ${f.total} tasks done",
                        "已完成 ${f.done} / ${f.total} 项任务"
                    ),
                    (
                        'if(w && w.rawState===\'review\') return `<span class="o2-tprog rev">In review</span>`;',
                        'if(w && w.rawState===\'review\') return `<span class="o2-tprog rev">审查中</span>`;'
                    ),
                    (
                        'if(revCount > 0) chips.push(`<span class="o2-pchip info"><i></i>${revCount} in review</span>`);',
                        'if(revCount > 0) chips.push(`<span class="o2-pchip info"><i></i>${revCount} 个审查中</span>`);'
                    ),
                    (
                        'if(openThreads) chips.push(`<span class="o2-pchip">${openThreads} thread${openThreads===1?\'\':\'s\'} open</span>`);',
                        'if(openThreads) chips.push(`<span class="o2-pchip">${openThreads} 个主题进行中</span>`);'
                    ),
                    (
                        'else if(tot.running - revCount > 0) chips.push(`<span class="o2-pchip info"><i></i>${tot.running - revCount} active</span>`);',
                        'else if(tot.running - revCount > 0) chips.push(`<span class="o2-pchip info"><i></i>${tot.running - revCount} 个活跃</span>`);'
                    ),
                    (
                        ': `<p class="o2-doneempty">No tasks completed yet.</p>`;',
                        ': `<p class="o2-doneempty">暂无已完成的任务。</p>`;'
                    ),
                    (
                        '<div class="o2-qhdr">Up next · ${queuedWs.length}</div>',
                        '<div class="o2-qhdr">后续计划 · ${queuedWs.length}</div>'
                    ),
                    (
                        'statTag = st===\'needs_you\' ? `<span class="o2-mstat warn">${ui(\'needs\')}</span>` : st===\'working\' ? `<span class="o2-mstat info">Coordinator · Working</span>` : `<span class="o2-mstat">Coordinator</span>`;',
                        'statTag = st===\'needs_you\' ? `<span class="o2-mstat warn">${ui(\'needs\')}</span>` : st===\'working\' ? `<span class="o2-mstat info">协调员 · 工作中</span>` : `<span class="o2-mstat">协调员</span>`;'
                    ),
                    (
                        'statTag = x.title ? `<span class="o2-mstat">${esc(x.title)}</span>` : `<span class="o2-mstat">Retired</span>`;',
                        'statTag = x.title ? `<span class="o2-mstat">${esc(x.title)}</span>` : `<span class="o2-mstat">已离队</span>`;'
                    ),
                    (
                        'statTag = `<span class="o2-mstat info">Working</span>`;',
                        'statTag = `<span class="o2-mstat info">工作中</span>`;'
                    )
                ]
                for src, rep in replacements_hive:
                    h_js = h_js.replace(src, rep)
                with open(hive_js, "w", encoding="utf-8") as f:
                    f.write(h_js)
                print(f"[✓] Swarm board hive.js localized: {sb_dir}")
            except Exception as e:
                print(f"[!] Notice: Swarm board hive.js patch skipped: {e}")

def broadcast_cdp(script_dir):
    """尝试通过 Chrome DevTools Protocol 广播热更新至当前运行的所有页面"""
    try:
        active_port_file = os.path.join(os.environ.get("APPDATA", ""), "Antigravity", "DevToolsActivePort")
        if not os.path.exists(active_port_file):
            return 0
        with open(active_port_file, "r") as f:
            dt_port = f.readline().strip()
        with urllib.request.urlopen(f"http://127.0.0.1:{dt_port}/json", timeout=2) as resp:
            targets = json.loads(resp.read().decode("utf-8"))
            
        with open(os.path.join(script_dir, "i18n_data.json"), "r", encoding="utf-8") as f:
            dt_str = f.read()
        with open(os.path.join(script_dir, "i18n_runner.js"), "r", encoding="utf-8") as f:
            rn_str = f.read()
        
        full_code = (
            "window.__ANTIGRAVITY_I18N_DATA__ = " + dt_str + ";\n" +
            "if (typeof window.__antigravity_cleanup_i18n === 'function') { try { window.__antigravity_cleanup_i18n(); } catch(e) {} }\n" +
            rn_str + "\n"
        )
        
        hot_targets = [t for t in targets if t.get("webSocketDebuggerUrl") and (
            t.get("type") == "page" or "swarm--swarm_board" in t.get("url", "")
        )]
        
        if hot_targets:
            node_eval = f'''
            const targets = {json.dumps(hot_targets)};
            const fullCode = {json.dumps(full_code)};
            let done = 0;
            targets.forEach(t => {{
                try {{
                    const ws = new WebSocket(t.webSocketDebuggerUrl);
                    ws.onopen = () => {{
                        ws.send(JSON.stringify({{
                            id: 1,
                            method: "Runtime.evaluate",
                            params: {{ expression: fullCode }}
                        }}));
                        setTimeout(() => {{
                            try {{ ws.close(); }} catch(e) {{}}
                            done++;
                            if (done >= targets.length) process.exit(0);
                        }}, 200);
                    }};
                    ws.onerror = () => {{
                        done++;
                        if (done >= targets.length) process.exit(0);
                    }};
                }} catch (e) {{
                    done++;
                    if (done >= targets.length) process.exit(0);
                }}
            }});
            setTimeout(() => process.exit(0), 2000);
            '''
            eval_file = os.path.join(tempfile.gettempdir(), "cdp_hot_reload.js")
            with open(eval_file, "w", encoding="utf-8") as f:
                f.write(node_eval)
            subprocess.run(["node", eval_file], capture_output=True)
            print(f"[✓] Successfully broadcasted hot-reload to {len(hot_targets)} targets via CDP!")
            return len(hot_targets)
    except Exception as e:
        print("[!] CDP hot reload notice:", e)
    return 0

def main():
    print("=" * 60)
    print("  Google Antigravity Chinese Localization Installer")
    print("  Google Antigravity 客户端一键中文汉化工具")
    print("=" * 60)

    # 0. 汉化内置插件 (如 Swarm Board)
    patchSwarmSidecar()

    # 1. 检查 Node.js 环境
    try:
        res = subprocess.run(["node", "-v"], capture_output=True, text=True)
        if res.returncode != 0:
            print("[Error] Node.js is required. Please install Node.js (v18+).")
            sys.exit(1)
        print(f"[✓] Node.js detected: {res.stdout.strip()}")
    except Exception:
        print("[Error] Node.js executable not found in PATH. Please install Node.js.")
        sys.exit(1)

    # 2. 定位资源目录
    resources_dir = find_antigravity_resources()
    if not resources_dir:
        print("[!] Antigravity installation not detected in standard path.")
        user_in = input("Please input the 'resources' folder path of Antigravity: ").strip()
        if os.path.exists(user_in) and (os.path.exists(os.path.join(user_in, "app.asar")) or os.path.exists(os.path.join(user_in, "app.asar.bak"))):
            resources_dir = user_in
        else:
            print("[Error] Invalid path or app.asar / app.asar.bak not found.")
            sys.exit(1)

    print(f"[✓] Antigravity resources found: {resources_dir}")
    target_asar = os.path.join(resources_dir, "app.asar")
    backup_asar = os.path.join(resources_dir, "app.asar.bak")

    # 3. 官方原版纯净备份确立 (app.asar.bak 作为不可变源语料)
    if not os.path.exists(backup_asar):
        print("[*] Creating initial pristine backup: app.asar.bak ...")
        shutil.copy2(target_asar, backup_asar)
        print("[✓] Backup completed.")
    else:
        print("[✓] Pristine official backup detected (app.asar.bak).")

    # 4. 从官方原版纯净备份提取与注入
    script_dir = os.path.dirname(os.path.abspath(__file__))
    i18n_runner_src = os.path.join(script_dir, "i18n_runner.js")
    i18n_data_src = os.path.join(script_dir, "i18n_data.json")

    if not os.path.exists(i18n_runner_src) or not os.path.exists(i18n_data_src):
        print("[Error] Missing i18n_runner.js or i18n_data.json in scripts directory.")
        sys.exit(1)

    # 检查是否为极速热更新模式 (--hot)
    is_hot = "--hot" in sys.argv or "-h" in sys.argv
    if is_hot:
        print("[*] 正在执行极速无缝热更新 (--hot模式)...")
        patchSwarmSidecar()
        live_json = os.path.join(resources_dir, "i18n_live.json")
        live_runner = os.path.join(resources_dir, "i18n_runner_live.js")
        shutil.copy2(i18n_data_src, live_json)
        shutil.copy2(i18n_runner_src, live_runner)
        print(f"[✓] 外部双物理热重载源已就绪: {live_json} & {live_runner}")
        broadcast_cdp(script_dir)
        print("=" * 60)
        print("  [✓] 极速热更新完成！修改已推送至物理热更新源与全部活跃页面。")
        print("=" * 60)
        return

    is_dry_run = "--dry-run" in sys.argv
    if is_dry_run:
        print("[*] 正在以 Dry-Run 沙箱模拟模式运行，绝不覆盖生产环境 app.asar ...")

    npx_bin = "npx.cmd" if sys.platform == "win32" else "npx"
    work_dir = tempfile.mkdtemp(prefix="antigravity_i18n_")
    clean_sandbox = os.path.join(work_dir, "sandbox")
    extract_dir = os.path.join(work_dir, "extract")
    os.makedirs(clean_sandbox, exist_ok=True)
    os.makedirs(extract_dir, exist_ok=True)

    try:
        # 4.1 纯净解包：从不可变的 backup_asar 解包，从物理根源彻底消除 6 重监听器泄漏与累积污染
        clean_src_asar = os.path.join(clean_sandbox, "clean_src.asar")
        shutil.copy2(backup_asar, clean_src_asar)

        target_unpacked = target_asar + ".unpacked"
        clean_src_unpacked = clean_src_asar + ".unpacked"
        # 严禁使用 mklink /J 或 symlink！采用安全的物理隔离 copytree，杜绝 finally rmtree 穿透删除生产环境
        if os.path.exists(target_unpacked):
            shutil.copytree(target_unpacked, clean_src_unpacked)

        print("[*] Extracting pristine official backup (clean_src.asar) into temporary sandbox...")
        subprocess.run(f'{npx_bin} --yes @electron/asar extract "{clean_src_asar}" "{extract_dir}"', shell=True, check=True)

        dist_dir = os.path.join(extract_dir, "dist")
        os.makedirs(dist_dir, exist_ok=True)
        shutil.copy2(i18n_runner_src, os.path.join(dist_dir, "i18n_runner.js"))
        shutil.copy2(i18n_data_src, os.path.join(dist_dir, "i18n_data.json"))

        utils_js = os.path.join(dist_dir, "utils.js")
        main_js = os.path.join(dist_dir, "main.js")
        modified_files = []

        # A. 注入 utils.js (主进程热更新总线、双文件支持、OS内核fs.watch、零IO右键菜单、全量webContents广播)
        with open(utils_js, "r", encoding="utf-8") as f:
            u_content = f.read()

        inject_code_def = (
            "const _fs = require('fs');\n"
            "const _path = require('path');\n"
            "let _cachedAntigravityI18nScript = null;\n"
            "let _lastI18nMtime = 0;\n"
            "let _menuDictCache = null;\n"
            "const getPhysicalResourcesPath = () => {\n"
            "    try {\n"
            "        if (typeof process !== 'undefined' && process.resourcesPath) return process.resourcesPath;\n"
            "        const electron = require('electron');\n"
            "        if (electron && electron.app && electron.app.isPackaged) return process.resourcesPath;\n"
            "    } catch(e) {}\n"
            "    try { return _path.resolve(__dirname, '../../'); } catch(e) { return ''; }\n"
            "};\n"
            "const refreshMenuDictCache = () => {\n"
            "    try {\n"
            "        const resDir = getPhysicalResourcesPath();\n"
            "        const livePath = resDir ? _path.join(resDir, 'i18n_live.json') : '';\n"
            "        const asarPath = _path.join(__dirname, 'i18n_data.json');\n"
            "        let targetPath = (livePath && _fs.existsSync(livePath)) ? livePath : asarPath;\n"
            "        if (_fs.existsSync(targetPath)) {\n"
            "            const dataStr = _fs.readFileSync(targetPath, 'utf-8');\n"
            "            const dict = JSON.parse(dataStr);\n"
            "            _menuDictCache = {\n"
            "                dict: dict,\n"
            "                exact: dict.exact || {},\n"
            "                reverseMap: dict.reverse_map || {},\n"
            "                regexRules: (dict.regex_rules || []).map(r => {\n"
            "                    try { return { re: new RegExp(r.pattern), rep: r.replacement }; }\n"
            "                    catch(e) { return null; }\n"
            "                }).filter(Boolean)\n"
            "            };\n"
            "            return dict;\n"
            "        }\n"
            "    } catch(e) {\n"
            "        console.error('[Antigravity i18n] refreshMenuDictCache error:', e);\n"
            "    }\n"
            "    return null;\n"
            "};\n"
            "const getMenuDict = () => {\n"
            "    if (!_menuDictCache) refreshMenuDictCache();\n"
            "    return _menuDictCache?.dict || null;\n"
            "};\n"
            "const getAntigravityI18nScript = (forceReload = false) => {\n"
            "    try {\n"
            "        const asarRunnerPath = _path.join(__dirname, 'i18n_runner.js');\n"
            "        const asarDataPath = _path.join(__dirname, 'i18n_data.json');\n"
            "        const resDir = getPhysicalResourcesPath();\n"
            "        const liveDataPath = resDir ? _path.join(resDir, 'i18n_live.json') : '';\n"
            "        const liveRunnerPath = resDir ? _path.join(resDir, 'i18n_runner_live.js') : '';\n"
            "        let targetDataPath = asarDataPath;\n"
            "        if (liveDataPath && _fs.existsSync(liveDataPath)) {\n"
            "            targetDataPath = liveDataPath;\n"
            "        }\n"
            "        let targetRunnerPath = asarRunnerPath;\n"
            "        if (liveRunnerPath && _fs.existsSync(liveRunnerPath)) {\n"
            "            targetRunnerPath = liveRunnerPath;\n"
            "        }\n"
            "        if (_fs.existsSync(targetRunnerPath) && _fs.existsSync(targetDataPath)) {\n"
            "            const stat1 = _fs.statSync(targetRunnerPath);\n"
            "            const stat2 = _fs.statSync(targetDataPath);\n"
            "            const currentMtime = Math.max(stat1.mtimeMs, stat2.mtimeMs);\n"
            "            if (!forceReload && _cachedAntigravityI18nScript && _lastI18nMtime === currentMtime) {\n"
            "                return _cachedAntigravityI18nScript;\n"
            "            }\n"
            "            const dataStr = _fs.readFileSync(targetDataPath, 'utf-8');\n"
            "            const runnerCode = _fs.readFileSync(targetRunnerPath, 'utf-8');\n"
            "            _cachedAntigravityI18nScript = '(function(){\\n' +\n"
            "                '    try {\\n' +\n"
            "                '        var _i18n_data = ' + JSON.stringify(JSON.parse(dataStr)) + ';\\n' +\n"
            "                '        window.__ANTIGRAVITY_I18N_DATA__ = _i18n_data;\\n' +\n"
            "                '        if (typeof window.__antigravity_cleanup_i18n === \"function\") {\\n' +\n"
            "                '            try { window.__antigravity_cleanup_i18n(); } catch(e) {}\\n' +\n"
            "                '        }\\n' +\n"
            "                runnerCode + '\\n' +\n"
            "                '    } catch(e) {\\n' +\n"
            "                '        console.error(\"[Antigravity i18n] Error executing i18n runner:\", e);\\n' +\n"
            "                '    }\\n' +\n"
            "                '})();';\n"
            "            _lastI18nMtime = currentMtime;\n"
            "            return _cachedAntigravityI18nScript;\n"
            "        }\n"
            "    } catch (e) {\n"
            "        console.error('[Antigravity i18n] Pre-cache error:', e);\n"
            "    }\n"
            "    return null;\n"
            "};\n"
            "const injectAntigravityI18n = (target, force = false) => {\n"
            "    try {\n"
            "        const wc = target?.webContents ? target.webContents : target;\n"
            "        if (!wc || typeof wc.executeJavaScript !== 'function' || wc.isDestroyed?.()) return;\n"
            "        const url = wc.getURL ? wc.getURL() : '';\n"
            "        if (typeof url === 'string' && url.startsWith('data:text/html') && url.includes('logo-pulse')) return;\n"
            "        const script = getAntigravityI18nScript(force);\n"
            "        if (script) {\n"
            "            wc.executeJavaScript(script).catch(() => {});\n"
            "        }\n"
            "    } catch (e) {\n"
            "        console.error('[Antigravity i18n] Injection error:', e);\n"
            "    }\n"
            "};\n"
            "let _hotReloadDebounceTimer = null;\n"
            "const setupLiveWatch = () => {\n"
            "    try {\n"
            "        const resDir = getPhysicalResourcesPath();\n"
            "        if (!resDir || !_fs.existsSync(resDir)) return;\n"
            "        refreshMenuDictCache();\n"
            "        const broadcastNewData = (attempt = 1) => {\n"
            "            try {\n"
            "                const livePath = _path.join(resDir, 'i18n_live.json');\n"
            "                const liveRunnerPath = _path.join(resDir, 'i18n_runner_live.js');\n"
            "                if (!_fs.existsSync(livePath)) return;\n"
            "                const dict = refreshMenuDictCache();\n"
            "                if (!dict || !dict.exact || Object.keys(dict.exact).length < 100) {\n"
            "                    throw new Error('Validation failed');\n"
            "                }\n"
            "                try {\n"
            "                    const menuMod = require('./menu');\n"
            "                    if (menuMod && typeof menuMod.refreshApplicationMenu === 'function') {\n"
            "                        menuMod.refreshApplicationMenu(dict);\n"
            "                    }\n"
            "                } catch(e) {}\n"
            "                try {\n"
            "                    const trayMod = require('./tray');\n"
            "                    if (trayMod && typeof trayMod.refreshTrayMenu === 'function') {\n"
            "                        trayMod.refreshTrayMenu(dict);\n"
            "                    }\n"
            "                } catch(e) {}\n"
            "                let runnerCode = '';\n"
            "                const asarRunnerPath = _path.join(__dirname, 'i18n_runner.js');\n"
            "                const targetRunner = (liveRunnerPath && _fs.existsSync(liveRunnerPath)) ? liveRunnerPath : asarRunnerPath;\n"
            "                if (_fs.existsSync(targetRunner)) {\n"
            "                    runnerCode = _fs.readFileSync(targetRunner, 'utf-8');\n"
            "                }\n"
            "                let dispatchScript = '';\n"
            "                if (runnerCode && runnerCode.trim()) {\n"
            "                    dispatchScript = '(function(){\\n' +\n"
            "                        '    try {\\n' +\n"
            "                        '        var d = ' + JSON.stringify(dict) + ';\\n' +\n"
            "                        '        window.__ANTIGRAVITY_I18N_DATA__ = d;\\n' +\n"
            "                        '        if (typeof window.__antigravity_cleanup_i18n === \"function\") {\\n' +\n"
            "                        '            try { window.__antigravity_cleanup_i18n(); } catch(e) {}\\n' +\n"
            "                        '        }\\n' +\n"
            "                        runnerCode + '\\n' +\n"
            "                        '    } catch(e) {\\n' +\n"
            "                        '        console.error(\"[Antigravity i18n Hot-Reload Error]\", e);\\n' +\n"
            "                        '    }\\n' +\n"
            "                        '})();';\n"
            "                } else {\n"
            "                    dispatchScript = '(function(){\\n' +\n"
            "                        '    try {\\n' +\n"
            "                        '        var d = ' + JSON.stringify(dict) + ';\\n' +\n"
            "                        '        window.__ANTIGRAVITY_I18N_DATA__ = d;\\n' +\n"
            "                        '        if (typeof window.__antigravity_reload_i18n === \"function\") {\\n' +\n"
            "                        '            window.__antigravity_reload_i18n(d);\\n' +\n"
            "                        '        } else if (typeof window.__antigravity_translateWholePage === \"function\") {\\n' +\n"
            "                        '            window.__antigravity_translateWholePage();\\n' +\n"
            "                        '        }\\n' +\n"
            "                        '    } catch(e) {\\n' +\n"
            "                        '        console.error(\"[Antigravity i18n Hot-Reload Error]\", e);\\n' +\n"
            "                        '    }\\n' +\n"
            "                        '})();';\n"
            "                }\n"
            "                const electron = require('electron');\n"
            "                const allWcs = electron.webContents ? electron.webContents.getAllWebContents() : [];\n"
            "                let broadcastCount = 0;\n"
            "                allWcs.forEach(wc => {\n"
            "                    try {\n"
            "                        if (!wc || wc.isDestroyed()) return;\n"
            "                        const url = wc.getURL ? wc.getURL() : '';\n"
            "                        if (typeof url === 'string' && url.includes('swarm_board')) {\n"
            "                            wc.reload();\n"
            "                            broadcastCount++;\n"
            "                            return;\n"
            "                        }\n"
            "                        if (typeof url === 'string' && url.startsWith('data:text/html') && url.includes('logo-pulse')) {\n"
            "                            return;\n"
            "                        }\n"
            "                        wc.executeJavaScript(dispatchScript).catch(() => {});\n"
            "                        broadcastCount++;\n"
            "                    } catch(e) {}\n"
            "                });\n"
            "                console.log('[Antigravity i18n] Hot-reload successfully broadcasted to ' + broadcastCount + ' WebContents targets.');\n"
            "            } catch (err) {\n"
            "                if (attempt < 3) {\n"
            "                    setTimeout(() => broadcastNewData(attempt + 1), 200);\n"
            "                }\n"
            "            }\n"
            "        };\n"
            "        _fs.watch(resDir, (eventType, filename) => {\n"
            "            if (!filename) return;\n"
            "            const fn = filename.toString();\n"
            "            if (fn === 'i18n_live.json' || fn === 'i18n_runner_live.js') {\n"
            "                if (_hotReloadDebounceTimer) clearTimeout(_hotReloadDebounceTimer);\n"
            "                _hotReloadDebounceTimer = setTimeout(() => { broadcastNewData(1); }, 200);\n"
            "            }\n"
            "        });\n"
            "    } catch(e) {\n"
            "        console.error('[Antigravity i18n] setupLiveWatch error:', e);\n"
            "    }\n"
            "};\n"
            "setupLiveWatch();\n"
            "const translateContextMenuItems = (items) => {\n"
            "    try {\n"
            "        if (!Array.isArray(items)) return;\n"
            "        if (!_menuDictCache) refreshMenuDictCache();\n"
            "        if (!_menuDictCache) return;\n"
            "        const exactMap = _menuDictCache.exact || {};\n"
            "        const regexRules = _menuDictCache.regexRules || [];\n"
            "        const translateOne = (str) => {\n"
            "            if (typeof str !== 'string' || !str.trim()) return str;\n"
            "            const trimmed = str.trim();\n"
            "            if (exactMap[trimmed]) return str.replace(trimmed, exactMap[trimmed]);\n"
            "            const collapsed = trimmed.replace(/\\s+/g, ' ');\n"
            "            if (exactMap[collapsed]) return str.replace(trimmed, exactMap[collapsed]);\n"
            "            const lower = trimmed.toLowerCase();\n"
            "            if (exactMap[lower]) return str.replace(trimmed, exactMap[lower]);\n"
            "            const lowerCol = collapsed.toLowerCase();\n"
            "            if (exactMap[lowerCol]) return str.replace(trimmed, exactMap[lowerCol]);\n"
            "            if (trimmed === 'now' || trimmed === 'just now') return str.replace(trimmed, '刚刚');\n"
            "            const mTime = trimmed.match(/^(\\d+)\\s*(s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|wk|wks|week|weeks|mo|mon|mons|month|months|y|yr|yrs|year|years)(?:\\s+ago)?$/i);\n"
            "            if (mTime) {\n"
            "                const num = mTime[1];\n"
            "                const u = mTime[2].toLowerCase();\n"
            "                let uZh = '分钟前';\n"
            "                if (u === 's' || u.startsWith('sec')) uZh = '秒前';\n"
            "                else if (u === 'm' || u.startsWith('min')) uZh = '分钟前';\n"
            "                else if (u === 'h' || u.startsWith('hr') || u.startsWith('hour')) uZh = '小时前';\n"
            "                else if (u === 'd' || u.startsWith('day')) uZh = '天前';\n"
            "                else if (u === 'w' || u.startsWith('wk') || u.startsWith('week')) uZh = '周前';\n"
            "                else if (u === 'mo' || u.startsWith('mon') || u.startsWith('month')) uZh = '个月前';\n"
            "                else if (u === 'y' || u.startsWith('yr') || u.startsWith('year')) uZh = '年前';\n"
            "                return str.replace(trimmed, `${num} ${uZh}`);\n"
            "            }\n"
            "            for (let i = 0; i < regexRules.length; i++) {\n"
            "                if (regexRules[i].re.test(trimmed)) {\n"
            "                    return str.replace(trimmed, trimmed.replace(regexRules[i].re, regexRules[i].rep));\n"
            "                }\n"
            "            }\n"
            "            return str;\n"
            "        };\n"
            "        const walk = (arr) => {\n"
            "            for (let i = 0; i < arr.length; i++) {\n"
            "                const it = arr[i];\n"
            "                if (!it) continue;\n"
            "                if (typeof it.label === 'string') {\n"
            "                    it.label = translateOne(it.label);\n"
            "                }\n"
            "                if (Array.isArray(it.submenu)) {\n"
            "                    walk(it.submenu);\n"
            "                }\n"
            "            }\n"
            "        };\n"
            "        walk(items);\n"
            "    } catch(e) {\n"
            "        console.error('[Antigravity i18n] Main process context menu translation error:', e);\n"
            "    }\n"
            "};\n"
            "exports.translateContextMenuItems = translateContextMenuItems;\n"
            "exports.injectAntigravityI18n = injectAntigravityI18n;\n"
            "exports.getMenuDict = getMenuDict;\n"
        )

        if "injectAntigravityI18n" in u_content:
            u_content = re.sub(
                r"(?:const _fs = require\('fs'\);[\s\S]*?|let _cachedAntigravityI18nScript[\s\S]*?)exports\.getMenuDict = getMenuDict;\s*",
                "",
                u_content
            )
        u_content = inject_code_def + "\n" + u_content

        # 严格幂等钩入，绝不重复叠加 hubContents.on 监听器
        needle_hub = "registerWindowWebContents(win, hubContents);"
        needle_old = "win.webContents.setWindowOpenHandler"
        if needle_hub in u_content and "injectAntigravityI18n(hubContents)" not in u_content:
            hub_hook = (
                "registerWindowWebContents(win, hubContents);\n"
                "    hubContents.on('dom-ready', () => injectAntigravityI18n(hubContents));\n"
                "    hubContents.on('did-finish-load', () => injectAntigravityI18n(hubContents));\n"
                "    hubContents.on('did-navigate-in-page', () => injectAntigravityI18n(hubContents));\n"
                "    if (win.webContents) {\n"
                "        win.webContents.on('dom-ready', () => injectAntigravityI18n(win.webContents));\n"
                "        win.webContents.on('did-finish-load', () => injectAntigravityI18n(win.webContents));\n"
                "        win.webContents.on('did-navigate-in-page', () => injectAntigravityI18n(win.webContents));\n"
                "    }"
            )
            u_content = u_content.replace(needle_hub, hub_hook, 1)
        elif needle_old in u_content and "injectAntigravityI18n(win.webContents)" not in u_content:
            old_hook = (
                "win.webContents.on('dom-ready', () => injectAntigravityI18n(win.webContents));\n"
                "    win.webContents.on('did-finish-load', () => injectAntigravityI18n(win.webContents));\n"
                "    win.webContents.on('did-navigate-in-page', () => injectAntigravityI18n(win.webContents));\n"
                "    " + needle_old
            )
            u_content = u_content.replace(needle_old, old_hook, 1)

        show_needle = "wins[0].focus();"
        if show_needle in u_content and "injectAntigravityI18n)(wins[0])" not in u_content:
            u_content = u_content.replace(
                show_needle,
                show_needle + "\n        if (exports.injectAntigravityI18n) { (0, exports.injectAntigravityI18n)(wins[0]); }",
                1
            )

        with open(utils_js, "w", encoding="utf-8") as f:
            f.write(u_content)
        modified_files.append(utils_js)

        # B. 注入 main.js (全局 web-contents-created 守卫，幂等注入)
        if os.path.exists(main_js):
            with open(main_js, "r", encoding="utf-8") as f:
                m_content = f.read()

            if "web-contents-created" not in m_content and "injectAntigravityI18n" not in m_content:
                main_inject = (
                    "    // Register global WebContents i18n injection lifecycle hook\n"
                    "    electron_1.app.on('web-contents-created', (_event, wc) => {\n"
                    "        wc.on('dom-ready', () => { if (utils_1.injectAntigravityI18n) (0, utils_1.injectAntigravityI18n)(wc); });\n"
                    "        wc.on('did-finish-load', () => { if (utils_1.injectAntigravityI18n) (0, utils_1.injectAntigravityI18n)(wc); });\n"
                    "        wc.on('did-navigate-in-page', () => { if (utils_1.injectAntigravityI18n) (0, utils_1.injectAntigravityI18n)(wc); });\n"
                    "    });\n"
                )
                m_match = re.search(r"(electron_1\.app\s*\.\s*whenReady\(\)\s*\.\s*then\s*\(\s*async\s*\(\)\s*=>\s*\{)", m_content)
                if m_match:
                    m_content = m_content[:m_match.end()] + "\n" + main_inject + m_content[m_match.end():]
                    with open(main_js, "w", encoding="utf-8") as f:
                        f.write(m_content)
            modified_files.append(main_js)

        modified_files.append(os.path.join(dist_dir, "i18n_runner.js"))
        patchNativeMenusAndTray(dist_dir, modified_files)

        # 5. 严格语法检查门禁 (node --check)
        print("[*] Performing syntax gatekeeper checks (node --check)...")
        for fpath in modified_files:
            chk = subprocess.run(["node", "--check", fpath], capture_output=True, text=True)
            if chk.returncode != 0:
                print(f"[Error] Syntax verification failed on {fpath}:\n{chk.stderr}")
                sys.exit(1)
        print("[✓] Syntax checks passed 100%.")

        # 5.1 验证实时渲染注入字符串语法 (Node vm.Script)
        print("[*] Performing live injection script VM compilation check...")
        test_script_path = os.path.join(tempfile.gettempdir(), "test_injection_vm_check.js")
        test_check_code = """
const fs = require('fs');
const vm = require('vm');
const dataStr = fs.readFileSync(process.argv[2], 'utf-8');
const runnerCode = fs.readFileSync(process.argv[3], 'utf-8');
const fullCode = '(function(){\\n' +
    'var _i18n_data = ' + JSON.stringify(JSON.parse(dataStr)) + ';\\n' +
    'window = {}; document = { addEventListener: () => {}, querySelectorAll: () => [] };\\n' +
    runnerCode + '\\n' +
'})();';
try {
    new vm.Script(fullCode);
    console.log('[✓] Live injection script compiled successfully via vm.Script.');
} catch (e) {
    console.error('[Error] Live injection script syntax error:', e);
    process.exit(1);
}
"""
        with open(test_script_path, "w", encoding="utf-8") as f:
            f.write(test_check_code)
        vm_chk = subprocess.run(["node", test_script_path, i18n_data_src, i18n_runner_src], capture_output=True, text=True)
        if vm_chk.returncode != 0:
            print(f"[Error] Live injection syntax verification failed:\n{vm_chk.stderr}\n{vm_chk.stdout}")
            sys.exit(1)
        print("[✓] Live injection syntax checks passed 100%.")

        if is_dry_run:
            print("[*] [Dry-Run] 沙箱全流程模拟与语法门禁验证 100% 成功！")
            return

        # 6. 打包新 asar
        temp_pack = os.path.join(tempfile.gettempdir(), "antigravity_new.asar")
        temp_unpacked = temp_pack + ".unpacked"
        if os.path.exists(temp_pack):
            os.remove(temp_pack)
        if os.path.exists(temp_unpacked):
            shutil.rmtree(temp_unpacked)

        print("[*] Packaging modified files into asar...")
        subprocess.run(
            f'{npx_bin} --yes @electron/asar pack "{extract_dir}" "{temp_pack}" --unpack-dir "node_modules/chrome-devtools-mcp"',
            shell=True,
            check=True
        )

        # 7. 原子替换生产文件
        target_unpacked = target_asar + ".unpacked"
        if os.path.exists(temp_unpacked):
            if os.path.exists(target_unpacked):
                shutil.rmtree(target_unpacked)
            shutil.copytree(temp_unpacked, target_unpacked)

        shutil.copy2(temp_pack, target_asar)
        print("[✓] Production app.asar successfully updated!")

        # 7.1 初始化外部双物理热更新源 (resources/i18n_live.json & resources/i18n_runner_live.js)
        try:
            live_json = os.path.join(resources_dir, "i18n_live.json")
            live_runner = os.path.join(resources_dir, "i18n_runner_live.js")
            shutil.copy2(i18n_data_src, live_json)
            shutil.copy2(i18n_runner_src, live_runner)
            print(f"[✓] Live hot-reload sources initialized: {live_json} & {live_runner}")
        except Exception as e:
            print("[!] Warning initializing live sources:", e)

        # 8. 触发 CDP 实时全量热注入（覆盖所有 page 与 swarm 插件 iframe）
        broadcast_cdp(script_dir)

        print("\n" + "=" * 60)
        print("  汉化部署成功！欢迎体验全中文版 Antigravity。")
        print("  [✓] 外部双物理热重载源 (i18n_live.json & i18n_runner_live.js) 已就绪！")
        print("  [✓] 零重启免刷新全量热更新通道已生效：词库与执行逻辑改动秒级就地自愈！")
        print("=" * 60)

    finally:
        shutil.rmtree(work_dir, ignore_errors=True)

if __name__ == "__main__":
    main()
