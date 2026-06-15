---
name: init-sdd-project
description: 从零初始化一个 SDD（规格驱动开发）项目脚手架时使用。当用户说"用 SDD 起个新项目、给这个空项目套上规格/文档驱动的治理、建一套 PRD/架构/ADR/规则/技能、初始化文档驱动的项目模板"时触发，即使没明说"SDD"。它在目标项目里生成项目级规格（PRD/ARCHITECTURE/ADR/API）+ 防漂移规则 + 迭代技能 + 工程化（版本/分支/运维/许可/静态检查）。
---

# 初始化 SDD 项目

## 这套 SDD 是什么（先建立心智）

一套让项目"规格先行、文档即代码、跨会话不漂移"的治理结构，三个粒度 + 工程化：

- **项目级规格**：`PRD`(要什么) · `ARCHITECTURE`(怎么建) · `ADR`(为什么这么定) · `API`(契约)。
- **功能级规格**：`docs/specs/<feature>.md`（非平凡功能开发前的工作规格）。
- **流程**：`.claude/rules`（防漂移红线）+ `.claude/skills`（迭代工作流：开发/修复/重构/回滚/发布/快照/热修/依赖/文档）。
- **工程化**：`VERSION` + 发布渠道、分支模型 + PR/Issue 模板、运维/安全/许可、静态检查。

模板随本技能打包在 **`templates/`**（本技能目录下）。本技能的工作是：**问清项目 → 用模板生成"项目特定"的规格 → 原样安装"通用"的规则与技能 → 配好 git/版本/许可**。

## 强制流程

### 1. 问清项目（动手前，别臆测）
确认这些——它们直接决定生成的 PRD/ARCHITECTURE/不变量：
- 项目名、一句话定位、解决什么问题、给谁用。
- 技术栈（语言/框架/DB/前端…）、规模、部署形态。
- 目标 / 非目标；分期（P1 MVP 做什么；P2/P3 留什么）。
- 是否开源 + 许可（MIT / Apache-2.0 / 内部保留所有权利）。
信息不足、边界不清 → 先问。

### 2. 生成项目特定文档（据 `templates/docs/_skeletons/` + 访谈填实）
- `docs/PRD.md`：目标/非目标/角色/用户故事/FR 表（带 `状态` 列：计划/开发中/已交付@版本）/NFR/验收/术语。
- `docs/ARCHITECTURE.md`：定位/模块/数据模型/接口/机制/部署/关键裁决/边界。
- `docs/API.md`：按项目接口形态填契约。
- `docs/adr/0001…`：把访谈里定下的**重大决策**各写一条 ADR（技术栈选型、核心架构取舍…），用 `templates/docs/_skeletons/ADR.md`；从 0001 顺序编号。
- `.claude/rules/architecture-invariants.md`：据本项目锁定的边界/禁用件/红线**填实** `templates/claude-rules/architecture-invariants.md` 的占位（这条是项目专属，不能照搬别人的）。
- `README.md` / `CHANGELOG.md` / `docs/OPERATIONS.md` / `SECURITY.md` / `VERSION` / `LICENSE`：据访谈填实（许可按用户选择，从 `templates/licenses/` 取）。

### 3. 原样安装通用治理（从 `templates/` 拷贝，仅替换占位符）
- `templates/claude-rules/*` → `<project>/.claude/rules/`（comments / config-files / git-commit / doc-sync / decision-alignment / scope-discipline / testing-and-quality / static-analysis / README）。
- `templates/claude-skills/<name>.md`（10 个迭代技能）→ 逐个写入 `<project>/.claude/skills/<name>/SKILL.md`（模板里是扁平 `<name>.md`，安装时还原成各自的 `<name>/SKILL.md`）。
- `templates/docs/{CONTRIBUTING.md, adr/README.md, specs/README.md, specs/_template.md}` → `<project>/docs/`。
- `templates/github/*` → `<project>/.github/`；`templates/editorconfig.txt` → `.editorconfig`；按栈选 `templates/gitignore-templates/<stack>.gitignore` → `.gitignore`。
仅替换占位符：项目名、技术栈、提交 scope 例子、测试高风险区、P2/P3 能力、静态检查工具等。

### 4. 收尾
- `git init`（若未初始化）；**不自动 push**。
- 实施计划（里程碑）写进 `.tmp/实施计划.md`——**不入库**（`.gitignore` 已含 `/.tmp/`）。
- 按 `git-commit` 规范做中文初始提交（用户确认后）。
- 给用户"接下来"：填实施计划 → 用 `develop-feature` 等技能迭代。

## 原则
- **简单优先 / 右尺寸**：按项目规模裁剪，别照搬不需要的重型件（小项目不必上 CI 全家桶/多环境）。
- 中文注释 / 日志 / 提交；文档即代码。
- **稳态层只陈述既定事实**：别把"还没做/待落地"的过渡话写进规则/技能（当前状态写进 README）。

## 红线
把模板里别项目的具体决策原样当本项目不变量 · 生成的 PRD/ARCHITECTURE 与访谈不符就交付 · 给项目每个小决定都写 ADR（滥用）· 自动 push · 把过渡性"未落地"措辞写进规则。
