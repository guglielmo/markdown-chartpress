# markdown-chartpress

> Turn Markdown into beautiful, browsable documentation — with interactive charts, PDF export, and built-in publishing.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/markdown-chartpress)](https://www.npmjs.com/package/markdown-chartpress)
[![Cookiecutter](https://img.shields.io/badge/cookiecutter-template-blue)](https://github.com/cookiecutter/cookiecutter)

---

## Which tool do you need?

| | Use case | Tool |
|---|---|---|
| **A** | You have a folder of `.md` files and want to browse them as a static site | [`mkpress` CLI](#use-case-a-browse-existing-markdown-as-a-static-site) |
| **B** | You're starting a new documentation project and want the full setup (PDF, CI/CD, branding) | [Cookiecutter template](#use-case-b-start-a-full-documentation-project-from-scratch) |

---

## Use case A: Browse existing Markdown as a static site

You have a directory of Markdown files — meeting notes, a report, a knowledge base — and want to turn it into a navigable VitePress site in seconds.

### Install

**No installation (recommended for one-off use):**

```bash
npx markdown-chartpress build ./my-docs
```

**Global install (recommended for frequent use):**

```bash
npm install -g markdown-chartpress
mkpress build ./my-docs
```

### How it works

Running `mkpress build <dir>`:

1. Moves your `.md` files into `<dir>/md/`
2. Auto-generates a home page `index.md` (if missing)
3. Builds a VitePress static site into `<dir>/html/`
4. Cleans up all tooling artifacts — only your content remains

The command is **idempotent**: running it again on an already-initialized directory is safe.

### Supported Markdown features

- ECharts charts via ` ```echarts ` code blocks
- Mermaid diagrams via ` ```mermaid ` blocks
- Task lists (`- [ ]` / `- [x]`)
- All standard VitePress / Markdown-it extensions

### Requirements

- Node.js 18+

---

## Use case B: Start a full documentation project from scratch

You're building a professional documentation site — a technical report, product docs, a company handbook — and need the complete setup: interactive charts, PDF export, CI/CD pipelines, branding, and a "Download PDF" button.

### What you get

- VitePress site with interactive ECharts and Mermaid charts
- PDF generation with static chart images (Puppeteer → Pandoc + XeLaTeX)
- Auto-configured CI/CD for GitLab Pages or GitHub Pages
- Optional "Download PDF" button
- Starter content (full example / minimal / empty)
- Auto-numbered chapters from filenames (`01-intro.md` → "1. Introduction")

### Quick start

```bash
# Install cookiecutter
pip install cookiecutter

# Generate your project
cookiecutter gh:guglielmo/markdown-chartpress

# Enter the generated project and start writing
cd your-project-name
npm install
make dev
```

### Template options

| Variable | Choices | Default |
|---|---|---|
| `publishing_platform` | `none`, `gitlab-pages`, `gitlab-pages-selfhosted`, `github-pages` | `none` |
| `include_pdf_download` | `yes`, `no` | `no` |
| `starter_content` | `example-full`, `example-minimal`, `empty` | `example-minimal` |
| `chart_format` | `svg`, `png` | `svg` |
| `initialize_git` | `yes`, `no` | `yes` |

### Prerequisites

- Node.js 18+, Python 3.8+
- Make, Pandoc, XeLaTeX
- Docker (optional, for chart rendering)

---

## Architecture

### mkpress CLI

```
<dir>/*.md  →  mkpress build  →  <dir>/html/  (VitePress static site)
```

Internally: sets `MCP_SRC_DIR` / `MCP_OUT_DIR` env vars and calls VitePress's programmatic `build()` API. Vite cache goes to `/tmp` — nothing is written to the npx cache directory.

### Cookiecutter template (dual-output pipeline)

**VitePress flow:**
```
markdown (```echarts blocks) → VitePress + Vue + ECharts → interactive site
```

**PDF flow:**
```
markdown → extract charts → Puppeteer render → Pandoc + XeLaTeX → PDF
```

---

## License

MIT © Guglielmo Celata
