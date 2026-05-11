#!/usr/bin/env node
import { resolve, join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readdirSync, mkdirSync, renameSync, rmSync, existsSync, lstatSync, symlinkSync, unlinkSync } from 'fs'
import { build } from 'vitepress'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = resolve(__dirname, '..')

async function main() {
  const targetArg = process.argv[2]
  if (!targetArg) {
    console.error('Usage: mkpress <directory>')
    process.exit(1)
  }

  const targetDir = resolve(targetArg)
  const mdDir = join(targetDir, 'md')
  const htmlDir = join(targetDir, 'html')

  // Move .md files to md/ if not already done
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

  const mdFiles = readdirSync(mdDir).filter(f => f.endsWith('.md'))
  if (mdFiles.length === 0) {
    console.error(`No .md files found in ${mdDir}`)
    process.exit(1)
  }

  process.env.MCP_SRC_DIR = mdDir
  process.env.MCP_OUT_DIR = htmlDir

  // Symlink node_modules into targetDir so VitePress can resolve deps
  // (Rollup resolves imports relative to the page file location)
  const nmLink = join(targetDir, 'node_modules')
  // lstatSync detects broken symlinks that existsSync would miss
  const nmLinkExists = (() => { try { lstatSync(nmLink); return true } catch { return false } })()
  if (nmLinkExists) {
    // Remove any stale entry (broken symlink from a previous crashed run)
    try { unlinkSync(nmLink) } catch { rmSync(nmLink, { recursive: true, force: true }) }
  }
  symlinkSync(join(PKG_ROOT, 'node_modules'), nmLink, 'dir')
  const nmLinkCreated = true

  console.log(`Building ${mdDir} → ${htmlDir}`)
  try {
    await build(PKG_ROOT)
  } finally {
    // Always remove the transient node_modules symlink we created
    if (nmLinkCreated && existsSync(nmLink)) {
      unlinkSync(nmLink)
    }
  }

  // Cleanup any .vitepress artifacts written inside mdDir
  const vitepressCache = join(mdDir, '.vitepress')
  if (existsSync(vitepressCache)) {
    rmSync(vitepressCache, { recursive: true, force: true })
  }

  console.log(`\nDone! Site built in ${htmlDir}`)
}

main().catch(err => { console.error(err); process.exit(1) })
