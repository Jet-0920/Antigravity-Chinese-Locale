@echo off
chcp 65001 >nul
title Google Antigravity 客户端一键汉化部署

echo ============================================================
echo   Google Antigravity 客户端一键深度汉化安装器 v2.5
echo   项目主页: https://github.com/Jet-0920/Antigravity-Chinese-Locale
echo ============================================================
echo.

:: 1. 检查 Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Python 环境！
    echo 请先安装 Python 3.8 或更高版本，并在安装时勾选 "Add python.exe to PATH"。
    echo.
    pause
    exit /b 1
)

:: 2. 检查 Node.js / npx
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js 环境！
    echo 汉化解包与重打包需要 Node.js (v18+)，请前往 https://nodejs.org 下载安装。
    echo.
    pause
    exit /b 1
)

:: 3. 运行核心安装脚本
echo [*] 正在启动全生命周期持久汉化安装引擎...
echo.
python "%~dp0scripts\deploy_chinese.py"

echo.
echo ============================================================
echo   汉化部署流程已执行完毕！
echo   如果 Antigravity 仍在运行，请在系统右下角托盘彻底退出后重新打开。
echo ============================================================
echo.
pause
