#!/usr/bin/env node
'use strict'
// SDD 文档同步提醒（Stop）。仅 SDD 项目。会话末若**暂存区**有代码改动却没有文档改动 → 软提醒 doc-sync。
// 非阻断（exit 0）：只是提醒，不强行让会话继续。
const fs = require('fs')
const { execSync } = require('child_process')
let raw = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', function (c) { raw += c })
process.stdin.on('end', function () {
  if (!fs.existsSync('docs/PRD.md') || !fs.existsSync('.claude/rules')) process.exit(0)
  let staged = ''
  try {
    staged = execSync('git diff --cached --name-only', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  } catch (e) { process.exit(0) }
  const files = staged.split(/\r?\n/).filter(Boolean)
  if (!files.length) process.exit(0)
  const isDoc = function (f) { return /^docs\//.test(f) || /CHANGELOG/i.test(f) || /README/i.test(f) }
  const isCode = function (f) {
    return /^(src|lib|app|internal|pkg|cmd|main)\//.test(f) || /\.(kt|kts|java|go|ts|tsx|js|jsx|py|rs|rb|php|c|cc|cpp|h)$/.test(f)
  }
  const hasCode = files.some(isCode)
  const hasDoc = files.some(isDoc)
  if (hasCode && !hasDoc) {
    console.error('[SDD 文档同步] 暂存区有代码改动、却没有文档改动。SDD「文档即代码」：受影响的 ' +
      'PRD / ARCHITECTURE / API / CHANGELOG 应在同一次变更里改到一致——提交前确认无文档漂移（doc-sync）。')
  }
  process.exit(0)
})
