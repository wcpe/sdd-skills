---
name: retrofit-to-sdd
description: 把一个已存在的代码库逆向改造成 SDD（规格驱动开发）项目时使用。当用户说"给现有项目补上 SDD 治理、把这个老项目改成规格/文档驱动、逆向生成架构文档和 ADR、给祖传代码套上防漂移规则和迭代技能、让这个项目以后按 SDD 迭代"时触发。它不改业务代码，而是从现有代码反向提取架构、补齐 PRD/ARCHITECTURE/ADR 与防漂移规则，并接入全局 SDD 迭代技能。
---

# 逆向改造为 SDD 项目

## 最重要的原则

**不动业务代码、不改行为。** 逆向改造只**新增治理文档/规则/技能**，从既有代码反向提取"现状真相"，让以后的迭代有规可循。第一版文档要**忠于代码现状**，不是"你希望它变成的样子"——理想与现状的差距记成待办，不在这次顺手改。

模板在本技能目录的 **`templates/`** 下（插件安装后其绝对路径为 `${CLAUDE_PLUGIN_ROOT}/skills/retrofit-to-sdd/templates/`；下文 `templates/` 均指此处）。

## 强制流程

### 1. 勘察现状（先读后写）
- 摸清：技术栈、目录结构、模块与依赖流向、对外接口、数据模型、部署方式、测试现状、已有文档/约定。
- 大项目可**并行多个子代理**分头读不同子系统，再汇总。
- 产出一份"现状速览"作为后续文档的事实基础（放 `.tmp/`，不入库）。

### 2. 反向提取项目级规格（忠于现状，这是逆向最大价值）
- **`docs/ARCHITECTURE.md`**：把代码里**隐含的架构显式化**——现有模块/数据模型/机制/依赖流向**照实写**。
- **`docs/PRD.md`**：从现有功能反推需求，FR 表里**已实现的标 `已交付`**、规划中的标 `计划`；别把已做的写成 TODO。
- **`docs/API.md`**：照现有对外接口写契约。
- **`docs/adr/`**：把代码里**已经成立的重大决策**补记为 ADR（选了什么框架/为何这样分层/关键取舍），状态写 `已接受`、背景注明"现状追认"。**只追认重大的**，别给每个细节写 ADR（会滥用）。
- **`.claude/rules/architecture-invariants.md`**：把现有代码**事实上的边界与禁忌**固化为不变量（据现状，不是空想）。

### 3. 安装通用治理（从 `templates/` 拷贝，按本项目替换占位符）
同 `init-sdd-project` 第 3 步：
- `templates/claude-rules/*` → `.claude/rules/`。迭代技能**不拷入项目**——`sdd-*` 技能随本 `sdd-skills` 插件一同提供、所有 SDD 项目共享，无需单独安装。
- `templates/docs/{CONTRIBUTING, adr/README, specs/*}` → `docs/`；`templates/github/*`、`editorconfig.txt`、按栈选 `.gitignore`。
- 补 `CHANGELOG.md` / `VERSION` / `SECURITY.md` / `docs/OPERATIONS.md` 骨架（据现状填）。
- **`.gitignore` 已含 `/.tmp/` 等**——若项目已有 `.gitignore`，是合并不是覆盖。

### 4. 对齐与缺口（关键：别和现有代码打架）
- 现有约定与模板规则冲突时，**以项目现状为准调整规则**（如代码用英文注释，就别硬塞"必须中文注释"；如已有分支模型，沿用它改 CONTRIBUTING）。
- 把"现状与理想的差距 / 技术债"列成 `.tmp/` 待办（不入库），作为后续用 `sdd-develop-feature`/`sdd-refactor-code` 迭代的输入——**但不在本次改造里动代码**。

### 5. 收尾
- **不自动 push**；中文提交（`docs: 引入 SDD 治理` / `chore: 落地 SDD 脚手架`）。
- 给用户"接下来"：以后加功能/修复/重构走全局 `sdd-*` 技能（`sdd-develop-feature` 等），文档随代码同步（`doc-sync`）。
- **逆向期间 / 之后若有绕过流程的提交进来**（队友直推、CI、合并、逆向窗口内的新 commit）→ 用 `sdd-reconcile-external-commits` 增量同步文档。

## 原则
- 忠于现状优先于规整理想；右尺寸（小项目别套重型治理）；不动业务代码。

## 实战提示（固化测试反馈）

- **`_skeletons/` 只是生成蓝本，不整目录拷入**；据它生成各文档 + 把 `_skeletons/ADR.md` 拷成 `docs/adr/_template.md` 供以后用。
- **占位符扫干净**：装完 `grep -rn '<[^>]*>'` 自查（`CONTRIBUTING` 的 `<各可交付物>` / `<各组件测试全绿>`、`architecture-invariants` / `git-commit` / `LICENSE` 等都有；迭代技能已全局化、不在项目内，不必扫）；填完 `architecture-invariants` 删掉模板自带的填写引导。
- **逆向项目通常没发过版**：追认的已交付 FR 状态填 `已交付`（**不带版本号**），首次发版时由 `sdd-release-version` 回填 `@vX.Y.Z`。
- **CHANGELOG 不追溯逆向前的历史能力**：只记一条"引入 SDD 治理"并指向 PRD FR 表（现有能力已用 FR 的 `已交付` 标明），别为旧功能逐条补 changelog。
- **右尺寸**：解释型 / 无构建产物项目 → 在 `docs/OPERATIONS.md` / README 与 `CONTRIBUTING` 写明"源码即交付物 + 测试"（全局 `sdd-release-version` / `sdd-publish-snapshot` 从项目文档读构建 / 测试命令）；无 YAML 配置 → 可不装 `config-files.md`；现有约定与模板规则冲突时以**现状**为准。
- **`.gitignore`**：合并不覆盖既有，并按本项目运行期产物（SQLite `.db`、日志、上传目录等）补忽略项。
- **ADR 文件名用英文 slug**。

## 红线
逆向改造里顺手改 / 重构业务代码 · 文档写成"希望的样子"而非代码现状 · 给现状每个细节都写 ADR（滥用）· 强推与现有代码冲突的规则 · 覆盖而非合并已有 `.gitignore` · 自动 push。
