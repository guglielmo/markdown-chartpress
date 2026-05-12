# markdown-chartpress

> Professional documentation with VitePress (interactive charts) and PDF generation — available as a **cookiecutter template** or a **zero-install `npx` CLI**.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/markdown-chartpress)](https://www.npmjs.com/package/markdown-chartpress)
[![Cookiecutter](https://img.shields.io/badge/cookiecutter-template-blue)](https://github.com/cookiecutter/cookiecutter)

## Features

- **Interactive Charts** — ECharts visualizations in ` ```echarts ` blocks
- **Professional PDFs** — Pandoc + XeLaTeX generation
- **Live Development** — VitePress dev server with hot reload
- **Auto-Numbering** — Chapter numbers from filenames (`01-intro.md` → "1. Introduction")
- **Built-in Publishing** — GitLab Pages & GitHub Pages support
- **Configurable** — Customize branding, colors, starter content

---

## Option A: `npx` CLI (quickest start)

Turn any directory of Markdown files into a VitePress static site — no installation needed.

```bash
npx markdown-chartpress build ./my-docs
```

What it does:
1. Moves your `.md` files into `my-docs/md/`
2. Auto-generates an `index.md` home page (if missing)
3. Builds a VitePress site into `my-docs/html/`
4. Leaves no tooling artifacts behind

### Requirements

- Node.js 18+

### Usage

```bash
# Build once
npx markdown-chartpress build ./path/to/docs

# Example: build the current directory
npx markdown-chartpress build .
```

The CLI is **idempotent** — running it again on an already-initialized directory is safe.

### Supported Markdown features

- ECharts charts via ` ```echarts ` code blocks
- Mermaid diagrams via ` ```mermaid ` blocks
- Task lists (`- [ ]` / `- [x]`)
- All standard VitePress / Markdown-it extensions

---

## Option B: Cookiecutter template (full project scaffold)

For teams that want the complete setup: dual VitePress + PDF pipeline, CI/CD, branding, and PDF download button.

### Prerequisites

- Node.js 18+, Python 3.8+
- Make, Pandoc, XeLaTeX
- Docker (optional, for chart rendering)

### Quick Start

```bash
# Install cookiecutter
pip install cookiecutter

# Generate project
cookiecutter gh:guglielmo/markdown-chartpress

# Start working
cd your-project-name
npm install
make dev
```

### What You Get

- VitePress site with interactive ECharts and Mermaid charts
- PDF generation with static chart images (via Puppeteer + Pandoc)
- Auto-configured CI/CD for GitLab Pages or GitHub Pages
- Optional "Download PDF" button
- Starter content (full example / minimal / empty)

### Template Options

| Variable | Choices | Default |
|---|---|---|
| `publishing_platform` | `none`, `gitlab-pages`, `gitlab-pages-selfhosted`, `github-pages` | `none` |
| `include_pdf_download` | `yes`, `no` | `no` |
| `starter_content` | `example-full`, `example-minimal`, `empty` | `example-minimal` |
| `chart_format` | `svg`, `png` | `svg` |
| `initialize_git` | `yes`, `no` | `yes` |

---

## Architecture

### Dual-Output Pipeline (template projects)

**VitePress flow:**
```
markdown (```echarts blocks) → VitePress + Vue + ECharts → interactive site
```

**PDF flow:**
```
markdown → extract charts → Puppeteer render → Pandoc + XeLaTeX → PDF
```

### npx CLI internals

The CLI sets `MCP_SRC_DIR` / `MCP_OUT_DIR` environment variables and calls VitePress's programmatic `build()` API with the package root as the VitePress root. Vite cache is redirected to `/tmp` — nothing is written to the npx cache directory.

---

## License

MIT © Guglielmo Celata
