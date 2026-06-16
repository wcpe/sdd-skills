---
name: sdd-parallel-develop
description: SDD 项目专用(需 docs/PRD.md 与 .claude/rules/)。批量并行开发多个 FR 时使用——分析依赖 → 为可并行的 FR 各创建独立 git worktree → spawn 并行 agent(每个 worktree 内走 sdd-develop-feature 全流程)→ 各自过完成判据 → 按依赖顺序自动 rebase 到主分支。当用户说"批量开 P2 / 并行做 FR-X/Y/Z / 一次性把这几个 FR 都做了 / 用 worktree 同时开几个分支并行迭代 / 让多个 agent 同时各做一个 FR"时触发。**触发本技能即用户明示授权使用 git worktree**(与全局规则"未明确指示不擅自用 worktree"不冲突);rebase 冲突时报告而非强推,不自动合 main,不自动 push。
---

# 并行开发多个 FR

## 核心原则

把"开一批 FR"从串行变并行,要解决四件事:

1. **先分析依赖** —— FR-A 依赖 FR-B 时不可并行,只能 FR-B 落 main 后再开 FR-A。跳过这步必然在后续 rebase 时撞墙。
2. **隔离工作区** —— 每个并行 FR 一个 git worktree(独立目录、独立分支),互不踩。
3. **沿用 `sdd-develop-feature` 强制流程** —— 每个 worktree 里的 agent 走完整流程(对齐 PRD/ARCH → 测试先行 → 实现 → doc-sync → 中文提交);**完成判据硬闸不能绕过**:测试从红转绿 + 涉及实机维度时真机过。
4. **rebase 到 main 后再合** —— 并行结束按依赖顺序 rebase,冲突报告给用户,不强推、不自动合。

并行的目的是**省墙钟时间**,不是省纪律。任何一步降级判据就回到了"agent 谎报完成"的坑。

## 适用边界

- 已是 SDD 项目(有 `docs/PRD.md` 与 `.claude/rules/`),且 PRD 已 realign 过(`sdd-realign-prd` 通过 → 否则依赖关系不可信,并行规划失真)
- 要并行的 FR **≥ 2**;只 1 个直接走 `sdd-develop-feature`,别上 worktree
- 主分支当前**干净、可发布**(commit 已落、无未推改动会拖累 rebase)
- 团队同意:**本技能触发即用户授权用 git worktree**(否则全局规则第 5 条限制并行)

## 强制流程

### 1. 选 FR + 分析依赖

- 列入本批的 FR 来源:① 用户指定(如"并行做 FR-9/10/11");② PRD §4 表里某期(如 P2)所有「计划」状态的 FR。
- 对每个 FR 收集"依赖"信号:
  - PRD 里显式 `依赖: FR-X` 字段
  - 对应 ADR 提到的前置条件
  - spec(`docs/specs/<feature>.md`)里写明的 blocker
- 构建依赖图,圈出**「第一批可并行」**(节点入度=0 或仅依赖已 `已交付@版本` 的 FR)
- 有相互依赖的归入**「第二批/第三批」**,标"等第 N 批合 main 后开"

### 2. 用户确认 + 估算

给用户看一份并行计划(写进 `.tmp/parallel-plan-<日期>.md`,**不入库**):

```
第一批(可并行,N 个):
  - FR-9  灰度  → worktree: ../beacon-fr-9-gray/
  - FR-10 流量调度 → worktree: ../beacon-fr-10-traffic/
  - FR-11 鉴权 → worktree: ../beacon-fr-11-auth/
第二批(等第一批合后):
  - FR-12 (依赖 FR-11)
主分支: master
预计并行 agent 数: 3
```

要点:
- **默认并行上限 4 个**;超过让用户显式确认(`确认并行 N 个`)
- worktree 路径用户可改(默认 `../<repo-name>-fr-<编号>-<slug>/`)
- 让用户确认:授权用 worktree、确认路径、确认依赖图无误

### 3. 预先在 main 上对齐"会被所有并行 agent 同时改"的文件

这一步是**避免可预见的 rebase 冲突**:

- **PRD §4 FR 表**:在 main 上一次性把所有本批 FR 加行(状态 `计划`)或确认已存在。并行 agent 各自只改"自己那行"的状态(`计划` → `开发中`)。
- **CHANGELOG 未发布段**:并行 agent 各自把自己的条目**追加在末尾**;不修改其他人加的行。
- **`docs/specs/<feature>.md`**:每个 FR 一个独立文件,天然不冲突。

> 这步预对齐由本技能在主仓库做一次中文提交(`docs(prd): 预登记 FR-9/10/11 待并行开发`),不直接派给 worktree agent。

### 4. 创建 worktree

对第一批每个 FR:
- 分支命名:`feature/fr-<编号>-<slug>`(slug 来自 FR 简述,英文 kebab-case)
- worktree 路径:`../<repo-name>-fr-<编号>-<slug>/`
- 命令:`git worktree add <path> -b <branch> <main 分支>`
- 创建后 `git worktree list` 自验

### 5. spawn 并行 agent(每个 worktree 一个)

每个 agent 的提示词模板:

```
你在 worktree <path> 中开发 <FR-编号>:<能力描述>。
工作目录已切到该 worktree;主分支基线是 <main>;依赖 FR 已全部 `已交付`。

请按 sdd-develop-feature 全流程走:
1. 读 docs/PRD.md(关注 FR-X 那行)、docs/ARCHITECTURE.md、相关 docs/adr/
2. 非平凡功能:复制 docs/specs/_template.md 到 docs/specs/<feature>.md 写规格
3. PRD §4 把 FR-X 状态从「计划」翻成「开发中」(只改这一行,不动其他人加的行)
4. 涉及架构决策:写新 docs/adr/NNNN-*.md(编号 = 该 worktree 看到的最大 +1)
5. 测试先行(红→绿)→ 实现 → doc-sync → CHANGELOG 末尾追加一行(只加不改)
6. 中文 commit(feat(scope): ...)
7. **完成判据硬闸**:测试从红转绿 + 真机维度真机过(无真机能力时如实报告,标"待真机验",不冒充完成)
8. **完成后不要 rebase、不要 push**——等主控会话统一做

最后用结构化结果汇报:
- 状态:done / blocked / partial
- 证据:测试输出(关键行)、真机结果(如适用)
- 触碰文件清单(供 rebase 风险预判)
- 阻塞或差距(如有)
```

注意:
- 用 Agent 工具或 Workflow 工具的 `parallel()` 并发跑
- agent 跑在各自 worktree(用 `cd <worktree>` 或工具支持的 cwd 切换)
- 不要让 agent 自己 `git push` / `git rebase` / 改 worktree 路径

### 6. 并行结束收集

所有 agent 返回后:
- 汇总每个 FR 的状态、证据、触碰文件清单到 `.tmp/parallel-plan-<日期>.md` 的"执行结果"段
- 标出 `done` / `partial` / `blocked` / `谎报完成`(证据不足或测试未真绿) 
- **未过完成判据的** → 路由到 `sdd-fix-bug` 接手(不阻塞其他 worktree 进入 rebase)

### 7. 按依赖顺序 rebase 到主分支

并行结束 → 主控会话统一做(不让 agent 各自 rebase 避免竞态):

```
git fetch                                  # 拉 main 最新
对每个 done 的 worktree(可同时,无依赖):
  cd <worktree>
  git rebase <main>
  if 冲突:
    git rebase --abort        # 不强推、不 --force
    报告冲突文件给用户,问是否协助手动解
  else:
    rebase 完成,留在 worktree
```

冲突常见来源:
- PRD §4 同行被多 agent 改(本应被第 3 步预对齐避免,若仍冲突 = 预对齐没做透)
- CHANGELOG 段尾顺序(多 agent 同时追加)
- 共同依赖的 ADR 编号撞号

**冲突原则**:本技能**不强推**(不 `--force`、不删除提交、不 `git checkout .`),把冲突文件列给用户、问处理方式。

### 8. 合到 main(不自动)

本技能**默认不合**,产出一份"合并队列"给用户:

```
建议合并顺序(按完成时间/规模/依赖):
  ① feature/fr-9-gray   → 合 main
  ② feature/fr-10-traffic → 合 main
  ③ feature/fr-11-auth  → 合 main(merge / fast-forward 由用户选)
```

让用户决定:
- 逐个合(merge / fast-forward / squash)
- 等下一轮 `sdd-accept-phase` 整期验收再合
- 留作 PR 走 review

### 9. 清理 worktree

用户确认合完后:
- `git worktree remove <path>`(每个)
- 分支可保留也可 `git branch -d`(已合且无引用)

## 与其他技能的关系

- **上游**:`sdd-realign-prd`(确保 PRD 规范、依赖关系清晰)→ 否则并行规划基于不可信 PRD,白做
- **本技能内部**:每个 worktree 内调用 `sdd-develop-feature`(单 FR 强制流程不变,完成判据继承)
- **阻塞处理**:任何 worktree agent 报"未过完成判据" → `sdd-fix-bug` 接手该 worktree,不影响其他
- **下游**:并行批量合 main 后,`sdd-accept-phase` 做整期验收 → `sdd-release-version` 发版

## 注意事项

- **并行 ≠ 越多越好**:默认上限 4;3~5 个 FR 时收益明显,>6 后管理失控,建议拆批做。
- **共享文件预对齐**:见第 3 步——PRD §4 / CHANGELOG / .claude/rules/* 这类全局文件预先在 main 调好。
- **跨 worktree 共享改动只在 main 改**:不要在某个 worktree 内改 `.claude/rules/` 然后期望它"扩散"到其他 worktree。
- **依赖有疑虑时,转串行**:不确定 FR-A 是否依赖 FR-B → 串行(`sdd-develop-feature` 单跑)比并行翻车安全。
- **真机维度的预算**:每个并行 FR 都要真机过 → 提前规划真机环境承载力(如只有一套测试集群,FR-9 真机和 FR-10 真机会互踩)。

## 红线

跳过依赖分析就并行 · 没拿用户授权擅自 `git worktree` · agent 报"完成了"不出示证据就 rebase · 自动 push / 自动合 main · rebase 冲突用 `--force` 或丢弃提交强推 · 并行超过用户确认的上限 · 在 worktree 改全局文件期望"扩散" · 用本技能"塞"单个 FR(直接 `sdd-develop-feature` 即可,不要为加 worktree 而加)。
