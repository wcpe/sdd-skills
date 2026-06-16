# SDD Skills

一套用于「规格驱动开发（SDD, Spec-Driven Development）」的 Claude 技能：**2 个脚手架技能** + **10 个全局迭代技能** + 一套可复用模板。让项目**规格先行、文档即代码、跨会话不漂移**。沉淀自实战项目的治理实践。

## 脚手架技能（一次性套上 SDD）

- **[init-sdd-project](init-sdd-project/SKILL.md)**：从零初始化一个 SDD 项目脚手架——项目级规格（PRD/架构/ADR/API）+ 功能级规格（specs）+ 防漂移规则 + 工程化（版本/分支/运维/许可/静态检查），并接入全局迭代技能。
- **[retrofit-to-sdd](retrofit-to-sdd/SKILL.md)**：把**现有代码库**逆向改造成 SDD 驱动——不改业务代码，从代码反向提取架构、补齐 PRD/ARCHITECTURE/ADR 与治理。

## 全局迭代技能（日常用，`sdd-` 前缀）

装一次到 `~/.claude/skills/`，所有 SDD 项目共享、**更新一次全项目生效**。`sdd-` 前缀用于和项目内的普通技能区分。每个仅在 SDD 项目（存在 `docs/PRD.md` 与 `.claude/rules/`）里触发。

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

> 这些技能只引用项目内的相对路径（`docs/PRD.md`、`.claude/rules/*` 等），装在哪都按"当前项目"解析——所以可全局共享，且更新时无需逐项目同步。

## 仓库结构

```
sdd-skills/
├── init-sdd-project/
│   ├── SKILL.md
│   └── templates/          该技能自带的全套模板（随技能打包，自包含）
│       ├── claude-rules/   防漂移规则 → 装到目标项目 .claude/rules/
│       ├── docs/           CONTRIBUTING · adr · specs · _skeletons 文档骨架
│       ├── github/         PR / Issue 模板
│       └── gitignore-templates/ · editorconfig.txt · licenses/ · VERSION
├── retrofit-to-sdd/
│   ├── SKILL.md
│   └── templates/          同上（每个脚手架技能各自带一份，自包含）
├── sdd-develop-feature/SKILL.md     ┐
├── sdd-fix-bug/SKILL.md             │
├── sdd-refactor-code/SKILL.md       │
├── sdd-rollback-change/SKILL.md     │
├── sdd-hotfix/SKILL.md              │ 10 个全局迭代技能
├── sdd-release-version/SKILL.md     │ （纯流程、无附带资源，
├── sdd-publish-snapshot/SKILL.md    │  装到 ~/.claude/skills/）
├── sdd-bump-dependencies/SKILL.md   │
├── sdd-update-docs/SKILL.md         │
├── sdd-reconcile-external-commits/SKILL.md ┘
└── README.md
```

## SDD 三个粒度

| 粒度 | 文档 | 作用 |
|---|---|---|
| 项目级 | PRD · ARCHITECTURE · ADR · API | 要什么 / 怎么建 / 为什么这么定 / 契约 |
| 功能级 | `docs/specs/<feature>.md` | 非平凡功能开发前的工作规格 |
| 流程 | `.claude/rules`（项目内）· 全局 `sdd-*` 技能 | 防漂移红线 + 迭代工作流 |

外加工程化：版本来源与发布渠道、GitHub Flow 分支模型、运维/安全/许可、静态检查。

## 用法

**先一次性安装 10 个全局 `sdd-*` 技能**（见下「安装」），之后在**目标项目**的会话里说出意图即可触发：
- 起新项目：「用 SDD 起个新项目 / 给这个空项目套上规格驱动的治理」→ `init-sdd-project`。
- 改造旧项目：「把这个现有项目改造成 SDD / 逆向生成架构文档和 ADR」→ `retrofit-to-sdd`。
- 日常迭代（任意 SDD 项目里）：「加个功能 / 修个 bug / 重构一下 / 发个版本」→ 对应的 `sdd-*` 全局技能。

脚手架技能会引导你问清项目、生成项目特定规格、安装通用规则，并校验全局迭代技能已就位。**简单优先**——按项目规模右尺寸，不照搬不需要的重型件。

## 安装

**全局迭代技能（装一次，所有项目共用）**——把 10 个 `sdd-*/` 目录拷进 `~/.claude/skills/`：

```bash
cp -r sdd-* ~/.claude/skills/        # 或在 Windows 上拷到 %USERPROFILE%\.claude\skills\
```

它们是纯流程技能（无附带资源），更新时改本仓库再重拷即可，所有 SDD 项目自动用上最新版。

**脚手架技能（init / retrofit）**——各自**自包含**（`SKILL.md` + 自带 `templates/`），可独立打包分发：

- **打成 `.skill` 安装包**：在 skill-creator 目录下运行 `python -m scripts.package_skill <仓库路径>/init-sdd-project`，得到 `init-sdd-project.skill`；`retrofit-to-sdd` 同理。把 `.skill` 文件发给别人，在 Claude 里安装即可。
- **直接拷目录**：把 `init-sdd-project/`（含 `templates/`）整个拷进 `~/.claude/skills/`。

> init / retrofit 各带一份相同的 `templates/`（防漂移规则 + 文档骨架等）——这是 skill 自包含规范的代价（资源必须在技能目录内），换来可独立打包、单独安装。迭代技能已抽成全局，故不再随模板重复。

