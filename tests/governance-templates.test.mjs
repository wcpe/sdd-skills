import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const canonicalTemplatePath = 'skills/init-sdd-project/templates/';
const historyHeading = '## 4. 提交历史整理与合并策略（强制）';
const contributingHeading = '### 8.1 提交历史治理（摘要）';
const rulesIndexLine = '| [git-commit.md](git-commit.md) | **提交信息规范**、**逻辑提交粒度**、**主线历史整理**、**文档入库边界**与**禁止擅自开 PR / 破坏性操作** |';

function readRepo(...segments) {
  return readFileSync(path.join(repoRoot, ...segments), 'utf8');
}

function toRepoPath(absolutePath) {
  return path.relative(repoRoot, absolutePath).split(path.sep).join('/');
}

function listMarkdownFiles(root) {
  const matches = [];

  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const absolutePath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      matches.push(...listMarkdownFiles(absolutePath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      matches.push(absolutePath);
    }
  }

  return matches;
}

function paragraphs(content) {
  return content.split(/\r?\n\s*\r?\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
}

function assertParagraphWithTerms(content, terms, message) {
  const matched = paragraphs(content).some((paragraph) =>
    terms.every((term) => term.test(paragraph)),
  );
  assert.ok(matched, message);
}

function assertNoActualFooter(content, label) {
  const finalLines = content.trimEnd().split(/\r?\n/).slice(-4).join('\n');
  assert.doesNotMatch(
    finalLines,
    /^(?:Co-Authored-By|Signed-Off-By|Author|作者|Generated (?:by|with)|由 .+ 生成)\s*:/im,
    `${label} 末尾不得存在实际 AI 或作者 footer`,
  );
}

const rootReadme = readRepo('README.md');
const initSkill = readRepo('skills', 'init-sdd-project', 'SKILL.md');
const retrofitSkill = readRepo('skills', 'retrofit-to-sdd', 'SKILL.md');
const syncSkill = readRepo('skills', 'sdd-sync-governance', 'SKILL.md');
const releaseSkill = readRepo('skills', 'sdd-release-version', 'SKILL.md');
const gitCommitRule = readRepo(
  'skills',
  'init-sdd-project',
  'templates',
  'claude-rules',
  'git-commit.md',
);
const rulesReadme = readRepo(
  'skills',
  'init-sdd-project',
  'templates',
  'claude-rules',
  'README.md',
);
const contributing = readRepo(
  'skills',
  'init-sdd-project',
  'templates',
  'docs',
  'CONTRIBUTING.md',
);

test('init 提供唯一治理模板真源，retrofit 不维护副本', () => {
  const canonicalRoot = path.join(repoRoot, 'skills', 'init-sdd-project', 'templates');
  const duplicatedRoot = path.join(repoRoot, 'skills', 'retrofit-to-sdd', 'templates');

  assert.ok(existsSync(canonicalRoot), 'init 权威模板目录必须存在');
  assert.equal(existsSync(duplicatedRoot), false, 'retrofit 不得保留模板副本');
  assert.match(initSkill, /唯一权威模板源/);
  assert.match(retrofitSkill, /不自带模板副本/);
});

test('init、retrofit 与 sync 均引用同一权威模板源', () => {
  for (const [label, content] of [
    ['init-sdd-project', initSkill],
    ['retrofit-to-sdd', retrofitSkill],
    ['sdd-sync-governance', syncSkill],
  ]) {
    assert.match(
      content,
      new RegExp(canonicalTemplatePath.replaceAll('/', '\\/')),
      `${label} 必须引用 ${canonicalTemplatePath}`,
    );
  }
});

test('权威提交规则完整约束开发提交与公开历史治理', () => {
  assert.ok(
    gitCommitRule.split(/\r?\n/).includes(historyHeading),
    '必须提供逐字一致的提交历史整理与合并策略章节锚点',
  );
  assertParagraphWithTerms(
    gitCommitRule,
    [/(?:开发|编码)/, /(?:频繁|及时|随手)/, /(?:提交|commit)/i],
    '必须要求开发期间频繁提交',
  );
  assertParagraphWithTerms(
    gitCommitRule,
    [/fixup!/i, /squash!/i, /(?:临时|暂存|过渡)/],
    '必须把 fixup!/squash! 明确限定为临时标记',
  );
  assertParagraphWithTerms(
    gitCommitRule,
    [/合并/, /前/, /逻辑/, /(?:整理|重排|归并)/],
    '必须要求合并前按逻辑整理提交',
  );
  assertParagraphWithTerms(
    gitCommitRule,
    [/(?:main|master|主线)/i, /(?:只保留|仅保留|只留下)/, /逻辑提交/],
    '必须要求 main 只保留逻辑提交',
  );
  assertParagraphWithTerms(
    gitCommitRule,
    [/提交数量/, /不是目标/, /独立理解/, /回滚/],
    '必须声明提交数量不是目标，边界以可独立理解和回滚的意图为准',
  );
  assertParagraphWithTerms(
    gitCommitRule,
    [/(?:中等规模|一个需求)/, /实现/, /测试/, /兼容性/, /文档/, /多个逻辑提交/],
    '必须允许一个中等规模需求拆成多个逻辑提交',
  );
  assertParagraphWithTerms(
    gitCommitRule,
    [/(?:禁止|不得|不要|严禁)/, /(?:整个|完整).{0,8}版本/, /(?:squash|压缩|压成|合并)/i, /(?:单个|一个|一条).{0,4}提交/],
    '必须禁止把整个版本 squash 成单提交',
  );
  assertParagraphWithTerms(
    gitCommitRule,
    [/(?:禁止|不得|不要|严禁)/, /(?:大型|大规模|多意图).{0,12}(?:PR|合并请求)/i, /(?:squash|压缩|压成|合并)/i, /(?:单个|一个|一条).{0,4}提交/],
    '必须禁止把大型多意图 PR squash 成单提交',
  );
  assertParagraphWithTerms(
    gitCommitRule,
    [/(?:release|发布)/i, /(?:commit|提交)/i, /tag/i, /独立/],
    '必须要求 release commit 与 tag 独立创建',
  );
  assertParagraphWithTerms(
    gitCommitRule,
    [/(?:公开|已推送|已发布)/, /历史/, /(?:禁止|不得|不要|不应)/, /重写/],
    '必须禁止重写公开历史',
  );
  assertParagraphWithTerms(
    gitCommitRule,
    [/正式版本标签/, /历史/, /(?:禁止|不得|不要|不应)/, /重写/],
    '必须禁止重写已被正式版本标签引用的历史',
  );
  assertParagraphWithTerms(
    gitCommitRule,
    [/(?:force push|--force)/i, /(?:main|master)/i, /(?:禁止|不得|不要|严禁)/],
    '必须禁止 force push main/master',
  );
});

test('权威提交规则保留提交格式、语言、尾注、hooks 与验证门', () => {
  assert.match(gitCommitRule, /Conventional Commits/);
  assert.match(gitCommitRule, /简体中文/);
  assertParagraphWithTerms(
    gitCommitRule,
    [/AI/i, /(?:签名|尾注|署名)/, /(?:禁止|不得|不要|严禁)/],
    '必须禁止 AI 签名或尾注',
  );
  assertParagraphWithTerms(
    gitCommitRule,
    [/(?:hooks?|--no-verify)/i, /(?:跳过|绕过)/, /(?:禁止|不得|不要|严禁)/],
    '必须禁止跳过 hooks',
  );
  assertParagraphWithTerms(
    gitCommitRule,
    [/(?:最终提交|提交前|git commit)/i, /验证门/, /(?:通过|全绿)/],
    '必须保留最终提交验证门',
  );
});

test('CONTRIBUTING 摘要提交历史治理并链接权威规则', () => {
  assert.ok(
    contributing.split(/\r?\n/).includes(contributingHeading),
    'CONTRIBUTING 必须使用逐字一致的提交历史治理标题',
  );
  assert.match(contributing, /\.\.\/\.claude\/rules\/git-commit\.md/);
  assertParagraphWithTerms(
    contributing,
    [/提交历史/, /(?:频繁提交|逻辑提交|主线整理)/],
    'CONTRIBUTING 必须包含提交历史治理摘要',
  );
});

test('规则 README 索引覆盖提交治理的五个边界', () => {
  assert.ok(
    rulesReadme.split(/\r?\n/).includes(rulesIndexLine),
    'git-commit.md 索引行必须逐字包含五项治理边界',
  );
});

test('同步治理技能采用章节级增量合并并报告冲突', () => {
  assert.ok(syncSkill.includes(`\`${historyHeading}\``), 'sync 必须逐字检测 git-commit 完整标题锚点');
  assert.ok(syncSkill.includes(`\`${contributingHeading}\``), 'sync 必须逐字检测 CONTRIBUTING 完整标题锚点');
  assert.match(
    syncSkill,
    /“提交信息规范、逻辑提交粒度、主线历史整理、文档入库边界”/,
    'sync 必须逐字检测规则 README 的四项索引描述',
  );
  assertParagraphWithTerms(syncSkill, [/缺失/, /(?:章节|条款)/], '必须识别缺失章节');
  assertParagraphWithTerms(syncSkill, [/保留/, /项目定制/], '必须保留项目定制');
  assertParagraphWithTerms(syncSkill, [/冲突/, /(?:报告|清单|列出)/], '必须报告冲突');
  assertParagraphWithTerms(
    syncSkill,
    [/(?:禁止|不得|不要|不是|不做|红线)/, /整文件/, /覆盖/],
    '必须禁止整文件覆盖',
  );
});

test('发布技能创建独立 release 提交和附注 tag 且不改写前序提交', () => {
  assert.match(
    releaseSkill,
    /chore\(release\): 发布 X\.Y\.Z/,
    'release 提交必须使用不带 v 的版本号，版本标签单独使用 vX.Y.Z',
  );
  assert.doesNotMatch(rootReadme, /chore\(release\): 发布 vX\.Y\.Z/);
  assertParagraphWithTerms(
    releaseSkill,
    [/独立/, /chore\(release\)/i, /(?:commit|提交)/i],
    '必须创建独立 chore(release) 提交',
  );
  assertParagraphWithTerms(
    releaseSkill,
    [/(?:附注(?:式)?\s*tag|annotated tag|git tag -a)/i],
    '必须创建附注 tag',
  );
  assertParagraphWithTerms(
    releaseSkill,
    [/(?:禁止|不得|不要|不应|不再)/, /重写/, /(?:前序|此前|既有|已有)/, /逻辑提交/],
    '必须禁止改写前序逻辑提交',
  );
});

test('治理文本不推荐把整个版本或大型多意图 PR squash 成单提交', () => {
  const markdownFiles = listMarkdownFiles(path.join(repoRoot, 'skills'));
  const suspectParagraphs = [];

  for (const file of markdownFiles) {
    for (const paragraph of paragraphs(readFileSync(file, 'utf8'))) {
      const mentionsLargeUnit = /(?:整个|完整).{0,8}版本|(?:大型|大规模|多意图).{0,12}(?:PR|合并请求)/i.test(paragraph);
      const mentionsSquash = /(?:squash|压缩|压成|合并成|合并为)/i.test(paragraph);
      const mentionsSingleCommit = /(?:单个|一个|一条).{0,4}提交/.test(paragraph);

      if (mentionsLargeUnit && mentionsSquash && mentionsSingleCommit) {
        suspectParagraphs.push([toRepoPath(file), paragraph]);
      }
    }
  }

  assert.ok(suspectParagraphs.length > 0, '必须明确记录禁止整版本或大型 PR squash 的治理文本');
  for (const [file, paragraph] of suspectParagraphs) {
    assert.match(
      paragraph,
      /(?:禁止|不得|不要|不应|严禁|反对|避免)/,
      `${file} 出现了推荐大型 squash 的相反建议`,
    );
  }
});

test('关键治理文本使用简体中文且不存在实际 AI 或作者 footer', () => {
  const governanceFiles = [
    ['git-commit.md', gitCommitRule],
    ['README.md', rulesReadme],
    ['CONTRIBUTING.md', contributing],
    ['sdd-sync-governance/SKILL.md', syncSkill],
    ['sdd-release-version/SKILL.md', releaseSkill],
  ];
  const governanceCorpus = governanceFiles.map(([, content]) => content).join('\n');

  assert.match(governanceCorpus, /[\u4e00-\u9fff]{20}/, '关键治理文本必须包含充分的中文正文');
  assert.doesNotMatch(
    governanceCorpus,
    /開發|歷史|邏輯|標記|驗證|規則|貢獻|發佈|發布|覆蓋|衝突|僅|應當|與/,
    '关键治理文本必须使用简体中文',
  );

  for (const [label, content] of governanceFiles) {
    assertNoActualFooter(content, label);
  }
  assertNoActualFooter(
    readRepo('tests', 'governance-templates.test.mjs'),
    'tests/governance-templates.test.mjs',
  );
});

test('sdd-skills 版本戳文件与插件清单版本一致', () => {
  const stamp = readRepo('skills', 'init-sdd-project', 'references', 'sdd-skills-version.txt').trim();
  for (const manifest of ['.claude-plugin', '.codex-plugin']) {
    const { version } = JSON.parse(readRepo(manifest, 'plugin.json'));
    assert.equal(stamp, version, `${manifest}/plugin.json 版本必须与 references/sdd-skills-version.txt 一致`);
  }
  assert.match(syncSkill, /references\/sdd-skills-version\.txt/, 'sync 必须从版本戳文件读取当前版本');
});

test('init 与 retrofit 共用安装参考，访谈提供的许可均有模板', () => {
  const sharedRef = 'skills/init-sdd-project/references/governance-install.md';
  assert.ok(existsSync(path.join(repoRoot, sharedRef)), '共用参考必须存在');
  assert.match(initSkill, /references\/governance-install\.md/);
  assert.match(retrofitSkill, /references\/governance-install\.md/);
  assert.ok(
    existsSync(path.join(repoRoot, 'skills', 'init-sdd-project', 'templates', 'AGENTS.md')),
    '必须提供 AGENTS.md 代理入口模板',
  );
  for (const license of ['MIT', 'Apache-2.0', 'PROPRIETARY']) {
    assert.ok(
      existsSync(path.join(repoRoot, 'skills', 'init-sdd-project', 'templates', 'licenses', `${license}.txt`)),
      `缺少许可模板 ${license}.txt`,
    );
  }
});
