# DEPP Documentation Template - ECharts + VitePress Integration Design

**Date:** 2025-11-11
**Status:** Validated
**Type:** Architecture & Implementation Design

## Overview

A reusable Git template for generating professional DEPP-branded documentation with dual outputs:
- **Interactive VitePress website** with live echarts visualizations
- **Professional PDF documents** with static chart images

### Core Principles

- **Single instance = single document project** (e.g., business plan, technical report, client proposal)
- **Hybrid distribution**: Clone template for direct use, Docker images for automation/CI
- **Docker-preferred rendering**: Chart extraction via containerized Puppeteer, optional local fallback
- **Makefile-driven configuration**: All customization (title, colors, branding) via Makefile variables

### Key Workflows

**Development mode** (`make dev`):
- VitePress dev server with live reload
- Charts render interactively in browser via Vue components
- No pre-rendering needed

**Production build** (`make build`):
- Extract charts from markdown, render to SVG/PNG via Docker
- Build static VitePress site (still interactive charts in browser)
- Generate PDF(s) with embedded static chart images
- Configurable: full PDF, per-chapter PDFs, or appendices-only

**Outputs:**
- `dist/` - VitePress static site (deploy to web server)
- `*.pdf` - Generated PDF documents (download from site)

---

## Directory Structure

```
docs_template/
├── docs/
│   ├── index.md                          # Landing page
│   ├── .vitepress/
│   │   ├── config.ts                     # VitePress config (from strategic-docs)
│   │   ├── theme/
│   │   │   ├── index.ts                 # Custom theme with auto-numbering
│   │   │   └── style.css                # Numbering styles
│   │   ├── components/
│   │   │   ├── EChart.vue               # Chart component
│   │   │   ├── EChartFromCode.vue       # Renders from code string
│   │   │   └── DownloadButton.vue       # PDF download button
│   │   └── plugins/
│   │       └── echarts-plugin.ts        # Markdown processor for ```echarts
│   │
│   ├── example-report/
│   │   ├── index.md                      # Simple example (intro)
│   │   ├── 01-introduction.md           # With echarts example
│   │   └── 02-conclusions.md            # With image example
│   │
│   └── example-with-appendices/
│       ├── index.md                      # Complex example
│       ├── 01-main-analysis.md          # With multiple echarts
│       ├── 02-methodology.md
│       └── appendici/
│           ├── A1-technical-details.md
│           └── A2-data-sources.md
│
├── scripts/
│   ├── extract-charts.js                 # Find ```echarts blocks in markdown
│   ├── preprocess-markdown.js            # Convert echarts blocks to images for Pandoc
│   └── docker/
│       ├── Dockerfile                    # Chart renderer image (node:24-slim)
│       ├── render-chart.js              # Puppeteer rendering script
│       └── entrypoint.sh                # Container entrypoint
│
├── images/                               # Generated charts (gitignored)
├── .build/                               # Temp build artifacts (gitignored)
│
├── templates/
│   ├── header.tex                        # LaTeX header template
│   └── title-page.tex                   # LaTeX title page template
│
├── assets/
│   ├── logo-depp.png
│   └── logo-depp.svg
│
├── Makefile                              # Build orchestration + configuration
├── package.json                          # VitePress + echarts only
├── .gitignore
└── README.md
```

### Key Decisions

- `.vitepress/` lives inside `docs/` (standard VitePress structure)
- `templates/` for LaTeX files (will be processed with sed substitution)
- Two example documents showing simple vs complex patterns
- `scripts/docker/` self-contained for chart renderer
- Generated files (`images/`, `.build/`) gitignored

---

## Chart Rendering Pipeline

### Chart Identification and Extraction

Markdown uses standard code fences:

```markdown
<!-- chart: revenue-analysis -->
```echarts
{
  "title": { "text": "Revenue Growth" },
  "xAxis": { "type": "category", "data": ["2026", "2027", "2028"] },
  "yAxis": { "type": "value" },
  "series": [{ "data": [331, 543, 755], "type": "bar" }]
}
```
```

### ID Resolution (Hybrid Approach)

1. Check for `<!-- chart: id -->` comment immediately before fence
2. If found → use `id.svg` as filename
3. If not found → hash chart content → `chart-a3f5b2c8.svg`

### Rendering Flow

**For VitePress (dev + site build):**

```
```echarts block
    ↓
echarts-plugin.ts transforms to <EChartFromCode>
    ↓
Vue component renders in browser using echarts.js
    ↓
Interactive chart (hover, zoom, etc.)
```

**For PDF build:**

```
```echarts block in markdown
    ↓
extract-charts.js scans files, builds manifest:
  { file: "01-main.md", charts: [{id: "revenue", config: {...}, format: "svg"}] }
    ↓
Docker: docker run -v $(pwd):/workspace depp/chart-renderer process manifest.json
  (or local: node scripts/docker/render-chart.js if Docker unavailable)
    ↓
Puppeteer renders to images/revenue-analysis.svg
    ↓
preprocess-markdown.js: ```echarts block → ![Chart](images/revenue-analysis.svg)
    ↓
Pandoc processes preprocessed markdown → PDF
```

### Incremental Builds (Timestamp Tracking)

- `.timestamps/` directory tracks when each markdown file was last processed
- Only re-render charts from files that changed
- Based on Option 3 from the original discussion document

---

## Makefile Configuration

### Configuration Variables (Top of Makefile)

```makefile
# Project configuration
PROJECT_TITLE := DEPP Strategic Documentation
PROJECT_AUTHOR := DEPP SRL
PROJECT_DATE := $(shell date +%Y-%m-%d)

# Theme customization
THEME_COLOR_RGB := 0, 51, 102           # DEPP blue
THEME_COLOR_HEX := 003366

# Paths
DOCS_DIR := docs
IMAGES_DIR := images
BUILD_DIR := .build
TEMPLATES_DIR := templates

# Output configuration
CHART_FORMAT := svg                      # svg or png
PDF_MARGIN := 2.5cm
PDF_FONTSIZE := 11pt
```

### Main Targets

```makefile
make dev              # VitePress dev server (live reload, interactive charts)
make site             # Build static VitePress site
make charts           # Extract and render all charts (incremental)
make pdf-full         # Complete PDF (all chapters + appendices)
make pdf-chapter-XX   # Individual chapter PDF (e.g., pdf-chapter-01)
make pdf-appendices   # Appendices-only PDF
make build            # Full production build (charts + site + pdf-full)
make clean            # Remove generated files
make docker-build-renderer  # Build chart renderer Docker image
make check            # Verify dependencies (pandoc, xelatex, docker/node)
```

### Dependency Chain

- `pdf-*` targets depend on charts being up-to-date
- Charts use timestamp tracking (`.timestamps/*.md.ts`)
- Only changed markdown files trigger chart re-rendering

### Variable Substitution

- Before Pandoc runs, Makefile copies templates/ to .build/
- Runs sed to replace placeholders with Makefile variables
- Pandoc uses processed templates from .build/

---

## Docker Chart Renderer

### Docker Image Structure

```dockerfile
# scripts/docker/Dockerfile
FROM node:24-slim

# Install Chromium dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package.json and install puppeteer
COPY package.json .
RUN npm install

# Copy rendering script
COPY render-chart.js .
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

ENTRYPOINT ["/app/entrypoint.sh"]
```

### Usage from Makefile

```makefile
# Check if Docker is available
HAS_DOCKER := $(shell command -v docker 2> /dev/null)

render-charts:
ifdef HAS_DOCKER
	@echo "Rendering charts via Docker..."
	docker run --rm \
	  -v $(PWD):/workspace \
	  depp/chart-renderer \
	  process $(DOCS_DIR) $(IMAGES_DIR) $(CHART_FORMAT)
else
	@echo "Docker not found, trying local puppeteer..."
	@command -v node >/dev/null 2>&1 || { echo "Error: Node.js required"; exit 1; }
	@test -d node_modules/puppeteer || { echo "Warning: puppeteer not installed, run 'npm install puppeteer'"; }
	node scripts/docker/render-chart.js $(DOCS_DIR) $(IMAGES_DIR) $(CHART_FORMAT)
endif
```

### render-chart.js Behavior

- Accepts: input directory, output directory, format (svg/png)
- Scans for markdown files with ```echarts blocks
- Extracts charts with ID resolution (comment or hash)
- Renders each via Puppeteer to images/
- Respects timestamp tracking (only re-render if markdown changed)

### Fallback Strategy

1. Try Docker (preferred)
2. Try local node + puppeteer
3. If neither available, check for existing images and warn
4. Fail only if charts needed but no rendering method available

---

## VitePress Configuration & Components

### Reusing from strategic-docs

Copy the entire `.vitepress/` structure from `~/Documents/DEPP/strategic-docs` and adapt:

### config.ts Changes

```typescript
// Remove business-plan specific hardcoded paths
// Make sidebar generation generic/reusable
export default defineConfig({
  title: '{{PROJECT_TITLE}}',  // Will be replaced by build script
  description: 'DEPP Documentation',
  base: '/',  // Configurable per deployment

  themeConfig: {
    logo: '/logo-depp.svg',
    // Sidebar auto-generated from docs/ structure
    sidebar: generateDynamicSidebar(),
    // ... rest from strategic-docs
  },

  markdown: {
    config: (md) => {
      md.use(echartsPlugin)  // Handles ```echarts blocks
      md.use(taskLists, { enabled: true })
    }
  }
})
```

### Components to Copy Directly

- `EChart.vue` - Interactive chart component
- `EChartFromCode.vue` - Renders from code string (what plugin uses)
- `DownloadButton.vue` - PDF download button for site

### echarts-plugin.ts

- Already handles ```echarts code fences
- Transforms to `<EChartFromCode>` component
- Works as-is from strategic-docs

### Automatic Numbering System

Three places with automatic numbering (all from strategic-docs):

1. **Left sidebar** - From `config.ts` `generateSidebarItems()`:
   - `01-introduction.md` → "1. Introduction"

2. **Main content headings** - From `theme/index.ts` `addHeadingNumbers()`:
   - Extracts chapter from filename: `01-introduction.md` → chapter "1"
   - H2 headings → "1.1", "1.2", "1.3"
   - H3 headings → "1.1.1", "1.2.1", etc.
   - Injects `<span class="heading-number">` via DOM manipulation

3. **Right sidebar (TOC/outline)** - Also from `addHeadingNumbers()`:
   - Same numbering applied to outline links
   - "1.1 Section Name", "1.2 Another Section"

**Files to copy:**
- `theme/index.ts` with the `addHeadingNumbers()` function
- `theme/style.css` for styling the `.heading-number` spans
- The config.ts sidebar generation logic

---

## PDF Generation with Preprocessed Markdown

### Challenge

Pandoc doesn't understand ```echarts blocks, but we need chart images in the PDF.

### Solution - Two-Stage Preprocessing

**Stage 1: Extract and render charts**

```javascript
// scripts/extract-charts.js
// Scans markdown files
// Finds ```echarts blocks with optional <!-- chart: id --> comments
// Builds manifest: { file, charts: [{id, config, format}] }
// Triggers Docker renderer (or local puppeteer)
// Outputs to images/
```

**Stage 2: Preprocess markdown for Pandoc**

```javascript
// scripts/preprocess-markdown.js
// Takes original markdown
// Finds ```echarts blocks
// Replaces with ![Chart Description](images/chart-id.svg)
// Outputs to .build/processed/
```

### Makefile PDF Targets

```makefile
# Full document PDF
pdf-full: charts
	@mkdir -p .build/processed
	@node scripts/preprocess-markdown.js docs/example-report/*.md > .build/merged.md
	@sed 's/{{PROJECT_TITLE}}/$(PROJECT_TITLE)/g' templates/header.tex > .build/header.tex
	@sed 's/{{PROJECT_TITLE}}/$(PROJECT_TITLE)/g' templates/title-page.tex > .build/title-page.tex
	pandoc .build/merged.md -o example-report.pdf \
	  --pdf-engine=xelatex \
	  -H .build/header.tex \
	  -B .build/title-page.tex \
	  --number-sections \
	  -V geometry:margin=$(PDF_MARGIN)

# Individual chapter PDF
pdf-chapter-%: charts
	@mkdir -p .build/processed
	@node scripts/preprocess-markdown.js docs/example-report/$*.md > .build/$*.md
	@sed 's/{{PROJECT_TITLE}}/$(PROJECT_TITLE)/g' templates/header.tex > .build/header.tex
	pandoc .build/$*.md -o chapter-$*.pdf \
	  --pdf-engine=xelatex \
	  -H .build/header.tex \
	  --number-sections
```

### Key Features

- Charts rendered once, used in multiple PDF builds
- Preprocessed markdown is temporary (.build/ gitignored)
- Original markdown stays clean (no image references)
- Variable substitution happens in .build/ directory

---

## Example Content Structure

### Example 1: Simple Report (`docs/example-report/`)

```markdown
# index.md
---
title: Example Business Report
description: A simple documentation example
---
# Example Business Report
Introduction text with overview...

# 01-introduction.md
---
title: Introduction and Context
---
# Introduction and Context
## Background
Text content...

## Market Analysis
<!-- chart: market-trends -->
```echarts
{
  "title": { "text": "Market Trends 2024-2028" },
  "xAxis": { "type": "category", "data": ["2024", "2025", "2026", "2027", "2028"] },
  "yAxis": { "type": "value" },
  "series": [{ "data": [100, 150, 200, 280, 350], "type": "line" }]
}
```

# 02-conclusions.md
---
title: Conclusions and Next Steps
---
# Conclusions
Final thoughts with an embedded image...
![DEPP Logo](../assets/logo-depp.png)
```

### Example 2: Complex Document (`docs/example-with-appendices/`)

```markdown
# index.md (executive summary)
# 01-main-analysis.md (multiple charts)
# 02-methodology.md (text + tables)
# appendici/A1-technical-details.md
# appendici/A2-data-sources.md
```

### Key Demonstration Features

- Numbered chapters (01-, 02-)
- Appendices with A1-, A2- prefix
- Multiple echarts in single file
- Chart ID comments (explicit) vs hash (automatic)
- Mixed content (charts + images + tables)
- Frontmatter metadata (title, description)

### Content Migration

- Use `documento_esempio.md` as basis for `01-introduction.md`
- Create new examples showing echarts usage
- Include realistic but simple chart configurations

---

## Template Usage & Distribution

### Initial Setup

```bash
# Clone/copy the template
git clone https://gitlab.com/depp/docs-template.git my-documentation
cd my-documentation

# Install dependencies (VitePress + echarts only)
npm install

# Optional: Build Docker chart renderer image
make docker-build-renderer
# Or pull pre-built: docker pull depp/chart-renderer:latest

# Customize configuration
# Edit Makefile: PROJECT_TITLE, THEME_COLOR_RGB, etc.

# Start developing
make dev    # VitePress dev server at http://localhost:5173
```

### Typical Workflow

```bash
# Edit content in docs/
vim docs/my-report/01-analysis.md

# Preview changes (auto-reload, interactive charts)
make dev

# Build everything for production
make build
  # → Extracts and renders charts (incremental)
  # → Builds VitePress static site to dist/
  # → Generates PDF(s)

# Or build specific outputs
make site              # Just VitePress site
make pdf-full          # Just complete PDF
make pdf-chapter-01    # Just chapter 01 PDF
```

### Version Control

**Files to gitignore:**

```gitignore
# .gitignore
node_modules/
dist/
images/              # Generated charts
.build/              # Temporary build artifacts
.timestamps/         # Chart rendering timestamps
*.pdf               # Generated PDFs
.vitepress/cache/
.vitepress/dist/
```

**Version controlled:**
- docs/ (content)
- templates/ (LaTeX templates)
- scripts/ (build scripts + Docker)
- .vitepress/ (config, components, plugins)
- Makefile, package.json, README.md

### README.md Structure

- Quick start guide
- Makefile targets reference
- Customization guide (Makefile variables)
- Chart syntax examples
- PDF build options
- Docker vs local rendering
- Deployment instructions

### Distribution Options

1. **Git template** - Users clone and customize
2. **Docker image** - `depp/docs-template:latest` for CI/CD
3. **GitLab project template** - One-click create new project

---

## Package Dependencies

### package.json Structure

```json
{
  "name": "depp-docs-template",
  "version": "1.0.0",
  "description": "DEPP Documentation Template - VitePress + PDF generation",
  "scripts": {
    "docs:dev": "vitepress dev docs",
    "docs:build": "vitepress build docs",
    "docs:preview": "vitepress preview docs"
  },
  "dependencies": {
    "vitepress": "^1.0.0",
    "vue": "^3.4.0",
    "echarts": "^5.5.0"
  }
}
```

**Puppeteer NOT included** - Docker is the recommended path. Advanced users can add manually if needed.

---

## Implementation Priority

1. **Phase 1: Core Infrastructure**
   - Directory structure setup
   - Copy .vitepress/ from strategic-docs
   - Basic Makefile with dev/site targets
   - Example content (without charts)

2. **Phase 2: Chart Rendering**
   - Docker renderer (scripts/docker/)
   - extract-charts.js script
   - Timestamp tracking
   - Test with simple echarts examples

3. **Phase 3: PDF Generation**
   - preprocess-markdown.js script
   - LaTeX template processing (sed substitution)
   - PDF targets (full, chapter, appendices)
   - Test complete pipeline

4. **Phase 4: Polish**
   - Example content with realistic charts
   - README documentation
   - Docker image publishing
   - CI/CD integration examples

---

## Success Criteria

- ✅ `make dev` starts VitePress with interactive charts
- ✅ `make site` builds static site with working charts
- ✅ `make pdf-full` generates professional PDF with embedded chart images
- ✅ Chart rendering is incremental (only changed files)
- ✅ Docker and local rendering both work
- ✅ Automatic numbering works (sidebar, content, TOC)
- ✅ Template can be cloned and customized via Makefile variables
- ✅ Example content demonstrates all features

---

## Open Questions / Future Enhancements

1. **CI/CD Integration** - GitLab CI pipeline to auto-build and deploy
2. **Multi-language support** - Italian/English documentation
3. **Chart theming** - Match VitePress light/dark mode in rendered images
4. **PDF bookmarks** - Generate from heading structure
5. **Version stamping** - Auto-inject git commit/tag into PDFs
