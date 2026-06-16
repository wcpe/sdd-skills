---
name: sdd-sync-governance
description: SDD 项目专用(需存在 docs/PRD.md 与 .claude/rules/)。当 sdd-skills 插件更新了治理模板(防漂移规则 / CONTRIBUTING / specs 模板等)、要把这些上游改动同步进【已经 init/retrofit 过】的现有项目时使用。当用户说"sdd 的规则更新了怎么同步到项目 / 把 .claude/rules 升级到最新 / 同步治理模板 / 更新防漂移规则 / 升级 sdd 治理 / 插件更新了规则要不要也更新项目"时触发。它只对账治理层、保留项目定制，不碰业务代码与项目自有文档正文。
---

# 同步治理模板（升级 .claude/rules 等）

## 为什么需要它

`sdd-*` 迭代技能随插件走、`/plugin update` 一次全项目生效；但 `.claude/rules/*`、`docs/CONTRIBUTING.md`、`docs/specs/_template.md` 等是 **init/retrofit 时拷进项目的副本**，之后与上游脱钩——插件更新够不到它们。本技能把上游治理模板的改动**对账式**并回项目，补上这个缺口。

## 核心原则

**对账，不是覆盖。** 这些文件 init 时填过项目特定内容，只把上游"通用治理正文"的增量并进来，**项目定制一律保留**；每处改动给用户过目，不静默改、不碰业务代码。

## 适用边界

- **能干净同步**（通用正文，随上游走）：`.claude/rules/` 里除 `architecture-invariants.md` 外的规则（`testing-and-quality` 除 §2 高风险区）、`git-commit` / `doc-sync` / `decision-alignment` / `scope-discipline` / `comments` / `config-files` / `static-analysis`，以及 `docs/CONTRIBUTING.md`、`docs/specs/_template.md`、`docs/adr/_template.md`。
- **绝不覆盖**（项目自有）：`architecture-invariants.md`、`testing-and-quality §2 高风险区`、一切 `<...>` 占位的填充处。
- **只提建议、不自动写**（活在项目自有文档里的治理注记）：如 PRD §4 / §6、ARCHITECTURE 里的约定——这些嵌在项目已填的文档中，本技能只**列出"上游加了这条，建议你也加"**，由用户走 `sdd-update-docs` 自行决定。

## 强制流程

### 1. 读来源戳、定版本差
- 读项目 `.claude/rules/.sdd-version` 拿到 init 时的 sdd-skills 版本 / commit。**无戳**（老项目）→ 当作未知，做 best-effort 全量对账，并提醒用户本次同步后即写入戳记、以后改走增量。
- 读插件当前版本（`${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json` 的 `version`）。版本相同且无改动 → 告知"已最新"，结束。

### 2. 逐文件对账
- 权威模板在 init-sdd-project 技能的 `templates/`（Claude Code 下 `${CLAUDE_PLUGIN_ROOT}/skills/init-sdd-project/templates/`；Codex / opencode 下为技能目录同级的 `init-sdd-project/templates/`）。
- **三方合并优先**：插件是 git 检出且含戳记 commit 时，用 `git -C <插件根> show <戳记commit>:<模板路径>` 取 base，精确分清"上游改的"与"项目改的"。
- 取不到 base（非 git / 拷贝安装 / 无戳）→ **两方对账**：项目文件 vs 当前模板，逐处差异判断归属（通用治理正文增量 = 上游的；占位 / 填充 = 项目的）。

### 3. 应用增量（保留项目定制）
- 只把上游新增 / 改写的**通用治理正文**并入对应文件；占位、项目填充、`architecture-invariants`、`testing-and-quality §2` 一字不动。
- 拿不准某处归属 → 停下来问，不臆测覆盖。

### 4. 项目自有文档：只产出建议清单
- 对活在 PRD / ARCHITECTURE 等项目文档里的治理注记改动，**不自动写**，列成"建议补充"清单交用户，指向 `sdd-update-docs`。

### 5. 更新来源戳
- 同步完，把 `.claude/rules/.sdd-version` 更新为当前版本 / commit + 日期，下次增量从这里起。

### 6. 验证与提交
- `grep -rn '<[^>]*>'` 自查没把占位带回项目；扫一眼被改文件确认项目定制还在。
- 中文提交 `chore: 同步 sdd 治理模板到 vX`，列出动了哪些规则；不自动 push。

## 与其他技能的关系
- `sdd-reconcile-external-commits` 对账的是"代码 → 项目文档"；本技能对账的是"上游治理模板 → 项目规则"，方向不同。
- 项目自有文档的实际改写走 `sdd-update-docs`；本技能只给建议。

## 红线
拿最新模板整文件覆盖、冲掉项目定制 · 把 `<占位符>` 带回项目 · 改 `architecture-invariants` 或 `testing-and-quality §2` 等项目自有内容 · 把项目文档里的治理注记静默改写（应只提建议）· 自动 push。
