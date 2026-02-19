#!/usr/bin/env node
/**
 * extract-mermaid.js
 *
 * Scans markdown files for ```mermaid blocks and extracts them to:
 * - Individual .mmd files for mermaid-cli processing
 * - A manifest JSON file for preprocessing
 *
 * Usage: node scripts/extract-mermaid.js
 */

import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { createHash } from 'crypto';

const DOCS_DIR = 'docs';
const OUTPUT_DIR = '.build/mermaid-diagrams';
const MANIFEST_FILE = '.build/mermaid-manifest.json';

// Ensure output directory exists
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Regex to match ```mermaid blocks
const MERMAID_BLOCK_REGEX = /```mermaid\s*\n([\s\S]*?)```/g;

/**
 * Generate a unique ID for a mermaid diagram based on its content
 */
function generateId(content) {
  const hash = createHash('md5').update(content.trim()).digest('hex');
  return `mermaid-${hash.substring(0, 8)}`;
}

/**
 * Find all markdown files recursively
 */
function findMarkdownFiles(dir, fileList = []) {
  const files = readdirSync(dir);

  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      // Skip hidden directories and node_modules
      if (!file.startsWith('.') && file !== 'node_modules') {
        findMarkdownFiles(filePath, fileList);
      }
    } else if (file.endsWith('.md')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Extract mermaid diagrams from a markdown file
 */
function extractMermaidFromFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const diagrams = [];

  let match;
  while ((match = MERMAID_BLOCK_REGEX.exec(content)) !== null) {
    const diagramContent = match[1].trim();
    const id = generateId(diagramContent);

    diagrams.push({
      id,
      content: diagramContent,
      sourceFile: filePath,
      position: match.index
    });
  }

  return diagrams;
}

/**
 * Main extraction logic
 */
function main() {
  console.log('🔍 Scanning for Mermaid diagrams...');

  const markdownFiles = findMarkdownFiles(DOCS_DIR);
  console.log(`   Found ${markdownFiles.length} markdown files`);

  const allDiagrams = [];

  markdownFiles.forEach(filePath => {
    const diagrams = extractMermaidFromFile(filePath);
    if (diagrams.length > 0) {
      console.log(`   📄 ${filePath}: ${diagrams.length} diagram(s)`);
      allDiagrams.push(...diagrams);
    }
  });

  if (allDiagrams.length === 0) {
    console.log('⚠️  No Mermaid diagrams found');
    return;
  }

  console.log(`\n📊 Total diagrams found: ${allDiagrams.length}`);
  console.log('💾 Saving diagram files and manifest...');

  // Save individual .mmd files
  allDiagrams.forEach(diagram => {
    const mmdPath = join(OUTPUT_DIR, `${diagram.id}.mmd`);
    writeFileSync(mmdPath, diagram.content, 'utf-8');
  });

  // Save manifest
  const manifest = {
    generated: new Date().toISOString(),
    diagrams: allDiagrams.map(d => ({
      id: d.id,
      sourceFile: d.sourceFile,
      mmdFile: `${OUTPUT_DIR}/${d.id}.mmd`,
      svgFile: `images/${d.id}.svg`
    }))
  };

  writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2), 'utf-8');

  console.log(`✅ Saved ${allDiagrams.length} diagram files to ${OUTPUT_DIR}/`);
  console.log(`✅ Manifest saved to ${MANIFEST_FILE}`);
  console.log('\n💡 Next step: Run "make render-mermaid" to generate SVG images');
}

main();
