---
name: retrofit-to-sdd
description: 把一个已存在的代码库逆向改造成 SDD（规格驱动开发）项目时使用。当用户说"给现有项目补上 SDD 治理、把这个老项目改成规格/文档驱动、逆向生成架构文档和 ADR、给祖传代码套上防漂移规则、让这个项目以后按 SDD 迭代"时触发。它不改业务代码，而是从现有代码反向提取架构、补齐 PRD/ARCHITECTURE/ADR 与防漂移规则，并接入随插件提供的 sdd-* 迭代技能。
---

# 逆向改造为 SDD 项目

## 最重要的原则

**不动业务代码、不改行为。** 逆向改造只**新增治理文档/规则**，从既有代码**如实**提取，文档写的是代码**现在的样子**，不是理想的样子。

本技能**不自带模板副本**，统一复用唯一权威模板源 `skills/init-sdd-project/templates/`。模板定位、版本戳、安装映射、既有文件合并、实战提示与收尾验收清单见共用参考 `skills/init-sdd-project/references/governance-install.md`（Claude Code 下 `${CLAUDE_PLUGIN_ROOT}/skills/init-sdd-project/references/`；Codex 与 opencode 同级安装时 `../init-sdd-project/references/`），下文简称「共用参考」。下文“权威模板”均指模板目录。

## 强制流程

### 0. 判定入口
- 已有 `docs/PRD.md` 与 `.claude/rules/` → 已是 SDD 项目，不重做逆向；治理模板升级走 `sdd-sync-governance`，文档落后于代码走 `sdd-reconcile-external-commits`。
- 仓库里几乎没有业务代码 → 改走 `init-sdd-project`。
- 工作树或暂存区有未提交改动（`git status --short` 非空）→ 先请用户把业务改动提交或 `git stash`，避免治理改动与业务改动混进同一提交；仅暂存不算隔离。

### 1. 勘察现状（先读后写）
- 摸清：技术栈、目录结构、模块与依赖流向、对外接口、数据模型、部署方式、测试现状、已有文档/约定（含已有 `AGENTS.md` / `CLAUDE.md` / `CONTRIBUTING` / 分支模型 / 提交规范）。
- 大项目可**并行多个子代理**分头读：按顶层模块或部署单元切分（每个子代理一个模块，跨模块的公共层单独一份），每份产出同一结构的速览（模块职责 / 对外接口 / 数据模型 / 依赖 / 证据路径），再由主代理汇总去重。
- 产出一份"现状速览"作为后续文档的事实基础（放 `.tmp/`，不入库）。

### 2. 反向提取项目级规格（忠于现状，这是逆向最大价值）
- **每条事实带证据**：已交付 FR、ADR 追认、不变量都要能指回代码——在 `.tmp/` 现状速览里记下对应的文件路径 / 模块 / 入口；找不到证据的不写成已交付，列入缺口清单问用户。
- **`ARCHITECTURE.md`（仓库根）**：把代码里**隐含的架构显式化**——现有模块/数据模型/机制/依赖流向**照实写**。
- **`docs/PRD.md`**：从现有功能反推需求，FR 以**用户可感知的能力**为粒度（一个 FR 对应一组接口 / 命令 / 页面，而不是一个函数或类）；FR 表里**已实现的标 `已交付`**、规划中的标 `计划`；别把已做的写成 TODO。
- **`docs/API.md`**：照现有对外接口写契约。
- **`docs/adr/`**：把代码里**已经成立的重大决策**补记为 ADR（选了什么框架/为何这样分层/关键取舍），状态写 `已接受`、背景注明"现状追认"。**只追认重大的**，别给每个细节写 ADR（会滥用）。
- **`.claude/rules/architecture-invariants.md`**：把现有代码**事实上的边界与禁忌**固化为不变量（据现状，不是空想）。

### 3. 安装通用治理（从权威模板拷贝，按本项目替换占位符）
- 按共用参考 §2 安装映射落地：权威模板的 `claude-rules/*`、`AGENTS.md`、仓库根的 `CONTRIBUTING.md`、`docs/` 下的 adr / specs、`github/*`、`editorconfig.txt`、按栈选 `.gitignore`。迭代技能**不拷入项目**——`sdd-*` 技能随本 `sdd-skills` 插件一同提供、所有 SDD 项目共享，无需单独安装。
- 补 `CHANGELOG.md` / `VERSION` / `SECURITY.md` / `docs/OPERATIONS.md` 骨架（据现状填）。
- **老仓库几乎每个目标路径都可能已存在**：一律按共用参考 §3 合并不覆盖（`.gitignore`、README、CONTRIBUTING、`.github` 模板、`.editorconfig`、`.claude/rules`、`AGENTS.md` / `CLAUDE.md`、`LICENSE`）。
- 按共用参考 §1 写 `.claude/rules/.sdd-version` 来源戳。

### 4. 对齐与缺口（关键：别和现有代码打架）
- 现有约定与模板规则冲突时，**以项目现状为准调整规则**（如代码用英文注释，就别硬塞"必须中文注释"；如已有分支模型 / 合并策略，沿用它改 CONTRIBUTING 与 `git-commit.md`）。
- 把"现状与理想的差距 / 技术债 / 找不到证据的疑点"列成 `.tmp/` 待办（不入库），作为后续用 `sdd-develop-feature`/`sdd-refactor-code` 迭代的输入——**但不在本次改造里动代码**。

### 5. 收尾
- 逐项过共用参考 §5 收尾验收清单，并用 `git status --short`（含已暂存）确认待提交内容只有治理文档 / 规则 / 配置、没有业务代码改动；提交时按路径显式 `git add` 治理文件，不用 `git add -A` / `git commit -a`。
- **不自动 push**；中文提交（`docs: 引入 SDD 治理` / `chore: 落地 SDD 脚手架`）。用户要求交付时按项目 `.claude/rules/git-commit.md` §4.2 / §7.1：在独立分支提交、开 PR 交用户审批，合并一律 squash；项目已有且用户确认保留的不同约定（步骤 4）优先。
- 给用户"接下来"：以后加功能/修复/重构走全局 `sdd-*` 技能（`sdd-develop-feature` 等），文档随代码同步（`doc-sync`）；想先系统性排查问题可用 `sdd-review-code`。
- **逆向期间 / 之后若有绕过流程的提交进来**（队友直推、CI、合并、逆向窗口内的新 commit）→ 用 `sdd-reconcile-external-commits` 增量同步文档。

## 原则
- 忠于现状优先于规整理想；右尺寸（小项目别套重型治理）；不动业务代码。

## 实战提示

通用部分见共用参考 §4；逆向特有的：

- **逆向项目通常没发过版**：追认的已交付 FR 状态填 `已交付`（**不带版本号**），首次发版时由 `sdd-release-version` 回填 `@vX.Y.Z`。已有发版 tag 的，能从 tag / CHANGELOG 对上版本的填 `已交付@vX.Y.Z`，对不上的不带版本号。
- **CHANGELOG 不追溯逆向前的历史能力**：只记一条"引入 SDD 治理"并指向 PRD FR 表（现有能力已用 FR 的 `已交付` 标明），别为旧功能逐条补 changelog；已有 CHANGELOG 的保留原文，只在顶部追加这一条。
- **解释型 / 无构建产物项目**：在 `docs/OPERATIONS.md` / README 与 `CONTRIBUTING` 写明"源码即交付物 + 测试"及实际的构建 / 测试命令（照现有脚本写，别臆造）。

## 红线
逆向改造里顺手改 / 重构业务代码 · 文档写成"希望的样子"而非代码现状 · 无代码证据就标 `已交付` · 给现状每个细节都写 ADR（滥用）· 强推与现有代码冲突的规则 · 覆盖而非合并已有文件 · 自动 push · 未经授权开 PR。
