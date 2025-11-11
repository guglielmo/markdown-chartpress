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
- librsvg2-bin (provides rsvg-convert for SVG to PDF conversion)

**Optional (but recommended):**
- Docker (for chart rendering)

**Install on Ubuntu/Debian:**
```bash
sudo apt-get install pandoc texlive-xetex librsvg2-bin make
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

**Chart behavior:**
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
