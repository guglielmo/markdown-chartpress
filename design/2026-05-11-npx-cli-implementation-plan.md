# npx CLI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an `npx`-able CLI (`mcp build <dir>`) that takes a directory of markdown files, moves them to `<dir>/md/`, builds a VitePress static site into `<dir>/html/`, and leaves no tooling artifacts behind.

**Architecture:** A root-level `package.json` turns the cookiecutter repo into an npm package with a `bin` entry. A `.vitepress/` directory at the repo root (separate from the cookiecutter template) holds the CLI's VitePress config, components, plugins, and theme. The CLI (`bin/mcp.js`) sets `MCP_SRC_DIR` / `MCP_OUT_DIR` env vars and calls VitePress's programmatic `build()` API with the package root as the VitePress root; `outDir` and `srcDir` are resolved from env vars inside `config.ts`. VitePress's Vite cache is redirected to `/tmp` so no files are written to the npx cache directory.

**Tech Stack:** Node.js ≥ 18 (ESM), VitePress 1.x programmatic API, TypeScript (VitePress config only), Vue 3 (existing components), `node:test` + `node:assert` for tests.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| CREATE | `package.json` | Root npm package: `bin`, deps, `"type":"module"` |
| CREATE | `bin/mcp.js` | CLI entry: parse args, move md files, set env vars, call `build()` |
| CREATE | `.vitepress/config.ts` | VitePress config reading `MCP_SRC_DIR` / `MCP_OUT_DIR` |
| COPY→  | `.vitepress/components/` | From `{{cookiecutter.project_slug}}/docs/.vitepress/components/` |
| COPY→  | `.vitepress/plugins/` | From `{{cookiecutter.project_slug}}/docs/.vitepress/plugins/` |
| COPY→  | `.vitepress/theme/` | From `{{cookiecutter.project_slug}}/docs/.vitepress/theme/` |
| CREATE | `test/cli.test.js` | Integration test: run CLI on temp dir, assert output |
| MODIFY | `.gitignore` | Ignore root-level `node_modules/`, `.vitepress/cache/`, `dist/` |

---

## Task 1: Root `package.json`

**Files:**
- Create: `package.json`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "markdown-chartpress",
  "version": "1.1.0",
  "description": "CLI to build VitePress static sites from markdown directories",
  "type": "module",
  "bin": {
    "mcp": "./bin/mcp.js"
  },
  "files": [
    "bin/",
    ".vitepress/",
    "{{cookiecutter.project_slug}}/",
    "cookiecutter.json",
    "hooks/"
  ],
  "dependencies": {
    "vitepress": "^1.6.0",
    "vue": "^3.4.0",
    "echarts": "^5.5.0",
    "mermaid": "^11.0.0",
    "markdown-it-task-lists": "^2.1.1"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "test": "node --test test/cli.test.js"
  },
  "keywords": ["vitepress", "documentation", "markdown", "cli", "echarts"],
  "author": "Guglielmo Celata",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/guglielmo/markdown-chartpress.git"
  }
}
```

- [ ] **Step 2: Install deps**

```bash
cd ~/Workspace/markdown_chartpress && npm install
```

Expected: `node_modules/` created with vitepress, vue, echarts, mermaid.

- [ ] **Step 3: Update `.gitignore`**

Add to root `.gitignore`:
```
node_modules/
.vitepress/cache/
.vitepress/dist/
dist/
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "feat(cli): add root package.json for npx distribution"
```

---

## Task 2: Copy VitePress assets to root `.vitepress/`

**Files:**
- Create: `.vitepress/components/EChart.vue`, `EChartFromCode.vue`, `Mermaid.vue`
- Create: `.vitepress/plugins/echarts-plugin.ts`, `mermaid-plugin.ts`
- Create: `.vitepress/theme/index.ts`, `style.css`, `components/PdfDownloadButton.vue`

> These are copied verbatim from the template. The relative imports inside them (`../components/`, `./components/`, `vitepress/theme`) resolve correctly from `.vitepress/`.

- [ ] **Step 1: Copy assets**

```bash
TMPL="{{cookiecutter.project_slug}}/docs/.vitepress"
cp -r "$TMPL/components" .vitepress/
cp -r "$TMPL/plugins"    .vitepress/
cp -r "$TMPL/theme"      .vitepress/
```

- [ ] **Step 2: Verify imports are intact**

```bash
grep -r "import" .vitepress/ | grep -v node_modules
```

All imports should use relative paths (`../components/`, `./style.css`, `vitepress/theme`, `echarts`, `mermaid`) — none should be absolute.

- [ ] **Step 3: Commit**

```bash
git add .vitepress/
git commit -m "feat(cli): add shared VitePress components, plugins, theme"
```

---

## Task 3: VitePress config for CLI

**Files:**
- Create: `.vitepress/config.ts`

- [ ] **Step 1: Write failing test (config loads env vars)**

```js
// test/cli.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = resolve(__dirname, '..')

test('MCP_SRC_DIR and MCP_OUT_DIR are consumed by config', async () => {
  process.env.MCP_SRC_DIR = '/tmp/mcp-test-src'
  process.env.MCP_OUT_DIR = '/tmp/mcp-test-out'
  // Dynamic import forces fresh module evaluation
  const mod = await import(`${PKG_ROOT}/.vitepress/config.ts?t=${Date.now()}`)
  const cfg = mod.default
  assert.equal(cfg.srcDir, '/tmp/mcp-test-src')
  assert.equal(cfg.outDir, '/tmp/mcp-test-out')
  delete process.env.MCP_SRC_DIR
  delete process.env.MCP_OUT_DIR
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
node --test test/cli.test.js
```

Expected: FAIL — `.vitepress/config.ts` does not exist yet.

- [ ] **Step 3: Write `.vitepress/config.ts`**

```ts
import { defineConfig } from 'vitepress'
import { echartsPlugin } from './plugins/echarts-plugin'
import { mermaidPlugin } from './plugins/mermaid-plugin'
import { readdirSync, readFileSync, statSync } from 'fs'
import { join, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { tmpdir } from 'os'
import taskLists from 'markdown-it-task-lists'

const __dirname = dirname(fileURLToPath(import.meta.url))

const srcDir = process.env.MCP_SRC_DIR
  ?? resolve(__dirname, '../{{cookiecutter.project_slug}}/docs/example-minimal')
const outDir = process.env.MCP_OUT_DIR
  ?? resolve(__dirname, '../dist')

function extractTitle(content: string): string | undefined {
  const fm = content.match(/^---\s*\n([\s\S]*?)\n---/)
  if (fm) {
    const m = fm[1].match(/^title:\s*(.+)$/m)
    if (m) return m[1].trim()
  }
  for (const line of content.replace(/^---[\s\S]*?---/, '').split('\n')) {
    const t = line.trim()
    if (t.startsWith('# ') && !t.startsWith('## ')) return t.slice(2).trim()
  }
}

function generateSidebarItems(dir: string, base: string) {
  return readdirSync(dir)
    .filter(f => f.endsWith('.md') && f !== 'index.md' && statSync(join(dir, f)).isFile())
    .sort()
    .map(f => {
      const title = extractTitle(readFileSync(join(dir, f), 'utf-8'))
      const m = f.match(/^(\d+)-/)
      const n = m ? parseInt(m[1], 10) : null
      return {
        text: n ? `${n}. ${title ?? f.replace('.md', '')}` : (title ?? f.replace('.md', '')),
        link: base + f.replace('.md', '')
      }
    })
}

function siteTitle(): string {
  const idx = join(srcDir, 'index.md')
  try { return extractTitle(readFileSync(idx, 'utf-8')) ?? 'Documentation' }
  catch { return 'Documentation' }
}

export default defineConfig({
  srcDir,
  outDir,
  title: siteTitle(),
  description: 'Generated by markdown-chartpress',
  lang: 'en-US',

  vite: {
    cacheDir: join(tmpdir(), 'mcp-vite-cache'),
  },

  themeConfig: {
    outline: { level: [2, 4], label: 'On this page' },
    search: { provider: 'local' },
    sidebar: [{ text: siteTitle(), items: generateSidebarItems(srcDir, '/') }],
    docFooter: { prev: 'Previous', next: 'Next' },
    lastUpdated: { text: 'Last updated' },
  },

  markdown: {
    lineNumbers: false,
    config: (md) => {
      md.use(echartsPlugin)
      md.use(mermaidPlugin)
      md.use(taskLists, { enabled: true })
    }
  }
})
```

- [ ] **Step 4: Run test**

```bash
node --test test/cli.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add .vitepress/config.ts test/cli.test.js
git commit -m "feat(cli): add VitePress config reading MCP_SRC_DIR/MCP_OUT_DIR"
```

---

## Task 4: `bin/mcp.js` CLI entry point

**Files:**
- Create: `bin/mcp.js`

- [ ] **Step 1: Write failing integration test**

Add to `test/cli.test.js`:

```js
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs'
import { execFileSync } from 'child_process'

test('mcp build moves md files and produces html/', async () => {
  const tmpDir = '/tmp/mcp-integ-test'
  rmSync(tmpDir, { recursive: true, force: true })
  mkdirSync(tmpDir)

  // Seed two markdown files
  writeFileSync(`${tmpDir}/index.md`, '# Test\nHello world')
  writeFileSync(`${tmpDir}/01-intro.md`, '# Introduction\nContent here')

  execFileSync('node', [`${PKG_ROOT}/bin/mcp.js`, tmpDir], { stdio: 'inherit' })

  assert.ok(existsSync(`${tmpDir}/md/index.md`), 'md/index.md should exist')
  assert.ok(existsSync(`${tmpDir}/md/01-intro.md`), 'md/01-intro.md should exist')
  assert.ok(existsSync(`${tmpDir}/html/index.html`), 'html/index.html should exist')
  assert.ok(!existsSync(`${tmpDir}/md/.vitepress`), '.vitepress should be cleaned up')

  rmSync(tmpDir, { recursive: true, force: true })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
node --test test/cli.test.js
```

Expected: FAIL — `bin/mcp.js` does not exist.

- [ ] **Step 3: Create `bin/` and write `mcp.js`**

```js
#!/usr/bin/env node
import { resolve, join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readdirSync, mkdirSync, renameSync, rmSync, existsSync } from 'fs'
import { build } from 'vitepress'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = resolve(__dirname, '..')

async function main() {
  const targetArg = process.argv[2]
  if (!targetArg) {
    console.error('Usage: mcp <directory>')
    process.exit(1)
  }

  const targetDir = resolve(targetArg)
  const mdDir = join(targetDir, 'md')
  const htmlDir = join(targetDir, 'html')

  // Move .md files to md/ if not already there
  if (!existsSync(mdDir)) {
    mkdirSync(mdDir, { recursive: true })
    const mdFiles = readdirSync(targetDir).filter(f => f.endsWith('.md'))
    if (mdFiles.length === 0) {
      console.error(`No .md files found in ${targetDir}`)
      process.exit(1)
    }
    for (const f of mdFiles) {
      renameSync(join(targetDir, f), join(mdDir, f))
      console.log(`  moved ${f} → md/${f}`)
    }
  }

  // If md/ already exists, trust the user put files there
  const mdFiles = readdirSync(mdDir).filter(f => f.endsWith('.md'))
  if (mdFiles.length === 0) {
    console.error(`No .md files found in ${mdDir}`)
    process.exit(1)
  }

  process.env.MCP_SRC_DIR = mdDir
  process.env.MCP_OUT_DIR = htmlDir

  console.log(`Building ${mdDir} → ${htmlDir}`)
  await build(PKG_ROOT)

  // Cleanup: remove any .vitepress artifacts written to mdDir
  const vitepressCache = join(mdDir, '.vitepress')
  if (existsSync(vitepressCache)) {
    rmSync(vitepressCache, { recursive: true, force: true })
  }

  console.log(`Done → ${htmlDir}`)
}

main().catch(err => { console.error(err); process.exit(1) })
```

- [ ] **Step 4: Make executable**

```bash
chmod +x bin/mcp.js
```

- [ ] **Step 5: Run integration test**

```bash
node --test test/cli.test.js
```

Expected: both tests PASS.

- [ ] **Step 6: Smoke-test with real docs**

```bash
node bin/mcp.js ~/Workspace/gst-maps-pipelines/docs/cube-storage
```

Expected:
- `~/Workspace/gst-maps-pipelines/docs/cube-storage/md/` contains the 6 `.md` files
- `~/Workspace/gst-maps-pipelines/docs/cube-storage/html/` contains `index.html` and one HTML per doc
- No `.vitepress/` directory in `md/`

- [ ] **Step 7: Commit**

```bash
git add bin/mcp.js test/cli.test.js
git commit -m "feat(cli): add mcp build command"
```

---

## Task 5: Handle idempotency (re-run on already-initialized dir)

The CLI already handles `md/` existing (skips the move). This task adds a test for idempotency and verifies the output is overwritten cleanly.

**Files:**
- Modify: `test/cli.test.js`

- [ ] **Step 1: Add idempotency test**

```js
test('mcp build is idempotent on already-initialized dir', async () => {
  const tmpDir = '/tmp/mcp-idem-test'
  rmSync(tmpDir, { recursive: true, force: true })
  mkdirSync(`${tmpDir}/md`, { recursive: true })
  writeFileSync(`${tmpDir}/md/index.md`, '# Re-run test\nHello')
  writeFileSync(`${tmpDir}/md/01-page.md`, '# Page\nContent')

  // First run
  execFileSync('node', [`${PKG_ROOT}/bin/mcp.js`, tmpDir], { stdio: 'inherit' })
  // Second run — should not error
  execFileSync('node', [`${PKG_ROOT}/bin/mcp.js`, tmpDir], { stdio: 'inherit' })

  assert.ok(existsSync(`${tmpDir}/html/index.html`))
  assert.ok(!existsSync(`${tmpDir}/md/.vitepress`))

  rmSync(tmpDir, { recursive: true, force: true })
})
```

- [ ] **Step 2: Run all tests**

```bash
node --test test/cli.test.js
```

Expected: all 3 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add test/cli.test.js
git commit -m "test(cli): add idempotency test for mcp build"
```

---

## Task 6: Smoke-test `npx` from GitHub

- [ ] **Step 1: Push branch to GitHub**

```bash
git push origin HEAD
```

- [ ] **Step 2: Test via npx**

```bash
# From any directory, using the branch directly
npx github:guglielmo/markdown-chartpress <path-to-a-dir-with-md-files>
```

Expected: `md/` and `html/` created, no tooling artifacts left.

- [ ] **Step 3: If it works, tag a release**

```bash
git tag v1.1.0
git push origin v1.1.0
```

---

## Rollback / cleanup notes

- The cookiecutter template (`{{cookiecutter.project_slug}}/`) is unchanged and continues to work as before.
- The root-level `.vitepress/` and `bin/` are new additions that don't affect the cookiecutter workflow.
- If `npx` caching causes stale versions, users can clear with `npx clear-npx-cache`.
