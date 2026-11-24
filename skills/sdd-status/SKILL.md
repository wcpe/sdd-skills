---
name: sdd-status
description: SDD 项目专用(需 docs/PRD.md 与 .claude/rules/)。汇报 SDD 项目进度与规格漂移时使用——读 docs/PRD.md 的 FR 表列每条 FR 状态，对照 git 标签 / 提交 / CHANGELOG 标出漂移信号。当用户说"看看进度 / 现在做到哪了 / FR 状态 / 查一下漂移 / sdd status"时触发。只读，不改任何文件。
---

# SDD 进度与漂移汇报（只读）

**只读，不改任何文件。** MCP 工具 `sdd_check_drift` 可用时先调用它拿 FR 表解析与标签对照结果，再补下面它不覆盖的检查。

1. 读 `docs/PRD.md §4` FR 表，列每条 FR：编号 / 一句话能力 / 优先级 / 状态（计划 | 开发中 | 已交付@vX.Y.Z）。
2. 读 git：`git tag --list`（含不带 v 前缀的旧标签）、`git log --oneline -20`。
3. 标**漂移信号**：
   - FR 标「已交付@vX.Y.Z」但 `vX.Y.Z` / `X.Y.Z` 标签都不存在、git 无对应提交 → 可疑预标。
   - FR「开发中」但近期无相关提交 → 停滞。
   - `CHANGELOG.md` 未发布段为空、却有开发中 / 未发版能力 → 变更没记。
   - FR 编号重复 / 跳号、缺 §6 整期验收 / §7 分期 → 结构漂移（建议 `sdd-realign-prd`）。
4. 产出「FR 状态表 + 漂移清单 + 下一步建议」（下一步按 `sdd` 入口的路由表指向具体技能）。
