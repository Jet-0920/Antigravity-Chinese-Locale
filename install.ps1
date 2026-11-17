# Google Antigravity 客户端一键汉化脚本 (PowerShell)
# Project: https://github.com/Jet-0920/Antigravity-Chinese-Locale

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Google Antigravity 客户端一键深度汉化安装器 v2.5" -ForegroundColor Cyan
Write-Host "  项目主页: https://github.com/Jet-0920/Antigravity-Chinese-Locale" -ForegroundColor DarkGray
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. 检查 Python
try {
    $pyVer = python --version 2>&1
    Write-Host "[✓] 检测到 Python: $pyVer" -ForegroundColor Green
} catch {
    Write-Host "[错误] 未检测到 Python，请先安装 Python 3.8+ 并添加至环境变量！" -ForegroundColor Red
    exit 1
}

# 2. 检查 Node.js
try {
    $nodeVer = node -v 2>&1
    Write-Host "[✓] 检测到 Node.js: $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "[错误] 未检测到 Node.js，汉化封包依赖 npx，请前往 https://nodejs.org 安装！" -ForegroundColor Red
    exit 1
}

# 3. 运行部署脚本
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$deployScript = Join-Path $scriptDir "scripts\deploy_chinese.py"

if (Test-Path $deployScript) {
    Write-Host "[*] 正在执行全生命周期持久汉化部署..." -ForegroundColor Yellow
    python $deployScript
} else {
    Write-Host "[错误] 未找到 deploy_chinese.py: $deployScript" -ForegroundColor Red
    exit 1
}
