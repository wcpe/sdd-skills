---
description: SDD 工作流入口——说清要做什么，路由到对应 sdd-* 技能
argument-hint: "[你要做的事，可留空]"
---

你是 SDD（规格驱动开发）项目的工作流入口。据用户说的「$ARGUMENTS」（留空就一次一个问题问清意图），路由到对应技能、走它的完整流程（**别在这里直接写实现**）。每个工作流也都有同名快捷命令，知道要干啥可直接敲、跳过路由：

- 大 / 模糊需求要理清拆解 → **sdd-brainstorming**（`/sdd-brainstorm`）
- 开发新功能 / 能力 → **sdd-develop-feature**（`/sdd-feature`）
- 修 bug / 不工作 / 报错 → **sdd-fix-bug**（`/sdd-fix`）
- 重构（行为不变）→ **sdd-refactor-code**（`/sdd-refactor`）
- 审代码找问题 → **sdd-review-code**（`/sdd-review`）
- 验收（整期 / 版本 / 改动够不够格）→ **sdd-accept-phase**（`/sdd-accept`）
- 发版 / 打 tag → **sdd-release-version**（`/sdd-release`）；发快照 → **sdd-publish-snapshot**（`/sdd-snapshot`）
- 线上紧急修 → **sdd-hotfix**（`/sdd-hotfix`）；回滚 → **sdd-rollback-change**（`/sdd-rollback`）
- 升依赖 → **sdd-bump-dependencies**（`/sdd-bump`）；改文档 / PRD / ADR → **sdd-update-docs**（`/sdd-docs`）
- PRD 不规范要整理 → **sdd-realign-prd**（`/sdd-realign`）；并行开发独立 FR → **sdd-parallel-develop**（`/sdd-parallel`）
- 对账外部 / 他人提交 → **sdd-reconcile-external-commits**（`/sdd-reconcile`）；同步治理规则 → **sdd-sync-governance**（`/sdd-governance`）
- 起新 SDD 项目 → **init-sdd-project**（`/sdd-init`）；老项目补 SDD → **retrofit-to-sdd**（`/sdd-retrofit`）
- 看进度 / 查漂移 → **`/sdd-status`**（读 PRD FR 表汇报状态与漂移信号）

不确定就问，别臆测。
