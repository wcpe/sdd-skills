#!/usr/bin/env node
'use strict'
// SDD 文档同步提醒（Stop）。仅 SDD 项目。回合结束时若**暂存区**有代码改动却没有文档改动 → 提醒 doc-sync。
// 只拦一次：首次以 decision:block 把提醒交给代理补查；代理再次结束（stop_hook_active）时一律放行，不会循环。
const { execSync } = require('child_process')
const { findSddRoot, readStdin, emit } = require('./sdd-hook-lib')

readStdin(function (input) {
  const isAntigravity = process.env.AGENT_HOOK_HOST === 'antigravity' || typeof input.executionNum === 'number' || Array.isArray(input.workspacePaths)
  const allow = function () {
    if (isAntigravity) emit({})
    process.exit(0)
  }

  if (input.stop_hook_active) allow()
  if (typeof input.executionNum === 'number' && input.executionNum > 1) allow()

  const candidates = Array.isArray(input.workspacePaths) && input.workspacePaths.length
    ? input.workspacePaths.concat([process.cwd()])
    : [process.cwd()]
  let root = null
  for (let i = 0; i < candidates.length; i++) {
    root = findSddRoot(candidates[i])
    if (root) break
  }
  if (!root) allow()

  let staged = ''
  try {
    staged = execSync('git diff --cached --name-only', { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  } catch (e) { allow() }
  const files = staged.split(/\r?\n/).filter(Boolean)
  if (!files.length) allow()
  const isDoc = function (f) {
    return /^docs\//.test(f) || /CHANGELOG/i.test(f) || /README/i.test(f) || /^(ARCHITECTURE|CONTRIBUTING)\.md$/i.test(f)
  }
  const isCode = function (f) {
    return /^(src|lib|app|internal|pkg|cmd|main)\//.test(f) || /\.(kt|kts|java|go|ts|tsx|js|jsx|py|rs|rb|php|c|cc|cpp|h)$/.test(f)
  }
  if (files.some(isCode) && !files.some(isDoc)) {
    const msg = '[SDD 文档同步] 暂存区有代码改动、却没有文档改动。SDD「文档即代码」：受影响的 ' +
      'PRD / ARCHITECTURE / API / CHANGELOG 应在同一次变更里改到一致——确认无文档漂移（doc-sync）后再结束；确实无需改文档就说明理由并结束。'
    if (isAntigravity) {
      emit({ decision: 'continue', reason: msg })
      process.exit(0)
    }
    emit({ decision: 'block', reason: msg })
    console.error(msg)
  }
  allow()
})
