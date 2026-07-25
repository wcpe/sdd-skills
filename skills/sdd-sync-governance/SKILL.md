---
name: sdd-sync-governance
description: SDD 项目专用(需存在 docs/PRD.md 与 .claude/rules/)。当 sdd-skills 插件更新了治理模板(防漂移规则 / CONTRIBUTING / specs 模板等)、要把这些上游改动同步进【已经 init/retrofit 过】的现有项目时使用。当用户说"sdd 的规则更新了怎么同步到项目 / 把 .claude/rules 升级到最新 / 同步治理模板 / 更新防漂移规则 / 升级 sdd 治理 / 插件更新了规则要不要也更新项目"时触发。它只对账治理层、保留项目定制，不碰业务代码与项目自有文档正文。
---

# 同步治理模板（升级 .claude/rules 等）

## 为什么需要它

`sdd-*` 迭代技能随插件走、`/plugin update` 一次全项目生效；但 `.claude/rules/*`、`docs/CONTRIBUTING.md`、`docs/specs/_template.md` 等是 **init/retrofit 时拷进项目的副本**，之后与上游脱钩——插件更新够不到它们。本技能把上游治理模板的改动**对账式**并回项目，补上这个缺口。

## 核心原则

**对账，不是覆盖。** `skills/init-sdd-project/templates/` 是唯一权威真源；这些文件 init 时填过项目特定内容，只按稳定锚点把上游“通用治理正文”的章节级增量并进来，**项目定制一律保留**。禁止拿最新模板整文件覆盖项目文件；每处改动给用户过目，不静默改、不碰业务代码。

## 适用边界

- **能干净同步**（通用正文，随上游走）：`.claude/rules/README.md` 与 `.claude/rules/` 里除 `architecture-invariants.md` 外的规则（`testing-and-quality` 除 §2 高风险区），包括 `git-commit` / `doc-sync` / `decision-alignment` / `scope-discipline` / `comments` / `config-files` / `test-conventions` / `static-analysis`，以及 `docs/CONTRIBUTING.md`、`docs/specs/_template.md`、`docs/adr/_template.md`。
- **绝不覆盖**（项目自有）：`architecture-invariants.md`、`testing-and-quality §2 高风险区`、一切 `<...>` 占位的填充处。
- **只提建议、不自动写**（活在项目自有文档里的治理注记）：如 PRD §4 / §6、ARCHITECTURE 里的约定——这些嵌在项目已填的文档中，本技能只**列出"上游加了这条，建议你也加"**，由用户走 `sdd-update-docs` 自行决定。

## 强制流程

### 1. 读来源戳、定版本差
- 读项目 `.claude/rules/.sdd-version` 拿到 init 时的 sdd-skills 版本 / commit。**无戳**（老项目）→ 当作未知，做 best-effort 全量对账，并提醒用户本次同步后即写入戳记、以后改走增量。
- 读插件当前版本（`${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json` 的 `version`）。版本相同且无改动 → 告知"已最新"，结束。

### 2. 逐文件对账
- 权威模板固定为 `skills/init-sdd-project/templates/`（Claude Code 下 `${CLAUDE_PLUGIN_ROOT}/skills/init-sdd-project/templates/`；Codex / opencode 下从技能根定位同一路径），不得从其他副本反向同步。模板 `claude-rules/README.md` 对应项目 `.claude/rules/README.md`，其他文件按 init 的既有映射逐一对账。
- 对每个映射先区分四种状态：已有文件的章节增量、上游新增文件、上游删除文件、冲突；不得把“文件不同”直接等同于“整文件替换”。
- **三方合并优先**：插件是 git 检出且含戳记 commit 时，用 `git -C <插件根> show <戳记commit>:<模板路径>` 取 base，精确分清“上游改的”与“项目改的”。
- 取不到 base（非 git / 拷贝安装 / 无戳）→ 继续做**两方降级对账**：project（项目文件）与 upstream（当前模板）逐章节比较，按锚点判断通用治理正文增量与项目填充；不能确认归属时按冲突处理，不因缺少 base 而整文件覆盖。

### 3. 应用章节级增量（保留项目定制）
- 只把 upstream 新增或改写的**通用治理章节、条款、索引行**按标题、相邻标题、表头或既有条款等稳定锚点并入对应位置；占位、项目填充、`architecture-invariants`、`testing-and-quality §2` 一字不动，绝不整文件覆盖。
- 旧项目若缺少 `git-commit.md` 的完整标题锚点 `## 4. 提交历史整理与合并策略（强制）`、`docs/CONTRIBUTING.md` 的完整标题锚点 `### 8.1 提交历史治理（摘要）`，或 `.claude/rules/README.md` 中包含“提交信息规范、逻辑提交粒度、主线历史整理、文档入库边界”的 `git-commit.md` 索引行，将其视为 upstream 新增的通用章节或索引行，展示插入锚点与拟新增正文后再做增量插入；不得借此重排或改写相邻项目内容。
- 若同名章节、同一条款或对应索引已经存在但内容不同，判定为**冲突**：列出 `base`、`project`、`upstream` 三方差异；取不到 base 时明确标为缺失并列出 project / upstream 两方差异，然后停下询问用户，禁止静默覆盖。
- upstream 新增文件只列为候选，说明目标路径与用途，获得用户确认后才创建；upstream 删除文件只报告删除事实和项目当前状态，不自动删除项目文件。
- 其他拿不准归属或锚点的差异同样按冲突处理，停下来问，不臆测覆盖。

### 4. 项目自有文档：只产出建议清单
- 对活在 PRD / ARCHITECTURE 等项目文档里的治理注记改动，**不自动写**，列成"建议补充"清单交用户，指向 `sdd-update-docs`。

### 5. 更新来源戳
- 同步完，把 `.claude/rules/.sdd-version` 更新为当前版本 / commit + 日期，下次增量从这里起。

### 6. 验证与提交
- 验证每个新增章节、条款或索引行都落在记录的锚点之后，尤其逐字检查完整标题“提交历史整理与合并策略（强制）”“提交历史治理（摘要）”及规则 README 中“提交信息规范、逻辑提交粒度、主线历史整理、文档入库边界”的索引描述；同时逐项确认原有项目定制、占位填充和受保护章节仍在且内容未变。
- `grep -rn '<[^>]*>'` 自查没把模板占位带回项目；复核变更清单中没有整文件替换、未确认的新文件或自动删除。
- 中文提交 `chore: 同步 sdd 治理模板到 vX`，列出动了哪些规则；不自动 push。

## 与其他技能的关系
- `sdd-reconcile-external-commits` 对账的是"代码 → 项目文档"；本技能对账的是"上游治理模板 → 项目规则"，方向不同。
- 项目自有文档的实际改写走 `sdd-update-docs`；本技能只给建议。

## 红线
拿最新模板整文件覆盖、冲掉项目定制 · 把 `<占位符>` 带回项目 · 改 `architecture-invariants` 或 `testing-and-quality §2` 等项目自有内容 · 把项目文档里的治理注记静默改写（应只提建议）· 自动 push。
