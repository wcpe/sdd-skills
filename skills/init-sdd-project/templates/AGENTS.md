# <项目名> 代理协作入口

本项目按 SDD（规格驱动开发）治理：规格先行、文档即代码、跨会话不漂移。任何 AI 代理（Claude Code / Codex / opencode 等）与人类协作者动手前先读：

1. `.claude/rules/README.md`：防漂移规则索引；`.claude/rules/*.md` 均为强制规则，项目规则优先于全局规则。
2. `docs/PRD.md`（要什么）· `ARCHITECTURE.md`（怎么建）· `docs/adr/`（为什么这么定）· `docs/API.md`（契约）。
3. `CONTRIBUTING.md`：分支、提交、发布与文档同步流程。

日常迭代走 `sdd-*` 技能（如 `sdd-develop-feature`、`sdd-fix-bug`）；受影响的文档与代码在同一变更里更新，见 `.claude/rules/doc-sync.md`。
