#!/usr/bin/env node
/**
 * preprocess-mermaid.js
 *
 * Replaces ```mermaid blocks with image references for PDF generation
 *
 * Input: Original markdown files with ```mermaid blocks
 * Output: Processed markdown with ![](images/mermaid-xxx.svg)
 *
 * Usage: node scripts/preprocess-mermaid.js <input-file> <output-file>
 */

import { readFileSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';

const MERMAID_BLOCK_REGEX = /```mermaid\s*\n([\s\S]*?)```/g;

/**
 * Generate ID matching extract-mermaid.js logic
 */
function generateId(content) {
  const hash = createHash('md5').update(content.trim()).digest('hex');
  return `mermaid-${hash.substring(0, 8)}`;
}

/**
 * Replace mermaid blocks with image references
 */
function replaceMermaidWithImages(content) {
  return content.replace(MERMAID_BLOCK_REGEX, (match, diagramContent) => {
    const id = generateId(diagramContent);
    // Use PNG for PDF (better compatibility than SVG with foreignObject)
    const imagePath = `images/${id}.png`;

    // Return markdown image syntax
    return `![Mermaid Diagram](${imagePath})`;
  });
}

/**
 * Main preprocessing
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length !== 2) {
    console.error('Usage: node scripts/preprocess-mermaid.js <input-file> <output-file>');
    process.exit(1);
  }

  const [inputFile, outputFile] = args;

  console.log(`📄 Processing: ${inputFile}`);

  try {
    const content = readFileSync(inputFile, 'utf-8');
    const processed = replaceMermaidWithImages(content);

    writeFileSync(outputFile, processed, 'utf-8');

    // Count replacements
    const originalCount = (content.match(MERMAID_BLOCK_REGEX) || []).length;
    console.log(`   ✅ Replaced ${originalCount} Mermaid diagram(s)`);
    console.log(`   💾 Saved to: ${outputFile}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
