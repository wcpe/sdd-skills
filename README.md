# SDD Skills

一套「规格驱动开发（SDD, Spec-Driven Development）」的 AI 编码技能集：**2 个脚手架技能** + **12 个 `sdd-*` 迭代技能** + 一套可复用模板。同一套 `SKILL.md` 通用于 **Claude Code**（插件一键装全部）、**OpenAI Codex** 与 **opencode**。让项目**规格先行、文档即代码、跨会话不漂移**。沉淀自实战项目的治理实践。

## 脚手架技能（一次性套上 SDD）

- **[init-sdd-project](skills/init-sdd-project/SKILL.md)**：从零初始化一个 SDD 项目脚手架——项目级规格（PRD/架构/ADR/API）+ 功能级规格（specs）+ 防漂移规则 + 工程化（版本/分支/运维/许可/静态检查），并接入 `sdd-*` 迭代技能。
- **[retrofit-to-sdd](skills/retrofit-to-sdd/SKILL.md)**：把**现有代码库**逆向改造成 SDD 驱动——不改业务代码，从代码反向提取架构、补齐 PRD/ARCHITECTURE/ADR 与治理。

## 迭代技能（日常用，`sdd-` 前缀）

随 `sdd-skills` 插件一同安装，所有 SDD 项目共享、**`/plugin update` 一次更新全项目生效**。`sdd-` 前缀用于和项目内的普通技能区分。每个仅在 SDD 项目（存在 `docs/PRD.md` 与 `.claude/rules/`）里触发。

| 技能 | 用途 |
|---|---|
| `sdd-develop-feature` | 开发新需求 / 功能 / 能力 |
| `sdd-fix-bug` | 修复缺陷（先复现测试） |
| `sdd-refactor-code` | 重构，行为不变 |
| `sdd-rollback-change` | 回滚功能 / 改动 / 版本 |
| `sdd-hotfix` | 生产紧急修复 + 补丁版 |
| `sdd-release-version` | 发布正式版本 / 打 tag |
| `sdd-publish-snapshot` | 发快照 / 预发布 / 开发版 |
| `sdd-bump-dependencies` | 升级第三方依赖 |
| `sdd-update-docs` | 纯文档任务（PRD/ARCH/ADR…） |
| `sdd-reconcile-external-commits` | 同步绕过流程的提交到文档 |
| `sdd-accept-phase` | 整期 / 里程碑验收 · 发版就绪审计 |
| `sdd-sync-governance` | 把上游治理模板同步进现有项目 |

> 这些技能只引用项目内的相对路径（`docs/PRD.md`、`.claude/rules/*` 等），装在哪都按"当前项目"解析——所以可全局共享，且更新时无需逐项目同步。（`sdd-sync-governance` 例外：它还要读插件自带的权威模板与项目对账，正是用来弥补"模板拷进项目后不随插件更新"这一缺口。）

## 仓库结构

```
sdd-skills/                         ← 仓库根 = 插件 = marketplace
├── .claude-plugin/                 Claude Code 插件清单
│   ├── plugin.json
│   └── marketplace.json            市场清单（source: "."）
├── .codex-plugin/                  Codex 插件清单
│   └── plugin.json                 skills 指向 ./skills/
├── skills/                         所有技能（SKILL.md，三种工具通用；opencode 靠目录发现）
│   ├── init-sdd-project/
│   │   ├── SKILL.md
│   │   └── templates/              脚手架自带模板：claude-rules · docs 骨架 · github · gitignore · licenses · VERSION
│   ├── retrofit-to-sdd/
│   │   ├── SKILL.md
│   │   └── templates/              同上（各自带一份，自包含）
│   ├── sdd-develop-feature/SKILL.md       ┐
│   ├── sdd-fix-bug/SKILL.md               │
│   ├── sdd-refactor-code/SKILL.md         │
│   ├── sdd-rollback-change/SKILL.md       │
│   ├── sdd-hotfix/SKILL.md                │ 12 个 sdd-* 迭代技能
│   ├── sdd-release-version/SKILL.md       │ （纯流程、无附带资源）
│   ├── sdd-publish-snapshot/SKILL.md      │
│   ├── sdd-bump-dependencies/SKILL.md     │
│   ├── sdd-update-docs/SKILL.md           │
│   ├── sdd-reconcile-external-commits/SKILL.md │
│   ├── sdd-accept-phase/SKILL.md          │
│   └── sdd-sync-governance/SKILL.md        ┘
└── README.md
```

## SDD 三个粒度

| 粒度 | 文档 | 作用 |
|---|---|---|
| 项目级 | PRD · ARCHITECTURE · ADR · API | 要什么 / 怎么建 / 为什么这么定 / 契约 |
| 功能级 | `docs/specs/<feature>.md` | 非平凡功能开发前的工作规格 |
| 流程 | `.claude/rules`（项目内）· `sdd-*` 插件技能 | 防漂移红线 + 迭代工作流 |

外加工程化：版本来源与发布渠道、GitHub Flow 分支模型、运维/安全/许可、静态检查。

## 用法

**先安装本技能集**（见下「安装」，Claude Code / Codex / opencode 三选一），之后在**目标项目**的会话里说出意图即可触发：
- 起新项目：「用 SDD 起个新项目 / 给这个空项目套上规格驱动的治理」→ `init-sdd-project`。
- 改造旧项目：「把这个现有项目改造成 SDD / 逆向生成架构文档和 ADR」→ `retrofit-to-sdd`。
- 日常迭代（任意 SDD 项目里）：「加个功能 / 修个 bug / 重构一下 / 发个版本」→ 对应的 `sdd-*` 全局技能。

脚手架技能会引导你问清项目、生成项目特定规格、安装通用规则；`sdd-*` 迭代技能随插件一同提供。**简单优先**——按项目规模右尺寸，不照搬不需要的重型件。

## 安装

同一套 `skills/`，三种工具都能用。仓库地址：`https://github.com/wcpe/sdd-skills`。

### Claude Code（插件，一键装全部 14 个）

本仓库自身即 marketplace，装后默认 **User 作用域**（所有项目可用）：

```
/plugin marketplace add wcpe/sdd-skills      # git 地址或本地路径均可
/plugin install sdd-skills@sdd-skills        # 格式：<插件名>@<市场名>，本仓库二者同名
/plugin marketplace update sdd-skills        # 以后更新到最新
```

CLI 等价：`claude plugin marketplace add wcpe/sdd-skills` / `claude plugin install sdd-skills@sdd-skills`。

### OpenAI Codex

Codex 原生认 `SKILL.md`。最稳的装法是把技能放进 Codex 的技能目录（无需任何清单）：

```
git clone https://github.com/wcpe/sdd-skills
cp -r sdd-skills/skills/* ~/.codex/skills/          # 全局：所有项目可用
# 或仅当前项目：拷进 <项目>/.codex/skills/
```

本仓库也带了 `.codex-plugin/plugin.json`，若你的 Codex 版本支持插件系统，可 `/plugin marketplace add wcpe/sdd-skills` + `/plugin install sdd-skills@sdd-skills` 安装（随版本而定，以目录安装为准）。

### opencode

opencode 原生认 `SKILL.md`（并兼容 `.claude/skills/`），靠**目录发现**、没有 skill 安装命令——把技能拷进它扫描的目录即可：

```
git clone https://github.com/wcpe/sdd-skills
cp -r sdd-skills/skills/* ~/.config/opencode/skills/   # 全局：所有项目可用
# 或仅当前项目：拷进 <项目>/.opencode/skills/（或 .claude/skills/）
```

> Windows 用 `Copy-Item sdd-skills\skills\* <目标> -Recurse`。脚手架技能自带的 `templates/` 随技能目录一起拷贝，其引用为「本技能目录下的 `templates/`」，三种工具都能定位（Claude Code 下另用 `${CLAUDE_PLUGIN_ROOT}` 绝对寻址）。

