# SDD Skills

一套「规格驱动开发（SDD, Spec-Driven Development）」的 AI 编码技能集：**2 个脚手架技能** + **16 个 `sdd-*` 迭代技能** + 一套可复用模板。同一套 `SKILL.md` 通用于 **Claude Code**（插件一键装全部）、**OpenAI Codex** 与 **opencode**。让项目**规格先行、文档即代码、跨会话不漂移**。沉淀自实战项目的治理实践。

## 脚手架技能（一次性套上 SDD）

- **[init-sdd-project](skills/init-sdd-project/SKILL.md)**：从零初始化一个 SDD 项目脚手架——项目级规格（PRD/架构/ADR/API）+ 功能级规格（specs）+ 防漂移规则 + 工程化（版本/分支/运维/许可/静态检查），并接入 `sdd-*` 迭代技能。
- **[retrofit-to-sdd](skills/retrofit-to-sdd/SKILL.md)**：把**现有代码库**逆向改造成 SDD 驱动——不改业务代码，从代码反向提取架构、补齐 PRD/ARCHITECTURE/ADR 与治理。

## 迭代技能（日常用，`sdd-` 前缀）

随 `sdd-skills` 插件一同安装，所有 SDD 项目共享、**`/plugin update` 一次更新全项目生效**。`sdd-` 前缀用于和项目内的普通技能区分。每个仅在 SDD 项目（存在 `docs/PRD.md` 与 `.claude/rules/`）里触发。

| 技能 | 用途 |
|---|---|
| `sdd-brainstorming` | 盘清大 / 模糊需求 → 拆成分类 FR（feat/fix/ref…）+ 验收 + 执行方式（不写代码） |
| `sdd-develop-feature` | 开发新需求 / 功能 / 能力 |
| `sdd-fix-bug` | 修复缺陷（先复现测试） |
| `sdd-refactor-code` | 重构，行为不变 |
| `sdd-rollback-change` | 回滚功能 / 改动 / 版本 |
| `sdd-hotfix` | 生产紧急修复 + 补丁版 |
| `sdd-release-version` | 发**正式版**：打 `vX.Y.Z` tag + CHANGELOG 定稿 + bump VERSION（刻进历史） |
| `sdd-publish-snapshot` | 发**开发版 / 试用版**：`-SNAPSHOT+<sha>`，不打 tag、不动 CHANGELOG / VERSION（不算数） |
| `sdd-bump-dependencies` | 升级第三方依赖 |
| `sdd-update-docs` | **纯文档任务**：你主动写 / 改 PRD/ARCH/ADR/README，与某批提交无关 |
| `sdd-reconcile-external-commits` | 把**绕过流程、已提交**的代码改动倒推补进文档（兜底对账 + 标违规漂移） |
| `sdd-accept-phase` | 验收：整期 / 当前版本待发 / 当前一批改动（scope 三选一，发布·合并就绪审计） |
| `sdd-realign-prd` | PRD 结构 / 状态不合规时的诊断 + 工单（不亲自改） |
| `sdd-review-code` | 代码质量 / bug / 安全审查 → 分级 findings + 路由（不亲自改） |
| `sdd-parallel-develop` | 并行开发多个 FR（依赖分析 + worktree + 并行 agent + 自动 rebase） |
| `sdd-sync-governance` | 把**上游更新的治理模板**（`.claude/rules`/CONTRIBUTING/specs 模板…）对账并回现有项目 |

> 这些技能只引用项目内的相对路径（`docs/PRD.md`、`.claude/rules/*` 等），装在哪都按"当前项目"解析——所以可全局共享，且更新时无需逐项目同步。（`sdd-sync-governance` 例外：它还要读插件自带的权威模板与项目对账，正是用来弥补"模板拷进项目后不随插件更新"这一缺口。）

### 易混技能辨析

几组看起来相近、实际分工不同的技能，按一句话判据区分：

**`update-docs` ↔ `reconcile-external-commits` —— 谁驱动的**

- `sdd-update-docs`：**你主动**要写 / 改某篇文档（写 ADR、改 README、整理结构），跟具体某批提交无关。**纯文档任务**才用——若文档变更是伴随代码改的，走 `sdd-develop-feature` / `sdd-fix-bug` 等（它们自带 doc-sync）。
- `sdd-reconcile-external-commits`：由**已发生、绕过流程的代码提交**驱动——队友直接 push / CI 自动提交 / 从别的分支合并进来的 commit 没跑过 doc-sync，文档落后了，把它倒推补回。它比 update-docs 多三件事：**圈定提交区间逐条扫 diff**（不漏提交）、**标出违规与漂移报告你**（绕过流程的代码若破坏不变量不会被静默接受）、**记录"已同步到哪"**。
- **判据**：有没有一批绕过流程的 commit 需要补进文档？有 → `reconcile`；你只是主动想改文档 → `update-docs`。长期用 update-docs 代替 reconcile，等于放弃了"违规 / 漂移检测"这道闸。

**`release-version` ↔ `publish-snapshot` —— 算不算正式**

- `sdd-release-version`：出**正式版**——打 `vX.Y.Z` tag、CHANGELOG 定稿、bump VERSION、FR 翻「已交付@vX.Y.Z」。**刻进历史**。
- `sdd-publish-snapshot`：出**开发版 / 试用版**——`<VERSION>-SNAPSHOT+<sha>`，**不打 tag、不动 CHANGELOG 正式段、不 bump VERSION**。临时给人先试，不算数（通常由 CI 在 main 推送时自动出）。

**`sync-governance` —— 方向不同于 reconcile**

- `sdd-sync-governance`：对账方向是**上游治理模板 → 项目规则**。`.claude/rules/*`、`CONTRIBUTING.md`、`specs 模板`等是 init/retrofit 时**拷进项目的副本**，之后与上游脱钩、插件更新够不着；本技能把上游通用治理正文的增量**对账式**并回项目。**对账不覆盖**：项目定制（`architecture-invariants`、`testing-and-quality §2`、`<占位符>`填充）一律保留，项目文档里的治理注记只提建议、不自动改。和 `reconcile`（代码 → 项目文档）方向相反。

**`brainstorming` —— 日常迭代的前置门**

- `sdd-brainstorming`：用于**大 / 模糊 / 多部分**的需求——先盘问清目的 / 约束 / 验收 / 边界（hard-gate：问清才拆），再拆成**分类 FR**（feat 净新 / fix 修坏 / ref 重构 / 增强 / docs）+ 每条带可验证验收 + 排依赖序，经用户确认后登记 PRD §4、路由到下游技能（单个 → `develop-feature`，多个无依赖 → `parallel-develop`，fix → `fix-bug`）。**本身不写实现代码**。
- **判据**：单个清楚的小功能直接 `sdd-develop-feature`、单个 bug 直接 `sdd-fix-bug`，不必上它；需求大到要先盘清拆解才用。

## 安装

同一套 `skills/`，三种工具都能用。仓库地址：`https://github.com/wcpe/sdd-skills`。

### Claude Code（插件，一键装全部 18 个）

本插件经 **wcpe 组织市场**（[wcpe/claude-plugins](https://github.com/wcpe/claude-plugins)，索引 WCPE 各插件）分发，装后默认 **User 作用域**（所有项目可用）：

```
/plugin marketplace add wcpe/claude-plugins   # wcpe 组织市场（含 sdd-skills + mc-testkit 等）
/plugin install sdd-skills@wcpe               # 格式：<插件名>@<市场名>
/plugin marketplace update wcpe               # 以后更新到最新
```

CLI 等价：`claude plugin marketplace add wcpe/claude-plugins` / `claude plugin install sdd-skills@wcpe`。

### OpenAI Codex

Codex 原生认 `SKILL.md`。最稳的装法是把技能放进 Codex 的技能目录（无需任何清单）：

```
git clone https://github.com/wcpe/sdd-skills
cp -r sdd-skills/skills/* ~/.codex/skills/          # 全局：所有项目可用
# 或仅当前项目：拷进 <项目>/.codex/skills/
```

本仓库也带了 `.codex-plugin/plugin.json`，若你的 Codex 版本支持插件系统，可 `/plugin marketplace add wcpe/claude-plugins` + `/plugin install sdd-skills@wcpe` 安装（随版本而定，以目录安装为准）。

### opencode

opencode 原生认 `SKILL.md`（并兼容 `.claude/skills/`），靠**目录发现**、没有 skill 安装命令——把技能拷进它扫描的目录即可：

```
git clone https://github.com/wcpe/sdd-skills
cp -r sdd-skills/skills/* ~/.config/opencode/skills/   # 全局：所有项目可用
# 或仅当前项目：拷进 <项目>/.opencode/skills/（或 .claude/skills/）
```

> Windows 用 `Copy-Item sdd-skills\skills\* <目标> -Recurse`。脚手架技能自带的 `templates/` 随技能目录一起拷贝，其引用为「本技能目录下的 `templates/`」，三种工具都能定位（Claude Code 下另用 `${CLAUDE_PLUGIN_ROOT}` 绝对寻址）。

## 仓库结构

```
sdd-skills/                         ← 仓库根 = 插件本体（分发经 wcpe 组织市场 wcpe/claude-plugins）
├── .claude-plugin/                 Claude Code 插件清单
│   └── plugin.json
├── .codex-plugin/                  Codex 插件清单
│   └── plugin.json                 skills 指向 ./skills/
├── skills/                         所有技能（SKILL.md，三种工具通用；opencode 靠目录发现）
│   ├── init-sdd-project/
│   │   ├── SKILL.md
│   │   └── templates/              脚手架自带模板：claude-rules · docs 骨架 · github · gitignore · licenses · VERSION
│   ├── retrofit-to-sdd/
│   │   ├── SKILL.md
│   │   └── templates/              同上（各自带一份，自包含）
│   ├── sdd-brainstorming/SKILL.md         ┐
│   ├── sdd-develop-feature/SKILL.md       │
│   ├── sdd-fix-bug/SKILL.md               │
│   ├── sdd-refactor-code/SKILL.md         │
│   ├── sdd-rollback-change/SKILL.md       │
│   ├── sdd-hotfix/SKILL.md                │ 16 个 sdd-* 迭代技能
│   ├── sdd-release-version/SKILL.md       │ （纯流程、无附带资源）
│   ├── sdd-publish-snapshot/SKILL.md      │
│   ├── sdd-bump-dependencies/SKILL.md     │
│   ├── sdd-update-docs/SKILL.md           │
│   ├── sdd-reconcile-external-commits/SKILL.md │
│   ├── sdd-accept-phase/SKILL.md          │
│   ├── sdd-realign-prd/SKILL.md           │
│   ├── sdd-parallel-develop/SKILL.md      │
│   ├── sdd-review-code/SKILL.md           │
│   └── sdd-sync-governance/SKILL.md        ┘
└── README.md
```

## SDD 三个粒度

| 粒度 | 文档 | 作用 |
|---|---|---|
| 项目级 | PRD · ARCHITECTURE · ADR · API | 要什么 / 怎么建 / 为什么这么定 / 契约 |
| 功能级 | `docs/specs/<feature>.md` | 功能开发前的工作规格（命中 spec-checklist 才写） |
| 流程 | `.claude/rules`（项目内）· `sdd-*` 插件技能 | 防漂移红线 + 迭代工作流 |

外加工程化：版本来源与发布渠道、GitHub Flow 分支模型、运维/安全/许可、静态检查。

## 首轮上手：从零到第一个版本

很多人第一次用 SDD 会卡在「init 跑完了，PRD/ADR 都有了，然后呢」。下面是一个新项目从空目录到发出 v0.1.0 的完整路径，按顺序走一遍就懂了。

```
第 0 步：开场（空目录里说一句）
    ┌──────────────────────────────────────────────────────────┐
    │  你：用 SDD 起个新项目 / 给这个空项目套上规格驱动的治理   │
    │            ↓ 自动触发                                     │
    │    init-sdd-project 反问你：                              │
    │      · 项目名、一句话定位、给谁用                         │
    │      · 技术栈、规模、部署形态                             │
    │      · 目标 / 非目标                                      │
    │      · 分期：P1 MVP 做什么、P2 / P3 留什么                │
    │      · 许可（MIT / Apache-2.0 / 内部保留）                │
    └──────────────────────────────────────────────────────────┘
                              │
                              ▼
第 1 步：init 产出（项目骨架就位）
    docs/
      PRD.md            §4 FR 表带"状态"列：计划 / 开发中 / 已交付@版本
                        §7 分期表：P1 / P2 / P3 各自的主题
      ARCHITECTURE.md   模块 / 数据模型 / 机制
      API.md            接口契约
      adr/0001-*.md     init 期间敲定的重大决策（技术栈选型等，"现状追认"）
      specs/_template.md  命中 spec-checklist 的功能开发前复制一份写规格
      OPERATIONS.md · SECURITY.md · CONTRIBUTING.md
    .claude/rules/      防漂移红线（架构不变量、doc-sync、scope-discipline...）
    CHANGELOG.md · VERSION（0.1.0）· README · LICENSE · .gitignore · .github/
    .tmp/实施计划.md    里程碑/任务清单（不入库，会过期）

                              │
                              ▼
第 2 步：开始开发 P1（一个 FR 一轮，循环到 P1 全部"开发中"做完）

    打开 PRD §4，挑 P1 里第一个 FR（比如 FR-1），跟 agent 说：
        "开始开发 FR-1：<那行能力描述>"
            ↓ 自动触发
    sdd-develop-feature 帮你走：
      ① 读 PRD / ARCHITECTURE / 相关 ADR，对齐既定方向
      ② 过 spec-checklist（6 条，命中任一条必写）→ 复制 docs/specs/_template.md
         到 docs/specs/<feature>.md 写清需求 / 设计 / 任务 / 验收（全不中可免）
      ③ PRD §4 把 FR-1 的状态从「计划」翻成「开发中」
      ④ 涉及架构决策 → 新写一条 docs/adr/NNNN-*.md
      ⑤ 测试先行（写失败测试 → 实现 → 红转绿）
      ⑥ doc-sync 自检（PRD / ARCH / API 与代码一致）
      ⑦ CHANGELOG 未发布段 +1 行
      ⑧ 中文提交 feat(scope): …（不自动 push）

    一个 FR 推完 → 挑下一个 FR 重复，直到 P1 那批 FR 都「开发中」完。

                              │
                              ▼
第 3 步：整期验收（P1 自认做完了）

    跟 agent 说："验收一下第一期 / 检查 PRD 完成度"
            ↓ 自动触发
    sdd-accept-phase：
      逐条对 PRD §6 的验收标准核 FR-1 ~ FR-N：
        · 测试绿（单元 + 集成）   ← 必须真跑，不是 SKIP
        · 真机过（涉及实机维度时） ← 测试绿 ≠ 真能用
      产出 .tmp/acceptance-<期>-<日期>.md：逐 FR 通过 / 差距清单。

      不通过的 → sdd-fix-bug 修（写复现测试 → 红 → 绿 + 真机过）
                  或 sdd-update-docs 改 PRD（代码对、文档过时）
                  修完回第 3 步复核。

                              │
                              ▼
第 4 步：发版收口 ─► P1 真正完工

    全部通过 → 跟 agent 说："发版 v0.1.0 / 出 release"
            ↓ 自动触发
    sdd-release-version：
      ① 阻断验证：构建 + 全部测试再跑一遍，任一失败就停
      ② 按 commit 自动定 SemVer（feat→MINOR / fix→PATCH / BREAKING→MAJOR）
      ③ CHANGELOG 未发布段 → ## 0.1.0（YYYY-MM-DD）
      ④ PRD §4 把交付的 FR 状态翻成「已交付@v0.1.0」（保留不删）
      ⑤ 更新根 VERSION
      ⑥ 中文提交 chore(release): 发布 v0.1.0
      ⑦ 打本地 tag v0.1.0（不 push，你审完手动推）

                              │
                              ▼
第 5 步：进入下一期（回到第 2 步开 P2）

    PRD §4 里 P2 的 FR 还是「计划」状态 → 挑一个，对 agent 说"开发 FR-9"
    回到第 2 步循环。期数本身不动——它就那 3~6 个。
```

> **新手最常踩的两个坑**：① init 完没动手做开发，直接想"看看 PRD 完成度"——PRD 是个空架子时没法验收，先按第 2 步把 FR 推到「开发中」完成才能验收。② 把「测试全绿」当「做完了」——这是 `sdd-fix-bug` / `sdd-accept-phase` 的硬闸：涉及实机/集成的 FR 必须真机跑过才算 done，否则别走第 4 步。

## 改造旧项目后：review 与修复

`retrofit-to-sdd` 把现有功能**追认成 `已交付`**，但这是基于"代码存在"、**不是验证过**——可能没测试、甚至有的根本不工作。所以逆向完的下一步不是急着加新功能，而是**先核实这些"已交付"是不是真的，再修问题**。

```
第 1 步：核实"追认的已交付"是不是真的 ── sdd-accept-phase（scope: phase / version）
    对被追认为「已交付」的 FR 逐条核：有测试吗？真机过吗？符合验收吗？
    legacy 项目十有八九暴露：大半 FR「无测试证据」、部分「实现了但不符」、个别「其实没工作」。
    产出 .tmp/acceptance-*.md 差距清单。

第 2 步：审代码本身的质量 ── sdd-review-code（scope: full）
    accept-phase 审"FR 达不达标"，不审代码坏味道 / bug / 安全——这块交 sdd-review-code：
    以项目 .claude/rules/ + 通用维度逐项审，出分级 findings（🔴/🟡/🟢）到 .tmp/，每条带证据。
    大库分模块并行审。

第 3 步：合三处待办成一张修复表
    ① retrofit 当时丢进 .tmp/ 的技术债待办
    ② accept-phase 差距   ③ review-code findings
    分类：坏了(bug) / 丑但能用(债) / 假已交付(没做完)。

第 4 步：按类型修（每类走对应技能）
    行为坏 / 安全漏洞      → sdd-fix-bug      （复现测试 → 红 → 绿 + 真机）
    某 FR 其实没工作过      → sdd-fix-bug      （状态归真：已交付 → 退回 开发中）
    结构烂但行为不变        → sdd-refactor-code（先补特征测试当安全网，再小步重构）
    文档与代码漂移          → sdd-update-docs
    依赖旧 / 有漏洞         → sdd-bump-dependencies

第 5 步：复核 + 收口 ── sdd-accept-phase 再跑 → 差距清零 → sdd-release-version
    出第一个"真·验收过"的版本（追认的 FR 这下才名副其实地 已交付@vX.Y.Z）。
```

> **legacy 铁律**：第 1/2 步往往发现"几乎没测试"。**动老代码前先补特征测试（characterization test）锁住当前行为**（`sdd-refactor-code` §1）——没安全网别改老代码。

> **审查三件套**：`sdd-realign-prd`（审 PRD 规范）· `sdd-accept-phase`（审 FR 达标）· `sdd-review-code`（审 代码质量）——分别审「需求文档 / 交付 / 代码」，三者都只**找 + 报告 + 路由**、不亲自改；修交给 `sdd-fix-bug` / `sdd-refactor-code` 等。

## 完整流程图

一张图把 15 个技能怎么串起来讲清楚。**主循环**是「日常迭代 → 整期收口 → 下一期」；**偏置流**按需触发，不打断主循环。

```
                          入口（一次性，二选一）
                    ┌──────────────────────────────┐
   空项目 ─────────►│   init-sdd-project           │──┐
                    ├──────────────────────────────┤  │
   现有代码 ───────►│   retrofit-to-sdd            │──┘
                    └──────────────────────────────┘
                                  │
              项目就绪：PRD · ARCHITECTURE · ADR · API
              + docs/specs · .claude/rules · CHANGELOG · VERSION
                                  ▼
              ┌──────── 日常迭代循环（按工作项路由）────────┐
              │                                              │
   新需求 ───►│   sdd-develop-feature                        │
   bug ──────►│   sdd-fix-bug                                │
   重构 ─────►│   sdd-refactor-code                          │
   回滚 ─────►│   sdd-rollback-change                        │
   依赖升级 ─►│   sdd-bump-dependencies                      │
   纯文档 ───►│   sdd-update-docs                            │
   外部提交 ─►│   sdd-reconcile-external-commits             │
              │                                              │
              │  每个技能内置三件套：                         │
              │   ① 测试先行（写失败测试 → 红 → 绿）         │
              │   ② doc-sync（代码与 PRD/ARCH/API 不脱节）   │
              │   ③ 中文提交（feat/fix/refactor…，不自动 push）│
              │                                              │
              │  完成判据（硬闸，agent 不能空口说"完成了"）：│
              │   测试从红转绿 + 涉及实机维度时真机过        │
              └──────────────────────┬───────────────────────┘
                                     │
                              一期 FR 都推完
                                     ▼
              ┌──────────── 整期收口 ────────────────────────┐
              │                                              │
              │   sdd-accept-phase                           │
              │   逐条对 PRD §6 / 各 spec 验收               │
              │   （要测试绿 ✚ 真机证据，缺一不可；          │
              │     `go test ./...` 全绿 ≠ 真能用）          │
              │                  │                           │
              │           ┌──────┴──────┐                    │
              │       不过 ▼            ▼ 全过               │
              │     回日常循环修     sdd-release-version     │
              │     （走对应         → 阻断验证（构建+测试） │
              │       sdd-fix-bug    → 按 commit 定 SemVer   │
              │       sdd-update-    → CHANGELOG 未发布段    │
              │       docs 等）        切成 ## X.Y.Z         │
              │                      → FR 状态翻             │
              │                        「已交付@vX.Y.Z」     │
              │                      → 打本地 tag（不 push） │
              │                              │               │
              │                              ▼               │
              │                    下一期 ─► 回日常循环开 P2 │
              └──────────────────────────────────────────────┘

              偏置流（不打断主循环，按需触发）
   给人试用 ────────────► sdd-publish-snapshot（main 自动出快照）
   生产事故 ────────────► sdd-hotfix（从发布 tag 切补丁版，回流 main）
   上游模板更新到项目 ──► sdd-sync-governance（治理基线刷新）
   方向变了 / 决策推翻 ─► sdd-update-docs（改 PRD §7 主题 / 计划 FR
                            + 写新 ADR 取代旧 ADR）
                          + sdd-rollback-change（如要下线已交付能力）
                          → 改完回主循环，用 sdd-develop-feature 按新方向开干
                          ※ 详见下方「方向变了 / 决策推翻 怎么改」
   PRD 不规范 / 结构错位 ► sdd-realign-prd（诊断 + 出工单，不亲自改）
                          → 工单按路由走 sdd-update-docs / sdd-fix-bug
                          → 清零后 sdd-accept-phase 复核基于规范 PRD 的状态
                          ※ 详见下方「PRD 不规范 / 结构错位 怎么纠正」
   批量并行开多个 FR ────► sdd-parallel-develop（依赖分析 + worktree + 并行 agent
                            + 各自跑 sdd-develop-feature + 按依赖顺序 rebase）
                          → rebase 完成后不自动合 main，由你按合并队列决定
```

**几条关键约束**（沉淀自实战，已写进对应技能的红线）：

- **`done` 由验证门背书，不是声明**：测试绿是必要不充分；涉及实机/集成的，必须真跑过——`sdd-fix-bug` §4 与 `sdd-accept-phase` 都明确这条。
- **FR 状态归真**：测试绿冒充验收过、把没真做完的 FR 标 `已交付` 是红线；不过的回循环修，标 `开发中`。
- **稳态层不写过渡话**：`.claude/rules` 与 `sdd-*` 技能只陈述既定事实；"还没做/待落地"放 README 或 `.tmp/`，不入规则。
- **不自动 push**：所有 `release-version` / `hotfix` / 普通提交均只到本地，由你审完再推。

## 期 · 版本 · FR 状态 · ADR 怎么演进

四个概念很容易绕，分开讲一遍——这套规则被各技能（develop-feature / release-version / accept-phase / update-docs / rules）共同遵守。

### 期（P1 / P2 / P3 …）—— 几乎不动

- 是路线图的**粗粒度横轴**，不是版本、不是功能单位。一期含很多 FR、跨很多版本。
- 在 PRD §7 维护，**每期只写"主题/目标"**（例：P1=MVP / P2=治理增强 / P3=规模化），不在这里列 FR 编号——具体哪个 FR 属于哪期由 §4 表的"期"列说了算。
- **什么时候加新期**：开新"大主题"才加。期数总数很少（成熟产品通常 3~6 个）；**产品成熟后（1.0 后稳态迭代）不再加新期**，改按版本（CHANGELOG/tag）+ 功能（FR/specs）组织。
- **滥用信号**：期数往二十、上百涨 = 把"期"当成版本/功能在用了，停下来反思。

#### 期号怎么命名（字面形式自由，性质比字面重要）

SDD 只约束"期"的**概念性质**（粗粒度横轴 / 数量少 / 几乎不动 / 主题驱动），**不规定字面命名**。下面这些都合规，挑一种、在 PRD §7 顶部写明、全项目一致即可：

| 命名风格 | 例 | 适合 |
|---|---|---|
| **优先级简写**（模板默认） | `P1` `P2` `P3` | 多数项目；表格短、有顺序 ⭐ |
| Phase 全词 | `Phase 1` `Phase 2` | 对外 / 给非技术看 |
| 里程碑词 | `MVP` `Beta` `GA` `Scale-out` | 整路线图已想清的产品 |
| 代号 | `Athena` `Bravo` `Charlie` | 大型 / 跨团队 / 对外 |
| 中文 | `一期` `二期` | 全中文文档项目 |

**模板默认 `P1` 起、不用 `P0`**：因为 `P0` 在传统优先级语义里 = "最紧急"，跟"第零期"打架；留 `P0` 给"立项前 PoC / 探索"（不入 PRD，放 `.tmp/`）。团队习惯 P0 起也行——在 PRD §7 写明 `P0 = MVP / P1 = ...`，全项目用同一套。

**别这么干**：
- ❌ 一会儿 `P0` 一会儿 `P1` —— 挑一种
- ❌ `phase01` 零填充（`phase01 → phase10` 跨位丑，你不会真到 10 期）
- ❌ 同时用 P1 当"期号"又当"优先级"造成歧义
- ❌ 中途换命名风格 —— 改一次终身，要换走 `sdd-update-docs`（PRD §7 说明 + §4 FR 表"期"列全部一致替换）

### 版本（SemVer）—— 唯一来源 = 根 `VERSION` 文件

- 由 `sdd-release-version` 按 commit 自动判等级，不是人工拍：

  | 提交内容 | 等级 |
  |---|---|
  | 对外契约 / 配置 / 数据模型不兼容；含 BREAKING | **MAJOR +1** |
  | `feat` 或新增用户可见能力 | **MINOR +1** |
  | `fix` / `perf` / `refactor` / `docs` / `chore` 且无新增能力 | **PATCH +1** |

- **1.0.0 之前为 0.y.z**，接口可不保证向后兼容（破坏性仍要在 CHANGELOG 标明）。
- **一期跨多个版本**：P1 可能从 v0.1.0 一路发到 v0.4.0 才把 P1 全部 FR 翻成「已交付」；不要"一期一版本"地误用。
- **快照 vs 正式**：`sdd-publish-snapshot` 出 `<VERSION>-SNAPSHOT+<sha>`，**不动 VERSION、不动 CHANGELOG 正式段、不打 tag**；`sdd-release-version` 才出 `vX.Y.Z`。

### FR 状态流转 —— PRD §4 表的活索引

```
   加需求 ──►  计划 ──► 开发中 ──► 已交付@vX.Y.Z（保留不删，便于追溯）
                              ▲                    │
                              │  误标 done 的归真   │  发版后此后只
                              │   ─ 从没工作过      │  修不再翻状态
                              │     → 回"开发中"   │
                              │   ─ 真交付过后回归  │
                              │     → 保留版本号    │
                              │       并标"回归损坏" │
                              └─────────────────────┘
```

- **「计划」→「开发中」**：由 `sdd-develop-feature` 触发时翻。
- **「开发中」→「已交付@vX.Y.Z」**：由 `sdd-release-version` 自动翻，**前提是 `sdd-accept-phase` 全过**。手工乱改 = 违反 done 由验证门背书的硬闸。
- **归真**：`sdd-fix-bug` 适用边界写了——发现某 FR 实际是断的但被标已交付，按"从没工作过"还是"真交付过后回归"两种情况处理。
- **已交付保留不删**：哪怕需求被回滚，也写新 ADR 取代旧决策、把 FR 状态回退到「计划」/「开发中」并在 CHANGELOG 记移除，**不删历史交付行**。

### ADR 演进 —— 不可变 + 取代

- 已接受 ADR 的**决策正文一字不改**。决策变了 → 写新 ADR（编号 = 现有最大 +1），旧 ADR 只改状态行为「已被 ADR-NNNN 取代」并加链接，**不删**。
- **只写重大决策**：技术栈选型、核心架构取舍、对外契约约定……。给每个小决定写 ADR = 滥用信号。
- ADR 文件名用英文 slug（`0002-sqlite-storage.md`），标题正文照中文规范。
- 由 `sdd-develop-feature`（涉及架构决策时）/ `sdd-rollback-change`（回滚带 ADR 的能力）/ `sdd-update-docs`（纯文档写新 ADR）触发。

### 一次变更各动哪些（速查）

| 来了什么 | 要动 | 不用动 | 走哪个技能 |
|---|---|---|---|
| **feat 新功能** | PRD §4 加 FR（贴已有期 + `计划`）· 命中 spec-checklist 任一条则写 `docs/specs/<f>.md` · 结构变更动 ARCHITECTURE · 接口变更动 API · CHANGELOG +1 · 加测试 | 期数 · VERSION（发版才动） | `sdd-develop-feature` |
| **fix 修 bug** | CHANGELOG +1 · 复现 + 回归测试 | PRD · 期数 · VERSION · ADR · API | `sdd-fix-bug` |
| **refactor 重构** | 结构变才动 ARCHITECTURE · 测试前后同样全绿 | PRD · 期数 · API · 行为 | `sdd-refactor-code` |
| **rollback 回滚** | FR 状态回退 · 取代相关 ADR · CHANGELOG +1（移除） | 期数 | `sdd-rollback-change` |
| **依赖升级** | 锁文件 · 有感知影响才记 CHANGELOG · 全测试绿 | PRD · 期数 · ADR | `sdd-bump-dependencies` |
| **架构决策** | **ADR +1 条（或取代旧的）** · 更新 ARCHITECTURE | 期数（除非顺带开新阶段） | `sdd-develop-feature` 或 `sdd-update-docs` |
| **发版 release** | **VERSION 改（按 commit 定 SemVer）** · CHANGELOG 分段 · 交付的 FR 翻「已交付@vX.Y.Z」· 打本地 tag | 期数 | `sdd-release-version`（前置：`sdd-accept-phase` 全过） |
| **发快照** | 构建发预发布（`-SNAPSHOT+<sha>`） | VERSION · CHANGELOG · 期数 | `sdd-publish-snapshot` |
| **开新大阶段（罕见）** | PRD §7 加一行主题 + 启用新期号 P4… | —— 这是**唯一**动期数的时候 | `sdd-update-docs` |

> 谁常动 / 谁不动：🔥 高频 = CHANGELOG（几乎每次）、PRD FR 表（每个 feat 加行 / 发版翻状态）、VERSION（每次发版）；❄ 低频 = ADR（只在架构决策时 +1 或取代）；🧊 几乎不动 = **期数**（只在开新大阶段，罕见）、`.claude/rules` / `sdd-*` 技能（动它 = 动根基，要配 ADR）。

### 方向变了 / 决策推翻 怎么改

PRD 是**活路线图**，立项时定的期/FR/架构允许事后改——这是常态，不是错。SDD 不阻止改方向，只要求**改的痕迹可追溯**：不删历史、不偷改 ADR、不靠堆期号扛改动。

分两种情况：

**情况 1：未交付的期 / FR 方向不对（最常见，最简单）**

```
 你：「P2 方向不对，改成 ...」/「FR-9 不要了，换成 FR-9'」
        ↓
 sdd-update-docs
   · 改 PRD §7 P2 / P3 主题描述（本来就几行字，活文档）
   · 改 §4 FR 表里状态还是「计划」的行：删 / 改 / 加 / 调整归属期
        ↓
 改完回主循环 ─► sdd-develop-feature 按新方向开第一个 FR
```

未动过的东西没历史包袱，跟改普通文档一样自由。

**情况 2：已交付的 P1（或某个 FR）整个被推翻**

```
 你：「v0.1.0 那条架构路全错了，要换成 ...」
        ↓
 ① sdd-update-docs 写新 ADR 取代旧 ADR
      · 新 ADR 编号 = 现有最大 +1
      · 旧 ADR 决策正文一字不改，只在状态行加「已被 ADR-NNNN 取代」+ 链接
        ↓
 ② sdd-rollback-change（如已交付能力要下线 / 替换）
      · git revert 不删历史
      · PRD §4 已交付 FR 行保留，状态后加备注
        「已交付@v0.1.0（后被 ADR-NNNN 取代）」
      · CHANGELOG 未发布段记「移除 / 回退 X，原因见 ADR-NNNN」
        ↓
 ③ 回主循环 ─► sdd-develop-feature 按新方向开发；下次 sdd-release-version
   出新版本（按 SemVer，破坏性变更 → MAJOR +1 或 0.x 期 MINOR +1）
```

**不允许的事**（任何情况下都别做）：

| ❌ 不能做 | ✅ 正确做法 |
|---|---|
| 删 PRD §4 已交付的 FR 行 | 保留，状态后加备注「后被 ADR-NNNN 取代」 |
| 改已接受 ADR 的决策正文 | 写新 ADR 取代，旧 ADR 只改状态行 + 链接 |
| 加 P4 / P5 / P6… 去扛"拨乱反正" | 期数几乎不动；改的是期装的内容，不是堆新期号 |
| 在一次会话里又改文档又改业务代码 | 职责分清：`sdd-update-docs` 改文档、`sdd-rollback-change` 改代码、`sdd-develop-feature` 按新方向开发 |

> **为什么这么"啰嗦"**：是为了让"我们曾经这么想过、后来这么改了"成为可追溯事实，不是被悄悄抹掉。半年后有人问"为什么用 X 不用 Y"，答案就在 ADR 链里——而不是"以前试过 Y，但代码看不到了，也没人记得"。**错过的决策也是资产。**

### PRD 不规范 / 结构错位 怎么纠正

上一小节讲的是"想改方向"——主动调整未交付的 PRD 内容。这一小节讲的是另一种情况：**PRD 已经存在，但写法本身就不符合 SDD 规范**——期号 / 优先级 / 版本三套混用、FR 编号重复或跳号、一堆 ✅ done 但验收清单半空（误标 done）、缺 §6 整期验收 / §7 分期主题、bug 记录混进了 PRD……这种 PRD 不能直接拿去 `sdd-accept-phase` 验收，结果会是"看似全过"的假结论。

**先 realign 再 accept-phase 再 release-version**，顺序不能反。

**八类常见症状**：

| # | 症状 | 等级 |
|---|---|---|
| 1 | 期号大节 + 每个 FR 的"优先级"字段 + V1/V2 版本分组 三套体系叠加 | ❗ 阻断 |
| 2 | 期号命名内部不一致（P0 / P1 混用、零填充、中途换风格、期号当版本用） | ❗ 阻断 |
| 3 | FR 编号重复（如两个 FR-017）或跳号（FR-100~106） | ❗ 阻断 |
| 4 | ✅ done 但验收清单半空、状态枚举里有 deprecated / deferred 但从没用过 | ❗ 阻断 |
| 5 | 没有 §7 分期主题（只有期号标签，没说每期"做什么主题"） | ❗ 阻断 |
| 6 | 没有 §6 整期验收（验收只散在每个 FR 下，sdd-accept-phase 扫不到） | 🟡 严重 |
| 7 | PRD 里混了 bug 记录 / 实施任务 / 过程性笔记 | 🟡 严重 |
| 8 | 死字段、过期链接、关联 ADR 已被取代未更新 | 🟢 提示 |

**操作流**：

```
 你：「PRD 不规范，整理一下 / 帮我审一下 PRD 是否合规」
        ↓
 ① sdd-realign-prd（诊断 + 工单，不亲自改）
    扫八类症状 → 产出 .tmp/prd-realign-<日期>.md：
      · 结论速览（符合 / 部分 / 不符合）
      · 逐项诊断（现状 + 目标 + 走哪个技能）
      · 工单清单（按 ❗ / 🟡 / 🟢 排序，checkbox 可勾）
        ↓
 ② 按工单逐项执行（在另一个会话里，每项一个 commit）：
    · sdd-fix-bug  →  误标 done 的 FR 状态归真（最先做，先归真再排期）
    · sdd-update-docs →  FR 编号、期 / 优先级 / 版本错位、§6 §7 补全、
                          移除 bug 记录、死字段清理
    · sdd-rollback-change  →  如有"被取代的已交付能力"要真下线
        ↓
 ③ sdd-accept-phase（基于已规范化的 PRD 复核）
    出新的验收报告，对比修前修后；若仍有差距回 ② 补完
        ↓
 ④ 全过 → sdd-release-version 发版；进下一期
```

**关键顺序**：**先归真状态，再整理结构**——状态决定哪些 FR 现状是 done / in-progress / todo，直接影响 §7 分期归属与 §6 验收策略。先把假 done 翻回去，再排期补 §6，顺序反了会把"待修"FR 当成"已交付"分到旧期。

**别这么干**：

| ❌ 不能做 | ✅ 正确做法 |
|---|---|
| `sdd-realign-prd` 自己批量改 PRD | 它只产工单 + 路由，执行交 `sdd-update-docs` / `sdd-fix-bug` |
| 没归真就重整分期 | 先 `sdd-fix-bug` 把误标 done 的 FR 翻回 `开发中`，再排期 |
| 用新增期号扛改动（P4 = "拨乱反正" / P5 = "重做"） | 期数几乎不动；改的是期装的内容，不是堆新期号 |
| 一个 commit 装完所有修整 | 一项一 commit（`docs(prd): FR 编号去重` / `fix(...): FR-X 状态归真` …），可追溯 |
| 跳过 realign 直接 `sdd-accept-phase` | 不可信的 PRD 当基准会得出假结论，先 realign 再 accept-phase |

## 用法

**先安装本技能集**（见上「安装」，Claude Code / Codex / opencode 三选一），之后在**目标项目**的会话里说出意图即可触发：
- 起新项目：「用 SDD 起个新项目 / 给这个空项目套上规格驱动的治理」→ `init-sdd-project`。
- 改造旧项目：「把这个现有项目改造成 SDD / 逆向生成架构文档和 ADR」→ `retrofit-to-sdd`。
- 日常迭代（任意 SDD 项目里）：「加个功能 / 修个 bug / 重构一下 / 发个版本」→ 对应的 `sdd-*` 全局技能。

脚手架技能会引导你问清项目、生成项目特定规格、安装通用规则；`sdd-*` 迭代技能随插件一同提供。**简单优先**——按项目规模右尺寸，不照搬不需要的重型件。

