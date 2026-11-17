# Antigravity Chinese Locale 社区贡献指南

非常欢迎您为 **Antigravity Chinese Locale** 项目做出贡献！为了保持工程工业级的稳定性与零崩溃特性，请遵循以下规范：

---

### 一、词库添加规范 (`scripts/i18n_data.json`)

1. **精确词条 (`exact`)**：
   - 英文原文作为 Key，中文翻译作为 Value；
   - 尽量提供精确且完整的英文语句；
   - 如果原文包含标点，建议同时提供包含标点与不带标点的变体。
2. **受控组件反向映射 (`reverse_map`)**：
   - 凡是属于 **下拉选择框 (Select)**、**单选/多选组 (Radio/Checkbox)** 或 Base UI 受控状态回传的文本，**必须**在 `reverse_map` 中添加：`"中文选项": "Original English Key"`；
   - 这能保证用户在界面上选中中文后，React 底层状态能够顺利接收原生英文 Key，避免界面假死。
3. **动态正则匹配 (`regex_rules`)**：
   - 针对包含动态数字、时长、日期的句式，可在 `regex_rules` 中添加正则表达式与替换模板。

---

### 二、本地验证门禁

在提交任何更改前，请确保通过语法门禁：

```bash
# 1. 验证执行器语法（退出码必须为 0）
node --check scripts/i18n_runner.js

# 2. 验证词典 JSON 格式合法性
python -c "import json; json.load(open('scripts/i18n_data.json', encoding='utf-8'))"

# 3. 运行本地打包与部署测试
python scripts/deploy_chinese.py
```

---

### 三、提交 Pull Request

1. Fork 本仓库并基于 `main` 分支拉出特性分支（如 `git checkout -b fix/settings-urls`）；
2. 提交规范的 Commit 格式（如 `fix(i18n): 补全网络权限设置项汉化`）；
3. 提交 PR 并勾选检查清单，维护者会进行测试与合并。

再次感谢您对中文开源生态的支持！
