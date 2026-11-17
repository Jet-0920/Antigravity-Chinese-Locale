<div align="center">

# Antigravity Chinese Locale

**Google Antigravity 客户端全界面企业级深度汉化与全生命周期持久化套件**

[![Release](https://img.shields.io/badge/Release-v2.5-10B981.svg?style=flat-square)](https://github.com/Jet-0920/Antigravity-Chinese-Locale/releases)
[![Dictionary](https://img.shields.io/badge/Dictionary-3%2C000%2B%20Terms-2563EB.svg?style=flat-square)](scripts/i18n_data.json)
[![Controlled Maps](https://img.shields.io/badge/Reverse%20Maps-233%20Items-D97706.svg?style=flat-square)](scripts/i18n_data.json)
[![Hot Reload](https://img.shields.io/badge/Hot%20Reload-CDP%20Supported-059669.svg?style=flat-square)](#核心技术突破)
[![License](https://img.shields.io/badge/License-MIT-4B5563.svg?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-6366F1.svg?style=flat-square)](#运行环境要求)

<p align="center">
  彻底根除传统外挂方案的「重启还原、下拉卡死、三键滑动闪烁英文、路由跳转失效」等顽疾<br>
  提供媲美官方原生体验的 100% 持久、流畅、高稳定的简体中文界面
</p>

[核心技术突破](#核心技术突破) • 
[智能体自动部署协议](#智能体自动部署协议) • 
[终端快速安装](#终端快速安装) • 
[方案对比](#方案对比) • 
[系统架构与执行流水线](#系统架构与执行流水线) • 
[常见问题与排查](#常见问题与排查)

</div>

---

## 智能体自动部署协议

最便捷的部署方式是将本仓库链接直接提供给正在对话的 Antigravity 智能体。智能体将自动完成环境识别、原版备份、语法门禁校验与实时热重载。

### 交互指令

复制并发送以下指令至 Antigravity 对话框：

> **帮我按照这个仓库中的内容汉化一下 Antigravity 客户端：https://github.com/Jet-0920/Antigravity-Chinese-Locale**

---

### 多模态截图自愈机制

若在使用过程中发现任何深层未汉化的英文区域（如深层子弹窗、特定异常报错或子任务状态提示）：

1. 直接**截屏**该英文区域；
2. 将截图发送给正在对话的 Antigravity；
3. 附带说明：`这个地方也帮我汉化一下`；
4. 智能体将自动识别图像中的英文字符、提取语义并录入词库、通过语法门禁后执行毫秒级 CDP 热重载生效。无需手动翻找代码或手动配置。

---

### 智能体执行指令 (Agent Instructions)

<!-- ANTIGRAVITY_AGENT_INSTRUCTIONS_START -->
> [!NOTE]
> **致正在协助用户的 Antigravity 智能体**：  
> 当收到用户关于“按照本仓库进行汉化”或“截屏补全汉化”的指令时，请在终端中按顺序执行以下跨平台自动化流程完成安全部署：
> 
> ```bash
> # 1. 克隆本仓库到临时或工作区目录（如已存在则跳过）
> git clone https://github.com/Jet-0920/Antigravity-Chinese-Locale.git
> cd Antigravity-Chinese-Locale
> 
> # 2. 执行全生命周期安全持久化部署引擎
> python scripts/deploy_chinese.py
> ```
> 
> **部署引擎技术保障**：
> - 跨平台客户端资源路径自动探测（Windows / macOS / Linux）；
> - 部署前自动创建官方原版镜像备份 `app.asar.bak`；
> - 强制通过沙箱 `node --check` 语法与 AST 门禁，零语法错误后方执行原子打包替换；
> - 自动通过 CDP (Chrome DevTools Protocol) 协议向所有活跃页面广播热重载，无需用户立即重启客户端即可见证全中文界面。
<!-- ANTIGRAVITY_AGENT_INSTRUCTIONS_END -->

---

## 终端快速安装

如果您偏好在本地终端直接执行安装，本项目提供了全自动单行安装脚本与离线运行方式：

### 方式一：终端单行免克隆极速安装

无需手动执行 `git clone`，直接在系统终端中粘贴对应命令回车：

- **Windows (PowerShell)**：
  ```powershell
  irm https://raw.githubusercontent.com/Jet-0920/Antigravity-Chinese-Locale/main/install.ps1 | iex
  ```

- **macOS / Linux (Bash/Zsh)**：
  ```bash
  curl -fsSL https://raw.githubusercontent.com/Jet-0920/Antigravity-Chinese-Locale/main/install.sh | bash
  ```

---

### 方式二：Windows 图形化双击安装

1. 前往 GitHub 仓库页面点击绿色代码按钮，选择 **[Download ZIP](https://github.com/Jet-0920/Antigravity-Chinese-Locale/archive/refs/heads/main.zip)** 下载压缩包并解压；
2. 双击运行解压根目录下的 **`install.bat`** 批处理脚本即可全自动完成安装与热重载。

---

### 方式三：源码克隆与本地构建

```bash
# 克隆仓库
git clone https://github.com/Jet-0920/Antigravity-Chinese-Locale.git
cd Antigravity-Chinese-Locale

# Windows 执行:
python scripts\deploy_chinese.py
# 或: .\install.ps1

# macOS / Linux 执行:
chmod +x install.sh && ./install.sh
# 或: python3 scripts/deploy_chinese.py
```

---

## 核心技术突破

| 技术维度 | 架构原理与用户体验指标 |
| :--- | :--- |
| **全域覆盖 (3,000+ 精准词条)** | 完整覆盖常规设置、应用配置、外观主题、快捷键管理、模型配额与用量明细、网络权限策略、定时任务自定义周期、插件市场（Marketplace）全分类及详情、右键菜单、浏览器自动化工具等全部死角。 |
| **0ms 指针即时校准 (Tooltip 互斥锁)** | 为浮动提示层构建独立微型互斥锁，并在指针微移动（`pointermove`）时进行 0ms 同步查表校准，彻底解决「复制、好评、差评」三键快速滑动切换时偶发闪现英文的历史难题。 |
| **全生命周期拦截网 (防重启还原)** | 挂载于 Electron 全局 `app.on('web-contents-created')`，全面守卫 `dom-ready`、`did-finish-load` 与 `did-navigate-in-page`，并在窗口激活链路中注入即时补偿，根治托盘常驻进程唤醒还原为英文的问题。 |
| **受控组件双向映射桥 (Radix/Base UI 防卡死)** | 全局代理 `Map.prototype.has` 与 `get`。当受控组件接收到汉化后的中文选项时，自动反向透传原始英文键值，彻底杜绝下拉选单失效、弹窗焦点锁死及页面假死。 |
| **纯值比对自愈机制 (弃用 WeakSet)** | 弃用具有永久黑名单副作用的 `WeakSet` 引用缓存，采用纯值动态比对算法。单页应用动态路由跳转或组件异步渲染时，执行毫秒级自动重译。 |
| **静态语法沙箱门禁 (node --check)** | 任何改动写入生产环境 `app.asar` 之前，强制在隔离沙箱中执行 `node --check` 语法与 AST 静态检验，100% 验证无误方执行原子写盘，保障客户端绝对拉起稳定。 |
| **零感知实时热重载 (CDP 广播)** | 深度集成 Chrome DevTools Protocol，安装或词库更新完成后即时向活跃窗口注入最新词典，用户无需中断当前工作重启客户端即可完成更新。 |

---

## 方案对比

| 衡量维度 | 传统外挂脚本 / 简单替换 | 前端油猴 / DOM 注入插件 | **Antigravity-Chinese-Locale (本项目)** |
| :--- | :---: | :---: | :---: |
| **词库规模与完整度** | < 800 条，中英夹杂严重 | 仅覆盖主聊天区域 | **3,000+ 高精词条 + 233 项受控映射 + 258 项动态正则** |
| **重启与唤醒持久性** | 退出托盘重开立即还原为英文 | 每次页面跳转需重新注入 | **Electron 全生命周期深度挂载，重启/唤醒 100% 持久生效** |
| **受控组件状态兼容** | 下拉菜单选不中、弹窗无法关闭 | 极易破坏 React 内部状态 | **原生 Map 原型链代理，双向无缝反向透传原生 Key** |
| **三键滑动抗闪烁** | 滑动切换时高频闪回英文 | 无法捕获动态复用节点的文本流 | **专属微型互斥锁 + 0ms 指针捕获即时校准，视觉完全连贯** |
| **生产运行安全性** | 偶发 SyntaxError 导致应用崩溃 | characterData 循环触发 CPU 100% | **纯 childList 拓扑扫描 + `node --check` 静态语法绝对门禁** |
| **安装与生效时效** | 需手动终止进程并反复重启 | 依赖三方脚本注入宿主 | **本地原子安全打包 + CDP 毫秒级免重启热更新** |

---

## 运行环境要求

- **操作系统**：Windows 10 / 11、macOS、Linux
- **Google Antigravity 客户端**：所有官方发布版本
- **Node.js**：v18.0.0 或更高版本（需支持 `npx`）
- **Python**：3.8 或更高版本（仅使用 Python 原生标准库，**无需安装任何 pip 依赖**）

---

## 系统架构与执行流水线

<div align="center">
  <img src="assets/architecture.png" alt="Antigravity Chinese Locale Architecture Pipeline" width="100%" style="border-radius: 8px; border: 1px solid #E2E8F0; margin-top: 12px; margin-bottom: 12px;" />
</div>

| 流水线阶段 | 核心防护机制与架构职责 |
| :--- | :--- |
| **1. 官方原版镜像备份 (Pristine Backup)** | 首次部署自动归档纯净 `app.asar.bak`，保留随时 100% 官方无损回滚能力。 |
| **2. 解耦式数据管理 (Decoupled i18n)** | 独立标准 `i18n_data.json` 存储，杜绝在主进程中硬编码文本引发的转义与语法异常。 |
| **3. 全生命周期守卫 (Full Lifecycle Guard)** | 挂载于 `app.on('web-contents-created')` 与窗口唤醒链路，彻底攻克托盘唤醒与重启失效。 |
| **4. 静态语法门禁 (Syntax Gatekeeper)** | 在隔离沙箱中强制执行 `node --check` 静态验证，确保注入脚本零语法缺陷。 |
| **5. 原子安全打包 (Atomic Production Pack)** | 双向同步 `app.asar` 与 `.unpacked` 依赖，确保原生 C++ 模块与二进制资产完整无损。 |
| **6. 零感知实时热重载 (Live CDP Hot Reload)** | 通过 Chrome DevTools Protocol 向当前运行的渲染窗口广播，即刻呈现汉化效果。 |

---

## 常见问题与排查

### Q1：安装完成后界面已变为中文，但点击关闭后再次打开又恢复为英文？
> **原因说明**：Antigravity 默认启用了「后台托盘常驻（Run in background）」。点击窗口右上角“关闭”时主进程并未完全退出，内存中仍驻留着旧模块缓存。  
> **解决方法**：
> 1. 在系统任务栏右下角找到 Antigravity 图标，右键选择「Quit / 退出」；
> 2. （或在任务管理器中结束 Antigravity 相关进程）；
> 3. 重新启动客户端即可永久从磁盘加载汉化模块。

### Q2：如何彻底卸载汉化并恢复官方原版英文？
> 本安装套件在初次运行时会自动在客户端 resources 目录下生成官方原版纯净副本 **`app.asar.bak`**。  
> **一键回滚步骤**：
> 1. 进入客户端资源目录（Windows 默认路径：`%LOCALAPPDATA%\Programs\antigravity\resources\`）；
> 2. 删除当前的 `app.asar` 文件；
> 3. 将同目录下的 `app.asar.bak` 重命名为 `app.asar`；
> 4. 重启客户端即可完全还原为官方纯净英文版本。

### Q3：官方客户端更新版本后汉化失效如何处理？
> 官方客户端更新后会覆盖为新的原版 `app.asar`。此时只需再次向智能体发送一条指令：  
> **“帮我按照这个仓库重新汉化一下 Antigravity：https://github.com/Jet-0920/Antigravity-Chinese-Locale”**  
> 脚本将自动重新执行新版本的全套适配与热重载。

### Q4：若发现个别界面残留未翻译的英文，如何反馈与自愈？
> - **方式 A（多模态截图自愈，推荐）**：直接截取未汉化区域屏幕，粘贴发送给正在对话的 Antigravity 并说：“这个地方也帮我汉化一下”，智能体将全自动识别、收录并热更新生效；
> - **方式 B（提交 Issue）**：将截图上传至本仓库的 [Issues](https://github.com/Jet-0920/Antigravity-Chinese-Locale/issues)，维护团队将在第一时间更新官方词库。

---

## 参与贡献

- 若发现未汉化的死角或存在更地道的表述建议，欢迎阅读 [贡献指南 (CONTRIBUTING.md)](CONTRIBUTING.md) 提交 [Pull Request](https://github.com/Jet-0920/Antigravity-Chinese-Locale/pulls)；
- 欢迎提交 [Issue 漏译反馈](https://github.com/Jet-0920/Antigravity-Chinese-Locale/issues)（支持直接粘贴界面截屏）；
- 如果本项目对您的开发体验有所帮助，欢迎在右上角点亮一个 Star 支持持续维护。

---

## 开源许可与声明

本项目基于 [MIT 许可证](LICENSE) 开源。

**免责声明**：本项目为独立开源的本地化增强扩展，旨在提升中文开发者的使用体验，与 Google 官方无关。请在遵循软件许可的前提下合法合规使用。
