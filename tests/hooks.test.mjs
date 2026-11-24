import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hookDir = path.join(repoRoot, 'hooks');

function makeSddProject() {
  const dir = mkdtempSync(path.join(tmpdir(), 'sdd-hook-'));
  mkdirSync(path.join(dir, 'docs', 'adr'), { recursive: true });
  mkdirSync(path.join(dir, '.claude', 'rules'), { recursive: true });
  writeFileSync(path.join(dir, 'docs', 'PRD.md'), '# PRD\n');
  return dir;
}

function runHook(script, input, { cwd, env = {}, host } = {}) {
  const args = [path.join(hookDir, 'run-hook.sh')];
  if (host) args.push('--host', host);
  args.push(script);
  return spawnSync('sh', args, {
    cwd: cwd || tmpdir(),
    input: JSON.stringify(input),
    encoding: 'utf8',
    env: { PATH: process.env.PATH, HOME: process.env.HOME, ...env },
  });
}

test('Devin hooks.json 按 DEVIN_PLUGIN_ROOT 定位插件，不只依赖 CLAUDE_PLUGIN_ROOT', () => {
  const hooks = JSON.parse(readFileSync(path.join(repoRoot, 'hooks.json'), 'utf8'));
  for (const event of ['PreToolUse', 'PostToolUse', 'Stop']) {
    for (const entry of hooks[event]) {
      for (const hook of entry.hooks) {
        assert.match(hook.command, /DEVIN_PLUGIN_ROOT/, `${event} 须优先用 DEVIN_PLUGIN_ROOT`);
        assert.match(hook.command, /--host devin/);
      }
    }
  }
  assert.equal(hooks.PreToolUse[0].matcher, '^exec$');
  assert.match('apply_patch', new RegExp(hooks.PostToolUse[0].matcher));
});

test('Devin 下按 Claude 兼容加载的 hooks/hooks.json 自动跳过，避免护栏跑两遍', () => {
  const dir = makeSddProject();
  try {
    const input = { tool_name: 'Bash', tool_input: { command: 'git commit -m "bad title"' } };
    const r = runHook('guard-commit.js', input, { cwd: dir, host: 'claude', env: { DEVIN_PLUGIN_ROOT: repoRoot } });
    assert.equal(r.status, 0);
    assert.equal(r.stdout, '');
    const claude = runHook('guard-commit.js', input, { cwd: dir, host: 'claude', env: { CLAUDE_PLUGIN_ROOT: repoRoot } });
    assert.equal(claude.status, 2, '纯 Claude 环境仍须拦截');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('提交门：Devin exec 的 workdir 指向 SDD 项目时拦截不合规标题并输出 decision:block', () => {
  const dir = makeSddProject();
  try {
    const bad = runHook('guard-commit.js',
      { tool_name: 'exec', tool_input: { command: 'git commit -m "update stuff"', workdir: dir } },
      { host: 'devin', env: { DEVIN_PLUGIN_ROOT: repoRoot } });
    assert.equal(bad.status, 2);
    assert.equal(JSON.parse(bad.stdout).decision, 'block');
    const cdBad = runHook('guard-commit.js',
      { tool_name: 'exec', tool_input: { command: `cd "${dir}" && git commit -m "update stuff"` } },
      { host: 'devin' });
    assert.equal(cdBad.status, 2, '命令开头 cd 到 SDD 项目也要生效');
    const good = runHook('guard-commit.js',
      { tool_name: 'exec', tool_input: { command: 'git commit -m "fix(core): 修复空指针"', workdir: path.join(dir, 'docs') } },
      { host: 'devin' });
    assert.equal(good.status, 0, '子目录内也能识别 SDD 根，合规标题放行');
    const plain = runHook('guard-commit.js',
      { tool_name: 'exec', tool_input: { command: 'git commit -m "update stuff"', workdir: tmpdir() } },
      { host: 'devin' });
    assert.equal(plain.status, 0, '非 SDD 项目不碰');
    const sub = path.join(dir, 'vendor', 'lib');
    mkdirSync(sub, { recursive: true });
    writeFileSync(path.join(sub, '.git'), 'gitdir: ../../.git/modules/lib\n');
    const submodule = runHook('guard-commit.js',
      { tool_name: 'exec', tool_input: { command: 'git commit -m "update stuff"', workdir: sub } },
      { host: 'devin' });
    assert.equal(submodule.status, 0, '非 SDD 的子模块不套用外层规则');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('ADR 门：改已接受 ADR（含 apply_patch 绝对路径）时经 additionalContext 提醒', () => {
  const dir = makeSddProject();
  try {
    const adr = path.join(dir, 'docs', 'adr', '0001-use-x.md');
    writeFileSync(adr, '# ADR-0001\n\n## 状态\n\n已接受\n');
    const edit = runHook('guard-adr.js', { tool_name: 'edit', tool_input: { file_path: adr, new_string: '改决策' } }, { host: 'devin' });
    assert.equal(edit.status, 0);
    const out = JSON.parse(edit.stdout).hookSpecificOutput;
    assert.equal(out.hookEventName, 'PostToolUse');
    assert.match(out.additionalContext, /ADR/);
    const patch = runHook('guard-adr.js',
      { tool_name: 'apply_patch', tool_input: { patch: `*** Begin Patch\n*** Update File: ${adr}\n@@\n-a\n+b\n*** End Patch` } },
      { host: 'devin' });
    assert.match(patch.stdout, /additionalContext/);
    const supersede = runHook('guard-adr.js',
      { tool_name: 'edit', tool_input: { file_path: adr, new_string: '已被 ADR-0002 取代' } }, { host: 'devin' });
    assert.equal(supersede.stdout, '', '合法的取代标记不提醒');
    const removedOnly = runHook('guard-adr.js',
      { tool_name: 'apply_patch', tool_input: { patch: `*** Begin Patch\n*** Update File: ${adr}\n@@\n-旧方案已弃用\n+改决策\n*** End Patch` } },
      { host: 'devin' });
    assert.match(removedOnly.stdout, /additionalContext/, '删除行里的旧措辞不能跳过提醒');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('文档同步：暂存代码无文档时拦一次，stop_hook_active 时放行，根目录 ARCHITECTURE 算文档', () => {
  const dir = makeSddProject();
  try {
    const git = (...a) => execFileSync('git', a, { cwd: dir, stdio: 'ignore' });
    git('init', '-q');
    mkdirSync(path.join(dir, 'src'));
    writeFileSync(path.join(dir, 'src', 'a.ts'), 'export {}\n');
    git('add', 'src/a.ts');
    const env = { DEVIN_PROJECT_DIR: dir };
    const first = runHook('nudge-doc-sync.js', { hook_event_name: 'Stop' }, { host: 'devin', env });
    assert.equal(first.status, 0);
    assert.equal(JSON.parse(first.stdout).decision, 'block');
    const again = runHook('nudge-doc-sync.js', { hook_event_name: 'Stop', stop_hook_active: true }, { host: 'devin', env });
    assert.equal(again.stdout, '');
    writeFileSync(path.join(dir, 'ARCHITECTURE.md'), '# 架构\n');
    git('add', 'ARCHITECTURE.md');
    const withDoc = runHook('nudge-doc-sync.js', { hook_event_name: 'Stop' }, { host: 'devin', env });
    assert.equal(withDoc.stdout, '');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('MCP 启动器按自身位置定位插件根，不依赖 cwd 或宿主变量', () => {
  const src = readFileSync(path.join(repoRoot, 'scripts', 'sdd-mcp-launcher.mjs'), 'utf8');
  assert.match(src, /import\.meta\.url/);
  assert.doesNotMatch(src, /process\.cwd\(\)/);
});
