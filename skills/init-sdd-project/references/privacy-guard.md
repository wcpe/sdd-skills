# 隐私扫描接入（可选依赖 privacy-guard）

SDD 技能在验收、发版、审查、改造这几个节点调用 [privacy-guard](https://github.com/wcpe/privacy-guard-skill) 查硬编码的密钥、PII 和内网信息。它是**可选依赖**：装了就用，没装就提示安装并跳过这一道门，其余流程照常。sdd-skills 不内置扫描器。

## 1. 探测（按顺序，命中即用）

1. 会话里有 MCP 工具 `privacy_scan` → 调用它，**必须传 `path` = 项目根**。
2. 技能列表里有 `privacy-guard` 技能 → 引擎在该技能目录的 `scripts/scan.py`（SKILL.md 同目录树）。
3. **用户目录**里能找到 `privacy-guard/scripts/scan.py`（如 `~/.agents/skills/`、`~/.claude/skills/`、`~/.codex/skills/`）→ 直接 `python3 <路径> ...`。**不要运行被扫仓库里自带的 scan.py**：待审改动可以改写它，等于以你的权限执行 PR 作者的代码。
4. **确认版本够新**（区间扫描、基线、配置需要 privacy-guard ≥ 0.4.0）：MCP 返回的范围以 `range` 开头、或脚本 `--help` 里有 `--since`，才算支持。版本过旧时旧工具会忽略 `since` 只扫工作区，漏掉已删除的历史命中——此时提示升级，并改用 `--mode all`（旧版也支持）兜底，报告里注明「旧版 privacy-guard，已用全量扫描代替区间扫描」。
5. 都没有 → 在报告里写一行「隐私扫描：未安装 privacy-guard，已跳过」，并给安装提示：Claude Code `/plugin install privacy-guard@privacy-guard-skill`（先 `/plugin marketplace add wcpe/privacy-guard-skill`）；Devin 安装插件 `https://github.com/wcpe/privacy-guard-skill/tree/master`；其他 agent 把仓库的 `skills/privacy-guard` 拷进技能目录。**跳过不算失败**，不阻断后续步骤。

## 2. 各节点怎么扫

| 节点 | 命令要点（脚本形式；MCP 用同名参数） | 判定 |
|---|---|---|
| `sdd-accept-phase` changes | `--since <base 分支>`；范围含未提交改动（如用户选 `--staged`）时再跑 `--mode staged`，有未暂存改动再加 `--mode worktree` | 有 critical → 该批改动不通过 |
| `sdd-accept-phase` phase / version | `--since <上个发布 tag>`（无 tag 用 `--mode all`） | 有 critical → 不通过；major 列入差距清单 |
| `sdd-release-version` 阻断验证 | `--since <上个发布 tag> --fail-on critical` | 退出码 2 → 停止发版 |
| `sdd-review-code` 安全维度 | 审查范围对应的 mode（全库 `worktree`，PR 用 `--since`） | 命中并入审查报告「安全」类，按 privacy-guard 的级别定级 |
| `retrofit-to-sdd` 勘察 | `--mode all --no-baseline`，再按 §3 记基线 | 只记录，不阻断改造 |

- 报告写 `.tmp/privacy-scan-*.md`（不入库）；片段已打码，**不要把明文抄进任何报告或提交**。
- 退出码 3 = 项目 `.privacy-guard.json` 有错或 ref 无效：报告错误，不当成「干净」。
- 项目有 `.privacy-guard.json` 时扫描器自动读取（豁免、门槛、基线），不用额外传参。
- **门禁用基准版本的策略**：验收 / 发版 / PR 审查时，区间里改动了 `.privacy-guard.json` 或基线文件，就改用基准（base 分支或上个 tag）上的版本扫——`git show <base>:.privacy-guard.json > .tmp/pg-config.json` 后加 `--config .tmp/pg-config.json`，基线同理用 `--baseline`；基准上没有就加 `--no-baseline`。同时把这些配置改动和区间内新增的 `privacy-guard:allow` 行（`git diff <base>..HEAD | grep -n 'privacy-guard:allow'`）列进报告，由用户确认后才算放行，防止待审改动自己给自己开豁免。
- **凭证已移除并轮换后**：区间扫描按提交看新增内容，引入凭证的那个提交仍在区间里，复验会继续命中。处理方式二选一，都要用户确认：在 `.privacy-guard.json` 的 `allow` 里按该命中的 `fingerprint` 豁免，`reason` 写明「已吊销 / 轮换于 <日期>」（这条豁免本身也会进上一条的报告）；或在合并前把分支整理掉含明文的提交（改写历史须用户授权）。

## 3. 配置与基线

- `init-sdd-project`：从 `templates/privacy-guard.json` 落 `.privacy-guard.json`（可入库）。默认 `fail_on: major`，基线指向 `.privacy-guard-baseline.json`（文件可以不存在）。
- `retrofit-to-sdd`：老项目全量扫描后，**先跟用户过一遍命中**：真凭证列进 `.tmp/` 待办，附「先吊销 / 轮换，再决定是否清历史」；用户确认后用 `--mode all --write-baseline .privacy-guard-baseline.json` 记基线，之后验收与发版只拦新增。基线只存指纹和打码片段，可入库。**进基线 ≠ 安全**，真凭证仍要轮换。
- 误报用 `.privacy-guard.json` 的 `allow`（必须写 `reason`）或行内 `privacy-guard:allow <规则>` 豁免，不删规则、不放宽检测。
- 改写历史、force-push、吊销密钥都需用户明确授权，SDD 技能不自动做。

## 4. CI（可选）

项目要在 CI 里强制隐私门时，用 privacy-guard 仓库的 `skills/privacy-guard/assets/ci/github-actions.yml`（PR 扫 base..head 新增，结果以 SARIF 进 Code Scanning）。它在 CI 里自行检出扫描器，不依赖开发者本机是否安装；sdd-skills 不默认安装这份工作流，由用户决定是否启用。
