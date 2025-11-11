import { defineConfig } from 'vitepress'
import { echartsPlugin } from './plugins/echarts-plugin'
import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'
import taskLists from 'markdown-it-task-lists'

// Extract title from frontmatter or h1 heading
function extractTitle(content: string): string | undefined {
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/)
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1]
    const titleMatch = frontmatter.match(/^title:\s*(.+)$/m)
    if (titleMatch) {
      return titleMatch[1].trim()
    }
  }

  const withoutFrontmatter = content.replace(/^---\s*\n[\s\S]*?\n---/, '').trim()
  const lines = withoutFrontmatter.split('\n')
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (trimmedLine.startsWith('# ') && !trimmedLine.startsWith('## ')) {
      return trimmedLine.substring(2).trim()
    }
  }

  return undefined
}

// Generate sidebar items from markdown files
function generateSidebarItems(dirPath: string, baseLink: string) {
  const files = readdirSync(dirPath)
    .filter(file => {
      const fullPath = join(dirPath, file)
      return file.endsWith('.md') && file !== 'index.md' && statSync(fullPath).isFile()
    })
    .sort()

  return files.map(file => {
    const filePath = join(dirPath, file)
    const content = readFileSync(filePath, 'utf-8')
    const title = extractTitle(content)

    const linkPath = baseLink + file.replace('.md', '')

    // Extract chapter number from filename (e.g., "01-" -> "1")
    const match = file.match(/^(\d+)-/)
    const chapterNum = match ? parseInt(match[1], 10) : null

    return {
      text: chapterNum ? `${chapterNum}. ${title || file.replace('.md', '')}` : (title || file.replace('.md', '')),
      link: linkPath
    }
  })
}

export default defineConfig({
  title: 'markdown-chartpress',
  description: 'Professional documentation with interactive charts and PDF generation',
  base: '/',
  lang: 'en-US',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#003366' }],
  ],

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'Documentation',

    outline: {
      level: [2, 4],
      label: 'On this page'
    },

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/example-report/' }
    ],

    sidebar: {
      '/example-report/': [
        {
          text: 'Example Report',
          items: generateSidebarItems(
            join(__dirname, '../example-report'),
            '/example-report/'
          )
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/guglielmo/markdown-chartpress' }
    ],

    search: {
      provider: 'local'
    },

    editLink: {
      pattern: 'https://github.com/guglielmo/markdown-chartpress/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },

    lastUpdated: {
      text: 'Last updated'
    },

    docFooter: {
      prev: 'Previous page',
      next: 'Next page'
    }
  },

  markdown: {
    lineNumbers: false,
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    config: (md) => {
      md.use(echartsPlugin)
      md.use(taskLists, { enabled: true })
    }
  }
})
