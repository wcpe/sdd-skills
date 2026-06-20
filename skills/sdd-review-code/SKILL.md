---
name: sdd-review-code
description: SDD 项目专用(需 docs/PRD.md 与 .claude/rules/)。对代码库做质量 / bug / 安全审查时使用——系统性地找问题、定级、路由到修复技能,本身不改代码。当用户说"review 一下这个项目 / 审一下代码 / 找找 bug 和坏味道 / 代码质量审查 / 安全审一遍 / 逆向成 SDD 后想 review 并修问题 / 审这个模块 / PR 合并前审代码 / 这块代码有没有问题"时触发。findings 要有证据(file:line + 为什么是问题 + 能否真触发),分级产出报告到 .tmp/(不入库),按类型路由到 sdd-fix-bug / sdd-refactor-code / sdd-bump-dependencies / sdd-update-docs;不顺手改业务代码。
---

# 代码审查（review）

## 核心原则

代码 review = **系统性地"找问题 + 定级 + 路由"**,不顺手修。两条命脉:

1. **要证据,不凭感觉** —— 每条 finding 给得出 `file:line`、说得清"为什么是问题"、判得了"能不能真触发 / 影响多大"。说不清就标"待确认",别当实锤——**宁可漏报,也别用误报淹没真问题**。
2. **审 / 修分离** —— 本技能**只判定 + 报告 + 路由**(同 `sdd-realign-prd` / `sdd-accept-phase` 的分工),修由 `sdd-fix-bug` / `sdd-refactor-code` 等接手。review 时动手改老代码,既破坏分离、又常常没有测试安全网。

## 适用边界

- 审的是**代码本身的质量 / 正确性 / 安全**——区别于 `sdd-accept-phase`(审 FR 是否达标、对着 PRD)与 `sdd-realign-prd`(审 PRD 是否规范)。三者一组:**审需求文档 / 审交付达标 / 审代码质量**。
- 最典型场景:**`retrofit-to-sdd` 之后第一次系统性 review**(追认的"已交付"从没经代码质量审视),或日常 PR / 模块审查。
- **基准:先用项目自己的 `.claude/rules/`**(`architecture-invariants` 是本项目权威红线),再叠加下面的通用维度。**不拿项目没采用的外部风格当问题刷数量**。

## 强制流程

### 1. 圈定 scope（三选一）
- **`full`(默认,整库)** —— 适合 retrofit 后首次全面 review。**大库分模块并行**(Agent / Workflow `parallel()`,每个子代理审一个子系统,再汇总去重)。
- **`changes`** —— 一段 git diff(PR / 最近提交);base 约定同 `sdd-accept-phase`(上个 tag..HEAD 或指定)。
- **`module`** —— 指定路径 / 包。

### 2. 先读项目的权威标准
- 读 `.claude/rules/*`(尤其 `architecture-invariants`:本项目的分层 / 禁用件 / 红线)、`docs/ARCHITECTURE.md`、`docs/adr/*`。
- 这些是"这个项目认什么"的真源——review **以它们为第一基准**,避免拿外部教条硬套到一个有意做了别的取舍的项目上。

### 3. 按维度逐项审（每条要证据）

先按项目 `.claude/rules/` 审,再叠加这些通用维度:

- **正确性 / bug**:逻辑 / 边界 / off-by-one、并发竞态、错误处理(吞异常、catch 顶层只打印、用异常控正常流)、资源泄露(IO / 连接没关)、空值 / 解引用。
- **架构 / 分层**:违反 `architecture-invariants`、循环依赖、上帝类、贫血模型、跨层直调、为可变逻辑堆 if/switch(违反开闭)。
- **安全**:硬编码密钥 / 令牌 / 内网地址 / 证书、未校验或未转义的外部输入(注入面)、敏感信息 / 完整凭据进日志或错误响应。
- **性能**:循环内 DB / 远程 / 高开销 IO(N+1)、可能超内存的大数据全量加载、请求主线程上的长阻塞。
- **坏味道**:长方法(>30 行)、深嵌套(>3 层)、复制粘贴(出现 ≥2 次的相似逻辑)、魔法值 / 硬编码、死代码 / 孤儿导入。
- **测试 / 可测试性**:关键路径 / 高风险区无测试、强耦合导致难测、测试质量差(断言空洞、被 skip、靠注释跳过)。
- **依赖**:过期或有安全公告的依赖、功能重叠的包、被静默引入的破坏性版本。
- **可观测性 / 日志**:日志级别滥用、`print` / `console.log` / `System.out` 残留、日志缺上下文(请求 ID / 关键参数)或泄露隐私。

> 对"可能是 bug 但不确定能否真触发"的,**追一下调用链或构造一个最小场景**确认再定级;高危项(安全 / 数据损坏 / 并发)尤其要从证据出发,不要靠想象。

### 4. 产出分级 findings 报告
- 写 `.tmp/review-<scope>-<日期>.md`(**不入库**)。
- 每条 finding:**编号 · 位置 `file:line` · 问题 · 影响 / 为什么 · 严重级 · 建议修法 · 路由技能**。
- 严重级三档:**🔴 blocking**(会出错 / 安全 / 数据损坏 / 阻断发版)· **🟡 major**(该修,影响明显)· **🟢 minor**(改善)。
- 给一句 review 结论 + 各级数量统计 + 优先级排序。

### 5. 路由（本技能不改代码）

| finding 类型 | 走哪个修复技能 |
|---|---|
| 行为坏 / 会出错 / **安全漏洞(可被利用)** | `sdd-fix-bug`(先写复现测试 → 红 → 绿;安全项优先级拉满) |
| 结构烂 / 坏味道 / 违反不变量(**行为不变**) | `sdd-refactor-code`(动老代码前先补特征测试当安全网) |
| 违反 `architecture-invariants` 且需**改架构决策** | 先写 / 取代 ADR(`sdd-update-docs`)再 `sdd-refactor-code` |
| 过期 / 有漏洞的依赖 | `sdd-bump-dependencies` |
| 发现的是**文档与代码漂移** | `sdd-update-docs` |
| 关键路径缺测试 | 随对应 fix / refactor 一起补;纯补测试也可走 `sdd-fix-bug` / `sdd-develop-feature` 的测试先行 |

### 6.（可选）盯修复闭环
- 修复后按 finding 编号**逐条核销**;高危项修完建议 `sdd-accept-phase`(scope: `changes`)复核,确认真修好(测试红转绿 + 涉及实机的真机过),别让"修了"又变成谎报。

## 与其他技能的关系

- **审查三件套**:`sdd-realign-prd`(审 PRD 规范)/ `sdd-accept-phase`(审 FR 达标)/ `sdd-review-code`(审 代码质量)——分别审"需求文档 / 交付 / 代码"。
- **上游**:`retrofit-to-sdd` 之后的自然下一步(追认的已交付未经代码审视)。
- **下游**:只产 findings + 路由,修由 `sdd-fix-bug` / `sdd-refactor-code` / `sdd-bump-dependencies` / `sdd-update-docs` 接手。

## 红线

review 时顺手改业务代码(破坏审 / 修分离,且老代码无测试网就动) · 报未经证实的猜测当实锤(误报淹没真问题) · 对 legacy 代码"review 完零问题"就交差(多半没认真看) · 拿项目没采用的外部风格当问题刷数量 · 严重级灌水(鸡毛当令箭 / 把真漏洞标 minor) · 找到安全漏洞却不拉高优先级 · 把 findings 报告入库(应留 `.tmp/`)。
