#!/usr/bin/env node
'use strict'
// SDD 提交信息门（PreToolUse: Claude 的 Bash / Devin 的 exec）。仅在 SDD 项目（docs/PRD.md + .claude/rules/）里生效。
// 拦下（exit 2 + stdout decision:block 阻断提交）：AI 署名、阶段/批次词、非 Conventional Commits 标题、描述非中文。
// 规则真源：.claude/rules/git-commit.md。提取不到提交信息（如开编辑器）则放行，绝不误拦。
const path = require('path')
const { findSddRoot, readStdin, emitAndExit } = require('./sdd-hook-lib')

function unquote (s) { return String(s || '').replace(/^["']|["']$/g, '') }

// 仅在引号外按 && / || / ; 拆分顶层命令段（遇 heredoc 保留整段避免误拆正文）
function splitCommands (cmd) {
  if (/<<-?\s*['"]?\w+['"]?/.test(cmd)) return [cmd]
  const out = []
  let cur = ''
  let quote = ''
  for (let i = 0; i < cmd.length; i++) {
    const ch = cmd[i]
    if (quote) {
      cur += ch
      if (ch === '\\' && quote === '"' && i + 1 < cmd.length) { cur += cmd[++i]; continue }
      if (ch === quote) quote = ''
      continue
    }
    if (ch === '"' || ch === "'") { quote = ch; cur += ch; continue }
    if ((ch === '&' && cmd[i + 1] === '&') || (ch === '|' && cmd[i + 1] === '|')) {
      out.push(cur); cur = ''; i++; continue
    }
    if (ch === ';') { out.push(cur); cur = ''; continue }
    cur += ch
  }
  if (cur) out.push(cur)
  return out
}

function extractCommitMsg (seg) {
  const heredoc = seg.match(/<<-?\s*['"]?(\w+)['"]?\s*\n([\s\S]*?)\n\s*\1\b/)
  if (heredoc) return heredoc[2]
  const m = seg.match(/-m\s+"((?:[^"\\]|\\.)*)"/) || seg.match(/-m\s+'([^']*)'/)
  return m ? m[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') : ''
}

readStdin(function (input) {
  const isAntigravity = process.env.AGENT_HOOK_HOST === 'antigravity' || Boolean(input.toolCall)
  const allow = function () {
    if (isAntigravity) return emitAndExit({ decision: 'allow' }, 0)
    process.exit(0)
  }
  const fail = function (why) {
    const reason = '[SDD 提交门] ' + why + '\n规则见 .claude/rules/git-commit.md。改好提交信息再提交。'
    if (isAntigravity) {
      // Antigravity 要求退出码为 0 并输出 decision: deny；非 0 会被视为 hook 异常并 fail-open
      return emitAndExit({ decision: 'deny', reason: reason }, 0)
    }
    console.error(reason)
    return emitAndExit({ decision: 'block', reason: reason }, 2)
  }

  const ti = (input.toolCall && input.toolCall.args) || input.tool_input || {}
  const cmd = String(ti.CommandLine || ti.command || '')
  const ARG = '("[^"]+"|\'[^\']+\'|[^\\s;&|]+)'
  const commitRe = new RegExp('\\bgit\\s+(?:-C\\s+' + ARG + '\\s+)?commit\\b')
  if (!commitRe.test(cmd)) return allow()

  // 命令实际运行目录：Antigravity run_command 的 Cwd / workspacePaths、Devin exec 的 workdir 参数、命令内 `cd` / `git -C`，否则为 hook 的 cwd
  let base = String(
    ti.Cwd || ti.workdir || ti.cwd || input.cwd ||
    (Array.isArray(input.workspacePaths) && input.workspacePaths[0]) ||
    process.cwd()
  )
  const cdRe = new RegExp('^cd\\s+' + ARG + '$')
  const segments = splitCommands(cmd)

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i].trim()
    if (!seg) continue
    const cdm = seg.match(cdRe)
    if (cdm) { base = path.resolve(base, unquote(cdm[1])); continue }
    const leadingCd = seg.match(new RegExp('^cd\\s+' + ARG + '\\s*&&'))
    if (leadingCd) base = path.resolve(base, unquote(leadingCd[1]))

    const cm = seg.match(commitRe)
    if (!cm) continue
    const commitDir = cm[1] ? path.resolve(base, unquote(cm[1])) : base
    // 仅 SDD 项目生效，普通项目完全不碰
    if (!findSddRoot(commitDir)) continue

    const msg = extractCommitMsg(seg)
    if (!msg.trim()) continue // 拿不到信息 → 放行，不误拦

    const title = (msg.split('\n').find(function (l) { return l.trim() }) || '').trim()
    // ① AI 署名 / 尾注（禁止）
    if (/Co-?Authored-?By|Generated with|🤖/i.test(msg)) {
      return fail('提交信息含 AI 署名 / 尾注——禁止 Co-Authored-By / Generated with 等署名。')
    }
    // ② 阶段 / 批次词（禁止：按功能点描述，不按开发阶段）
    const stage = msg.match(/Phase\s*\d|\bP[012]\b|\bMVP\b|\bSprint\b|第[一二三四五六七八九十两]+期|本次迭代|本期/i)
    if (stage) {
      return fail('提交信息含阶段 / 批次词「' + stage[0] + '」——禁止。按"这次改了什么"（功能点）描述，别按"项目走到哪步"（Phase/P0/MVP/Sprint/第一期等会随时间失效）。')
    }
    // ③ Conventional Commits 标题格式
    if (!/^(feat|fix|refactor|docs|chore|test|build|ci|perf|style)(\([a-z0-9-]+\))?: .+/.test(title)) {
      return fail('标题不合 Conventional Commits：应为 `<type>(<scope>): <中文描述>`，type ∈ feat/fix/refactor/docs/chore/test/build/ci/perf/style。当前标题：「' + title + '」')
    }
    // ④ 描述用简体中文（type/scope 用英文，描述须含中文）
    const desc = title.replace(/^[a-z]+(\([a-z0-9-]+\))?:\s*/, '')
    if (!/[一-鿿]/.test(desc)) {
      return fail('标题描述应为简体中文（type/scope 仍用英文小写）。当前描述：「' + desc + '」')
    }
  }
  allow()
})
