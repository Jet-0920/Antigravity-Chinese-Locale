## 变更说明 (PR Description)
简要说明本次 PR 修复的漏译位置或新增的汉化词条：

## 关联 Issue
Fixes #

## 自检检查清单 (Checklist)
- [ ] 已在 `scripts/i18n_data.json` 中规范录入精确匹配或反向映射
- [ ] 已在本地执行 `node --check scripts/i18n_runner.js` 语法门禁（0 错误）
- [ ] 若涉及受控组件选项（如设置下拉菜单），已同步在 `reverse_map` 中补齐反向透传
- [ ] 实机通过 CDP 热更新或本地部署验证无死循环与界面异常
