/**
 * Markdown-it plugin for Mermaid diagrams
 * Transforms ```mermaid blocks into pre blocks with class mermaid
 */

import type MarkdownIt from 'markdown-it'

export function mermaidPlugin(md: MarkdownIt) {
  const fence = md.renderer.rules.fence!

  md.renderer.rules.fence = (...args) => {
    const [tokens, idx] = args
    const token = tokens[idx]
    const lang = token.info.trim()

    if (lang === 'mermaid') {
      // Return a pre block with class mermaid
      // Mermaid.js will automatically pick it up
      return `<pre class="mermaid">${token.content}</pre>`
    }

    return fence(...args)
  }
}
