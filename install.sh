#!/usr/bin/env bash
# Google Antigravity 客户端一键汉化脚本 (macOS & Linux)
# Project: https://github.com/Jet-0920/Antigravity-Chinese-Locale

set -e

echo "============================================================"
echo "  Google Antigravity 客户端一键深度汉化安装器 v2.5"
echo "  项目主页: https://github.com/Jet-0920/Antigravity-Chinese-Locale"
echo "============================================================"
echo ""

# 1. 检查 Python 3
if command -v python3 >/dev/null 2>&1; then
    PY_BIN="python3"
elif command -v python >/dev/null 2>&1; then
    PY_BIN="python"
else
    echo "[错误] 未检测到 Python 3，请先安装 Python 3.8+！"
    exit 1
fi
echo "[✓] 检测到 Python: $($PY_BIN --version)"

# 2. 检查 Node.js / npx
if ! command -v node >/dev/null 2>&1; then
    echo "[错误] 未检测到 Node.js，汉化封包依赖 npx，请先安装 Node.js (v18+)！"
    exit 1
fi
echo "[✓] 检测到 Node.js: $(node -v)"

# 3. 定位脚本目录，若为在线管道执行 (curl ... | bash)，则自动拉取核心文件至临时沙箱
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd)"
IS_TEMP=0

if [ -z "$SCRIPT_DIR" ] || [ ! -f "$SCRIPT_DIR/scripts/deploy_chinese.py" ]; then
    echo "[*] 检测到在线即时运行模式，正在从 GitHub 获取最新部署套件..."
    TEMP_DIR=$(mktemp -d 2>/dev/null || mktemp -d -t 'antigravity_installer')
    mkdir -p "$TEMP_DIR/scripts"
    
    RAW_BASE="https://raw.githubusercontent.com/Jet-0920/Antigravity-Chinese-Locale/main/scripts"
    curl -fsSL "$RAW_BASE/deploy_chinese.py" -o "$TEMP_DIR/scripts/deploy_chinese.py"
    curl -fsSL "$RAW_BASE/i18n_runner.js" -o "$TEMP_DIR/scripts/i18n_runner.js"
    curl -fsSL "$RAW_BASE/i18n_data.json" -o "$TEMP_DIR/scripts/i18n_data.json"
    
    SCRIPT_DIR="$TEMP_DIR"
    IS_TEMP=1
fi

DEPLOY_SCRIPT="$SCRIPT_DIR/scripts/deploy_chinese.py"

if [ -f "$DEPLOY_SCRIPT" ]; then
    echo "[*] 正在执行全生命周期持久汉化部署..."
    "$PY_BIN" "$DEPLOY_SCRIPT"
    if [ "$IS_TEMP" -eq 1 ]; then
        rm -rf "$SCRIPT_DIR"
    fi
else
    echo "[错误] 未找到 deploy_chinese.py: $DEPLOY_SCRIPT"
    exit 1
fi

echo ""
echo "============================================================"
echo "  汉化部署流程已执行完毕！"
echo "  如果客户端仍在运行，请完全退出客户端进程后重新打开即可生效。"
echo "============================================================"
