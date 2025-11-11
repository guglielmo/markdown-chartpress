# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

markdown-chartpress is a professional documentation template with dual output formats:
- **VitePress Site**: Interactive documentation with ECharts visualizations
- **PDF Documents**: Professional exports with static chart images via Pandoc + XeLaTeX

Built on: VitePress 1.0, Vue 3, ECharts 5, Puppeteer (Docker), Pandoc, XeLaTeX

## Build Commands

### Primary Commands
```bash
make dev              # Start VitePress dev server (http://localhost:5173)
make build            # Full production build (site + PDF + charts)
make site             # Build VitePress static site only
make pdf-full         # Generate complete PDF
make charts           # Extract and render all charts
make clean            # Remove all build artifacts
make check            # Verify dependencies
make help             # Show all available targets
make info             # Display current configuration
```

### Specific Outputs
```bash
make pdf-chapter-01   # Generate specific chapter PDF
make pdf-appendices   # Generate appendices PDF
make extract-charts   # Extract chart definitions to manifest
make render-charts    # Render charts to images (Docker or local)
```

### Docker
```bash
make docker-build-renderer  # Build chart renderer Docker image
make docker-test-renderer   # Test Docker renderer
```

## Architecture

### Dual-Output Pipeline

**VitePress Flow:**
```
markdown (```echarts blocks)
    ↓
[VitePress + Vue + ECharts]
    ↓
Interactive site with live charts
```

**PDF Flow:**
```
markdown (```echarts blocks)
    ↓
[Extract charts] → manifest.json
    ↓
[Puppeteer in Docker] → images/*.svg
    ↓
[Preprocess markdown] → Replace blocks with ![](images/chart.svg)
    ↓
[Pandoc + XeLaTeX] → Professional PDF
```

### Key Components

1. **VitePress Layer** (`docs/.vitepress/`):
   - `config.ts`: Site configuration with dynamic sidebar generation
   - `theme/index.ts`: Custom theme with automatic heading numbering
   - `components/EChart.vue`: Interactive chart component
   - `plugins/echarts-plugin.ts`: Markdown plugin to transform ```echarts blocks

2. **Chart Rendering** (`scripts/`):
   - `extract-charts.js`: Parses markdown, extracts ```echarts blocks to JSON manifest
   - `docker/render-chart.js`: Puppeteer script to render charts as SVG/PNG
   - `preprocess-markdown.js`: Replaces ```echarts blocks with image references for PDF

3. **PDF Layer** (`templates/`):
   - `header.tex.template`: LaTeX header with placeholders ({{ '{{' }}COMPANY_NAME{{ '}}' }}, etc.)
   - `title-page.tex.template`: Title page template with placeholders
   - Makefile: Variable substitution with sed, Pandoc invocation

4. **Configuration** (`Makefile`):
   - Project settings (title, company, author, date)
   - Branding (logo files, primary color RGB/HEX)
   - Directories (docs, images, build, templates, assets, scripts)
   - PDF settings (chart format, margins, font size)

## File Structure

```
markdown-chartpress/
├── docs/                      # Documentation content
│   ├── .vitepress/           # VitePress config, theme, components, plugins
│   ├── example-report/       # Example documentation with charts
│   └── index.md              # Landing page (home layout)
├── scripts/
│   ├── extract-charts.js     # Chart extraction from markdown
│   ├── preprocess-markdown.js # Chart→image replacement for PDF
│   └── docker/               # Dockerized Puppeteer renderer
├── templates/                # LaTeX templates with {{ '{{' }}PLACEHOLDERS{{ '}}' }}
├── assets/                   # Logo files (logo.png, logo.svg)
├── Makefile                  # Build orchestration and configuration
└── package.json              # Node.js dependencies (VitePress, Vue, ECharts)
```

## Content Authoring

### Chapter Numbering Convention

Files with numeric prefixes auto-number in sidebar and content:
- `01-introduction.md` → "1. Introduction"
- `02-analysis.md` → "2. Analysis"
- `A1-appendix.md` → Appendix files (no chapter prefix in sidebar)

Implemented in `docs/.vitepress/theme/index.ts` via:
- Filename regex: `/(\d+)-[^/]+/` extracts chapter number
- Dynamic span injection to H2/H3 headings and TOC
- Format: `chapterNum.h2Counter.h3Counter`

### Embedding Charts

Use ```echarts code blocks:
```markdown
<!-- chart: unique-id -->
\`\`\`echarts
{
  "title": { "text": "Chart Title" },
  "xAxis": { "type": "category", "data": ["A", "B", "C"] },
  "yAxis": { "type": "value" },
  "series": [{ "data": [120, 200, 150], "type": "bar" }]
}
\`\`\`
```

**Chart ID:**
- Optional `<!-- chart: id -->` comment before block → explicit ID
- Without comment → auto-generated MD5 hash ID (`chart-abc12345`)

**Rendering:**
- VitePress: Transformed to `<EChartFromCode>` Vue component (interactive)
- PDF: Extracted, rendered to SVG/PNG by Puppeteer, replaced with `![](images/id.svg)`

## Customization

### Branding (Makefile variables)

```makefile
PROJECT_TITLE := Your Documentation Title
COMPANY_NAME := Your Company
PROJECT_AUTHOR := Your Name
PRIMARY_COLOR_RGB := 0, 51, 102
LOGO_FILE := logo.png
LOGO_SVG := logo.svg
```

Replace logos in `assets/`:
- `logo.png` (800x800px recommended) for PDF
- `logo.svg` (vector) for VitePress

### LaTeX Templates

Templates use `{{ '{{' }}PLACEHOLDER{{ '}}' }}` syntax:
- `{{ '{{{' }}PRIMARY_COLOR_NAME{{ '}}}' }}` → Three braces for LaTeX commands
- `{{ '{{' }}COMPANY_NAME{{ '}}' }}` → Two braces for text values

Processed by `make process-templates` with sed substitution.

### VitePress Theme

Modify `docs/.vitepress/theme/style.css` for colors/fonts.

### Sidebar Generation

Dynamic sidebar in `config.ts`:
```typescript
function generateSidebarItems(dirPath: string, baseLink: string)
```
- Reads markdown files from directory
- Extracts titles from frontmatter or H1
- Sorts by filename
- Adds chapter numbers for `\d+-` prefixed files

## Development Workflow

### Starting a New Document

```bash
# 1. Create document directory
mkdir -p docs/my-report

# 2. Add chapters
echo "# Introduction" > docs/my-report/01-introduction.md
echo "# Conclusions" > docs/my-report/02-conclusions.md

# 3. Update config.ts sidebar routes
# Add entry to config.ts themeConfig.sidebar

# 4. Start dev server
make dev
```

### Building Outputs

```bash
# Development
make dev          # Live reload at http://localhost:5173

# Production
make build        # Full build (site + PDF + charts)
make site         # Static site only
make pdf-full     # PDF only
```

### Chart Rendering

**With Docker (recommended):**
```bash
make docker-build-renderer  # One-time setup
make charts                 # Extract and render
```

**Without Docker:**
```bash
npm install puppeteer       # Install locally
make charts                 # Uses local Puppeteer
```

## Common Workflows

### Add New Example Document

1. Create directory: `docs/new-doc/`
2. Add chapters: `01-chapter.md`, `02-chapter.md`
3. Update `config.ts`:
   ```typescript
   sidebar: {
     '/new-doc/': [
       {
         text: 'New Document',
         items: generateSidebarItems(
           join(__dirname, '../new-doc'),
           '/new-doc/'
         )
       }
     ]
   }
   ```
4. Add nav link: `nav: [{ text: 'New Doc', link: '/new-doc/' }]`

### Customize Branding

1. Edit `Makefile` variables (colors, company name, etc.)
2. Replace `assets/logo.png` and `assets/logo.svg`
3. Run `make process-templates` to regenerate LaTeX files
4. Rebuild: `make build`

### Debug Chart Rendering

```bash
# Extract charts
make extract-charts
cat .build/charts-manifest.json  # Inspect manifest

# Test Docker renderer
make docker-test-renderer

# Check preprocessed markdown
make preprocess-markdown
ls -la .build/processed/
```

## Notes for AI Assistants

- This is a **generic template**, not DEPP-specific anymore
- DEPP references in `archive/` and `design/` are historical context
- Makefile is the central configuration point (no hardcoded values)
- Chart extraction uses MD5 hashing for auto-IDs (crypto library)
- VitePress config uses Node.js fs/path modules (not browser-compatible)
- Template processing uses shell `sed` (not JavaScript string replacement)
- Docker is optional but recommended for chart rendering
- The `/example-report/` demonstrates all features with 2 live charts

## Origin

Originally built as DEPP Strategic Docs, genericized into markdown-chartpress.
See `archive/` and `design/` directories for historical context.
