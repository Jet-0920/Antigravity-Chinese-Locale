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

# 3. 定位脚本目录，若为在线管道执行 (irm ... | iex)，则自动拉取最新核心文件至临时沙箱
$scriptDir = $PSScriptRoot
if (-not $scriptDir -or -not (Test-Path (Join-Path $scriptDir "scripts\deploy_chinese.py"))) {
    Write-Host "[*] 检测到在线即时运行模式，正在从 GitHub 获取最新部署套件..." -ForegroundColor Yellow
    $tempDir = Join-Path $env:TEMP "antigravity_installer_$(Get-Random)"
    $scriptsDir = Join-Path $tempDir "scripts"
    New-Item -ItemType Directory -Path $scriptsDir -Force | Out-Null
    
    $rawBase = "https://raw.githubusercontent.com/Jet-0920/Antigravity-Chinese-Locale/main/scripts"
    Invoke-WebRequest -Uri "$rawBase/deploy_chinese.py" -OutFile (Join-Path $scriptsDir "deploy_chinese.py") -UseBasicParsing
    Invoke-WebRequest -Uri "$rawBase/i18n_runner.js" -OutFile (Join-Path $scriptsDir "i18n_runner.js") -UseBasicParsing
    Invoke-WebRequest -Uri "$rawBase/i18n_data.json" -OutFile (Join-Path $scriptsDir "i18n_data.json") -UseBasicParsing
    
    $scriptDir = $tempDir
    $isTemp = $true
}

$deployScript = Join-Path $scriptDir "scripts\deploy_chinese.py"

if (Test-Path $deployScript) {
    Write-Host "[*] 正在执行全生命周期持久汉化部署..." -ForegroundColor Yellow
    python $deployScript
    if ($isTemp) {
        Remove-Item -Path $scriptDir -Recurse -Force -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "[错误] 未找到 deploy_chinese.py: $deployScript" -ForegroundColor Red
    exit 1
}
