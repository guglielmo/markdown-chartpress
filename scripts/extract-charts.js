#!/usr/bin/env node

/**
 * Extract chart definitions from markdown files
 * Outputs manifest of charts to render
 */

import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

/**
 * Extract charts from a markdown file
 * Returns array of {id, config, format, width, height}
 */
async function extractChartsFromFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8')
  const charts = []

  // Find all ```echarts code blocks
  // Also look for optional <!-- chart: id --> comment before block
  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Check if this line is start of echarts block
    if (line.trim() === '```echarts') {
      // Look backward for chart ID comment
      let chartId = null
      if (i > 0) {
        const prevLine = lines[i - 1].trim()
        const commentMatch = prevLine.match(/<!--\s*chart:\s*(\S+)\s*-->/)
        if (commentMatch) {
          chartId = commentMatch[1]
        }
      }

      // Extract chart config (everything until closing ```)
      const configLines = []
      let j = i + 1
      while (j < lines.length && lines[j].trim() !== '```') {
        configLines.push(lines[j])
        j++
      }

      const config = configLines.join('\n').trim()

      // If no explicit ID, hash the config
      if (!chartId) {
        const hash = crypto.createHash('md5').update(config).digest('hex').substring(0, 8)
        chartId = `chart-${hash}`
      }

      charts.push({
        id: chartId,
        config: config,
        format: 'svg', // default format
        width: 800,
        height: 600
      })
    }
  }

  return charts
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2)

  if (args.length < 2) {
    console.error('Usage: node extract-charts.js <docs-dir> <output-manifest>')
    console.error('Example: node extract-charts.js docs charts-manifest.json')
    process.exit(1)
  }

  const docsDir = args[0]
  const outputManifest = args[1]

  // Find all markdown files
  const findMarkdownFiles = async (dir) => {
    const files = []
    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        files.push(...await findMarkdownFiles(fullPath))
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath)
      }
    }

    return files
  }

  const mdFiles = await findMarkdownFiles(docsDir)
  console.log(`Found ${mdFiles.length} markdown files`)

  // Extract charts from all files
  const manifest = []

  for (const file of mdFiles) {
    console.log(`Processing ${file}...`)
    const charts = await extractChartsFromFile(file)

    if (charts.length > 0) {
      console.log(`  Found ${charts.length} chart(s)`)
      manifest.push({
        file: file,
        charts: charts
      })
    }
  }

  // Write manifest
  await fs.writeFile(outputManifest, JSON.stringify(manifest, null, 2))
  console.log(`\nManifest written to ${outputManifest}`)
  console.log(`Total charts: ${manifest.reduce((sum, m) => sum + m.charts.length, 0)}`)
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
