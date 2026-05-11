import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'fs'
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
