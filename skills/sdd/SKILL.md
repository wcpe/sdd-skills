---
name: sdd
description: SDD（规格驱动开发）工作流入口与路由。用户只说"按 SDD 来 / 走 SDD 流程 / 我要做件事但不知道用哪个 sdd 技能 / sdd 帮我看看该怎么做"、或需求类型不明时使用。一次一个问题问清意图，再路由到对应的 sdd-* / init / retrofit 技能走完整流程；本技能自身不写实现。
---

# SDD 工作流入口

据用户描述（说不清就一次一个问题问清意图）路由到对应技能、走它的完整流程，**别在这里直接写实现**：

- 大 / 模糊需求要理清拆解 → `sdd-brainstorming`
- 开发新功能 / 能力 → `sdd-develop-feature`
- 修 bug / 不工作 / 报错 → `sdd-fix-bug`
- 重构（行为不变）→ `sdd-refactor-code`
- 审代码找问题 → `sdd-review-code`
- 验收（整期 / 版本 / 改动够不够格）→ `sdd-accept-phase`
- 发版 / 打 tag → `sdd-release-version`；发快照 → `sdd-publish-snapshot`
- 线上紧急修 → `sdd-hotfix`；回滚 → `sdd-rollback-change`
- 升依赖 → `sdd-bump-dependencies`；改文档 / PRD / ADR → `sdd-update-docs`
- PRD 不规范要整理 → `sdd-realign-prd`；并行开发独立 FR → `sdd-parallel-develop`
- 对账外部 / 他人提交 → `sdd-reconcile-external-commits`；同步治理规则 → `sdd-sync-governance`
- 起新 SDD 项目 → `init-sdd-project`；老项目补 SDD → `retrofit-to-sdd`
- 看进度 / 查漂移 → `sdd-status`

除 `init-sdd-project` / `retrofit-to-sdd` 外，路由前先确认目标目录有 `docs/PRD.md` 与 `.claude/rules/`；没有就先问用户是新项目（init）还是老项目（retrofit）。不确定就问，别臆测。
