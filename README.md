# markdown-chartpress

> Cookiecutter template for professional documentation with VitePress (interactive charts) and PDF (static images) generation

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Cookiecutter](https://img.shields.io/badge/cookiecutter-template-blue)](https://github.com/cookiecutter/cookiecutter)

## Features

- 📊 **Interactive Charts** - ECharts visualizations in ```echarts blocks
- 📄 **Professional PDFs** - Pandoc + XeLaTeX generation
- ⚡ **Live Development** - VitePress dev server with hot reload
- 🎨 **Auto-Numbering** - Chapter numbers from filenames (01-intro.md → "1. Introduction")
- 🚀 **Built-in Publishing** - GitLab Pages & GitHub Pages support
- 🔧 **Configurable** - Customize branding, colors, starter content

## Quick Start

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

## What You Get

- VitePress site with interactive charts
- PDF generation with static chart images
- Auto-configured CI/CD (GitLab/GitHub Pages)
- "Download PDF" button (optional)
- Starter content (full/minimal/empty)

## Prerequisites

- Node.js 18+, Python 3.8+
- Make, Pandoc, XeLaTeX
- Docker (optional, for chart rendering)

## License

MIT © Guglielmo Celata
