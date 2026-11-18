<div align="center">

# Antigravity Chinese Locale

**Google Antigravity 客户端中文汉化补丁**

[![Release](https://img.shields.io/badge/Release-v2.5-10B981.svg?style=flat-square)](https://github.com/Jet-0920/Antigravity-Chinese-Locale/releases)
[![Dictionary](https://img.shields.io/badge/Dictionary-3%2C100%2B%20Terms-2563EB.svg?style=flat-square)](scripts/i18n_data.json)
[![Hot Reload](https://img.shields.io/badge/Hot%20Reload-Supported-059669.svg?style=flat-square)](#核心特色)
[![License](https://img.shields.io/badge/License-MIT-4B5563.svg?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-6366F1.svg?style=flat-square)](#运行环境要求)

<p align="center">
  专为 Google Antigravity 打造的中文汉化包。<br>
  重点解决普通汉化常见的“重启变回英文”、“下拉菜单卡死”、“滑动时偶发闪现英文”等问题，装完即用、长久稳定。
</p>

[核心特色](#核心特色) • 
[让智能体自动汉化](#让智能体自动汉化) • 
[手动安装指南](#手动安装指南) • 
[方案对比](#方案对比) • 
[它是怎么工作的？](#它是怎么工作的安全机制) • 
[常见问题](#常见问题)

</div>

---

## 让智能体自动汉化

最省心的方法是直接把本仓库地址发给正在和你对话的 Antigravity 智能体。它会自动找到客户端路径、备份原版文件并帮你搞定汉化。

### 怎么对智能体说？

直接复制下面这句话发给 Antigravity：

> **帮我按照这个仓库中的内容汉化一下 Antigravity 客户端：https://github.com/Jet-0920/Antigravity-Chinese-Locale**

---

### 发现还有没汉化的地方？直接截图发给它！

如果你在使用过程中发现某处界面还是英文（比如某个深层弹窗或特定提示）：

1. 直接把包含英文的区域**截屏**；
2. 把截图发给正在对话的 Antigravity；
3. 对它说一句：`这个地方也帮我汉化一下`；
4. 智能体会自动识别图中的英文并加入翻译词库，无需你查找任何代码或手动配置。

---

### 智能体使用说明 (Agent Instructions)

<!-- ANTIGRAVITY_AGENT_INSTRUCTIONS_START -->
> [!NOTE]
> **致正在协助用户的 Antigravity 智能体**：  
> 当收到用户关于“按照本仓库进行汉化”或“通过截图补全汉化”的指令时，请直接在终端中运行以下命令：
> 
> ```bash
> # 1. 克隆本仓库（如果尚未下载）
> git clone https://github.com/Jet-0920/Antigravity-Chinese-Locale.git
> cd Antigravity-Chinese-Locale
> 
> # 2. 运行自动化汉化部署脚本
> python scripts/deploy_chinese.py
> ```
> 
> **脚本保障**：
> - 自动查找 Windows / macOS / Linux 客户端安装目录；
> - 安装前自动创建官方原版备份 `app.asar.bak`；
> - 写入前会自动运行 `node --check` 语法检查，确保客户端 100% 能正常启动；
> - 尝试通过 CDP 协议向当前活跃窗口发送实时更新信号。
<!-- ANTIGRAVITY_AGENT_INSTRUCTIONS_END -->

---

## 手动安装指南

如果你想自己在终端里安装，本项目提供了一行命令安装以及下载双击运行两种方式：

### 方式一：终端一行命令搞定（推荐，无需手动下载代码）

打开系统终端（PowerShell 或 Terminal），复制对应系统的命令回车即可：

- **Windows (PowerShell)**：
  ```powershell
  irm https://raw.githubusercontent.com/Jet-0920/Antigravity-Chinese-Locale/main/install.ps1 | iex
  ```

- **macOS / Linux (Bash/Zsh)**：
  ```bash
  curl -fsSL https://raw.githubusercontent.com/Jet-0920/Antigravity-Chinese-Locale/main/install.sh | bash
  ```

---

### 方式二：Windows 下载解压，双击运行

1. 点击仓库右上角的绿色代码按钮，选择 **[Download ZIP](https://github.com/Jet-0920/Antigravity-Chinese-Locale/archive/refs/heads/main.zip)** 下载压缩包并解压；
2. 双击解压目录中的 **`install.bat`** 即可自动完成安装。

---

### 方式三：常规 Git 克隆运行

```bash
# 克隆仓库
git clone https://github.com/Jet-0920/Antigravity-Chinese-Locale.git
cd Antigravity-Chinese-Locale

# Windows 执行：
python scripts\deploy_chinese.py
# 或运行：.\install.ps1

# macOS / Linux 执行：
chmod +x install.sh && ./install.sh
# 或运行：python3 scripts/deploy_chinese.py
```

---

## 核心特色

| 常见痛点 | 本项目解决效果 |
| :--- | :--- |
| **覆盖全面 (3,100+ 精准词条)** | 汉化了常规设置、快捷键、模型用量、定时任务、插件市场、右键菜单、以及最新版桌面悬浮条（HUD）等全部界面。 |
| **三键滑动不闪退英文** | 鼠标在“复制”、“好评”、“差评”几个紧挨着的按钮间快速划过时，提示文字依然稳定显示中文，绝不闪现英文。 |
| **重启 / 唤醒不失效** | 无论彻底退出重新打开软件、最小化到托盘后再点开，还是在页面之间来回跳转，都能长久保持全中文。 |
| **下拉菜单与弹窗不卡死** | 底层做了双向数据桥接，选择中文选项时程序能正确识别对应英文，彻底杜绝下拉菜单选不中、弹窗点不动或界面卡死的问题。 |
| **页面切换自动重译** | 采用动态比对算法，无论在会话之间来回切换，还是异步加载新内容，都能自动把新出现的英文替换为中文。 |
| **安全代码检查** | 每次安装前都会自动做代码检查，确保零报错后才替换文件，绝不会把软件搞坏导致打不开。 |
| **免重启实时更新** | 安装或更新词库时，脚本会自动尝试通知正在运行的窗口刷新，很多时候装完不用重启就能直接看到中文效果。 |

---

## 方案对比

| 对比项目 | 普通简单替换 | 常见油猴 / 页面注入插件 | **Antigravity-Chinese-Locale (本项目)** |
| :--- | :---: | :---: | :---: |
| **词库完整度** | < 800 条，中英夹杂严重 | 仅覆盖主聊天区域 | **3,100+ 条精准词条 + 288 条动态匹配规则** |
| **重启后是否失效** | 退出托盘重开立即变回英文 | 每次页面跳转需重新加载 | **不管是重启电脑还是重新开软件，中文都长久有效** |
| **下拉菜单和弹窗是否卡死** | 下拉选不中、弹窗关不掉 | 容易破坏内部状态导致报错 | **点击下拉选项、点弹窗都丝滑正常，绝不卡死** |
| **滑动按钮是否闪现英文** | 鼠标快速划过时经常闪回英文 | 无法监听动态变化的文字 | **提示文字 100% 稳定，滑动无任何闪烁** |
| **软件运行稳定性** | 容易因代码格式错误导致打不开 | 复杂页面容易引发高 CPU 占用 | **安装前自动代码安检，零报错才写入，绝不崩溃** |
| **安装与生效方式** | 必须手动结束进程再重启 | 依赖三方脚本环境 | **支持终端一行秒装或双击运行，免去各种折腾** |

---

## 运行环境要求

- **操作系统**：Windows 10 / 11、macOS、Linux
- **Google Antigravity 客户端**：任何官方版本
- **Node.js**：v18.0.0 或更高版本（需支持 `npx`）
- **Python**：3.8 或更高版本（仅使用 Python 自带的标准库，**无需额外安装任何第三方包**）

---

## 它是怎么工作的？（安全机制）

<div align="center">
  <img src="assets/architecture.png" alt="Antigravity Chinese Locale Architecture Pipeline" width="100%" style="border-radius: 8px; border: 1px solid #E2E8F0; margin-top: 12px; margin-bottom: 12px;" />
</div>

| 处理步骤 | 怎么做的，如何保障安全？ |
| :--- | :--- |
| **1. 原版自动备份** | 第一次运行时会自动把官方原版文件备份为 `app.asar.bak`。随时都能一键恢复官方英文，不用担心把软件搞坏。 |
| **2. 独立词库管理** | 所有汉化内容都单独存放在 `i18n_data.json` 字典里，干净清爽，不乱改软件核心逻辑。 |
| **3. 窗口自动补译** | 软件每次打开窗口或切换界面时都会自动补上中文，彻底解决关闭重开变回英文的问题。 |
| **4. 语法严格检验** | 写入前自动执行 `node --check` 语法检查，确保零错误才准许打包替换。 |
| **5. 完整依赖打包** | 自动打包所有需要的支持文件，绝不缺斤少两，保证软件功能原汁原味。 |
| **6. 尽量免重启生效** | 安装完成后会自动通知正在运行的窗口刷新，尽量让你不用退出客户端就能即刻看到中文。 |

---

## 常见问题

### Q1：安装完成后界面已经变中文了，但关掉窗口重新打开又变回英文了？
> **原因**：Antigravity 默认开启了后台运行（托盘常驻）。直接点窗口右上角的“X”并没有真正退出软件，旧的程序还在后台运行。  
> **解决办法**：
> 1. 在电脑右下角任务栏找到 Antigravity 图标，右键选择「Quit / 退出」；
> 2. （或者在任务管理器中结束 Antigravity 相关进程）；
> 3. 重新打开软件，就能长久保持全中文界面了。
> *(注：平时更新词库通常免重启即刻生效；只有在官方客户端刚做完大版本升级覆盖了文件时，才需要退出重开这一次)*

### Q2：如何卸载汉化，恢复成官方原版英文？
> 脚本在第一次运行时已经自动在软件目录下备份了官方原版文件 **`app.asar.bak`**。  
> **恢复步骤**：
> 1. 打开客户端安装目录（Windows 默认在：`%LOCALAPPDATA%\Programs\antigravity\resources\`）；
> 2. 删除当前的 `app.asar`；
> 3. 把同目录下的 `app.asar.bak` 改名为 `app.asar`；
> 4. 彻底重启软件即可恢复官方纯净英文。

### Q3：官方软件更新后，汉化失效了怎么办？
> 官方客户端更新后会拉取新的英文包覆盖。此时只需再对你的智能体说一句：  
> **“帮我按照这个仓库重新汉化一下 Antigravity：https://github.com/Jet-0920/Antigravity-Chinese-Locale”**  
> 脚本会自动完成新版本的适配。

### Q4：使用中如果发现个别地方还是英文，该如何反馈？
> - **方式 A（直接截图发给智能体，最方便）**：直接把没汉化的地方截屏发给正在对话的 Antigravity，说一句“这个地方也帮我汉化一下”，它就会自动识别并补全；  
> - **方式 B（提交 Issue）**：也可以把截图上传到本仓库的 [Issues](https://github.com/Jet-0920/Antigravity-Chinese-Locale/issues)，我们会第一时间更新词库。

---

## 参与贡献

- 发现漏译或有更好的翻译建议？欢迎阅读 [贡献指南 (CONTRIBUTING.md)](CONTRIBUTING.md) 提交 [Pull Request](https://github.com/Jet-0920/Antigravity-Chinese-Locale/pulls)；
- 欢迎提交 [Issue 漏译反馈](https://github.com/Jet-0920/Antigravity-Chinese-Locale/issues)（直接粘贴截屏即可）；
- 如果觉得好用，欢迎点亮右上角的 Star ⭐️ 支持一下！

---

## 开源协议与说明

本项目基于 [MIT 许可证](LICENSE) 开源。

**免责声明**：本项目为第三方开源汉化补丁，旨在方便中文开发者使用，与 Google 官方无关。请在遵循官方软件许可的前提下使用。
