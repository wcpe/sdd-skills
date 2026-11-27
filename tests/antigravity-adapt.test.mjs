import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hookDir = path.join(repoRoot, 'hooks');
const readJson = (...p) => JSON.parse(readFileSync(path.join(repoRoot, ...p), 'utf8'));

function makeSddProject() {
  const dir = mkdtempSync(path.join(tmpdir(), 'sdd-agy-'));
  mkdirSync(path.join(dir, 'docs', 'adr'), { recursive: true });
  mkdirSync(path.join(dir, '.claude', 'rules'), { recursive: true });
  writeFileSync(path.join(dir, 'docs', 'PRD.md'), '# PRD\n');
  return dir;
}

function runHook(script, input, { cwd = repoRoot, env = {} } = {}) {
  return spawnSync('sh', [path.join(hookDir, 'run-hook.sh'), '--host', 'antigravity', script], {
    cwd,
    input: JSON.stringify(input),
    encoding: 'utf8',
    env: { PATH: process.env.PATH, HOME: process.env.HOME, ...env },
  });
}

test('Antigravity 插件清单与 MCP 配置合法、版本一致且 logo 文件存在', () => {
  const agy = readJson('.antigravity-plugin', 'plugin.json');
  assert.equal(agy.$schema, 'https://antigravity.google/schemas/v1/plugin.json');
  assert.match(agy.name, /^[a-z0-9]+(-[a-z0-9]+)*$/);
  assert.equal(agy.version, readJson('.devin-plugin', 'plugin.json').version);
  assert.equal(agy.version, readJson('.claude-plugin', 'plugin.json').version);
  assert.equal(agy.version, readJson('.codex-plugin', 'plugin.json').version);
  assert.ok(existsSync(path.join(repoRoot, agy.logo)), 'logo 资源必须存在');
  assert.ok(Array.isArray(agy.suggestedPrompts) && agy.suggestedPrompts.length <= 3);

  const mcp = readJson('mcp_config.json');
  assert.deepEqual(mcp.mcpServers.sdd.args, ['${PLUGIN_ROOT}/scripts/sdd-mcp-launcher.mjs']);
});

test('Antigravity 提交门：不合规标题返回 exit 0 + decision:deny，合规标题返回 {}', () => {
  const dir = makeSddProject();
  try {
    const bad = runHook('guard-commit.js', {
      toolCall: { name: 'run_command', args: { CommandLine: 'git commit -m "update stuff"', Cwd: dir } },
      workspacePaths: [dir],
    });
    assert.equal(bad.status, 0, 'Antigravity 阻断必须返回 exit 0');
    assert.equal(JSON.parse(bad.stdout).decision, 'deny');

    const good = runHook('guard-commit.js', {
      toolCall: { name: 'run_command', args: { CommandLine: 'git commit -m "fix(core): 修复空指针"', Cwd: dir } },
      workspacePaths: [dir],
    });
    assert.equal(good.status, 0);
    assert.deepEqual(JSON.parse(good.stdout), {});
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('Antigravity ADR 门：改已接受 ADR 返回 exit 0 + decision:ask，合法取代标记返回 {}', () => {
  const dir = makeSddProject();
  try {
    const adr = path.join(dir, 'docs', 'adr', '0001-use-x.md');
    writeFileSync(adr, '# ADR-0001\n\n## 状态\n\n已接受\n');

    const hit = runHook('guard-adr.js', {
      toolCall: { name: 'replace_file_content', args: { TargetFile: adr, ReplacementContent: '改决策正文' } },
      workspacePaths: [dir],
    });
    assert.equal(hit.status, 0);
    const out = JSON.parse(hit.stdout);
    assert.equal(out.decision, 'ask');
    assert.match(out.reason, /ADR/);

    const ok = runHook('guard-adr.js', {
      toolCall: { name: 'replace_file_content', args: { TargetFile: adr, ReplacementContent: '已被 ADR-0002 取代' } },
      workspacePaths: [dir],
    });
    assert.equal(ok.status, 0);
    assert.deepEqual(JSON.parse(ok.stdout), {});
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('Antigravity 文档同步门：首次 Stop 返回 decision:continue，第二次 executionNum=2 放行返回 {}', () => {
  const dir = makeSddProject();
  try {
    const git = (...a) => execFileSync('git', a, { cwd: dir, stdio: 'ignore' });
    git('init', '-q');
    mkdirSync(path.join(dir, 'src'));
    writeFileSync(path.join(dir, 'src', 'a.ts'), 'export {}\n');
    git('add', 'src/a.ts');

    const first = runHook('nudge-doc-sync.js', { executionNum: 1, workspacePaths: [dir] });
    assert.equal(first.status, 0);
    assert.equal(JSON.parse(first.stdout).decision, 'continue');

    const second = runHook('nudge-doc-sync.js', { executionNum: 2, workspacePaths: [dir] });
    assert.equal(second.status, 0);
    assert.deepEqual(JSON.parse(second.stdout), {});
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
