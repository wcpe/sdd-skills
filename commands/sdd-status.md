---
description: 读 docs/PRD.md 的 FR 表汇报每条 FR 状态、标出漂移信号（SDD 项目，只读）
---

汇报当前 SDD 项目的进度与漂移（**只读，不改任何文件**）。

1. 读 `docs/PRD.md §4` FR 表，列每条 FR：编号 / 一句话能力 / 优先级 / 状态（计划 | 开发中 | 已交付@vX.Y.Z）。
2. 读 git：`git tag --list "v*"`、`git log --oneline -20`。
3. 标**漂移信号**：
   - FR 标「已交付@vX.Y.Z」但 `vX.Y.Z` tag 不存在 / git 无对应提交 → 可疑预标。
   - FR「开发中」但近期无相关提交 → 停滞。
   - `CHANGELOG.md` 未发布段为空、却有开发中 / 未发版能力 → 变更没记。
   - FR 编号重复 / 跳号、缺 §6 整期验收 / §7 分期 → 结构漂移（建议 `sdd-realign-prd`）。
4. 产出「FR 状态表 + 漂移清单 + 下一步建议」。
