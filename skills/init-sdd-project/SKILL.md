---
name: init-sdd-project
description: 从零初始化一个 SDD（规格驱动开发）项目脚手架时使用。当用户说"用 SDD 起个新项目、给这个空项目套上规格/文档驱动的治理、建一套 PRD/架构/ADR/规则、初始化文档驱动的项目模板"时触发，即使没明说"SDD"。它在目标项目里生成项目级规格（PRD/ARCHITECTURE/ADR/API）+ 防漂移规则 + 代理入口 AGENTS.md + 工程化（版本/分支/运维/许可/静态检查），并接入随插件提供的 sdd-* 迭代技能（不拷进项目）。
---

# 初始化 SDD 项目

## 这套 SDD 是什么（先建立心智）

一套让项目"规格先行、文档即代码、跨会话不漂移"的治理结构，三个粒度 + 工程化：

- **项目级规格**：`PRD`(要什么) · `ARCHITECTURE`(怎么建) · `ADR`(为什么这么定) · `API`(契约)。
- **功能级规格**：`docs/specs/<feature>.md`（功能开发期的工作规格，命中 spec-checklist 才写）。
- **流程**：`.claude/rules`（防漂移红线，装进项目）+ `AGENTS.md`（代理入口，让只读 AGENTS.md 的工具也能找到规则）+ 16 个 `sdd-*` 迭代技能（需求拆解 / 开发 / 修复 / 重构 / 回滚 / 热修 / 发布 / 快照 / 依赖 / 文档 / 外部提交对账 / 验收 / PRD 对齐 / 并行开发 / 代码审查 / 治理同步，随本 `sdd-skills` 插件一同提供，所有 SDD 项目共享、`/plugin update` 一次更新全项目生效）。
- **工程化**：`VERSION` + 发布渠道、分支模型 + PR/Issue 模板、运维/安全/许可、静态检查。

**`skills/init-sdd-project/templates/` 是本仓库唯一权威模板源**，其他脚手架技能只引用它，不维护副本。模板定位、版本戳、安装映射、既有文件合并、实战提示与收尾验收清单统一写在共用参考 `references/governance-install.md`（与 `templates/` 同在本技能目录下，定位方式相同），下文简称「共用参考」。下文 `templates/` 均指权威模板目录。本技能的工作是：**判定入口 → 问清项目 → 用模板生成"项目特定"的规格 → 安装"通用"的防漂移规则 → 配好 git/版本/许可 → 过验收清单**。

## 强制流程

### 0. 判定入口（动手前先看目标目录）
- 已有 `docs/PRD.md` 与 `.claude/rules/` → 已是 SDD 项目，**不重复初始化**；治理模板要升级改走 `sdd-sync-governance`。
- 已有业务代码（源码目录、构建文件、提交历史里有功能提交）→ 改走 `retrofit-to-sdd`，从现状反推规格。
- 空目录或只有 README / LICENSE / `.gitignore` 等零星文件 → 继续本技能；已有的零星文件按共用参考 §3 合并，不覆盖。

### 1. 问清项目（动手前，别臆测）
确认这些——它们直接决定生成的 PRD/ARCHITECTURE/不变量：
- 项目名、一句话定位、解决什么问题、给谁用。
- 技术栈（语言/框架/DB/前端…）、规模、部署形态。
- 目标 / 非目标；分期（P1 MVP 做什么；P2/P3 留什么）。
- 是否开源 + 许可（MIT / Apache-2.0 / 内部保留所有权利，分别对应 `templates/licenses/` 的 `MIT.txt` / `Apache-2.0.txt` / `PROPRIETARY.txt`）。
信息不足、边界不清 → 先问。

### 2. 生成项目特定文档（据 `templates/docs/_skeletons/` + 访谈填实）
- `docs/PRD.md`：目标/非目标/角色/用户故事/FR 表（四列 `| FR-NN | 需求 | 优先级 | 状态 |`，状态取 计划/开发中/已交付@版本）/NFR/验收/术语。
- `ARCHITECTURE.md`：定位/模块/数据模型/接口/机制/部署/关键裁决/边界（放仓库根，与 README 同级）。
- `docs/API.md`：按项目接口形态填契约。
- `docs/adr/0001…`：把访谈里定下的**重大决策**各写一条 ADR（技术栈选型、核心架构取舍…），用 `templates/docs/_skeletons/ADR.md`；从 0001 顺序编号。
- `.claude/rules/architecture-invariants.md`：据本项目锁定的边界/禁用件/红线**填实** `templates/claude-rules/architecture-invariants.md` 的占位（这条是项目专属，不能照搬别人的）。
- `README.md` / `CHANGELOG.md` / `docs/OPERATIONS.md` / `SECURITY.md` / `VERSION` / `LICENSE`：据访谈填实（许可按用户选择，从 `templates/licenses/` 取）。

### 3. 原样安装通用治理（从 `templates/` 拷贝，仅替换占位符）
- 按共用参考 §2 安装映射逐项落地：`.claude/rules/*`、`AGENTS.md`、仓库根的 `CONTRIBUTING.md`、`docs/` 下的 adr / specs、`.github/`、`.editorconfig`、按栈选的 `.gitignore`。
- 迭代技能**不拷进项目**：16 个 `sdd-*` 技能随本 `sdd-skills` 插件一同提供、所有 SDD 项目共享，无需单独安装；项目侧不放 `.claude/skills/`。
- 按共用参考 §1 写 `.claude/rules/.sdd-version` 来源戳。
仅替换占位符：项目名、技术栈、提交 scope 例子、测试高风险区、P2/P3 能力、静态检查工具等。

### 4. 收尾
- `git init`（若未初始化）；**不自动 push**。
- 实施计划（里程碑）写进 `.tmp/实施计划.md`——**不入库**（`.gitignore` 已含 `/.tmp/`）。
- 逐项过共用参考 §5 收尾验收清单，未过的先修。
- 按 `git-commit` 规范做中文初始提交（用户确认后）。
- 给用户"接下来"：填实施计划 → 大需求先 `sdd-brainstorming` 拆 FR，单个功能用 `sdd-develop-feature` 迭代。

## 原则
- **简单优先 / 右尺寸**：按项目规模裁剪，别照搬不需要的重型件（小项目不必上 CI 全家桶/多环境）。
- 中文注释 / 日志 / 提交；文档即代码。
- **稳态层只陈述既定事实**：别把"还没做/待落地"的过渡话写进规则/技能（当前状态写进 README）。

## 实战提示
见共用参考 §4（占位符自查、填写引导清理、右尺寸判据、ADR 文件名、`.gitignore` 与无对应栈的兜底）。

## 红线
把模板里别项目的具体决策原样当本项目不变量 · 生成的 PRD/ARCHITECTURE 与访谈不符就交付 · 给项目每个小决定都写 ADR（滥用）· 在已有业务代码的仓库里走 init 而不走 retrofit · 覆盖已有文件 · 自动 push · 把过渡性"未落地"措辞写进规则。
