#!/usr/bin/env node
// 最小零依赖 MCP stdio server（JSON-RPC 2.0，换行分隔）：SDD 规格漂移审计。
// 工具 sdd_check_drift：解析 docs/PRD.md §4 FR 表，对照 git tag / CHANGELOG，列 FR 状态 + 标漂移信号。只读。
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const SERVER = { name: 'sdd', version: '0.10.0' }

const TOOLS = [
  {
    name: 'sdd_check_drift',
    description:
      '审 SDD 项目的规格漂移：解析 docs/PRD.md §4 FR 表，对照 git tag 与 CHANGELOG，列出每条 FR 状态并标出漂移信号（已交付但无对应 tag 的可疑预标、开发中但 CHANGELOG 未记等）。只读，不改任何文件。',
    inputSchema: {
      type: 'object',
      properties: { projectDir: { type: 'string', description: 'SDD 项目根目录（默认当前工作目录）' } }
    }
  }
]

function send(m) { process.stdout.write(JSON.stringify(m) + '\n') }
function ok(id, r) { send({ jsonrpc: '2.0', id, result: r }) }
function err(id, c, m) { send({ jsonrpc: '2.0', id, error: { code: c, message: m } }) }
function text(t, isError = false) { return { content: [{ type: 'text', text: t }], isError } }

function git(dir, args) {
  const r = spawnSync('git', args, { cwd: dir, encoding: 'utf8' })
  return r.status === 0 ? (r.stdout || '') : ''
}

function checkDrift(args) {
  const dir = args.projectDir || process.cwd()
  const prd = join(dir, 'docs', 'PRD.md')
  if (!existsSync(prd)) return text(`不是 SDD 项目或缺 docs/PRD.md：${prd}`, true)
  const body = readFileSync(prd, 'utf8')

  const frs = []
  for (const line of body.split(/\r?\n/)) {
    const m = line.match(/^\|\s*FR-(\d+)\s*\|(.+?)\|(.+?)\|(.+?)\|\s*$/)
    if (m) frs.push({ id: 'FR-' + m[1], desc: m[2].trim(), prio: m[3].trim(), status: m[4].trim() })
  }
  const tags = git(dir, ['tag', '--list', 'v*']).split(/\r?\n/).filter(Boolean)

  const drift = []
  for (const fr of frs) {
    const dm = fr.status.match(/已交付@v?([\d.]+)/)
    if (dm && !tags.includes('v' + dm[1]) && !tags.includes(dm[1])) {
      drift.push(`${fr.id} 标了「${fr.status}」但 tag v${dm[1]} 不存在 → 可疑预标（应由 sdd-release-version 发版时统一标）`)
    }
  }
  const cl = join(dir, 'CHANGELOG.md')
  const inDev = frs.filter((f) => /开发中/.test(f.status))
  if (existsSync(cl) && inDev.length) {
    const clb = readFileSync(cl, 'utf8')
    const unreleased = (clb.match(/##\s*未发布[\s\S]*?(?=\n##\s)/) || [''])[0]
    if (/（暂无）/.test(unreleased)) {
      drift.push(`有 ${inDev.length} 条 FR「开发中」（${inDev.map((f) => f.id).join(', ')}），但 CHANGELOG 未发布段为空 → 变更可能没同步记录`)
    }
  }

  const g = (re) => frs.filter((f) => re.test(f.status)).map((f) => f.id)
  const plan = g(/计划/), dev = g(/开发中/), done = g(/已交付/)
  let out = `SDD 漂移审计（${dir}）\n\nFR 共 ${frs.length} 条：\n`
  out += `  计划 ${plan.length}：${plan.join(', ') || '(无)'}\n`
  out += `  开发中 ${dev.length}：${dev.join(', ') || '(无)'}\n`
  out += `  已交付 ${done.length}：${done.join(', ') || '(无)'}\n`
  out += `\ngit tags：${tags.join(', ') || '(无)'}\n`
  out += `\n漂移信号（${drift.length}）：\n` + (drift.length ? drift.map((d) => '  ⚠ ' + d).join('\n') : '  ✓ 未发现明显漂移')
  return text(out)
}

function handle(msg) {
  const { id, method, params } = msg
  if (method === 'initialize') {
    return ok(id, { protocolVersion: (params && params.protocolVersion) || '2024-11-05', capabilities: { tools: {} }, serverInfo: SERVER })
  }
  if (method === 'notifications/initialized') return
  if (method === 'tools/list') return ok(id, { tools: TOOLS })
  if (method === 'tools/call') {
    const name = params && params.name
    const a = (params && params.arguments) || {}
    try {
      if (name === 'sdd_check_drift') return ok(id, checkDrift(a))
      return err(id, -32601, `unknown tool: ${name}`)
    } catch (e) {
      return ok(id, text(`工具执行异常：${e.message}`, true))
    }
  }
  if (id !== undefined) err(id, -32601, `method not found: ${method}`)
}

let buf = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', (chunk) => {
  buf += chunk
  let i
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i).trim()
    buf = buf.slice(i + 1)
    if (!line) continue
    let msg
    try { msg = JSON.parse(line) } catch (e) { continue }
    handle(msg)
  }
})
