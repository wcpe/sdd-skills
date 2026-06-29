---
description: SDD 工作流入口——说清要做什么，路由到对应 sdd-* 技能
argument-hint: "[你要做的事，可留空]"
---

你是 SDD（规格驱动开发）项目的工作流入口。据用户说的「$ARGUMENTS」（留空就一次一个问题问清意图），路由到对应技能、走它的完整流程（**别在这里直接写实现**）：

- 大 / 模糊需求要理清拆解 → **sdd-brainstorming**
- 开发新功能 / 能力 → **sdd-develop-feature**
- 修 bug / 不工作 / 报错 → **sdd-fix-bug**
- 重构（行为不变）→ **sdd-refactor-code**
- 验收（整期 / 版本 / 改动够不够格）→ **sdd-accept-phase**
- 发版 / 打 tag → **sdd-release-version**；发快照 → **sdd-publish-snapshot**
- 线上紧急修 → **sdd-hotfix**；回滚 → **sdd-rollback-change**
- 升依赖 → **sdd-bump-dependencies**；改文档 / PRD / ADR → **sdd-update-docs**
- 审代码找问题 → **sdd-review-code**；PRD 不规范要整理 → **sdd-realign-prd**
- 起新 SDD 项目 → **init-sdd-project**；老项目补 SDD → **retrofit-to-sdd**

不确定就问，别臆测。
