# SDD 治理安装共用参考

`init-sdd-project` 与 `retrofit-to-sdd` 共用本文件：模板定位、版本戳、安装映射、既有文件合并、实战提示与收尾验收清单。两个技能只写各自差异，通用做法以本文件为准。

## 1. 模板定位与版本戳

- 权威模板源固定为 `skills/init-sdd-project/templates/`：Claude Code 下为 `${CLAUDE_PLUGIN_ROOT}/skills/init-sdd-project/templates/`；Codex / opencode / 其他按技能目录安装的工具，从当前技能目录用 `../init-sdd-project/templates/` 定位。
- sdd-skills 版本读 `init-sdd-project/references/sdd-skills-version.txt`（随技能目录分发，插件安装与直接拷贝技能目录都能读到；与 `.claude-plugin/plugin.json`、`.codex-plugin/plugin.json` 的 `version` 由仓库测试保证一致）。
- 插件根是 git 检出时，再用 `git -C <插件根> rev-parse HEAD` 取 commit；取不到就只记版本。
- 写 `.claude/rules/.sdd-version`，内容为版本、commit（可空）、日期、来源技能（`init-sdd-project` / `retrofit-to-sdd`），供 `sdd-sync-governance` 日后增量升级。

## 2. 安装映射（从权威模板拷贝，仅替换占位符）

| 模板 | 项目落点 | 说明 |
|---|---|---|
| `claude-rules/*` | `.claude/rules/` | comments / config-files / git-commit / doc-sync / decision-alignment / scope-discipline / testing-and-quality / test-conventions / static-analysis / architecture-invariants / README |
| `AGENTS.md` | `AGENTS.md` | 代理入口：Codex、opencode 等只读 `AGENTS.md`，不会自动加载 `.claude/rules/`，靠它指向规则与规格 |
| `docs/CONTRIBUTING.md`、`docs/adr/README.md`、`docs/specs/README.md`、`docs/specs/_template.md` | `docs/` 同名路径 | |
| `docs/_skeletons/ADR.md` | `docs/adr/_template.md` | 供以后写新 ADR |
| `docs/_skeletons/*` | `docs/PRD.md`、`docs/ARCHITECTURE.md`、`docs/API.md`、`docs/OPERATIONS.md`、`SECURITY.md`、`README.md`、`CHANGELOG.md` | 只是生成蓝本，据访谈 / 现状填实，**不整目录拷进项目** |
| `github/*` | `.github/` | PR / Issue 模板 |
| `editorconfig.txt` | `.editorconfig` | |
| `gitignore-templates/<stack>.gitignore` | `.gitignore` | 无对应栈见 §4 |
| `licenses/<许可>.txt` | `LICENSE` | `MIT` / `Apache-2.0` / `PROPRIETARY`（内部保留所有权利）；Apache-2.0 原文不改，版权声明写进 `NOTICE` 或 README |
| `VERSION` | `VERSION` | |

迭代技能（`sdd-*`）随 sdd-skills 插件一同提供、所有 SDD 项目共享，**不拷进项目**，项目侧不放 `.claude/skills/`。

## 3. 既有文件合并（目标路径已存在时）

一律**合并不覆盖**，先读再写：

- `.gitignore`、`.editorconfig`：保留既有条目，只追加缺失项（至少 `/.tmp/`）。`.gitignore` 里已有 `!` 例外时，新增条目插在会被它覆盖的例外**之前**（后出现的规则优先），追加后用 `git check-ignore -v <例外路径>` 确认例外仍生效。
- `README.md`、`CHANGELOG.md`、`docs/CONTRIBUTING.md`、`SECURITY.md`：保留既有正文，按模板章节补缺失段；既有约定（分支模型、发布方式）与模板冲突时沿用既有约定改写模板段。
- `.github/` 下已有 PR / Issue 模板：保留既有，模板中缺失的检查项以追加方式补入。
- `.claude/rules/` 已有同名规则：保留项目内容，模板增量按章节并入；无法判断归属的列入冲突清单问用户。
- `AGENTS.md` / `CLAUDE.md` 已存在：在既有文件里追加 SDD 入口段（§2 的 `AGENTS.md` 模板正文），不替换原有内容。
- `LICENSE` 已存在：不动，除非用户明确要求更换许可。

## 4. 实战提示（固化测试反馈）

- **占位符要扫干净**：模板占位一律是含中文的 `<...>`（如 `<项目名>`、`<年份>`、CONTRIBUTING 的 `<各可交付物>` / `<各组件测试全绿>`，易漏）。只扫本次生成 / 安装的文件，别扫业务代码：`grep -rnP '<(?!!--)[^<>\n]*\p{Han}[^<>\n]*>' docs .claude AGENTS.md README.md CHANGELOG.md SECURITY.md LICENSE .github`。命中 `git-commit.md` 里的格式说明 `<type>(<scope>): <中文描述>` 是规则正文，保留。
- **填完 `architecture-invariants` 删掉模板自带的填写引导**（那是给你填的脚手，不该留在项目里）。
- **右尺寸的可操作判据**：无 YAML 配置 → 可不装 `config-files.md`；单人 / 暂不用 CI → 把 `CONTRIBUTING §8` 与 `static-analysis` 的 CI 段改成"可选 / 如果用 CI"而非既定事实；无独立构建产物的解释型项目（Python 等）→ 在 `docs/OPERATIONS.md` / README 的构建章节写明"源码即交付物 + 测试"（`sdd-release-version` / `sdd-publish-snapshot` 从这里读构建 / 测试命令）。
- **ADR 文件名用英文 slug**（如 `0002-sqlite-storage.md`），标题正文照中文规范。
- **`.gitignore`**：选栈模板后，再按本项目运行期产物（SQLite `.db`、日志、上传目录等）补忽略项。无对应栈模板（Rust、.NET、C/C++ 等）→ 以任一栈模板的「IDE / 操作系统」「过程性临时文件」「环境与密钥」三段为底，再补该栈的标准构建产物（如 Rust `target/`、.NET `bin/` `obj/`）；多栈仓库合并多个模板并去重。

## 5. 收尾验收清单（交付前逐项过）

- [ ] `.claude/rules/.sdd-version` 已写入版本 / 日期 / 来源技能。
- [ ] 占位符自查（§4）无残留命中。
- [ ] `AGENTS.md` 存在并指向 `.claude/rules/README.md` 与 `docs/`。
- [ ] `docs/PRD.md` §4 FR 表为四列 `| FR-NN | 需求 | 优先级 | 状态 |`，可被 `sdd_check_drift` 解析；有该 MCP 工具时跑一次，确认无漂移信号。
- [ ] `.tmp/` 已被忽略：`git check-ignore -q .tmp/x` 成功；`git status` 中没有 `.tmp/` 下文件。
- [ ] 生成的文档内部链接（README → CONTRIBUTING / LICENSE、rules README → CONTRIBUTING）都能打开。
- [ ] 提交遵循项目 `.claude/rules/git-commit.md`：中文 Conventional Commits；用户要求交付时在独立分支提交并开 PR（非豁免变更不直推主线），合并一律 squash 且须用户批准。
