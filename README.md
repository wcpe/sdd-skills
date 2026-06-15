# SDD Skills

两个用于「规格驱动开发（SDD, Spec-Driven Development）」的 Claude 技能 + 一套可复用模板。让项目**规格先行、文档即代码、跨会话不漂移**。沉淀自实战项目的治理实践。

## 两个技能

- **[init-sdd-project](init-sdd-project/SKILL.md)**：从零初始化一个 SDD 项目脚手架——项目级规格（PRD/架构/ADR/API）+ 功能级规格（specs）+ 防漂移规则 + 迭代技能 + 工程化（版本/分支/运维/许可/静态检查）。
- **[retrofit-to-sdd](retrofit-to-sdd/SKILL.md)**：把**现有代码库**逆向改造成 SDD 驱动——不改业务代码，从代码反向提取架构、补齐 PRD/ARCHITECTURE/ADR 与治理。

## 仓库结构

```
sdd-skills/
├── init-sdd-project/
│   ├── SKILL.md
│   └── templates/          该技能自带的全套模板（随技能打包，自包含）
│       ├── claude-rules/   防漂移规则 → 装到目标项目 .claude/rules/
│       ├── claude-skills/  迭代工作流技能 → 装到 .claude/skills/
│       ├── docs/           CONTRIBUTING · adr · specs · _skeletons 文档骨架
│       ├── github/         PR / Issue 模板
│       └── gitignore-templates/ · editorconfig.txt · licenses/ · VERSION
├── retrofit-to-sdd/
│   ├── SKILL.md
│   └── templates/          同上（每个技能各自带一份，自包含）
└── README.md
```

## SDD 三个粒度

| 粒度 | 文档 | 作用 |
|---|---|---|
| 项目级 | PRD · ARCHITECTURE · ADR · API | 要什么 / 怎么建 / 为什么这么定 / 契约 |
| 功能级 | `docs/specs/<feature>.md` | 非平凡功能开发前的工作规格 |
| 流程 | `.claude/rules` · `.claude/skills` | 防漂移红线 + 迭代工作流 |

外加工程化：版本来源与发布渠道、GitHub Flow 分支模型、运维/安全/许可、静态检查。

## 用法

在**目标项目**的会话里说出意图即可触发：
- 起新项目：「用 SDD 起个新项目 / 给这个空项目套上规格驱动的治理」→ `init-sdd-project`。
- 改造旧项目：「把这个现有项目改造成 SDD / 逆向生成架构文档和 ADR」→ `retrofit-to-sdd`。

技能会引导你问清项目、生成项目特定规格、安装通用规则与技能。**简单优先**——按项目规模右尺寸，不照搬不需要的重型件。

## 安装

每个技能**自包含**（`SKILL.md` + 自带 `templates/`），可独立打包分发：

- **打成 `.skill` 安装包**：在 skill-creator 目录下运行 `python -m scripts.package_skill <仓库路径>/init-sdd-project`，得到 `init-sdd-project.skill`；`retrofit-to-sdd` 同理。把 `.skill` 文件发给别人，在 Claude 里安装即可。
- **直接拷目录**：把 `init-sdd-project/`（含 `templates/`）整个拷进 `~/.claude/skills/` 或某项目的 `.claude/skills/`。

> 两个技能各自带一份相同的 `templates/`——这是 skill 自包含规范的代价（资源必须在技能目录内），换来可独立打包、单独安装。

