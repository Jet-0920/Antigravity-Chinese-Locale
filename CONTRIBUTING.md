# Antigravity 中文汉化项目参与指南

非常欢迎你参与完善 Antigravity 中文汉化！为了让大家用得顺畅、不闪退、不卡死，提交修改时请留意以下几点：

---

### 一、词库添加说明 (`scripts/i18n_data.json`)

1. **精确词条 (`exact`)**：
   - 英文原文作为 Key，中文翻译作为 Value；
   - 尽量提供完整准确的英文句子；
   - 如果原文包含句号或点，建议同时提供带句号与不带句号的版本。
2. **下拉选项与单选框 (`reverse_map`)**：
   - 凡是属于 **下拉选择框 (Select)**、**单选/多选框** 的选项，**必须**在 `reverse_map` 中补上：`"中文选项": "英文原生值"`；
   - 这样能保证用户选中中文选项后，软件内部能正常识别对应的英文设置项，避免点击后没反应或卡死。
3. **动态句子规则 (`regex_rules`)**：
   - 遇到带动态数字、时长、日期的句子，可以在 `regex_rules` 中添加正则表达式与替换规则。

---

### 二、本地简单自测

提交代码前，请先在本地测试一下，确保没有语法错误：

```bash
# 1. 检查运行脚本是否有语法错误（退出码为 0 说明通过）
node --check scripts/i18n_runner.js

# 2. 检查词典 JSON 格式是否正确
python -c "import json; json.load(open('scripts/i18n_data.json', encoding='utf-8'))"

# 3. 运行本地安装测试
python scripts/deploy_chinese.py
```

---

### 三、提交 Pull Request

1. Fork 本仓库并新建分支（例如：`git checkout -b fix/settings-urls`）；
2. 提交清晰的说明（例如：`fix: 补全网络设置界面漏译`）；
3. 提交 PR，我们会第一时间测试并合并。

再次感谢你对中文开源生态的支持！
