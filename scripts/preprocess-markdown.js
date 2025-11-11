#!/usr/bin/env node

/**
 * Preprocess markdown files for Pandoc PDF generation
 * Replaces ```echarts blocks with ![](images/chart-id.svg) references
 */

import fs from 'fs/promises'
import crypto from 'crypto'

/**
 * Replace Unicode characters that LaTeX fonts don't support
 */
function replaceUnicodeCharacters(text) {
  // Replace emoji with text equivalents
  const emojiReplacements = {
    '✅': '[YES]',
    '❌': '[NO]',
    '⚠️': '[WARNING]',
    '⚠': '[WARNING]',
    '️': '', // Variant selector
    '✓': '[✓]',
    '✗': '[✗]',
  }

  // Replace mathematical symbols
  const mathReplacements = {
    '≥': '>=',
    '≤': '<=',
    '≠': '!=',
    '≈': '~=',
    '×': 'x',
    '÷': '/',
  }

  // Replace box-drawing characters with simple alternatives
  const boxDrawingReplacements = {
    '┌': '+',
    '┐': '+',
    '└': '+',
    '┘': '+',
    '├': '+',
    '┤': '+',
    '┬': '+',
    '┴': '+',
    '┼': '+',
    '─': '-',
    '│': '|',
    '═': '=',
    '║': '|',
    '▼': 'v',
    '▲': '^',
    '►': '>',
    '◄': '<',
  }

  let result = text

  // Apply emoji replacements
  for (const [unicode, replacement] of Object.entries(emojiReplacements)) {
    result = result.replace(new RegExp(unicode, 'g'), replacement)
  }

  // Apply mathematical symbol replacements
  for (const [unicode, replacement] of Object.entries(mathReplacements)) {
    result = result.replace(new RegExp(unicode, 'g'), replacement)
  }

  // Apply box-drawing replacements
  for (const [unicode, replacement] of Object.entries(boxDrawingReplacements)) {
    result = result.replace(new RegExp(unicode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement)
  }

  return result
}

/**
 * Remove YAML frontmatter from markdown content
 */
function removeFrontmatter(content) {
  // Check if content starts with frontmatter delimiter
  if (!content.trim().startsWith('---')) {
    return content
  }

  const lines = content.split('\n')
  let inFrontmatter = false
  let frontmatterEnded = false
  const output = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // First line with ---
    if (i === 0 && line.trim() === '---') {
      inFrontmatter = true
      continue
    }

    // Second --- ends frontmatter
    if (inFrontmatter && line.trim() === '---') {
      inFrontmatter = false
      frontmatterEnded = true
      continue
    }

    // Skip lines inside frontmatter
    if (inFrontmatter) {
      continue
    }

    // Keep everything after frontmatter
    if (frontmatterEnded || !inFrontmatter) {
      output.push(line)
    }
  }

  return output.join('\n')
}

/**
 * Process a single markdown file
 */
async function preprocessMarkdown(filePath, imagesDir) {
  let content = await fs.readFile(filePath, 'utf-8')

  // Remove YAML frontmatter first
  content = removeFrontmatter(content)

  // Replace Unicode characters
  content = replaceUnicodeCharacters(content)

  const lines = content.split('\n')
  const output = []

  let i = 0
  while (i < lines.length) {
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
          // Remove the comment line from output
          output.pop()
        }
      }

      // Extract chart config to compute hash if needed
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

      // Replace with image reference
      output.push(`![Chart: ${chartId}](${imagesDir}/${chartId}.svg)`)
      output.push('')

      // Skip to end of code block
      i = j + 1
      continue
    }

    output.push(line)
    i++
  }

  return output.join('\n')
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2)

  if (args.length < 1) {
    console.error('Usage: node preprocess-markdown.js <input-file> [images-dir]')
    console.error('Output is written to stdout')
    process.exit(1)
  }

  const inputFile = args[0]
  const imagesDir = args[1] || 'images'

  const processed = await preprocessMarkdown(inputFile, imagesDir)
  console.log(processed)
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
