# markdown-chartpress Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the DEPP-specific docs_template into a generic, reusable markdown-chartpress template for generating professional documentation with VitePress (interactive charts) and PDF (static chart images) outputs.

**Architecture:** Git template repository with Makefile-driven configuration. VitePress provides live dev server and static site build with interactive echarts. Docker-based Puppeteer service renders charts to SVG/PNG for PDF generation via Pandoc + XeLaTeX. All branding (company name, colors, logos) configurable via Makefile variables with sed substitution.

**Tech Stack:** VitePress 1.0, Vue 3, ECharts 5, Puppeteer (Docker), Pandoc, XeLaTeX, Make

---

## Phase 1: Genericize Existing Template

### Task 1: Create Configuration Variables in Makefile

**Files:**
- Modify: `Makefile:1-40`

**Step 1: Add configuration section to Makefile**

Replace lines 1-40 with:

```makefile
# ==========================================
# markdown-chartpress Configuration
# ==========================================
# Customizable template for VitePress + PDF documentation generation
# Repository: https://github.com/guglielmo/markdown-chartpress

# PROJECT CONFIGURATION
# ---------------------
PROJECT_TITLE := Professional Documentation
COMPANY_NAME := Your Company
PROJECT_AUTHOR := Documentation Team
PROJECT_DATE := $(shell date +%Y-%m-%d)

# BRANDING
# --------
LOGO_FILE := logo.png
LOGO_SVG := logo.svg
PRIMARY_COLOR_NAME := primarycolor
PRIMARY_COLOR_RGB := 0, 51, 102
PRIMARY_COLOR_HEX := 003366

# DIRECTORIES
# -----------
DOCS_DIR := docs
IMAGES_DIR := images
BUILD_DIR := .build
TEMPLATES_DIR := templates
ASSETS_DIR := assets
SCRIPTS_DIR := scripts
TIMESTAMPS_DIR := .timestamps

# PDF CONFIGURATION
# -----------------
CHART_FORMAT := svg
PDF_MARGIN := 2.5cm
PDF_FONTSIZE := 11pt
PDF_DOCCLASS := article

# TOOLS
# -----
PANDOC := pandoc
PDF_ENGINE := xelatex
VITEPRESS := npx vitepress
NODE := node
DOCKER := docker

# Detect Docker availability
HAS_DOCKER := $(shell command -v docker 2> /dev/null)
HAS_NODE := $(shell command -v node 2> /dev/null)
```

**Step 2: Commit configuration changes**

```bash
git add Makefile
git commit -m "feat: add generic configuration variables to Makefile"
```

---

### Task 2: Create Generic LaTeX Templates

**Files:**
- Create: `templates/header.tex.template`
- Create: `templates/title-page.tex.template`
- Modify: `header.tex` → move to templates/
- Modify: `title-page.tex` → move to templates/

**Step 1: Create header template with placeholders**

Create `templates/header.tex.template`:

```latex
% Header personalizzato
% Questo file definisce lo stile di header e footer

\usepackage{fancyhdr}
\usepackage{graphicx}
\usepackage{lastpage}
\usepackage{xcolor}

% Definizione colore primario (configurabile)
\definecolor{{{PRIMARY_COLOR_NAME}}}{RGB}{{{PRIMARY_COLOR_RGB}}}

% Configurazione header e footer
\pagestyle{fancy}
\fancyhf{}

% Header sinistro: logo + nome azienda
\fancyhead[L]{\includegraphics[height=0.8cm]{{{LOGO_FILE}}}\hspace{0.3cm}\textbf{\color{{{PRIMARY_COLOR_NAME}}}{{COMPANY_NAME}}}}

% Header destro: titolo documento
\fancyhead[R]{\small\textit{\color{{{PRIMARY_COLOR_NAME}}}\@title}}

% Footer centro: numero pagina
\fancyfoot[C]{\small Pagina \thepage\ di \pageref{LastPage}}

% Footer destro: autore
\fancyfoot[R]{\small\textit{\@author}}

% Linea separatrice header e footer
\renewcommand{\headrulewidth}{0.5pt}
\renewcommand{\footrulewidth}{0.5pt}

% Rimuove header dalla prima pagina (title page)
\fancypagestyle{plain}{%
  \fancyhf{}%
  \fancyfoot[C]{\small Pagina \thepage\ di \pageref{LastPage}}
  \fancyfoot[R]{\small\textit{\@author}}
  \renewcommand{\headrulewidth}{0pt}%
  \renewcommand{\footrulewidth}{0.5pt}%
}

% Stile per le sezioni
\usepackage{titlesec}
\titleformat{\section}
  {\color{{{PRIMARY_COLOR_NAME}}}\Large\bfseries}
  {\thesection}
  {1em}
  {}

\titleformat{\subsection}
  {\color{{{PRIMARY_COLOR_NAME}}}\large\bfseries}
  {\thesubsection}
  {1em}
  {}
```

**Step 2: Create title page template with placeholders**

Create `templates/title-page.tex.template`:

```latex
% ==========================================
% PAGINA INIZIALE TEMPLATE
% ==========================================

\thispagestyle{empty}

\begin{center}
\vspace*{3cm}

% Logo centrato
\includegraphics[width=8cm]{{{LOGO_FILE}}}

\vspace{1.5cm}

% Nome azienda
{\Huge \textbf{{{COMPANY_NAME}}}}

\vspace{3cm}

% Titolo documento
{\LARGE \textbf{{{PROJECT_TITLE}}}}

\vspace{0.5cm}

% Sottotitolo
{\Large {{PROJECT_SUBTITLE}}}

\vspace{3cm}

% Tabella informazioni documento
{\large
\begin{tabular}{rl}
\textbf{Data:} & {{PROJECT_DATE}} \\[0.3cm]
\textbf{Autore:} & {{PROJECT_AUTHOR}} \\[0.3cm]
\end{tabular}
}

\end{center}

\newpage
```

**Step 3: Move old templates and commit**

```bash
mkdir -p templates
mv header.tex templates/header.tex.old
mv title-page.tex templates/title-page.tex.old
git add templates/
git commit -m "feat: create generic LaTeX templates with placeholders"
```

---

### Task 3: Add Template Processing to Makefile

**Files:**
- Modify: `Makefile` (add after configuration section)

**Step 1: Add template processing target**

Add after configuration variables in Makefile:

```makefile
# ==========================================
# TEMPLATE PROCESSING
# ==========================================

# Process LaTeX templates with variable substitution
.PHONY: process-templates
process-templates:
	@mkdir -p $(BUILD_DIR)
	@echo "Processing LaTeX templates..."
	@sed -e 's/{{{PRIMARY_COLOR_NAME}}}/$(PRIMARY_COLOR_NAME)/g' \
	     -e 's/{{{PRIMARY_COLOR_RGB}}}/$(PRIMARY_COLOR_RGB)/g' \
	     -e 's/{{COMPANY_NAME}}/$(COMPANY_NAME)/g' \
	     -e 's/{{{LOGO_FILE}}}/$(ASSETS_DIR)\/$(LOGO_FILE)/g' \
	     $(TEMPLATES_DIR)/header.tex.template > $(BUILD_DIR)/header.tex
	@sed -e 's/{{{LOGO_FILE}}}/$(ASSETS_DIR)\/$(LOGO_FILE)/g' \
	     -e 's/{{COMPANY_NAME}}/$(COMPANY_NAME)/g' \
	     -e 's/{{PROJECT_TITLE}}/$(PROJECT_TITLE)/g' \
	     -e 's/{{PROJECT_SUBTITLE}}/$(PROJECT_SUBTITLE)/g' \
	     -e 's/{{PROJECT_DATE}}/$(PROJECT_DATE)/g' \
	     -e 's/{{PROJECT_AUTHOR}}/$(PROJECT_AUTHOR)/g' \
	     $(TEMPLATES_DIR)/title-page.tex.template > $(BUILD_DIR)/title-page.tex
	@echo "Templates processed to $(BUILD_DIR)/"
```

**Step 2: Test template processing**

Run:
```bash
make process-templates
cat .build/header.tex | grep "primarycolor"
```

Expected: Should see "primarycolor" in color definition

**Step 3: Commit**

```bash
git add Makefile
git commit -m "feat: add template processing with sed substitution"
```

---

### Task 4: Rename and Genericize Assets

**Files:**
- Rename: `logo-depp.png` → `assets/logo.png`
- Rename: `logo-depp.svg` → `assets/logo.svg`
- Create: `assets/README.md`

**Step 1: Create assets directory and move files**

```bash
mkdir -p assets
cp logo-depp.png assets/logo.png
cp logo-depp.svg assets/logo.svg
```

**Step 2: Create assets README**

Create `assets/README.md`:

```markdown
# Assets Directory

## Logo Files

- `logo.png` - Company logo (PNG format for LaTeX/PDF)
- `logo.svg` - Company logo (SVG format for VitePress)

### Customization

Replace these files with your company logo. Recommended sizes:
- PNG: 800x800px minimum
- SVG: Vector format

### Usage

- **PDF**: Logo appears in header (0.8cm height) and title page (8cm width)
- **VitePress**: Logo appears in site header and footer

Configure logo filenames in `Makefile`:
```makefile
LOGO_FILE := logo.png
LOGO_SVG := logo.svg
```
```

**Step 3: Update .gitignore**

Add to `.gitignore`:

```
# Keep template assets, but users can override
# assets/logo.png
# assets/logo.svg
```

**Step 4: Commit**

```bash
git add assets/
git add .gitignore
git commit -m "feat: genericize assets directory with placeholder logos"
```

---

### Task 5: Update .gitignore for Build Artifacts

**Files:**
- Modify: `.gitignore`

**Step 1: Create comprehensive .gitignore**

Replace `.gitignore` content:

```gitignore
# Node modules
node_modules/

# Build outputs
dist/
.build/
*.pdf

# Generated charts
images/

# Timestamp tracking
.timestamps/

# VitePress cache
docs/.vitepress/cache/
docs/.vitepress/dist/

# LaTeX temporary files
*.aux
*.log
*.out
*.toc
*.synctex.gz

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Environment
.env
.env.local
```

**Step 2: Commit**

```bash
git add .gitignore
git commit -m "feat: comprehensive .gitignore for build artifacts"
```

---

## Phase 2: VitePress Infrastructure Setup

### Task 6: Initialize npm Package

**Files:**
- Create: `package.json`

**Step 1: Create package.json**

Create `package.json`:

```json
{
  "name": "markdown-chartpress",
  "version": "1.0.0",
  "description": "Professional documentation template with VitePress (interactive charts) and PDF (static images) generation",
  "type": "module",
  "scripts": {
    "docs:dev": "vitepress dev docs",
    "docs:build": "vitepress build docs",
    "docs:preview": "vitepress preview docs"
  },
  "keywords": [
    "vitepress",
    "documentation",
    "pdf",
    "echarts",
    "markdown",
    "pandoc"
  ],
  "author": "Guglielmo Celata",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/guglielmo/markdown-chartpress.git"
  },
  "dependencies": {
    "vitepress": "^1.0.0",
    "vue": "^3.4.0",
    "echarts": "^5.5.0"
  },
  "devDependencies": {
    "markdown-it-task-lists": "^2.1.1"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**Step 2: Initialize npm and install**

```bash
npm install
```

Expected: Creates node_modules/, package-lock.json

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: initialize npm package with VitePress dependencies"
```

---

### Task 7: Copy VitePress Components from strategic-docs

**Files:**
- Create: `docs/.vitepress/components/EChart.vue`
- Create: `docs/.vitepress/components/EChartFromCode.vue`
- Create: `docs/.vitepress/components/DownloadButton.vue`

**Step 1: Create components directory**

```bash
mkdir -p docs/.vitepress/components
```

**Step 2: Copy EChart.vue**

Create `docs/.vitepress/components/EChart.vue`:

```vue
<template>
  <div class="chart-wrapper">
    <h3 v-if="title" class="chart-title">{{ title }}</h3>
    <p v-if="description" class="chart-description">{{ description }}</p>
    <div
      ref="chartRef"
      :style="{ height, width, minHeight: '300px' }"
      class="echart-container"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

const props = withDefaults(defineProps<{
  option: EChartsOption
  height?: string
  width?: string
  theme?: 'light' | 'dark'
  title?: string
  description?: string
}>(), {
  height: '400px',
  width: '100%',
  theme: 'light'
})

const chartRef = ref<HTMLDivElement>()
let chartInstance: echarts.ECharts | null = null

onMounted(() => {
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value, props.theme, {
      renderer: 'canvas'
    })

    const optionWithContainment = {
      ...props.option,
      tooltip: {
        ...((props.option as any).tooltip || {}),
        confine: true,
        appendToBody: false
      }
    }

    chartInstance.setOption(optionWithContainment)
    window.addEventListener('resize', handleResize)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})

watch(() => props.option, (newOption) => {
  if (chartInstance) {
    const optionWithContainment = {
      ...newOption,
      tooltip: {
        ...((newOption as any).tooltip || {}),
        confine: true,
        appendToBody: false
      }
    }
    chartInstance.setOption(optionWithContainment, true)
  }
}, { deep: true })

function handleResize() {
  chartInstance?.resize()
}
</script>

<style scoped>
.echart-container {
  border-radius: 8px;
}
</style>
```

**Step 3: Copy EChartFromCode.vue**

Create `docs/.vitepress/components/EChartFromCode.vue`:

```vue
<template>
  <div class="chart-from-code-wrapper">
    <EChart
      :option="parsedOption"
      :height="height"
      :width="width"
      :theme="theme"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import EChart from './EChart.vue'
import type { EChartsOption } from 'echarts'

const props = withDefaults(defineProps<{
  code: string
  height?: string
  width?: string
  theme?: 'light' | 'dark'
}>(), {
  height: '400px',
  width: '100%',
  theme: 'light'
})

const parsedOption = computed<EChartsOption>(() => {
  try {
    // The code prop contains the chart configuration as a string
    // It can be either JSON or JavaScript object notation
    // We need to evaluate it safely
    const evalCode = `(${props.code})`
    return eval(evalCode)
  } catch (error) {
    console.error('Error parsing chart code:', error)
    return {
      title: {
        text: 'Chart Error',
        subtext: 'Failed to parse chart configuration'
      }
    }
  }
})
</script>

<style scoped>
.chart-from-code-wrapper {
  margin: 1rem 0;
}
</style>
```

**Step 4: Commit**

```bash
git add docs/.vitepress/components/
git commit -m "feat: add EChart Vue components from strategic-docs"
```

---

### Task 8: Copy and Adapt echarts Plugin

**Files:**
- Create: `docs/.vitepress/plugins/echarts-plugin.ts`

**Step 1: Create plugins directory**

```bash
mkdir -p docs/.vitepress/plugins
```

**Step 2: Copy echarts-plugin.ts**

Create `docs/.vitepress/plugins/echarts-plugin.ts`:

```typescript
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
```

**Step 3: Commit**

```bash
git add docs/.vitepress/plugins/
git commit -m "feat: add echarts markdown plugin"
```

---

### Task 9: Create VitePress Theme with Auto-Numbering

**Files:**
- Create: `docs/.vitepress/theme/index.ts`
- Create: `docs/.vitepress/theme/style.css`

**Step 1: Create theme directory**

```bash
mkdir -p docs/.vitepress/theme
```

**Step 2: Create theme index with auto-numbering logic**

Create `docs/.vitepress/theme/index.ts`:

```typescript
import { h, onMounted, watch, nextTick } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { useRoute } from 'vitepress'
import './style.css'

// Import custom components
import EChart from '../components/EChart.vue'
import EChartFromCode from '../components/EChartFromCode.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app, router, siteData }) {
    // Register global components
    app.component('EChart', EChart)
    app.component('EChartFromCode', EChartFromCode)
  },
  setup() {
    const route = useRoute()

    // Extract chapter number from filename (e.g., "01-intro.md" -> "1")
    const getChapterFromPath = (path: string): string | null => {
      const match = path.match(/\/(\d+)-[^/]+/)
      if (match) {
        return String(parseInt(match[1], 10))
      }
      return null
    }

    // Add heading numbers to content and TOC
    const addHeadingNumbers = () => {
      nextTick(() => {
        const chapterNum = getChapterFromPath(route.path)
        if (!chapterNum) {
          document.querySelectorAll('.heading-number').forEach(el => el.remove())
          return
        }

        document.querySelectorAll('.heading-number').forEach(el => el.remove())

        let h2Counter = 0
        let h3Counter = 0

        // Process H2 and H3 headings in main content
        const docElement = document.querySelector('.vp-doc')
        if (docElement) {
          docElement.querySelectorAll('h2, h3').forEach(heading => {
            const level = heading.tagName.toLowerCase()

            if (level === 'h2') {
              h2Counter++
              h3Counter = 0
              const span = document.createElement('span')
              span.className = 'heading-number'
              span.textContent = `${chapterNum}.${h2Counter} `
              heading.insertBefore(span, heading.firstChild)
            } else if (level === 'h3') {
              h3Counter++
              const span = document.createElement('span')
              span.className = 'heading-number'
              span.textContent = `${chapterNum}.${h2Counter}.${h3Counter} `
              heading.insertBefore(span, heading.firstChild)
            }
          })
        }

        // Also add numbers to TOC (right sidebar)
        const tocContainer = document.querySelector('.VPDocAsideOutline')
        if (tocContainer) {
          h2Counter = 0
          h3Counter = 0

          const rootList = tocContainer.querySelector('ul')
          if (rootList) {
            rootList.querySelectorAll(':scope > li').forEach(h2Item => {
              h2Counter++
              h3Counter = 0

              const h2Link = h2Item.querySelector('.outline-link')
              if (h2Link && !h2Link.querySelector('.heading-number')) {
                const span = document.createElement('span')
                span.className = 'heading-number'
                span.textContent = `${chapterNum}.${h2Counter} `
                h2Link.insertBefore(span, h2Link.firstChild)
              }

              const h3List = h2Item.querySelector('ul')
              if (h3List) {
                h3List.querySelectorAll(':scope > li').forEach(h3Item => {
                  h3Counter++

                  const h3Link = h3Item.querySelector('.outline-link')
                  if (h3Link && !h3Link.querySelector('.heading-number')) {
                    const span = document.createElement('span')
                    span.className = 'heading-number'
                    span.textContent = `${chapterNum}.${h2Counter}.${h3Counter} `
                    h3Link.insertBefore(span, h3Link.firstChild)
                  }
                })
              }
            })
          }
        }
      })
    }

    onMounted(() => {
      addHeadingNumbers()

      // Watch for DOM changes
      const observer = new MutationObserver(() => {
        const docElement = document.querySelector('.vp-doc')
        if (docElement) {
          const h2 = docElement.querySelector('h2')
          if (h2 && !h2.querySelector('.heading-number')) {
            addHeadingNumbers()
          }
        }
      })

      const content = document.querySelector('.VPContent')
      if (content) {
        observer.observe(content, {
          childList: true,
          subtree: true
        })
      }
    })

    watch(() => route.path, () => {
      addHeadingNumbers()
    })
  }
} satisfies Theme
```

**Step 3: Create theme styles**

Create `docs/.vitepress/theme/style.css`:

```css
/**
 * Custom styles for markdown-chartpress
 */

/* Heading numbers styling */
.heading-number {
  color: var(--vp-c-brand-1);
  font-weight: bold;
  margin-right: 0.5em;
}

/* Chart wrapper spacing */
.chart-wrapper {
  margin: 2rem 0;
}

.chart-title {
  margin-bottom: 0.5rem;
  color: var(--vp-c-text-1);
}

.chart-description {
  margin-bottom: 1rem;
  color: var(--vp-c-text-2);
  font-size: 0.9em;
}

/* EChart container */
.echart-container {
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  padding: 1rem;
}
```

**Step 4: Commit**

```bash
git add docs/.vitepress/theme/
git commit -m "feat: add VitePress theme with automatic heading numbering"
```

---

### Task 10: Create Generic VitePress Config

**Files:**
- Create: `docs/.vitepress/config.ts`

**Step 1: Create config.ts with dynamic sidebar generation**

Create `docs/.vitepress/config.ts`:

```typescript
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
      ],
      '/example-with-appendices/': [
        {
          text: 'Example with Appendices',
          items: generateSidebarItems(
            join(__dirname, '../example-with-appendices'),
            '/example-with-appendices/'
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
```

**Step 2: Test VitePress dev server**

Run:
```bash
npm run docs:dev
```

Expected: Server starts on http://localhost:5173 (may have errors since docs/ content doesn't exist yet)

**Step 3: Commit**

```bash
git add docs/.vitepress/config.ts
git commit -m "feat: add generic VitePress config with dynamic sidebar"
```

---

## Phase 3: Chart Rendering Scripts

### Task 11: Create Chart Extraction Script

**Files:**
- Create: `scripts/extract-charts.js`

**Step 1: Create scripts directory**

```bash
mkdir -p scripts
```

**Step 2: Create extract-charts.js**

Create `scripts/extract-charts.js`:

```javascript
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
```

**Step 3: Make executable and test**

```bash
chmod +x scripts/extract-charts.js
node scripts/extract-charts.js docs test-manifest.json
```

Expected: Creates test-manifest.json (may be empty if no markdown files exist yet)

**Step 4: Commit**

```bash
git add scripts/extract-charts.js
git commit -m "feat: add chart extraction script"
```

---

### Task 12: Create Docker Chart Renderer

**Files:**
- Create: `scripts/docker/package.json`
- Create: `scripts/docker/Dockerfile`
- Create: `scripts/docker/render-chart.js`
- Create: `scripts/docker/entrypoint.sh`

**Step 1: Create Docker directory and package.json**

```bash
mkdir -p scripts/docker
```

Create `scripts/docker/package.json`:

```json
{
  "name": "chartpress-renderer",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "puppeteer": "^22.0.0"
  }
}
```

**Step 2: Create Dockerfile**

Create `scripts/docker/Dockerfile`:

```dockerfile
FROM node:24-slim

# Install Chromium and dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
COPY package.json .
RUN npm install

# Copy rendering script
COPY render-chart.js .
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

# Configure Puppeteer to use system Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true

ENTRYPOINT ["/app/entrypoint.sh"]
```

**Step 3: Create render-chart.js**

Create `scripts/docker/render-chart.js`:

```javascript
#!/usr/bin/env node

/**
 * Render charts from manifest using Puppeteer
 */

import puppeteer from 'puppeteer'
import fs from 'fs/promises'
import path from 'path'

async function renderChartPNG(chartConfig, outputPath, width = 800, height = 600) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const page = await browser.newPage()
  await page.setViewport({ width, height })

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
    </head>
    <body style="margin: 0; padding: 0;">
      <div id="chart" style="width: ${width}px; height: ${height}px;"></div>
      <script>
        const chart = echarts.init(document.getElementById('chart'));
        try {
          chart.setOption(${chartConfig});
        } catch (e) {
          console.error('Chart error:', e);
        }
      </script>
    </body>
    </html>
  `

  await page.setContent(html)
  await page.waitForSelector('#chart')
  await page.waitForTimeout(1500) // Wait for chart render

  const element = await page.$('#chart')
  await element.screenshot({ path: outputPath, type: 'png' })

  await browser.close()
}

async function renderChartSVG(chartConfig, outputPath, width = 800, height = 600) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const page = await browser.newPage()
  await page.setViewport({ width, height })

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
    </head>
    <body style="margin: 0; padding: 0;">
      <div id="chart" style="width: ${width}px; height: ${height}px;"></div>
      <script>
        const chart = echarts.init(document.getElementById('chart'), null, {
          renderer: 'svg'
        });
        try {
          chart.setOption(${chartConfig});
        } catch (e) {
          console.error('Chart error:', e);
        }
      </script>
    </body>
    </html>
  `

  await page.setContent(html)
  await page.waitForSelector('#chart')
  await page.waitForTimeout(1500)

  const svgContent = await page.evaluate(() => {
    const svgElement = document.querySelector('#chart svg')
    return svgElement ? svgElement.outerHTML : null
  })

  if (svgContent) {
    await fs.writeFile(outputPath, svgContent, 'utf-8')
  } else {
    throw new Error('Failed to extract SVG content')
  }

  await browser.close()
}

async function renderChart(chartConfig, outputPath, width, height, format) {
  if (format === 'svg') {
    return renderChartSVG(chartConfig, outputPath, width, height)
  } else {
    return renderChartPNG(chartConfig, outputPath, width, height)
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2)

  if (args.length < 2) {
    console.error('Usage: node render-chart.js <manifest> <output-dir> [format]')
    console.error('  format: svg (default) or png')
    process.exit(1)
  }

  const manifestPath = args[0]
  const outputDir = args[1]
  const format = args[2] || 'svg'

  // Read manifest
  const manifestContent = await fs.readFile(manifestPath, 'utf-8')
  const manifest = JSON.parse(manifestContent)

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true })

  console.log(`Rendering charts to ${outputDir} (format: ${format})`)

  let totalCharts = 0

  // Process each file's charts
  for (const fileEntry of manifest) {
    console.log(`\nProcessing ${fileEntry.file}:`)

    for (const chart of fileEntry.charts) {
      const extension = format === 'svg' ? 'svg' : 'png'
      const outputPath = path.join(outputDir, `${chart.id}.${extension}`)

      console.log(`  Rendering ${chart.id} (${chart.width}x${chart.height})...`)

      try {
        await renderChart(
          chart.config,
          outputPath,
          chart.width,
          chart.height,
          format
        )
        console.log(`  ✓ Generated ${outputPath}`)
        totalCharts++
      } catch (error) {
        console.error(`  ✗ Error rendering ${chart.id}:`, error.message)
      }
    }
  }

  console.log(`\n✓ Rendered ${totalCharts} charts`)
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
```

**Step 4: Create entrypoint.sh**

Create `scripts/docker/entrypoint.sh`:

```bash
#!/bin/sh
set -e

# Default command: render charts from manifest
if [ "$1" = "render" ]; then
  shift
  exec node /app/render-chart.js "$@"
else
  exec "$@"
fi
```

**Step 5: Commit**

```bash
git add scripts/docker/
git commit -m "feat: add Docker-based chart renderer with Puppeteer"
```

---

### Task 13: Add Docker Build Target to Makefile

**Files:**
- Modify: `Makefile` (add Docker targets)

**Step 1: Add Docker targets**

Add to Makefile:

```makefile
# ==========================================
# DOCKER CHART RENDERER
# ==========================================

DOCKER_IMAGE := markdown-chartpress/renderer
DOCKER_TAG := latest

.PHONY: docker-build-renderer
docker-build-renderer:
	@echo "Building Docker chart renderer image..."
	cd $(SCRIPTS_DIR)/docker && $(DOCKER) build -t $(DOCKER_IMAGE):$(DOCKER_TAG) .
	@echo "✓ Docker image built: $(DOCKER_IMAGE):$(DOCKER_TAG)"

.PHONY: docker-test-renderer
docker-test-renderer:
	@echo "Testing Docker renderer..."
	@echo '{"file":"test.md","charts":[{"id":"test","config":"{title:{text:\"Test\"},series:[{data:[1,2,3],type:\"line\"}]}","format":"svg","width":800,"height":600}]}' > /tmp/test-manifest.json
	$(DOCKER) run --rm -v /tmp:/workspace $(DOCKER_IMAGE):$(DOCKER_TAG) render /workspace/test-manifest.json /workspace svg
	@echo "✓ Check /tmp/test.svg"
```

**Step 2: Test Docker build**

Run:
```bash
make docker-build-renderer
```

Expected: Docker image builds successfully

**Step 3: Commit**

```bash
git add Makefile
git commit -m "feat: add Docker renderer build target"
```

---

## Phase 4: PDF Generation Pipeline

### Task 14: Create Markdown Preprocessor for PDF

**Files:**
- Create: `scripts/preprocess-markdown.js`

**Step 1: Create preprocess-markdown.js**

Create `scripts/preprocess-markdown.js`:

```javascript
#!/usr/bin/env node

/**
 * Preprocess markdown files for Pandoc PDF generation
 * Replaces ```echarts blocks with ![](images/chart-id.svg) references
 */

import fs from 'fs/promises'
import crypto from 'crypto'

/**
 * Process a single markdown file
 */
async function preprocessMarkdown(filePath, imagesDir) {
  const content = await fs.readFile(filePath, 'utf-8')
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
```

**Step 2: Make executable and test**

```bash
chmod +x scripts/preprocess-markdown.js
```

**Step 3: Commit**

```bash
git add scripts/preprocess-markdown.js
git commit -m "feat: add markdown preprocessor for PDF generation"
```

---

### Task 15: Add Chart Rendering Makefile Targets

**Files:**
- Modify: `Makefile` (add chart rendering targets)

**Step 1: Add chart rendering logic**

Add to Makefile:

```makefile
# ==========================================
# CHART RENDERING
# ==========================================

MANIFEST_FILE := $(BUILD_DIR)/charts-manifest.json

.PHONY: extract-charts
extract-charts:
	@mkdir -p $(BUILD_DIR)
	@echo "Extracting charts from $(DOCS_DIR)..."
	$(NODE) $(SCRIPTS_DIR)/extract-charts.js $(DOCS_DIR) $(MANIFEST_FILE)

.PHONY: render-charts
render-charts: extract-charts
	@echo "Rendering charts..."
ifdef HAS_DOCKER
	@echo "Using Docker renderer..."
	$(DOCKER) run --rm \
	  -v $(PWD)/$(BUILD_DIR):/workspace/build \
	  -v $(PWD)/$(IMAGES_DIR):/workspace/images \
	  $(DOCKER_IMAGE):$(DOCKER_TAG) \
	  render /workspace/build/charts-manifest.json /workspace/images $(CHART_FORMAT)
else ifdef HAS_NODE
	@echo "Docker not found, using local Node.js..."
	@test -d node_modules/puppeteer && \
	  $(NODE) $(SCRIPTS_DIR)/docker/render-chart.js $(MANIFEST_FILE) $(IMAGES_DIR) $(CHART_FORMAT) || \
	  (echo "Error: puppeteer not installed. Run 'npm install puppeteer' or use Docker"; exit 1)
else
	@echo "Error: Neither Docker nor Node.js found"
	@exit 1
endif
	@echo "✓ Charts rendered to $(IMAGES_DIR)/"

.PHONY: charts
charts: render-charts
```

**Step 2: Commit**

```bash
git add Makefile
git commit -m "feat: add chart rendering Makefile targets"
```

---

### Task 16: Add PDF Generation Makefile Targets

**Files:**
- Modify: `Makefile` (add PDF targets)

**Step 1: Add PDF generation targets**

Add to Makefile:

```makefile
# ==========================================
# PDF GENERATION
# ==========================================

# Preprocess markdown files for Pandoc
.PHONY: preprocess-markdown
preprocess-markdown: charts
	@mkdir -p $(BUILD_DIR)/processed
	@echo "Preprocessing markdown files..."
	@for file in $(DOCS_DIR)/**/*.md; do \
	  if [ -f "$$file" ]; then \
	    outfile=$(BUILD_DIR)/processed/$$(basename $$file); \
	    $(NODE) $(SCRIPTS_DIR)/preprocess-markdown.js "$$file" $(IMAGES_DIR) > "$$outfile"; \
	  fi \
	done
	@echo "✓ Markdown preprocessed to $(BUILD_DIR)/processed/"

# Generate full PDF (all content)
.PHONY: pdf-full
pdf-full: process-templates preprocess-markdown
	@echo "Generating full PDF..."
	@cat $(BUILD_DIR)/processed/*.md > $(BUILD_DIR)/merged.md
	$(PANDOC) $(BUILD_DIR)/merged.md \
	  -o $(PROJECT_TITLE)-full.pdf \
	  --pdf-engine=$(PDF_ENGINE) \
	  -H $(BUILD_DIR)/header.tex \
	  -B $(BUILD_DIR)/title-page.tex \
	  --number-sections \
	  -V geometry:margin=$(PDF_MARGIN) \
	  -V fontsize=$(PDF_FONTSIZE) \
	  -V documentclass=$(PDF_DOCCLASS)
	@echo "✓ Generated $(PROJECT_TITLE)-full.pdf"

# Generate chapter PDF (pattern: pdf-chapter-01)
.PHONY: pdf-chapter-%
pdf-chapter-%: process-templates preprocess-markdown
	@echo "Generating chapter $* PDF..."
	@file=$$(find $(DOCS_DIR) -name "$*-*.md" -type f | head -1); \
	if [ -z "$$file" ]; then \
	  echo "Error: Chapter $* not found"; \
	  exit 1; \
	fi; \
	outfile=$(BUILD_DIR)/processed/$$(basename $$file); \
	$(PANDOC) "$$outfile" \
	  -o chapter-$*.pdf \
	  --pdf-engine=$(PDF_ENGINE) \
	  -H $(BUILD_DIR)/header.tex \
	  --number-sections \
	  -V geometry:margin=$(PDF_MARGIN) \
	  -V fontsize=$(PDF_FONTSIZE)
	@echo "✓ Generated chapter-$*.pdf"

# Generate appendices PDF
.PHONY: pdf-appendices
pdf-appendices: process-templates preprocess-markdown
	@echo "Generating appendices PDF..."
	@find $(BUILD_DIR)/processed -name "A*-*.md" -exec cat {} \; > $(BUILD_DIR)/appendices.md
	$(PANDOC) $(BUILD_DIR)/appendices.md \
	  -o appendices.pdf \
	  --pdf-engine=$(PDF_ENGINE) \
	  -H $(BUILD_DIR)/header.tex \
	  --number-sections \
	  -V geometry:margin=$(PDF_MARGIN) \
	  -V fontsize=$(PDF_FONTSIZE)
	@echo "✓ Generated appendices.pdf"

.PHONY: pdf
pdf: pdf-full
```

**Step 2: Commit**

```bash
git add Makefile
git commit -m "feat: add PDF generation targets with flexible output options"
```

---

## Phase 5: VitePress Build Targets

### Task 17: Add VitePress Makefile Targets

**Files:**
- Modify: `Makefile` (add VitePress targets)

**Step 1: Add VitePress targets**

Add to Makefile:

```makefile
# ==========================================
# VITEPRESS SITE
# ==========================================

.PHONY: dev
dev:
	@echo "Starting VitePress dev server..."
	@echo "Interactive charts will render in browser"
	$(VITEPRESS) dev $(DOCS_DIR)

.PHONY: site
site:
	@echo "Building VitePress static site..."
	$(VITEPRESS) build $(DOCS_DIR)
	@echo "✓ Site built to $(DOCS_DIR)/.vitepress/dist/"

.PHONY: preview
preview: site
	@echo "Previewing built site..."
	$(VITEPRESS) preview $(DOCS_DIR)

# Full production build
.PHONY: build
build: charts site pdf-full
	@echo ""
	@echo "✓ Full build complete!"
	@echo "  - Static site: $(DOCS_DIR)/.vitepress/dist/"
	@echo "  - PDF: $(PROJECT_TITLE)-full.pdf"
	@echo "  - Charts: $(IMAGES_DIR)/"
```

**Step 2: Commit**

```bash
git add Makefile
git commit -m "feat: add VitePress build and dev targets"
```

---

### Task 18: Add Utility Makefile Targets

**Files:**
- Modify: `Makefile` (add utility targets)

**Step 1: Add utility targets**

Add to Makefile:

```makefile
# ==========================================
# UTILITIES
# ==========================================

.PHONY: clean
clean:
	@echo "Cleaning build artifacts..."
	rm -rf $(BUILD_DIR)
	rm -rf $(IMAGES_DIR)
	rm -rf $(TIMESTAMPS_DIR)
	rm -rf $(DOCS_DIR)/.vitepress/dist
	rm -rf $(DOCS_DIR)/.vitepress/cache
	rm -f *.pdf
	@echo "✓ Clean complete"

.PHONY: check
check:
	@echo "Checking dependencies..."
	@command -v $(PANDOC) >/dev/null 2>&1 || echo "  ✗ pandoc not found"
	@command -v $(PDF_ENGINE) >/dev/null 2>&1 || echo "  ✗ xelatex not found"
	@command -v $(NODE) >/dev/null 2>&1 || echo "  ✗ node not found"
	@command -v $(DOCKER) >/dev/null 2>&1 || echo "  ✗ docker not found"
	@command -v npm >/dev/null 2>&1 || echo "  ✗ npm not found"
	@test -d node_modules || echo "  ✗ node_modules not found (run npm install)"
	@echo "✓ Dependency check complete"

.PHONY: info
info:
	@echo "markdown-chartpress Configuration:"
	@echo "=================================="
	@echo "Project: $(PROJECT_TITLE)"
	@echo "Company: $(COMPANY_NAME)"
	@echo "Author: $(PROJECT_AUTHOR)"
	@echo ""
	@echo "Directories:"
	@echo "  Docs: $(DOCS_DIR)"
	@echo "  Images: $(IMAGES_DIR)"
	@echo "  Build: $(BUILD_DIR)"
	@echo ""
	@echo "PDF Config:"
	@echo "  Chart format: $(CHART_FORMAT)"
	@echo "  Margin: $(PDF_MARGIN)"
	@echo "  Font size: $(PDF_FONTSIZE)"
	@echo ""
	@echo "Tools:"
	@echo "  Docker: $(if $(HAS_DOCKER),✓ available,✗ not found)"
	@echo "  Node.js: $(if $(HAS_NODE),✓ available,✗ not found)"

.PHONY: help
help:
	@echo "markdown-chartpress - Makefile Targets"
	@echo "======================================"
	@echo ""
	@echo "Development:"
	@echo "  make dev              Start VitePress dev server"
	@echo "  make preview          Preview built site"
	@echo ""
	@echo "Building:"
	@echo "  make build            Full production build (site + PDF + charts)"
	@echo "  make site             Build VitePress static site only"
	@echo "  make pdf-full         Generate complete PDF"
	@echo "  make pdf-chapter-XX   Generate specific chapter PDF"
	@echo "  make pdf-appendices   Generate appendices PDF"
	@echo ""
	@echo "Charts:"
	@echo "  make charts           Extract and render all charts"
	@echo "  make extract-charts   Extract chart definitions only"
	@echo "  make render-charts    Render extracted charts"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build-renderer  Build chart renderer Docker image"
	@echo "  make docker-test-renderer   Test Docker renderer"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean            Remove all build artifacts"
	@echo "  make check            Check dependencies"
	@echo "  make info             Show current configuration"
	@echo "  make help             Show this help"
	@echo ""
	@echo "Configuration:"
	@echo "  Edit Makefile variables at top of file to customize"

.PHONY: all
all: build
```

**Step 2: Test help target**

Run:
```bash
make help
```

Expected: Shows comprehensive help text

**Step 3: Commit**

```bash
git add Makefile
git commit -m "feat: add utility targets (clean, check, info, help)"
```

---

## Phase 6: Example Content

### Task 19: Create Landing Page

**Files:**
- Create: `docs/index.md`

**Step 1: Create docs directory**

```bash
mkdir -p docs
```

**Step 2: Create index.md**

Create `docs/index.md`:

```markdown
---
layout: home
title: markdown-chartpress
description: Professional documentation with interactive charts and PDF generation

hero:
  name: markdown-chartpress
  text: Documentation Template
  tagline: Interactive VitePress sites with professional PDF exports
  actions:
    - theme: brand
      text: Get Started
      link: /example-report/
    - theme: alt
      text: View on GitHub
      link: https://github.com/guglielmo/markdown-chartpress

features:
  - icon: 📊
    title: Interactive Charts
    details: Embed ECharts visualizations in markdown using ```echarts code blocks. Charts are interactive in the web view.

  - icon: 📄
    title: Professional PDFs
    details: Generate publication-quality PDFs with static chart images via Pandoc + XeLaTeX. Fully customizable branding.

  - icon: ⚡
    title: Live Development
    details: VitePress dev server with hot reload. Edit markdown and see changes instantly with interactive charts.

  - icon: 🎨
    title: Automatic Numbering
    details: Chapter and section numbers auto-generated from filenames (01-intro.md → "1. Introduction").

  - icon: 🐳
    title: Docker-Powered
    details: Chart rendering via Dockerized Puppeteer. Optional local rendering for development.

  - icon: 🔧
    title: Highly Configurable
    details: Customize branding, colors, logos via Makefile variables. No code changes needed.
---

## Quick Start

```bash
# Clone template
git clone https://github.com/guglielmo/markdown-chartpress.git my-docs
cd my-docs

# Install dependencies
npm install

# Start dev server
make dev

# Build everything
make build
```

## Features

### Dual Output Format

- **VitePress Site**: Interactive documentation with live charts, search, navigation
- **PDF Documents**: Professional exports with static chart images for print/distribution

### Chart Integration

Embed charts using standard markdown code fences:

\`\`\`echarts
{
  "title": { "text": "Sales Data" },
  "xAxis": { "type": "category", "data": ["Mon", "Tue", "Wed"] },
  "yAxis": { "type": "value" },
  "series": [{ "data": [120, 200, 150], "type": "bar" }]
}
\`\`\`

Charts render interactively in VitePress, statically in PDFs.

### Flexible PDF Generation

- `make pdf-full` - Complete document (all chapters + appendices)
- `make pdf-chapter-01` - Individual chapter
- `make pdf-appendices` - Appendices only

## Examples

Explore the example documentation:

- [Simple Report](/example-report/) - Basic document with charts
- [Complex Document](/example-with-appendices/) - Multi-chapter with appendices

## Documentation

See [README.md](https://github.com/guglielmo/markdown-chartpress) for complete documentation.
```

**Step 3: Commit**

```bash
git add docs/index.md
git commit -m "feat: create landing page for VitePress site"
```

---

### Task 20: Create Example Report Structure

**Files:**
- Create: `docs/example-report/index.md`
- Create: `docs/example-report/01-introduction.md`
- Create: `docs/example-report/02-conclusions.md`

**Step 1: Create example-report directory**

```bash
mkdir -p docs/example-report
```

**Step 2: Create index.md**

Create `docs/example-report/index.md`:

```markdown
---
title: Example Business Report
description: A simple documentation example with charts
---

# Example Business Report

This is a simple example report demonstrating the markdown-chartpress template.

## Overview

This report demonstrates:
- **Automatic chapter numbering** from filenames (01-, 02-)
- **Interactive charts** rendered from ```echarts blocks
- **Professional PDF** generation with static chart images
- **VitePress navigation** with sidebar and table of contents

## Contents

- [1. Introduction](/example-report/01-introduction) - Market analysis with charts
- [2. Conclusions](/example-report/02-conclusions) - Final thoughts

## Building This Report

```bash
# View in browser (interactive charts)
make dev

# Generate PDF
make pdf-full

# Generate specific chapter
make pdf-chapter-01
```

## Next Steps

See [Example with Appendices](/example-with-appendices/) for a more complex document structure.
```

**Step 3: Create 01-introduction.md with chart example**

Create `docs/example-report/01-introduction.md`:

```markdown
---
title: Introduction and Market Analysis
description: Market trends and background context
---

# Introduction and Market Analysis

## Background

This chapter demonstrates how to embed interactive charts in your documentation using ECharts code blocks.

## Market Trends

The following chart shows market growth over a 5-year period:

<!-- chart: market-growth-trends -->
\`\`\`echarts
{
  "title": {
    "text": "Market Growth 2024-2028",
    "left": "center"
  },
  "tooltip": {
    "trigger": "axis"
  },
  "xAxis": {
    "type": "category",
    "data": ["2024", "2025", "2026", "2027", "2028"],
    "name": "Year"
  },
  "yAxis": {
    "type": "value",
    "name": "Revenue (M€)"
  },
  "series": [{
    "data": [100, 150, 225, 320, 450],
    "type": "line",
    "smooth": true,
    "lineStyle": {
      "width": 3
    },
    "areaStyle": {
      "opacity": 0.3
    }
  }]
}
\`\`\`

**Key observations:**
- Steady growth trajectory
- 45% CAGR over 5-year period
- Acceleration in years 2027-2028

## Regional Distribution

Market distribution by region:

\`\`\`echarts
{
  "title": {
    "text": "Revenue by Region (2028)",
    "left": "center"
  },
  "tooltip": {
    "trigger": "item",
    "formatter": "{b}: €{c}M ({d}%)"
  },
  "series": [{
    "type": "pie",
    "radius": "70%",
    "data": [
      { "value": 180, "name": "Europe" },
      { "value": 135, "name": "North America" },
      { "value": 90, "name": "Asia Pacific" },
      { "value": 45, "name": "Other" }
    ],
    "emphasis": {
      "itemStyle": {
        "shadowBlur": 10,
        "shadowOffsetX": 0,
        "shadowColor": "rgba(0, 0, 0, 0.5)"
      }
    }
  }]
}
\`\`\`

## Chart Features

Note how the charts above demonstrate:
- **Explicit IDs**: The first chart has `<!-- chart: market-growth-trends -->` comment
- **Auto IDs**: The second chart has no comment, will get auto-generated hash ID
- **Interactivity**: Hover over charts in the web view to see tooltips
- **PDF Export**: These same charts render as static SVG images in PDF output

## Technical Details

Charts are defined using standard ECharts JSON configuration. See [ECharts documentation](https://echarts.apache.org/) for full API reference.
```

**Step 4: Create 02-conclusions.md**

Create `docs/example-report/02-conclusions.md`:

```markdown
---
title: Conclusions and Next Steps
description: Summary and recommendations
---

# Conclusions and Next Steps

## Summary

This example report demonstrated the core features of markdown-chartpress:

1. **Chapter Organization**: Files named `01-*.md`, `02-*.md` auto-number in sidebar and content
2. **Interactive Charts**: ECharts render live in browser, static in PDF
3. **Professional Output**: VitePress site + LaTeX PDF with customizable branding

## Recommendations

For your own documentation:

1. **Customize branding** - Edit `Makefile` variables:
   ```makefile
   PROJECT_TITLE := Your Project
   COMPANY_NAME := Your Company
   PRIMARY_COLOR_RGB := 0, 51, 102
   ```

2. **Replace logo** - Add your logo to `assets/logo.png` and `assets/logo.svg`

3. **Add content** - Create markdown files in `docs/your-project/` following naming convention

4. **Build outputs**:
   ```bash
   make dev      # Development with live reload
   make build    # Production build (site + PDF)
   ```

## Example Image

You can also embed regular images:

![markdown-chartpress](../../assets/logo.svg){ width=200px }

## Next Steps

See [Example with Appendices](/example-with-appendices/) for a more complex document with appendices and multiple sections.
```

**Step 5: Commit**

```bash
git add docs/example-report/
git commit -m "feat: create example report with chart demonstrations"
```

---

### Task 21: Update README

**Files:**
- Modify: `README.md`

**Step 1: Create comprehensive README**

Replace `README.md` content:

```markdown
# markdown-chartpress

> Professional documentation template with VitePress (interactive charts) and PDF (static images) generation

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![VitePress](https://img.shields.io/badge/VitePress-1.0-42b883.svg)](https://vitepress.dev/)

## Features

- 📊 **Interactive Charts** - Embed ECharts visualizations using ```echarts markdown code blocks
- 📄 **Professional PDFs** - Generate publication-quality PDFs via Pandoc + XeLaTeX
- ⚡ **Live Development** - VitePress dev server with hot reload and interactive charts
- 🎨 **Auto-Numbering** - Chapter/section numbers from filenames (01-intro.md → "1. Introduction")
- 🐳 **Docker-Powered** - Dockerized Puppeteer for chart rendering (optional local mode)
- 🔧 **Highly Configurable** - Customize branding, colors, logos via Makefile variables

## Quick Start

```bash
# Clone template
git clone https://github.com/guglielmo/markdown-chartpress.git my-documentation
cd my-documentation

# Install dependencies
npm install

# Build Docker chart renderer (optional, recommended)
make docker-build-renderer

# Start development server
make dev
# Opens http://localhost:5173 with live reload

# Generate PDF
make pdf-full
```

## Installation

### Prerequisites

**Required:**
- Node.js 18+ and npm
- Make
- Pandoc 2+
- XeLaTeX (from texlive-xetex package)

**Optional (but recommended):**
- Docker (for chart rendering)

**Install on Ubuntu/Debian:**
```bash
sudo apt-get install pandoc texlive-xetex make
curl -fsSL https://get.docker.com | sh
```

**Install on macOS:**
```bash
brew install pandoc
brew install --cask mactex
brew install make
brew install docker
```

### Check Dependencies

```bash
make check
```

## Usage

### Configuration

Edit `Makefile` variables to customize your documentation:

```makefile
# Project Configuration
PROJECT_TITLE := Your Documentation Title
COMPANY_NAME := Your Company
PROJECT_AUTHOR := Your Name

# Branding
LOGO_FILE := logo.png
PRIMARY_COLOR_RGB := 0, 51, 102    # Your brand color

# PDF Settings
CHART_FORMAT := svg                 # svg or png
PDF_MARGIN := 2.5cm
```

Replace logo files in `assets/`:
- `assets/logo.png` - For PDF (recommended 800x800px)
- `assets/logo.svg` - For VitePress site

### Creating Content

1. **Create document directory:**
   ```bash
   mkdir -p docs/my-report
   ```

2. **Add chapters** (numbered files):
   ```bash
   docs/my-report/
   ├── index.md              # Overview
   ├── 01-introduction.md    # Chapter 1
   ├── 02-analysis.md        # Chapter 2
   └── 03-conclusions.md     # Chapter 3
   ```

3. **Add appendices** (optional):
   ```bash
   docs/my-report/appendici/
   ├── A1-methodology.md
   └── A2-data-sources.md
   ```

### Embedding Charts

Use standard markdown code fences with `echarts` language:

```markdown
<!-- chart: sales-trend -->
\`\`\`echarts
{
  "title": { "text": "Monthly Sales" },
  "xAxis": {
    "type": "category",
    "data": ["Jan", "Feb", "Mar", "Apr", "May"]
  },
  "yAxis": { "type": "value" },
  "series": [{
    "data": [120, 200, 150, 80, 70],
    "type": "bar"
  }]
}
\`\`\`
```

**Chart ID (optional):**
- Add `<!-- chart: your-id -->` before code block for explicit ID
- Without comment, auto-generated hash ID is used

**Chart behav  ior:**
- **VitePress**: Renders interactively in browser (hover, zoom, etc.)
- **PDF**: Renders as static SVG/PNG image

### Building

**Development:**
```bash
make dev          # Start VitePress dev server (http://localhost:5173)
make preview      # Preview production build
```

**Production:**
```bash
make build        # Full build (site + PDF + charts)
make site         # VitePress static site only
make pdf-full     # Complete PDF (all chapters + appendices)
```

**Specific PDFs:**
```bash
make pdf-chapter-01      # Individual chapter
make pdf-chapter-02
make pdf-appendices      # Appendices only
```

**Charts:**
```bash
make charts              # Extract and render all charts
make extract-charts      # Extract definitions only
make render-charts       # Render from extracted definitions
```

**Docker:**
```bash
make docker-build-renderer   # Build chart renderer image
make docker-test-renderer    # Test renderer
```

**Utilities:**
```bash
make clean       # Remove build artifacts
make check       # Check dependencies
make info        # Show configuration
make help        # Show all targets
```

## Architecture

```
markdown files (```echarts blocks)
         ↓
    [VitePress]  →  Interactive site (docs/.vitepress/dist/)
         ↓
    [Extract charts]  →  Manifest (charts to render)
         ↓
    [Docker Puppeteer]  →  Static images (images/*.svg)
         ↓
    [Preprocess MD]  →  Replace charts with ![](images/chart.svg)
         ↓
    [Pandoc + XeLaTeX]  →  Professional PDF (*.pdf)
```

### Key Components

- **VitePress**: Static site generator with Vue-based theming
- **ECharts**: JavaScript visualization library
- **Puppeteer**: Headless Chrome for rendering charts to images
- **Pandoc**: Universal document converter (Markdown → LaTeX)
- **XeLaTeX**: LaTeX engine for PDF generation

### File Structure

```
markdown-chartpress/
├── docs/                      # Documentation content
│   ├── .vitepress/
│   │   ├── config.ts         # VitePress configuration
│   │   ├── theme/            # Custom theme (auto-numbering)
│   │   ├── components/       # Vue components (EChart)
│   │   └── plugins/          # Markdown plugins (echarts-plugin)
│   ├── example-report/       # Example documentation
│   └── index.md              # Landing page
├── scripts/
│   ├── extract-charts.js     # Extract chart definitions
│   ├── preprocess-markdown.js # Replace charts with images for PDF
│   └── docker/
│       ├── Dockerfile        # Chart renderer container
│       └── render-chart.js   # Puppeteer rendering script
├── templates/
│   ├── header.tex.template   # LaTeX header (with placeholders)
│   └── title-page.tex.template # LaTeX title page
├── assets/
│   ├── logo.png              # Your logo (PDF)
│   └── logo.svg              # Your logo (web)
├── Makefile                  # Build orchestration
└── package.json              # Node.js dependencies
```

## Customization

### Branding

Edit `Makefile` variables and replace logos in `assets/`.

### LaTeX Templates

Templates are in `templates/` with `{{PLACEHOLDER}}` syntax:
- `header.tex.template` - Headers, footers, section styling
- `title-page.tex.template` - Title page layout

Placeholders are replaced during build via `make process-templates`.

### VitePress Theme

Customize in `docs/.vitepress/`:
- `config.ts` - Site title, nav, sidebar
- `theme/style.css` - Colors, fonts, spacing
- `theme/index.ts` - Auto-numbering logic

## Examples

See `docs/example-report/` for:
- Chapter numbering (01-, 02- prefix)
- ECharts integration (with and without IDs)
- Image embedding
- Frontmatter metadata

## Troubleshooting

**Charts not rendering in PDF:**
```bash
# Check Docker is available
make check

# Test Docker renderer
make docker-test-renderer

# Try local rendering
npm install puppeteer
make charts
```

**VitePress build fails:**
```bash
# Clean and rebuild
make clean
npm install
make build
```

**PDF generation fails:**
```bash
# Check XeLaTeX installation
xelatex --version

# Check templates processed correctly
make process-templates
cat .build/header.tex
```

**Chapter numbering not working:**
- Ensure files follow pattern: `01-name.md`, `02-name.md`
- Check filename has two-digit prefix
- Appendices should use: `A1-name.md`, `A2-name.md`

## License

MIT © Guglielmo Celata

## Contributing

Issues and pull requests welcome on [GitHub](https://github.com/guglielmo/markdown-chartpress).

## Acknowledgments

- VitePress infrastructure inspired by [DEPP Strategic Docs](https://gitlab.openpolis.io/lab/depp-strategic-docs)
- Built with [VitePress](https://vitepress.dev/), [ECharts](https://echarts.apache.org/), [Pandoc](https://pandoc.org/)
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: comprehensive README with quick start and usage"
```

---

## Phase 7: Final Integration

### Task 22: Create LICENSE

**Files:**
- Create: `LICENSE`

**Step 1: Create MIT license**

Create `LICENSE`:

```
MIT License

Copyright (c) 2025 Guglielmo Celata

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

**Step 2: Commit**

```bash
git add LICENSE
git commit -m "docs: add MIT license"
```

---

### Task 23: Full System Test

**Files:**
- None (testing only)

**Step 1: Clean build from scratch**

```bash
make clean
```

**Step 2: Check dependencies**

```bash
make check
```

Expected: Lists all dependencies and their status

**Step 3: Build Docker renderer**

```bash
make docker-build-renderer
```

Expected: Docker image builds successfully

**Step 4: Start dev server**

```bash
make dev
```

Expected:
- Server starts on http://localhost:5173
- Landing page loads
- Example report accessible
- Charts render interactively

**Step 5: Build full production**

```bash
# Stop dev server (Ctrl+C)
make build
```

Expected:
- Charts extracted and rendered to `images/`
- VitePress site built to `docs/.vitepress/dist/`
- PDF generated successfully

**Step 6: Verify outputs**

```bash
ls -lh docs/.vitepress/dist/
ls -lh images/
ls -lh *.pdf
```

Expected: All outputs present

**Step 7: Test individual PDF generation**

```bash
make pdf-chapter-01
```

Expected: `chapter-01.pdf` generated

**Step 8: Document test results**

If all tests pass, create test report:

```bash
git add -A
git commit -m "test: verify full system integration"
```

---

### Task 24: Cleanup and Archive DEPP-Specific Files

**Files:**
- Move: Old DEPP-specific files to `archive/`

**Step 1: Create archive directory**

```bash
mkdir -p archive
```

**Step 2: Move old files**

```bash
mv documento_esempio.md archive/
mv documento_esempio.pdf archive/ 2>/dev/null || true
mv templates/header.tex.old archive/ 2>/dev/null || true
mv templates/title-page.tex.old archive/ 2>/dev/null || true
mv embed_echarts_in_pdf_discussion.md design/
```

**Step 3: Update .gitignore to track archive**

Add to `.gitignore`:
```
# Archive directory for reference
# archive/
```

**Step 4: Commit**

```bash
git add archive/ design/
git add .gitignore
git commit -m "chore: archive DEPP-specific original files"
```

---

### Task 25: Final README Review

**Files:**
- Review: `README.md`, `package.json`, `Makefile`

**Step 1: Verify all GitHub references**

Check that all URLs point to correct repository:
```bash
grep -r "github.com" README.md package.json docs/.vitepress/config.ts
```

Expected: All should reference `github.com/guglielmo/markdown-chartpress`

**Step 2: Verify no hardcoded DEPP references remain**

```bash
grep -ri "depp" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=archive
```

Expected: Only in comments, examples, or archive/

**Step 3: Test info command**

```bash
make info
```

Expected: Shows generic configuration, not DEPP-specific

**Step 4: Commit any final adjustments**

```bash
git add -A
git commit -m "docs: final verification and cleanup"
```

---

## Completion Checklist

### Phase 1: Genericize ✓
- [x] Add configuration variables to Makefile
- [x] Create generic LaTeX templates with placeholders
- [x] Add template processing with sed substitution
- [x] Rename and genericize assets
- [x] Update .gitignore

### Phase 2: VitePress ✓
- [x] Initialize npm package
- [x] Copy EChart Vue components
- [x] Copy echarts plugin
- [x] Create theme with auto-numbering
- [x] Create generic VitePress config

### Phase 3: Chart Rendering ✓
- [x] Create chart extraction script
- [x] Create Docker chart renderer (Dockerfile, render script)
- [x] Add Docker build target

### Phase 4: PDF Generation ✓
- [x] Create markdown preprocessor
- [x] Add chart rendering Makefile targets
- [x] Add PDF generation Makefile targets

### Phase 5: VitePress Build ✓
- [x] Add VitePress Makefile targets
- [x] Add utility targets (clean, check, info, help)

### Phase 6: Example Content ✓
- [x] Create landing page
- [x] Create example report with charts
- [x] Update README

### Phase 7: Final Integration ✓
- [x] Create LICENSE
- [x] Full system test
- [x] Cleanup and archive
- [x] Final verification

## Ready for GitHub

After completing this plan, the repository is ready to push to GitHub:

```bash
# Initialize git if not already done
git init
git branch -M main

# Add GitHub remote
git remote add origin https://github.com/guglielmo/markdown-chartpress.git

# Push to GitHub
git push -u origin main
```

## Post-Launch Tasks (Optional)

1. **GitHub Actions CI/CD** - Auto-build on push
2. **Docker Hub** - Publish chart-renderer image
3. **GitHub Pages** - Host example documentation
4. **npm package** - Distribute as scaffolding tool
5. **Documentation site** - Dedicated docs site
