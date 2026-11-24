#!/usr/bin/env node
'use strict'
// SDD ADR 不可变提醒（PostToolUse: Claude 的 Edit|Write|MultiEdit / Devin 的 edit|write|apply_patch）。仅 SDD 项目。
// 编辑「已接受」状态的 docs/adr/NNNN-*.md 时软提醒：ADR 不可变、决策变了写新 ADR 取代。
// 软提醒（不阻断，经 additionalContext 注入代理上下文）——「把旧 ADR 状态改成『已被 ADR-NNNN 取代』」「修笔误」都是合法编辑。
const fs = require('fs')
const path = require('path')
const { findSddRoot, readStdin, emit } = require('./sdd-hook-lib')

const ADR_RE = /docs[\\/]adr[\\/]\d{4}-[^\\/]*\.md$/i

readStdin(function (input) {
  const ti = input.tool_input || {}
  const patch = typeof ti.patch === 'string' ? ti.patch : (typeof ti.input === 'string' ? ti.input : '')
  const files = [ti.file_path, ti.path, ti.notebook_path].filter(function (f) { return typeof f === 'string' && f })
  // apply_patch：从补丁头取被改文件
  patch.replace(/^\*\*\* (?:Update|Add) File: (.+)$/gm, function (_, f) { files.push(f.trim()); return '' })
  const adrs = files.filter(function (f) { return ADR_RE.test(f) })
  if (!adrs.length) process.exit(0)

  const edit = [ti.new_string, ti.content, patch].filter(Boolean).join('\n') +
    (Array.isArray(ti.edits) ? '\n' + ti.edits.map(function (e) { return e && e.new_string }).filter(Boolean).join('\n') : '')
  // 本次编辑若是合法的「取代标记」更新，不提醒
  if (/已被\s*ADR-\d{4}.*取代|已弃用/.test(edit)) process.exit(0)

  const hits = adrs.filter(function (fp) {
    const abs = path.resolve(process.cwd(), fp)
    if (!findSddRoot(path.dirname(abs))) return false
    let content = ''
    try { content = fs.readFileSync(abs, 'utf8') } catch (e) { return false }
    // 只对「已接受」的 ADR 提醒；提议中 / 已弃用 / 已被取代 的不提醒
    return /##\s*状态\s*\n+\s*已接受/.test(content)
  })
  if (!hits.length) process.exit(0)

  const msg = '[SDD ADR 门] 你在改「已接受」的 ADR（' + hits.join('、') + '）。SDD 规则：已接受 ADR 的决策正文**不可变**——' +
    '决策变了请写一条**新 ADR 取代**它（旧 ADR 仅把状态改为「已被 ADR-NNNN 取代」）。若你只是改状态/订正笔误，忽略本提醒。'
  emit({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: msg } })
  console.error(msg)
  process.exit(0)
})
