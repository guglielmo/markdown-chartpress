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

## Example

Explore the example business report:

- [Example Business Report](/example-report/) - Comprehensive report with 6 chapters, 9+ charts, and 3 appendices

## Documentation

See [README.md](https://github.com/guglielmo/markdown-chartpress) for complete documentation.
