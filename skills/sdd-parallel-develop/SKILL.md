---
name: sdd-parallel-develop
description: SDD 项目专用(需 docs/PRD.md 与 .claude/rules/)。批量并行开发多个 FR 时使用——分析依赖 → 为可并行的 FR 各创建独立 git worktree → spawn 并行 agent(每个 worktree 内走 sdd-develop-feature 全流程)→ 各自过完成判据 → 按开工前与用户确认的集成方式(rebase 或 merge)整合回主分支。当用户说"批量开 P2 / 并行做 FR-X/Y/Z / 一次性把这几个 FR 都做了 / 用 worktree 同时开几个分支并行迭代 / 让多个 agent 同时各做一个 FR"时触发。**触发本技能即用户明示授权使用 git worktree**(与全局规则"未明确指示不擅自用 worktree"不冲突)。**集成方式(rebase / merge)开工前必须问用户、禁止不问就直接用 merge(或 rebase)默认整合**;**整合前先给 main 与所有分支建备份分支(可一键回滚;金贵批次再加 git bundle 离线档)**;冲突时报告而非强推,不自动合 main,不自动 push。
---

# 并行开发多个 FR

## 核心原则

把"开一批 FR"从串行变并行,要解决四件事:

1. **先分析依赖** —— FR-A 依赖 FR-B 时不可并行,只能 FR-B 落 main 后再开 FR-A。跳过这步必然在后续 rebase 时撞墙。
2. **隔离工作区** —— 每个并行 FR 一个 git worktree(独立目录、独立分支),互不踩。
3. **沿用 `sdd-develop-feature` 强制流程** —— 每个 worktree 里的 agent 走完整流程(对齐 PRD/ARCH → 测试先行 → 实现 → doc-sync → 中文提交);**完成判据硬闸不能绕过**:测试从红转绿 + 涉及实机维度时真机过。
4. **整合回 main(方式开工前先问)** —— 集成用 **rebase**(线性历史)还是 **merge**(保留合并提交)由项目的 git 哲学决定,agent 无从替用户拍板,所以**开工前必须问、得到答复才开 worktree;禁止默认/擅自用 merge 或 rebase**。并行结束按依赖顺序、用选定方式整合,冲突报告给用户,不强推、不自动合。

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
集成方式: <rebase / merge —— 开工前必须问用户,未答不开 worktree>
预计并行 agent 数: 3
```

要点:
- **集成方式必须先问**(阻断项):本批整合回主分支用 `rebase`(线性历史、各分支 replay 到 main 之上)还是 `merge`(保留合并提交、历史有分叉)?这取决于项目的 git 哲学(是否在意线性历史、分支是否已 push 给别人),**agent 不替用户拍板**。**在用户明确回答前,不创建 worktree、不开工**;**禁止不问就按 merge 或 rebase 默认**。把答复记进计划的"集成方式"行,后续 §7/§8 严格照此执行。
- **默认并行上限 4 个**;超过让用户显式确认(`确认并行 N 个`)
- worktree 路径用户可改(默认 `../<repo-name>-fr-<编号>-<slug>/`)
- 让用户确认:授权用 worktree、确认路径、确认依赖图无误、**确认集成方式(rebase / merge)**

### 3. 预先在 main 上对齐"会被所有并行 agent 同时改"的文件

这一步是**避免可预见的 rebase 冲突**:

- **PRD §4 FR 表**:在 main 上一次性把所有本批 FR 加行(状态 `计划`)或确认已存在。并行 agent 各自只改"自己那行"的状态(`计划` → `开发中`)。
- **CHANGELOG 未发布段**:并行 agent 各自把自己的条目**追加在末尾**;不修改其他人加的行。
- **`docs/specs/<feature>.md`**:每个 FR 一个独立文件,天然不冲突。
- **ADR 编号预分配**(关键,易踩坑且 git 不会替你报警):并行 agent 各自"看 main 最大 +1"必撞号——更阴的是**不同 slug 的撞号**(如 `0009-auth.md` vs `0009-traffic.md`)**git 会干净合并、不报冲突**,留下两个 ADR-0009。因此**开工前在 main 上确定整批 ADR 号策略**,二选一:
  - **占位名(推荐)**:并行 agent 一律写 `docs/adr/XXXX-<slug>.md`(标题里也用 `ADR-XXXX`),**真号由本技能在 §7/§8 落地那一刻按入 main 顺序统一分配**。最简单,零撞号风险。
  - **预留号**:本技能开工前看 main 最大号(如 `0008`),按计划顺序预留(`FR-9→0009 / FR-10→0010 / FR-11→0011`),写进 `.tmp/parallel-plan-<日期>.md`,**每个 agent 提示词里把它分到的号写死**,绝不准自己算。

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
4. 涉及架构决策:写新 ADR 文件,**编号严格按主控分配**——**禁止自己算"max+1"**(并行下必撞,且不同 slug 时 git 不报警,会静默留两个同号):
   - 若主控分配的是**占位名策略**:文件名用 `docs/adr/XXXX-<slug>.md`、标题写 `# ADR-XXXX`,真号由主控落地时统一替换;
   - 若主控分配的是**预留号策略**:用主控指定的那个具体编号,不准动其他号。
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
- **若用预留号策略**:逐 worktree 验证 ADR 文件名 / 标题用的就是分配号,**不准擅自换号**;有偏差立即纠正再进 §7。
- **若用占位名策略**:确认所有新 ADR 都是 `XXXX-<slug>.md`(没有 agent 偷偷算成 `00NN`)。

### 7. 按确认的集成方式整合到主分支(rebase 或 merge)

并行结束 → 主控会话统一做(不让 agent 各自整合避免竞态)。**用哪种方式以第 2 步用户确认的"集成方式"为准;用户没确认就别动手整合,回去补问。**

**7.0 整合前必做:备份 main 与所有待整合分支(防整合搞坏无法回滚)**

整合那步——**rebase 会重写分支历史、merge 会给 main 加合并提交**——即便 git 没报冲突,也可能"成功但语义搞坏"。所以**动 rebase/merge 之前,先给 main 和每个待整合分支建备份分支,并把 SHA 记进计划文件**,这样任何一步出问题都能**一键还原**,不依赖会过期、看着也乱的 reflog:

```
日期戳=<YYYYMMDD-HHMM>
# 备份落地目标 main（备份分支只建不 checkout，免得手滑提交把它移动）
git branch backup/main-pre-integrate-<日期戳> <main>
# 备份每个 done 的 feature 分支（rebase 会改写它的 commit SHA，尤其要备）
对每个分支: git branch backup/<branch 斜杠转横线>-pre-integrate-<日期戳> <branch>
git branch --list "backup/*pre-integrate-<日期戳>"   # 自验都建了
# 把这些备份分支名 + 对应 SHA 抄进 .tmp/parallel-plan-<日期>.md「备份」段
```

回滚怎么做(列给用户,本技能**不自动 reset**):
- main 被搞乱 → `git reset --hard backup/main-pre-integrate-<日期戳>`
- 某分支 rebase/merge 错了 → `cd <worktree> && git reset --hard backup/<branch>-pre-integrate-<日期戳>`

> 这些是**本地备份分支、不 push**(契合"不自动 push")。**金贵 / 不可重做的批次**可再加一份 repo 外的离线档,删分支 / gc 都不怕:`git bundle create ../<repo>-pre-integrate-<日期戳>.bundle --all`。整批落地确认无误、用户点头后再 `git branch -D backup/*-pre-integrate-<日期戳>` 清理(bundle 档直接删文件),或留着当历史——由用户决定,本技能不擅自删备份。

**若选 `rebase`(线性历史):**
```
git fetch                                  # 拉 main 最新
对每个 done 的 worktree(无依赖可同时):
  cd <worktree>
  git rebase <main>
  冲突 → git rebase --abort（不强推、不 --force），报告冲突文件、问用户
  无冲突 → rebase 完成,留在 worktree(分支已在 main 之上,§8 可 fast-forward 落地)
```

**若选 `merge`(保留合并历史):**
```
git fetch
对每个 done 的 worktree:
  cd <worktree>
  git merge <main>          # 把 main 的新提交并入本分支,消除基线漂移
  冲突 → git merge --abort，报告冲突文件、问用户（禁止 -X ours/theirs 自动蒙混）
  无冲突 → 合并完成,留在 worktree(§8 用 --no-ff 落地保留分支结构)
```

冲突常见来源:
- PRD §4 同行被多 agent 改(本应被第 3 步预对齐避免,若仍冲突 = 预对齐没做透)
- CHANGELOG 段尾顺序(多 agent 同时追加)
- **ADR 编号撞号(易漏)**:同号同 slug → git 报冲突,看得见;**同号不同 slug → git 不报、干净合并、静默留下两个同号 ADR**。**整合前/整合后必须主动跑重号检测**(任何一种集成方式都要跑):
  ```
  # 查重号(应为空输出)
  ls docs/adr/*.md | sed -E 's#.*/0*([0-9]+)-.*#\1#' | sort | uniq -d
  # 查 XXXX 占位号是否还残留没替(若用占位名策略)
  ls docs/adr/XXXX-*.md 2>/dev/null
  ```
  若用**占位名策略**:在此处**按入 main 顺序**(rebase 后的提交时序 / merge 的合并时序)给每个占位 ADR 分配真号,并 `git mv XXXX-foo.md NNNN-foo.md` + 改文件内 `ADR-XXXX` 标题 + grep 全仓库追平所有 `XXXX`/旧编号引用(PRD / ARCHITECTURE / 其它 ADR 的"已被取代"链 / CHANGELOG / 代码注释)。
  若用**预留号策略**且仍撞号:说明哪个 agent 违反了第 5 步指令,先纠正再合;不准默默 `git mv` 蒙混。

**冲突原则(rebase / merge 都适用)**:本技能**不强推、不自动解冲突**(不 `--force`、不删除提交、不 `git checkout .`、不 `-X ours/theirs`),把冲突文件列给用户、问处理方式。**ADR 重号一律以重号检测命令为准,不能依赖 git 状态。**

### 8. 落地到 main(不自动)

本技能**默认不落地**,产出一份"合并队列"给用户。**落地方式跟随第 2 步选定的集成方式,不在这里临时改口:**
- **rebase 路线** → 各分支已在 main 之上,落地用 fast-forward(`git merge --ff-only feature/...`),主分支线性、无多余合并提交。
- **merge 路线** → 落地用合并提交(`git merge --no-ff feature/...`),保留分支结构,便于回溯"这批是一起并行做的"。

```
建议合并顺序(按完成时间/规模/依赖):
  ① feature/fr-9-gray     → 落 main
  ② feature/fr-10-traffic → 落 main
  ③ feature/fr-11-auth    → 落 main(用选定方式:ff-only 或 --no-ff)
```

让用户决定最终时机(方式已定、时机仍由用户拍):
- 逐个落地(按选定方式)
- 等下一轮 `sdd-accept-phase` 整期验收再落地
- 留作 PR 走 review

### 9. 清理 worktree

用户确认合完后:
- `git worktree remove <path>`(每个)
- 分支可保留也可 `git branch -d`(已合且无引用)
- **§7.0 的备份分支**(及 bundle 档,若有):**确认整批落地无误、用户点头后才删**(`git branch -D backup/*-pre-integrate-<日期戳>`;bundle 直接删文件);用户想留作历史就别删。删早了就失去回滚锚点了。

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

跳过依赖分析就并行 · 没拿用户授权擅自 `git worktree` · **没问用户集成方式(rebase / merge)就开工** · **不问就默认 / 擅自用 merge(或 rebase)整合** · agent 报"完成了"不出示证据就整合 · 自动 push / 自动合 main · 冲突用 `--force`、`-X ours/theirs` 或丢弃提交强推 / 自动蒙混 · 并行超过用户确认的上限 · 在 worktree 改全局文件期望"扩散" · 用本技能"塞"单个 FR(直接 `sdd-develop-feature` 即可,不要为加 worktree 而加) · **让并行 agent 各自"max+1"写 ADR 编号** · **整合前后不跑 ADR 重号检测**(git 不会替你报 ADR 静默撞号)· **整合前不给 main 与分支建备份(分支)就 rebase/merge**(出问题无锚点可回滚)· 没等用户确认整批落地无误就删备份分支。
