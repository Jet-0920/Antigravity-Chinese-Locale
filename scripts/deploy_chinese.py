#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Antigravity Chinese Locale One-Click Installer
Google Antigravity 官方客户端一键安全汉化与全生命周期持久化工具

Features:
- Auto-detects Antigravity resources folder across Windows, macOS & Linux
- Automatic pristine backup (app.asar.bak)
- Microtask loop prevention & Base UI controlled component bridge
- Full WebContents lifecycle hook (prevents reverting on restart, refresh, or child windows)
- Static syntax gatekeeper (node --check on all modified files)
- Atomic replacement of app.asar & app.asar.unpacked
- Optional live hot-reload via Chrome DevTools Protocol (CDP)
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
        if os.path.exists(p) and os.path.exists(os.path.join(p, "app.asar")):
            return p
    # 2. macOS default path
    mac_path = "/Applications/Antigravity.app/Contents/Resources"
    if os.path.exists(mac_path) and os.path.exists(os.path.join(mac_path, "app.asar")):
        return mac_path
    # 3. Linux default path
    linux_path = "/opt/Antigravity/resources"
    if os.path.exists(linux_path) and os.path.exists(os.path.join(linux_path, "app.asar")):
        return linux_path
    return None


def patchNativeMenusAndTray(dist_dir, modified_files):
    # 1. 汉化 dist/tray.js
    tray_js = os.path.join(dist_dir, "tray.js")
    if os.path.exists(tray_js):
        with open(tray_js, "r", encoding="utf-8") as f:
            t_content = f.read()
        
        # 替换智能体运行计数标签
        old_count_pattern = r"\(count > 0 \? `\$\{count\}` : 'No'\) \+\s*' agent' \+\s*\(count === 1 \? '' : 's'\) \+\s*' running'"
        new_count_code = "count > 0 ? (count + ' 个智能体正在运行') : '暂无运行中的智能体'"
        t_content = re.sub(old_count_pattern, new_count_code, t_content)
        t_content = t_content.replace("'No agents running'", "'暂无运行中的智能体'")
        
        with open(tray_js, "w", encoding="utf-8") as f:
            f.write(t_content)
        modified_files.append(tray_js)

    # 2. 汉化 dist/menu.js
    menu_js = os.path.join(dist_dir, "menu.js")
    if os.path.exists(menu_js):
        with open(menu_js, "r", encoding="utf-8") as f:
            m_content = f.read()
        
        m_content = m_content.replace("label: 'New Window'", "label: '新建窗口'")
        m_content = m_content.replace("label: 'Docs'", "label: '官方文档'")
        m_content = m_content.replace("label: 'Connect to WSL'", "label: '连接到 WSL'")
        m_content = m_content.replace("label: 'Reopen Locally'", "label: '在本地重新打开'")
        m_content = m_content.replace("label: updater_1.MenuUpdateStep.CheckForUpdates", "label: '检查更新'")
        
        with open(menu_js, "w", encoding="utf-8") as f:
            f.write(m_content)
        modified_files.append(menu_js)

    # 3. 汉化 dist/main.js
    main_js = os.path.join(dist_dir, "main.js")
    if os.path.exists(main_js):
        with open(main_js, "r", encoding="utf-8") as f:
            main_c = f.read()
        
        main_c = main_c.replace("label: 'No agents running'", "label: '暂无运行中的智能体'")
        main_c = main_c.replace("label: `Open ${electron_1.app.getName()}`", "label: `打开 ${electron_1.app.getName()}`")
        main_c = main_c.replace("label: 'Quit'", "label: '退出'")
        main_c = main_c.replace("label: 'New Window'", "label: '新建窗口'")
        
        with open(main_js, "w", encoding="utf-8") as f:
            f.write(main_c)
        if main_js not in modified_files:
            modified_files.append(main_js)

    # 4. 汉化 dist/computer/hud.js (v2.33+ AGY Desktop HUD 桌面控制悬浮指示器)
    hud_js = os.path.join(dist_dir, "computer", "hud.js")
    if os.path.exists(hud_js):
        with open(hud_js, "r", encoding="utf-8") as f:
            h_content = f.read()
        
        h_content = h_content.replace("<title>AGY Desktop HUD</title>", "<title>AGY 桌面控制指示器</title>")
        h_content = h_content.replace('<div id="status">AGY is controlling your Mac</div>', '<div id="status">AGY 正在控制您的电脑</div>')
        h_content = h_content.replace('<div id="status">AGY is controlling your PC</div>', '<div id="status">AGY 正在控制您的电脑</div>')
        h_content = h_content.replace('<div id="status">AGY is controlling your computer</div>', '<div id="status">AGY 正在控制您的电脑</div>')
        h_content = h_content.replace('<button id="stop">Stop</button><button id="resume">Resume</button>', '<button id="stop">停止</button><button id="resume">恢复</button>')
        h_content = h_content.replace("end.textContent = 'Stopped';", "end.textContent = '已停止';")
        h_content = h_content.replace("end.textContent = 'Stop';", "end.textContent = '停止';")
        h_content = h_content.replace("title: 'AGY Desktop HUD'", "title: 'AGY 桌面控制指示器'")
        
        with open(hud_js, "w", encoding="utf-8") as f:
            f.write(h_content)
        if hud_js not in modified_files:
            modified_files.append(hud_js)

def main():
    print("=" * 60)
    print("  Google Antigravity Chinese Localization Installer v2.0")
    print("  Google Antigravity 客户端一键安全汉化工具 (全生命周期持久版)")
    print("=" * 60)

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
        if os.path.exists(user_in) and os.path.exists(os.path.join(user_in, "app.asar")):
            resources_dir = user_in
        else:
            print("[Error] Invalid path or app.asar not found.")
            sys.exit(1)

    print(f"[✓] Antigravity resources found: {resources_dir}")
    target_asar = os.path.join(resources_dir, "app.asar")
    backup_asar = os.path.join(resources_dir, "app.asar.bak")

    # 3. 官方原版纯净备份
    if not os.path.exists(backup_asar):
        print("[*] Creating initial backup: app.asar.bak ...")
        shutil.copy2(target_asar, backup_asar)
        print("[✓] Backup completed.")
    else:
        print("[✓] Existing backup detected (app.asar.bak).")

    # 4. 解包与注入
    script_dir = os.path.dirname(os.path.abspath(__file__))
    i18n_runner_src = os.path.join(script_dir, "i18n_runner.js")
    i18n_data_src = os.path.join(script_dir, "i18n_data.json")

    if not os.path.exists(i18n_runner_src) or not os.path.exists(i18n_data_src):
        print("[Error] Missing i18n_runner.js or i18n_data.json in scripts directory.")
        sys.exit(1)

    npx_bin = "npx.cmd" if sys.platform == "win32" else "npx"
    work_dir = tempfile.mkdtemp(prefix="antigravity_i18n_")
    try:
        print("[*] Extracting app.asar into temporary sandbox...")
        subprocess.run(f'{npx_bin} --yes @electron/asar extract "{target_asar}" "{work_dir}"', shell=True, check=True)

        dist_dir = os.path.join(work_dir, "dist")
        os.makedirs(dist_dir, exist_ok=True)
        shutil.copy2(i18n_runner_src, os.path.join(dist_dir, "i18n_runner.js"))
        shutil.copy2(i18n_data_src, os.path.join(dist_dir, "i18n_data.json"))

        utils_js = os.path.join(dist_dir, "utils.js")
        main_js = os.path.join(dist_dir, "main.js")
        modified_files = []

        # A. 注入 utils.js (主窗体生命周期与唤醒补偿)
        with open(utils_js, "r", encoding="utf-8") as f:
            u_content = f.read()

        inject_code_def = (
            "const injectAntigravityI18n = (target) => {\n"
            "    try {\n"
            "        const wc = target?.webContents ? target.webContents : target;\n"
            "        if (!wc || typeof wc.executeJavaScript !== \"function\" || wc.isDestroyed?.()) return;\n"
            "        const runnerPath = path_1.default.join(__dirname, \"i18n_runner.js\");\n"
            "        const dataPath = path_1.default.join(__dirname, \"i18n_data.json\");\n"
            "        if (fs.existsSync(runnerPath) && fs.existsSync(dataPath)) {\n"
            "            const dataStr = fs.readFileSync(dataPath, \"utf-8\");\n"
            "            const runnerCode = fs.readFileSync(runnerPath, \"utf-8\");\n"
            "            const script = `\n"
            "                (function(){\n"
            "                    try {\n"
            "                        window.__ANTIGRAVITY_I18N_DATA__ = ${JSON.stringify(JSON.parse(dataStr))};\n"
            "                        ${runnerCode}\n"
            "                    } catch(e) {\n"
            "                        console.error(\"[Antigravity i18n] Error executing i18n runner:\", e);\n"
            "                    }\n"
            "                })();\n"
            "            `;\n"
            "            wc.executeJavaScript(script).catch(() => {});\n"
            "        }\n"
            "    } catch (e) {\n"
            "        console.error(\"[Antigravity i18n] Injection error:\", e);\n"
            "    }\n"
            "};\n"
            "exports.injectAntigravityI18n = injectAntigravityI18n;\n"
        )

        if "injectAntigravityI18n" not in u_content:
            u_content = inject_code_def + "\n" + u_content

            needle_hub = "registerWindowWebContents(win, hubContents);"
            needle_old = "win.webContents.setWindowOpenHandler"
            if needle_hub in u_content:
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
            elif needle_old in u_content:
                old_hook = (
                    "win.webContents.on('dom-ready', () => injectAntigravityI18n(win.webContents));\n"
                    "    win.webContents.on('did-finish-load', () => injectAntigravityI18n(win.webContents));\n"
                    "    win.webContents.on('did-navigate-in-page', () => injectAntigravityI18n(win.webContents));\n"
                    "    " + needle_old
                )
                u_content = u_content.replace(needle_old, old_hook, 1)

            show_needle = "wins[0].focus();"
            if show_needle in u_content:
                u_content = u_content.replace(
                    show_needle,
                    show_needle + "\n        if (exports.injectAntigravityI18n) { (0, exports.injectAntigravityI18n)(wins[0]); }",
                    1
                )

            with open(utils_js, "w", encoding="utf-8") as f:
                f.write(u_content)
        modified_files.append(utils_js)

        # B. 注入 main.js (全局 web-contents-created 守卫)
        if os.path.exists(main_js):
            with open(main_js, "r", encoding="utf-8") as f:
                m_content = f.read()

            if "web-contents-created" not in m_content:
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

        # 6. 打包新 asar
        temp_pack = os.path.join(tempfile.gettempdir(), "antigravity_new.asar")
        temp_unpacked = temp_pack + ".unpacked"
        if os.path.exists(temp_pack):
            os.remove(temp_pack)
        if os.path.exists(temp_unpacked):
            shutil.rmtree(temp_unpacked)

        print("[*] Packaging modified files into asar...")
        subprocess.run(
            f'{npx_bin} --yes @electron/asar pack "{work_dir}" "{temp_pack}" --unpack-dir "node_modules/chrome-devtools-mcp"',
            shell=True,
            check=True
        )

        # 7. 原子替换
        target_unpacked = target_asar + ".unpacked"
        if os.path.exists(temp_unpacked):
            if os.path.exists(target_unpacked):
                shutil.rmtree(target_unpacked)
            shutil.copytree(temp_unpacked, target_unpacked)

        shutil.copy2(temp_pack, target_asar)
        print("[✓] Production app.asar successfully updated!")

        # 8. 尝试 CDP 实时全量热注入（覆盖所有 page 与 swarm 插件 iframe）
        try:
            active_port_file = os.path.join(os.environ.get("APPDATA", ""), "Antigravity", "DevToolsActivePort")
            if os.path.exists(active_port_file):
                with open(active_port_file, "r") as f:
                    dt_port = f.readline().strip()
                with urllib.request.urlopen(f"http://127.0.0.1:{dt_port}/json", timeout=2) as resp:
                    targets = json.loads(resp.read().decode("utf-8"))
                    
                    with open(os.path.join(dist_dir, "i18n_data.json"), "r", encoding="utf-8") as f:
                        dt_str = f.read()
                    with open(os.path.join(dist_dir, "i18n_runner.js"), "r", encoding="utf-8") as f:
                        rn_str = f.read()
                    
                    full_code = (
                        "window.__ANTIGRAVITY_I18N_DATA__ = " + dt_str + ";\n" +
                        rn_str + "\n" +
                        "if (typeof window.__antigravity_translateWholePage === 'function') { window.__antigravity_translateWholePage(); }"
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
                        print(f"[✓] Successfully broadcasted hot-reload to {len(hot_targets)} targets (pages & swarm iframes)!")
        except Exception as e:
            print("[!] Hot reload notice:", e)

        print("\n" + "=" * 60)
        print("  Localization deployed successfully! Enjoy Antigravity in Chinese.")
        print("  汉化部署成功！")
        print("  提示：若关闭窗口后重新打开仍显示英文，请在任务栏右下角系统托盘彻底退出")
        print("  Antigravity 或在任务管理器结束残留进程后再打开，即可永久生效。")
        print("=" * 60)

    finally:
        shutil.rmtree(work_dir, ignore_errors=True)

if __name__ == "__main__":
    main()
