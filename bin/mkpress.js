#!/usr/bin/env node
import { resolve, join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readdirSync, mkdirSync, renameSync, rmSync, existsSync, lstatSync, symlinkSync, unlinkSync, writeFileSync, readFileSync } from 'fs'
import { build } from 'vitepress'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = resolve(__dirname, '..')

function extractH1(filePath) {
  try {
    for (const line of readFileSync(filePath, 'utf-8').split('\n')) {
      const t = line.trim()
      if (t.startsWith('# ') && !t.startsWith('## ')) return t.slice(2).trim()
    }
  } catch { /* ignore */ }
}

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

  const mdFiles = readdirSync(mdDir).filter(f => f.endsWith('.md') && f !== 'index.md').sort()
  if (mdFiles.length === 0) {
    console.error(`No .md files found in ${mdDir}`)
    process.exit(1)
  }

  // Auto-generate index.md if missing
  if (!existsSync(join(mdDir, 'index.md'))) {
    const title = extractH1(join(mdDir, mdFiles[0])) ?? 'Documentation'
    const features = mdFiles.slice(0, 6).map(f => {
      const t = extractH1(join(mdDir, f)) ?? f.replace('.md', '')
      const link = '/' + f.replace('.md', '')
      return `  - title: ${t}\n    link: ${link}`
    }).join('\n')
    const index = `---\nlayout: home\nhero:\n  name: ${title}\n  text: ''\nfeatures:\n${features}\n---\n`
    writeFileSync(join(mdDir, 'index.md'), index)
    console.log('  generated index.md')
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
