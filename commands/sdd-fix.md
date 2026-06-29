---
description: 修 bug / 某功能不工作 / 报错（走 sdd-fix-bug 全流程）
argument-hint: "<现象 / 报错>"
---

修复：**$ARGUMENTS**。用 **sdd-fix-bug** 技能——先写**复现测试**、再定位根因、做最小修复、最后回归验证；按 `git-commit` 规范提交（type=fix）。是"已交付能力坏了"才走本流程；开发中功能的缺陷回到 sdd-develop-feature 续修。
