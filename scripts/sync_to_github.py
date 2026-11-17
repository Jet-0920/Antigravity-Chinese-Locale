#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Antigravity Chinese Locale - 一键同步更新到 GitHub 仓库
用于在客户端功能升级或本地增量汉化后，自动门禁自检并秒级推送到 GitHub
"""

import os
import sys
import subprocess
import json
import datetime

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    scripts_dir = os.path.join(root_dir, "scripts")
    runner_path = os.path.join(scripts_dir, "i18n_runner.js")
    data_path = os.path.join(scripts_dir, "i18n_data.json")

    print("=" * 60)
    print("  Antigravity 中文汉化套件 - 一键同步到 GitHub")
    print("=" * 60)

    # 1. 语法静态门禁检查
    print("[*] 正在执行语法安全门禁自检 (node --check)...")
    res = subprocess.run(["node", "--check", runner_path], capture_output=True, text=True)
    if res.returncode != 0:
        print("[X] 语法门禁检查失败，中止同步：")
        print(res.stderr)
        sys.exit(1)
    print("[✓] 语法门禁通过 100%。")

    # 2. 统计词库数量
    exact_count = 0
    reverse_count = 0
    if os.path.exists(data_path):
        try:
            with open(data_path, "r", encoding="utf-8") as f:
                d = json.load(f)
                exact_count = len(d.get("exact", {}))
                reverse_count = len(d.get("reverse_map", {}))
        except Exception:
            pass

    today_str = datetime.date.today().strftime("%Y-%m-%d")
    commit_msg = f"feat(i18n): 同步最新汉化词库 ({exact_count} 条精准词条, {reverse_count} 项受控映射) [{today_str}]"
    print(f"[*] 当前词库规模: {exact_count} 条精确匹配, {reverse_count} 项反向映射")
    print(f"[*] 提交信息: {commit_msg}")

    # 3. 执行 Git 暂存与提交
    print("[*] 正在暂存文件...")
    subprocess.run(["git", "add", "."], cwd=root_dir, check=True)

    status_res = subprocess.run(["git", "status", "--porcelain"], cwd=root_dir, capture_output=True, text=True)
    if not status_res.stdout.strip():
        print("[!] 本地工作区无新的更改，已是最新状态。")
    else:
        print("[*] 正在创建 Git 提交...")
        subprocess.run(["git", "commit", "-m", commit_msg], cwd=root_dir, check=True)

    # 4. 推送到远程仓库
    print("[*] 正在推送到 GitHub 远程仓库 (origin/main)...")
    push_res = subprocess.run(["git", "push", "origin", "main"], cwd=root_dir)
    if push_res.returncode == 0:
        print("\n" + "=" * 60)
        print("  [✓] 恭喜！最新汉化已成功同步到 GitHub 仓库！")
        print("=" * 60)
    else:
        print("\n[!] 推送遇到问题，请检查网络或 GitHub 仓库权限。")

if __name__ == "__main__":
    main()
