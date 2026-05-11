import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync, mkdirSync, writeFileSync, rmSync } from 'fs'
import { execFileSync } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = resolve(__dirname, '..')

test('config.ts exists and references MCP_SRC_DIR / MCP_OUT_DIR', () => {
  const configPath = `${PKG_ROOT}/.vitepress/config.ts`
  assert.ok(existsSync(configPath), 'config.ts must exist')
  const src = readFileSync(configPath, 'utf-8')
  assert.ok(src.includes('MCP_SRC_DIR'), 'config.ts must reference MCP_SRC_DIR')
  assert.ok(src.includes('MCP_OUT_DIR'), 'config.ts must reference MCP_OUT_DIR')
  assert.ok(src.includes('srcDir'), 'config.ts must set srcDir')
  assert.ok(src.includes('outDir'), 'config.ts must set outDir')
})

test('mkpress build moves md files and produces html/', { timeout: 120000 }, () => {
  const tmpDir = '/tmp/mkpress-integ-test'
  rmSync(tmpDir, { recursive: true, force: true })
  mkdirSync(tmpDir)

  writeFileSync(`${tmpDir}/index.md`, '# Test Site\nHello world')
  writeFileSync(`${tmpDir}/01-intro.md`, '# Introduction\nContent here')

  execFileSync('node', [`${PKG_ROOT}/bin/mkpress.js`, tmpDir], { stdio: 'inherit' })

  assert.ok(existsSync(`${tmpDir}/md/index.md`), 'md/index.md should exist')
  assert.ok(existsSync(`${tmpDir}/md/01-intro.md`), 'md/01-intro.md should exist')
  assert.ok(existsSync(`${tmpDir}/html/index.html`), 'html/index.html should exist')
  assert.ok(!existsSync(`${tmpDir}/md/.vitepress`), '.vitepress should be cleaned up')

  rmSync(tmpDir, { recursive: true, force: true })
})

test('mkpress build is idempotent (re-run on already-initialized dir)', { timeout: 120000 }, () => {
  const tmpDir = '/tmp/mkpress-idem-test'
  rmSync(tmpDir, { recursive: true, force: true })
  mkdirSync(`${tmpDir}/md`, { recursive: true })
  writeFileSync(`${tmpDir}/md/index.md`, '# Re-run Test\nHello')
  writeFileSync(`${tmpDir}/md/01-page.md`, '# Page\nContent')

  // First run
  execFileSync('node', [`${PKG_ROOT}/bin/mkpress.js`, tmpDir], { stdio: 'inherit' })
  // Second run — must not error
  execFileSync('node', [`${PKG_ROOT}/bin/mkpress.js`, tmpDir], { stdio: 'inherit' })

  assert.ok(existsSync(`${tmpDir}/html/index.html`), 'html/index.html must exist after second run')
  assert.ok(!existsSync(`${tmpDir}/md/.vitepress`), '.vitepress must be cleaned up after second run')

  rmSync(tmpDir, { recursive: true, force: true })
})
