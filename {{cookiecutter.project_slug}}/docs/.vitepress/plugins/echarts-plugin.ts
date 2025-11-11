import type MarkdownIt from 'markdown-it'

/**
 * VitePress plugin to render ```echarts code blocks as EChart components
 * Supports both JSON and JavaScript object notation (with functions)
 */
export function echartsPlugin(md: MarkdownIt) {
  const fence = md.renderer.rules.fence!.bind(md.renderer.rules)

  md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
    const token = tokens[idx]
    const lang = token.info.trim()

    // Only process echarts code blocks
    if (lang === 'echarts') {
      const code = token.content.trim()

      // Escape the code for use in HTML attribute
      const escapedCode = escapeAttr(code)

      // Generate the EChartFromCode component
      return `<ClientOnly>
  <EChartFromCode
    code="${escapedCode}"
    height="500px"
  />
</ClientOnly>
`
    }

    // For other languages, use default fence renderer
    return fence(tokens, idx, options, env, slf)
  }
}

function escapeAttr(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '&#10;')
    .replace(/\r/g, '&#13;')
}
