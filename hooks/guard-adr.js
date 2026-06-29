#!/usr/bin/env node
'use strict'
// SDD ADR 不可变提醒（PostToolUse: Edit|Write|MultiEdit）。仅 SDD 项目。
// 编辑「已接受」状态的 docs/adr/NNNN-*.md 时软提醒：ADR 不可变、决策变了写新 ADR 取代。
// 软提醒（不阻断）——因为「把旧 ADR 状态改成『已被 ADR-NNNN 取代』」「修笔误」都是合法编辑。
const fs = require('fs')
let raw = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', function (c) { raw += c })
process.stdin.on('end', function () {
  let input
  try { input = JSON.parse(raw || '{}') } catch (e) { process.exit(0) }
  if (!fs.existsSync('docs/PRD.md') || !fs.existsSync('.claude/rules')) process.exit(0)
  const ti = input.tool_input || {}
  const fp = String(ti.file_path || '')
  if (!/docs[\\/]adr[\\/]\d{4}-.*\.md$/i.test(fp)) process.exit(0)

  let content = ''
  try { content = fs.readFileSync(fp, 'utf8') } catch (e) { process.exit(0) }
  // 只对「已接受」的 ADR 提醒；提议中 / 已弃用 / 已被取代 的不提醒
  if (!/##\s*状态\s*\n+\s*已接受/.test(content)) process.exit(0)
  // 本次编辑若是合法的「取代标记」更新，不提醒
  const edit = [ti.new_string, ti.content].filter(Boolean).join('\n') +
    (Array.isArray(ti.edits) ? '\n' + ti.edits.map(function (e) { return e && e.new_string }).filter(Boolean).join('\n') : '')
  if (/已被\s*ADR-\d{4}.*取代|已弃用/.test(edit)) process.exit(0)

  console.error('[SDD ADR 门] 你在改一条「已接受」的 ADR（' + fp + '）。SDD 规则：已接受 ADR 的决策正文**不可变**——' +
    '决策变了请写一条**新 ADR 取代**它（旧 ADR 仅把状态改为「已被 ADR-NNNN 取代」）。若你只是改状态/订正笔误，忽略本提醒。')
  process.exit(0)
})
