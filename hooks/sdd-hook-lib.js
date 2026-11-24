'use strict'
// 护栏 hook 共用：定位 SDD 项目根、按宿主协议输出（Devin 与 Claude Code 都认 stdout JSON）。
const fs = require('fs')
const path = require('path')

function isSddRoot (dir) {
  return fs.existsSync(path.join(dir, 'docs', 'PRD.md')) && fs.existsSync(path.join(dir, '.claude', 'rules'))
}

// 从 start 逐级向上找 SDD 项目根（docs/PRD.md + .claude/rules/）；找不到返回 null
function findSddRoot (start) {
  let dir = path.resolve(start || process.cwd())
  for (;;) {
    if (isSddRoot(dir)) return dir
    // 到达 git 仓库 / 子模块边界（.git 目录或文件）仍不是 SDD 根：不再向外层项目借用规则
    if (fs.existsSync(path.join(dir, '.git'))) return null
    const parent = path.dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

function readStdin (cb) {
  let raw = ''
  process.stdin.setEncoding('utf8')
  process.stdin.on('data', function (c) { raw += c })
  process.stdin.on('end', function () {
    let input = {}
    try { input = JSON.parse(raw || '{}') || {} } catch (e) { process.exit(0) }
    cb(input)
  })
}

function emit (obj) { process.stdout.write(JSON.stringify(obj) + '\n') }

module.exports = { findSddRoot, readStdin, emit }
