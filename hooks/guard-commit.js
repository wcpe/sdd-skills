#!/usr/bin/env node
'use strict'
// SDD 提交信息门（PreToolUse: Bash）。仅在 SDD 项目（cwd 有 docs/PRD.md + .claude/rules/）里生效。
// 拦下（exit 2 阻断提交）：AI 署名、阶段/批次词、非 Conventional Commits 标题、描述非中文。
// 规则真源：.claude/rules/git-commit.md。提取不到提交信息（如开编辑器）则放行，绝不误拦。
const fs = require('fs')
let raw = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', function (c) { raw += c })
process.stdin.on('end', function () {
  let input
  try { input = JSON.parse(raw || '{}') } catch (e) { process.exit(0) }
  // 仅 SDD 项目生效，普通项目完全不碰
  if (!fs.existsSync('docs/PRD.md') || !fs.existsSync('.claude/rules')) process.exit(0)
  const cmd = String((input.tool_input || {}).command || '')
  if (!/\bgit\s+commit\b/.test(cmd)) process.exit(0)

  // 提取提交信息：heredoc 优先（git commit -m "$(cat <<'EOF' ... EOF)"），否则 -m "..." / -m '...'
  let msg = ''
  const heredoc = cmd.match(/<<-?\s*['"]?(\w+)['"]?\s*\n([\s\S]*?)\n\s*\1\b/)
  if (heredoc) {
    msg = heredoc[2]
  } else {
    const m = cmd.match(/-m\s+"((?:[^"\\]|\\.)*)"/) || cmd.match(/-m\s+'([^']*)'/)
    if (m) msg = m[1].replace(/\\"/g, '"').replace(/\\n/g, '\n')
  }
  if (!msg.trim()) process.exit(0) // 拿不到信息 → 放行，不误拦

  const title = (msg.split('\n').find(function (l) { return l.trim() }) || '').trim()
  const fail = function (why) {
    console.error('[SDD 提交门] ' + why + '\n规则见 .claude/rules/git-commit.md。改好提交信息再提交。')
    process.exit(2)
  }

  // ① AI 署名 / 尾注（禁止）
  if (/Co-?Authored-?By|Generated with|🤖/i.test(msg)) {
    fail('提交信息含 AI 署名 / 尾注——禁止 Co-Authored-By / Generated with 等署名。')
  }
  // ② 阶段 / 批次词（禁止：按功能点描述，不按开发阶段）
  const stage = msg.match(/Phase\s*\d|\bP[012]\b|\bMVP\b|\bSprint\b|第[一二三四五六七八九十两]+期|本次迭代|本期/i)
  if (stage) {
    fail('提交信息含阶段 / 批次词「' + stage[0] + '」——禁止。按"这次改了什么"（功能点）描述，别按"项目走到哪步"（Phase/P0/MVP/Sprint/第一期等会随时间失效）。')
  }
  // ③ Conventional Commits 标题格式
  if (!/^(feat|fix|refactor|docs|chore|test|build|ci|perf|style)(\([a-z0-9-]+\))?: .+/.test(title)) {
    fail('标题不合 Conventional Commits：应为 `<type>(<scope>): <中文描述>`，type ∈ feat/fix/refactor/docs/chore/test/build/ci/perf/style。当前标题：「' + title + '」')
  }
  // ④ 描述用简体中文（type/scope 用英文，描述须含中文）
  const desc = title.replace(/^[a-z]+(\([a-z0-9-]+\))?:\s*/, '')
  if (!/[一-鿿]/.test(desc)) {
    fail('标题描述应为简体中文（type/scope 仍用英文小写）。当前描述：「' + desc + '」')
  }
  process.exit(0)
})
