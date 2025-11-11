# Cookiecutter Publishing Architecture Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform markdown-chartpress into a cookiecutter template with built-in publishing platform support (GitLab Pages, GitHub Pages) and conditional PDF download functionality.

**Architecture:** Move all project files into `{{cookiecutter.project_slug}}/` directory, create cookiecutter.json for user prompts, generate platform-specific CI/CD configs using Jinja2 templates, add VitePress PDF download button component controlled by config.

**Tech Stack:** Cookiecutter (Python), Jinja2 templates, VitePress (TypeScript/Vue), GitLab CI/CD, GitHub Actions

---

## Prerequisites

- Current repository is in clean state
- Node.js 18+ and npm installed
- Python 3.8+ with cookiecutter installed (`pip install cookiecutter`)
- Git configured

## Task 1: Create Cookiecutter Configuration

**Files:**
- Create: `cookiecutter.json`

**Step 1: Create cookiecutter.json**

Create file at repository root:

```json
{
  "project_title": "Professional Documentation",
  "project_slug": "{{ cookiecutter.project_title.lower().replace(' ', '-').replace('_', '-') }}",
  "company_name": "Your Company",
  "author_name": "Documentation Team",
  "primary_color_hex": "003366",
  "primary_color_rgb": "0, 51, 102",

  "publishing_platform": [
    "gitlab-pages",
    "gitlab-pages-selfhosted",
    "github-pages",
    "none"
  ],

  "gitlab_selfhosted_url": "https://gitlab.example.com",

  "include_pdf_download": [
    "yes",
    "no"
  ],

  "starter_content": [
    "example-full",
    "example-minimal",
    "empty"
  ],

  "chart_format": [
    "svg",
    "png"
  ],

  "initialize_git": [
    "yes",
    "no"
  ]
}
```

**Step 2: Verify JSON syntax**

Run: `python -m json.tool cookiecutter.json > /dev/null`
Expected: No output (valid JSON)

**Step 3: Commit**

```bash
git add cookiecutter.json
git commit -m "feat: add cookiecutter configuration"
```

---

## Task 2: Create Post-Generation Hook

**Files:**
- Create: `hooks/post_gen_project.py`

**Step 1: Create hooks directory and post-generation script**

```python
#!/usr/bin/env python
"""Post-generation hook for markdown-chartpress cookiecutter template."""

import os
import shutil
import subprocess
from pathlib import Path


def remove_file(filepath):
    """Remove a file if it exists."""
    if os.path.isfile(filepath):
        os.remove(filepath)
        print(f"Removed: {filepath}")


def remove_dir(dirpath):
    """Remove a directory if it exists."""
    if os.path.isdir(dirpath):
        shutil.rmtree(dirpath)
        print(f"Removed: {dirpath}")


def main():
    """Clean up files based on cookiecutter choices."""

    publishing_platform = "{{ cookiecutter.publishing_platform }}"
    include_pdf = "{{ cookiecutter.include_pdf_download }}"
    starter_content = "{{ cookiecutter.starter_content }}"
    initialize_git = "{{ cookiecutter.initialize_git }}"

    print("Running post-generation cleanup...")

    # Remove GitLab CI if not using GitLab
    if publishing_platform not in ["gitlab-pages", "gitlab-pages-selfhosted"]:
        remove_file(".gitlab-ci.yml")

    # Remove GitHub Actions if not using GitHub
    if publishing_platform != "github-pages":
        remove_dir(".github")

    # Remove example content if empty was chosen
    if starter_content == "empty":
        remove_dir("docs/example")

    # Initialize git repository if requested
    if initialize_git == "yes":
        print("Initializing git repository...")
        subprocess.run(["git", "init"], check=True)
        subprocess.run(["git", "add", "."], check=True)
        subprocess.run(
            ["git", "commit", "-m", "Initial commit from markdown-chartpress template"],
            check=True
        )
        print("Git repository initialized and first commit created")

    print("Post-generation cleanup complete!")
    print(f"\nNext steps:")
    print(f"  cd {{ cookiecutter.project_slug }}")
    print(f"  npm install")
    print(f"  make dev")


if __name__ == "__main__":
    main()
```

**Step 2: Make script executable**

Run: `chmod +x hooks/post_gen_project.py`

**Step 3: Commit**

```bash
git add hooks/post_gen_project.py
git commit -m "feat: add post-generation cleanup hook"
```

---

## Task 3: Restructure Repository - Create Template Directory

**Files:**
- Create: `{{cookiecutter.project_slug}}/` directory structure

**Step 1: Create template directory**

Run: `mkdir -p "{{cookiecutter.project_slug}}"`

**Step 2: Move all project files into template directory**

Run the following commands:

```bash
# Move all files except cookiecutter files and git
mv docs "{{cookiecutter.project_slug}}/"
mv scripts "{{cookiecutter.project_slug}}/"
mv templates "{{cookiecutter.project_slug}}/"
mv assets "{{cookiecutter.project_slug}}/"
mv Makefile "{{cookiecutter.project_slug}}/"
mv package.json "{{cookiecutter.project_slug}}/"
mv package-lock.json "{{cookiecutter.project_slug}}/"
mv node_modules "{{cookiecutter.project_slug}}/" 2>/dev/null || true
mv tsconfig.json "{{cookiecutter.project_slug}}/"
mv .gitignore "{{cookiecutter.project_slug}}/"
mv LICENSE "{{cookiecutter.project_slug}}/"
```

**Step 3: Verify structure**

Run: `ls -la "{{cookiecutter.project_slug}}/"`
Expected: All project files visible in template directory

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: move project files into cookiecutter template directory"
```

---

## Task 4: Update Makefile with Cookiecutter Variables

**Files:**
- Modify: `{{cookiecutter.project_slug}}/Makefile:1-50`

**Step 1: Replace hardcoded values with Jinja2 variables**

Open `{{cookiecutter.project_slug}}/Makefile` and replace the PROJECT CONFIGURATION section:

```makefile
# PROJECT CONFIGURATION
# ---------------------
PROJECT_TITLE := {{cookiecutter.project_title}}
COMPANY_NAME := {{cookiecutter.company_name}}
PROJECT_AUTHOR := {{cookiecutter.author_name}}
PROJECT_SLUG := {{cookiecutter.project_slug}}
PROJECT_DATE := $(shell date +%Y-%m-%d)

# BRANDING
# --------
LOGO_FILE := logo.png
LOGO_SVG := logo.svg
PRIMARY_COLOR_NAME := primarycolor
PRIMARY_COLOR_RGB := {{cookiecutter.primary_color_rgb}}
PRIMARY_COLOR_HEX := {{cookiecutter.primary_color_hex}}

# PDF CONFIGURATION
# -----------------
CHART_FORMAT := {{cookiecutter.chart_format}}
PDF_MARGIN := 2.5cm
PDF_FONTSIZE := 11pt
PDF_DOCCLASS := article
```

**Step 2: Add PDF output filename using project slug**

Find the line defining PDF outputs (around line 60-80) and update:

```makefile
# PDF Output files (using project slug)
PDF_FULL := $(BUILD_DIR)/{{cookiecutter.project_slug}}.pdf
PDF_CHAPTER_TEMPLATE := $(BUILD_DIR)/{{cookiecutter.project_slug}}-chapter-%.pdf
PDF_APPENDICES := $(BUILD_DIR)/{{cookiecutter.project_slug}}-appendices.pdf
```

**Step 3: Add new dev-with-pdf target at end of file**

```makefile
# Development server with PDF available
.PHONY: dev-with-pdf
dev-with-pdf: pdf-full
	@echo "Copying PDF to dist for dev server..."
	@mkdir -p $(DOCS_DIR)/.vitepress/dist/downloads
	@cp $(PDF_FULL) $(DOCS_DIR)/.vitepress/dist/downloads/
	@echo "PDF available at /downloads/{{cookiecutter.project_slug}}.pdf"
	@echo "Starting development server..."
	$(VITEPRESS) dev $(DOCS_DIR)
```

**Step 4: Commit**

```bash
git add "{{cookiecutter.project_slug}}/Makefile"
git commit -m "feat: add cookiecutter variables to Makefile"
```

---

## Task 5: Update VitePress Config with Cookiecutter Variables

**Files:**
- Modify: `{{cookiecutter.project_slug}}/docs/.vitepress/config.ts`

**Step 1: Add pdfDownload configuration to themeConfig**

Open `{{cookiecutter.project_slug}}/docs/.vitepress/config.ts` and locate the `themeConfig` object. Add the pdfDownload configuration:

```typescript
export default defineConfig({
  title: '{{cookiecutter.project_title}}',
  description: 'Professional documentation with interactive charts and PDF export',

  // ... other config ...

  themeConfig: {
    // PDF Download configuration
    pdfDownload: {
      enabled: {{cookiecutter.include_pdf_download === 'yes' | lower}},
      url: '/downloads/{{cookiecutter.project_slug}}.pdf',
      label: 'Scarica PDF'
    },

    // ... rest of themeConfig ...
  }
})
```

**Step 2: Verify TypeScript syntax**

Run: `cd "{{cookiecutter.project_slug}}" && npx tsc --noEmit docs/.vitepress/config.ts`
Expected: No errors (note: there might be warnings about missing dependencies, that's ok)

**Step 3: Commit**

```bash
git add "{{cookiecutter.project_slug}}/docs/.vitepress/config.ts"
git commit -m "feat: add PDF download config to VitePress"
```

---

## Task 6: Create PDF Download Button Component

**Files:**
- Create: `{{cookiecutter.project_slug}}/docs/.vitepress/theme/components/PdfDownloadButton.vue`

**Step 1: Create component file**

```vue
<template>
  <div v-if="config.enabled" class="pdf-download">
    <a :href="config.url" class="pdf-link" download>
      <svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M10,19L12,19V14.5L13.5,16L14.9,14.6L12,11.7L9.1,14.6L10.5,16L12,14.5V19H10Z" />
      </svg>
      <span class="label">{{ config.label }}</span>
    </a>
  </div>
</template>

<script setup lang="ts">
import { useData } from 'vitepress'

const { theme } = useData()
const config = theme.value.pdfDownload || { enabled: false, url: '', label: 'Download PDF' }
</script>

<style scoped>
.pdf-download {
  padding: 12px 16px;
  border-top: 1px solid var(--vp-c-divider);
  margin-top: auto;
}

.pdf-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: var(--vp-c-brand-soft);
  border-radius: 8px;
  text-decoration: none;
  color: var(--vp-c-brand-1);
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;
}

.pdf-link:hover {
  background: var(--vp-c-brand);
  color: var(--vp-c-white);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.icon {
  flex-shrink: 0;
}

.label {
  flex: 1;
}

@media (max-width: 768px) {
  .pdf-download {
    padding: 8px 12px;
  }

  .pdf-link {
    padding: 8px 12px;
    font-size: 13px;
  }
}
</style>
```

**Step 2: Commit**

```bash
git add "{{cookiecutter.project_slug}}/docs/.vitepress/theme/components/PdfDownloadButton.vue"
git commit -m "feat: add PDF download button component"
```

---

## Task 7: Integrate PDF Button into VitePress Theme

**Files:**
- Modify: `{{cookiecutter.project_slug}}/docs/.vitepress/theme/index.ts`

**Step 1: Import and register the PDF download button component**

Open `{{cookiecutter.project_slug}}/docs/.vitepress/theme/index.ts` and modify:

```typescript
import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import EChart from './components/EChart.vue'
import EChartFromCode from './components/EChartFromCode.vue'
import PdfDownloadButton from './components/PdfDownloadButton.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // Add PDF button to bottom of sidebar
      'sidebar-nav-after': () => h(PdfDownloadButton)
    })
  },
  enhanceApp({ app, router, siteData }) {
    app.component('EChart', EChart)
    app.component('EChartFromCode', EChartFromCode)
    app.component('PdfDownloadButton', PdfDownloadButton)
  }
} satisfies Theme
```

**Step 2: Commit**

```bash
git add "{{cookiecutter.project_slug}}/docs/.vitepress/theme/index.ts"
git commit -m "feat: integrate PDF button into VitePress theme"
```

---

## Task 8: Rename Example Report Folder

**Files:**
- Move: `{{cookiecutter.project_slug}}/docs/example-report/` → `{{cookiecutter.project_slug}}/docs/example/`
- Modify: `{{cookiecutter.project_slug}}/docs/.vitepress/config.ts`

**Step 1: Rename directory**

Run: `mv "{{cookiecutter.project_slug}}/docs/example-report" "{{cookiecutter.project_slug}}/docs/example"`

**Step 2: Update VitePress config sidebar references**

Open `{{cookiecutter.project_slug}}/docs/.vitepress/config.ts` and update:

```typescript
sidebar: {
  '/example/': [
    {
      text: 'Example Documentation',
      items: generateSidebarItems(
        join(__dirname, '../example'),
        '/example/'
      )
    }
  ]
}
```

**Step 3: Update nav links**

```typescript
nav: [
  { text: 'Home', link: '/' },
  { text: 'Example', link: '/example/' }
]
```

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: rename example-report to example folder"
```

---

## Task 9: Create GitLab CI/CD Template

**Files:**
- Create: `{{cookiecutter.project_slug}}/.gitlab-ci.yml.jinja`

**Step 1: Create GitLab CI template with conditional PDF build**

```yaml
# GitLab CI/CD Pipeline for {{cookiecutter.project_title}}
# Generated from markdown-chartpress cookiecutter template

image: node:18

stages:
  - build
  - deploy

# Cache node_modules for faster builds
cache:
  key:
    files:
      - package-lock.json
  paths:
    - node_modules/

# Build VitePress static site
build-site:
  stage: build
  script:
    - npm ci
    - npm run docs:build
  artifacts:
    paths:
      - docs/.vitepress/dist
    expire_in: 1 hour

{% if cookiecutter.include_pdf_download == 'yes' %}
# Build PDF document with charts
build-pdf:
  stage: build
  image: docker:24-dind
  services:
    - docker:24-dind
  variables:
    DOCKER_DRIVER: overlay2
    DOCKER_TLS_CERTDIR: ""
  before_script:
    # Install build dependencies
    - apk add --no-cache make pandoc texlive-xetex nodejs npm python3 py3-pip
  script:
    - npm ci
    # Build Docker renderer for charts
    - make docker-build-renderer
    # Generate PDF
    - make pdf-full
    # Prepare PDF for deployment
    - mkdir -p docs/.vitepress/dist/downloads
    - cp .build/{{cookiecutter.project_slug}}.pdf docs/.vitepress/dist/downloads/
  artifacts:
    paths:
      - docs/.vitepress/dist/downloads
    expire_in: 1 hour
  # Run independently from build-site
  dependencies: []
{% endif %}

# Deploy to GitLab Pages
pages:
  stage: deploy
  image: alpine:latest
  script:
    - mv docs/.vitepress/dist public
  artifacts:
    paths:
      - public
  only:
    - main
  dependencies:
    - build-site
{% if cookiecutter.include_pdf_download == 'yes' %}
    - build-pdf
{% endif %}
```

**Step 2: Commit**

```bash
git add "{{cookiecutter.project_slug}}/.gitlab-ci.yml.jinja"
git commit -m "feat: add GitLab CI/CD template with conditional PDF"
```

---

## Task 10: Create GitHub Actions Workflow Template

**Files:**
- Create: `{{cookiecutter.project_slug}}/.github/workflows/deploy.yml.jinja`

**Step 1: Create GitHub Actions workflow**

```yaml
# GitHub Actions workflow for {{cookiecutter.project_title}}
# Generated from markdown-chartpress cookiecutter template

name: Deploy Documentation

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  # Build VitePress site
  build-site:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build VitePress site
        run: npm run docs:build

      - name: Upload site artifact
        uses: actions/upload-artifact@v4
        with:
          name: vitepress-dist
          path: docs/.vitepress/dist
          retention-days: 1

{% if cookiecutter.include_pdf_download == 'yes' %}
  # Build PDF document
  build-pdf:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: npm

      - name: Install system dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y pandoc texlive-xetex make

      - name: Install npm dependencies
        run: npm ci

      - name: Build Docker chart renderer
        run: make docker-build-renderer

      - name: Generate PDF
        run: make pdf-full

      - name: Prepare PDF artifact
        run: |
          mkdir -p pdf-artifact
          cp .build/{{cookiecutter.project_slug}}.pdf pdf-artifact/

      - name: Upload PDF artifact
        uses: actions/upload-artifact@v4
        with:
          name: pdf
          path: pdf-artifact
          retention-days: 1
{% endif %}

  # Deploy to GitHub Pages
  deploy:
    needs:
      - build-site
{% if cookiecutter.include_pdf_download == 'yes' %}
      - build-pdf
{% endif %}
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: {% raw %}${{ steps.deployment.outputs.page_url }}{% endraw %}
    steps:
      - name: Download site artifact
        uses: actions/download-artifact@v4
        with:
          name: vitepress-dist
          path: dist

{% if cookiecutter.include_pdf_download == 'yes' %}
      - name: Download PDF artifact
        uses: actions/download-artifact@v4
        with:
          name: pdf
          path: dist/downloads
{% endif %}

      - name: Configure Pages
        uses: actions/configure-pages@v4

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**Step 2: Commit**

```bash
git add "{{cookiecutter.project_slug}}/.github/workflows/deploy.yml.jinja"
git commit -m "feat: add GitHub Actions workflow template"
```

---

## Task 11: Create Minimal Starter Content

**Files:**
- Create: `{{cookiecutter.project_slug}}/docs/example-minimal/`

**Step 1: Create minimal example directory structure**

Run:
```bash
mkdir -p "{{cookiecutter.project_slug}}/docs/example-minimal"
```

**Step 2: Create index.md**

Create `{{cookiecutter.project_slug}}/docs/example-minimal/index.md`:

```markdown
---
layout: doc
title: Documentation Home
---

# {{cookiecutter.project_title}}

Welcome to your documentation. This is a minimal starter template.

## Getting Started

Edit this file and the chapter files to create your documentation.

## Structure

This documentation uses:
- **Chapter numbering**: Files like `01-introduction.md` automatically get numbered
- **Interactive charts**: Use ECharts code blocks for visualizations
- **PDF export**: Generate professional PDFs with static chart images

## Next Steps

1. Customize the chapters below with your content
2. Add more chapters by creating files like `04-next-chapter.md`
3. See `docs/README.md` for detailed instructions
```

**Step 3: Create 01-introduction.md**

Create `{{cookiecutter.project_slug}}/docs/example-minimal/01-introduction.md`:

```markdown
---
title: Introduction
---

# Introduction

<!-- This is Chapter 1 - the filename 01-introduction.md automatically adds numbering -->

## Purpose

Describe the purpose of your documentation here.

## Audience

Who is this documentation for?

## How to Use This Documentation

Explain how readers should navigate and use this documentation.

---

**TIP:** You can use standard Markdown formatting:
- Lists
- **Bold** and *italic* text
- [Links](https://example.com)
- Images: `![Alt text](path/to/image.png)`
- Code blocks with syntax highlighting
```

**Step 4: Create 02-main-content.md**

Create `{{cookiecutter.project_slug}}/docs/example-minimal/02-main-content.md`:

```markdown
---
title: Main Content
---

# Main Content

<!-- This is Chapter 2 -->

## Overview

Add your main content here.

## Embedding Charts

You can embed interactive charts using ECharts:

<!-- chart: example-chart -->
\`\`\`echarts
{
  "title": {
    "text": "Sample Chart"
  },
  "tooltip": {},
  "xAxis": {
    "type": "category",
    "data": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  },
  "yAxis": {
    "type": "value"
  },
  "series": [{
    "name": "Sales",
    "type": "bar",
    "data": [120, 200, 150, 80, 70, 110, 130]
  }]
}
\`\`\`

The chart above is interactive in the browser and will be rendered as a static image in the PDF.

## Code Examples

\`\`\`python
def hello_world():
    print("Hello, World!")
\`\`\`

## Tables

| Feature | Description |
|---------|-------------|
| Charts | Interactive ECharts visualizations |
| PDF | Professional PDF export |
| Numbering | Automatic chapter/section numbering |
```

**Step 5: Create 03-conclusions.md**

Create `{{cookiecutter.project_slug}}/docs/example-minimal/03-conclusions.md`:

```markdown
---
title: Conclusions
---

# Conclusions

<!-- This is Chapter 3 -->

## Summary

Summarize your documentation here.

## Next Steps

What should readers do after reading this documentation?

## Further Reading

- Link to additional resources
- Related documentation
- External references
```

**Step 6: Commit**

```bash
git add "{{cookiecutter.project_slug}}/docs/example-minimal/"
git commit -m "feat: add minimal starter content"
```

---

## Task 12: Create docs/README.md Template

**Files:**
- Create: `{{cookiecutter.project_slug}}/docs/README.md.jinja`

**Step 1: Create comprehensive documentation guide**

Create `{{cookiecutter.project_slug}}/docs/README.md.jinja`:

```markdown
# Documentation Structure

This directory contains your VitePress documentation source files.

## Folder Organization

{% if cookiecutter.starter_content == 'empty' %}
Create your documentation in organized folders. Each folder represents a separate documentation section or project.

**Example structure:**
\`\`\`
docs/
├── user-guide/
│   ├── index.md
│   ├── 01-getting-started.md
│   └── 02-advanced-features.md
├── api-reference/
│   ├── index.md
│   └── 01-endpoints.md
└── index.md
\`\`\`

To add a new documentation section:
1. Create folder: `docs/my-section/`
2. Add content files with numbered prefixes
3. Update `.vitepress/config.ts` (see below)

{% else %}
### The `example/` Folder

{% if cookiecutter.starter_content == 'example-full' %}
This folder contains a **complete example documentation** with:
- 6 chapters demonstrating structure and auto-numbering
- 3 appendices showing supplementary content organization
- 2 ECharts visualizations (interactive in browser, static in PDF)
- Images and formatting examples
- Frontmatter metadata examples

**Purpose:** Learn by example - see how chapters are structured, how charts work, and how numbering is applied.

**To start your own documentation:**

**Option A (Replace):** Delete `example/` and create your own folder
\`\`\`bash
rm -rf docs/example
mkdir docs/user-guide
# Create your content in docs/user-guide/
\`\`\`

**Option B (Rename):** Rename and modify the example
\`\`\`bash
mv docs/example docs/user-guide
# Edit files in docs/user-guide/ with your content
\`\`\`

**Option C (Keep as reference):** Keep `example/` and create additional folders
\`\`\`bash
mkdir docs/my-docs
# Create your content, refer to example/ when needed
\`\`\`

{% elif cookiecutter.starter_content == 'example-minimal' %}
This folder contains a **minimal skeleton** with:
- 3 starter chapters with placeholder content
- Comments explaining chapter numbering and structure
- Basic formatting examples
- One sample ECharts visualization

**Purpose:** Quick start template with just enough to understand the structure.

**To start your own documentation:**

**Option A (Edit in place):** Modify the files in `example/`
\`\`\`bash
# Edit docs/example/*.md with your content
# Rename folder when ready: mv docs/example docs/user-guide
\`\`\`

**Option B (Start fresh):** Delete and create your own
\`\`\`bash
rm -rf docs/example
mkdir docs/user-guide
# Create numbered chapter files
\`\`\`

{% endif %}
{% endif %}

## Chapter Numbering

Files with **numeric prefixes** automatically get numbered in the sidebar and headings:

| Filename | Rendered As |
|----------|-------------|
| `01-introduction.md` | "1. Introduction" |
| `02-architecture.md` | "2. Architecture" |
| `03-implementation.md` | "3. Implementation" |
| `A1-glossary.md` | "A1. Glossary" (appendices) |
| `A2-references.md` | "A2. References" |

**Rules:**
- Use two-digit prefix: `01-`, `02-`, etc.
- Use hyphen separator, not underscore
- Appendices start with `A1-`, `A2-`, etc.
- Files without numeric prefix are not auto-numbered

## Adding New Documentation Sections

### Step 1: Create Folder and Content

\`\`\`bash
# Create folder
mkdir docs/my-section

# Add chapters
cat > docs/my-section/index.md << 'EOF'
---
title: My Section
---
# My Section

Overview of this section.
EOF

cat > docs/my-section/01-chapter.md << 'EOF'
---
title: First Chapter
---
# First Chapter

Content here.
EOF
\`\`\`

### Step 2: Update VitePress Config

Edit `docs/.vitepress/config.ts`:

**Add to sidebar:**
\`\`\`typescript
sidebar: {
  '/example/': [ /* ... */ ],

  // Add your new section
  '/my-section/': [
    {
      text: 'My Section',
      items: generateSidebarItems(
        join(__dirname, '../my-section'),
        '/my-section/'
      )
    }
  ]
}
\`\`\`

**Add to navigation:**
\`\`\`typescript
nav: [
  { text: 'Home', link: '/' },
  { text: 'Example', link: '/example/' },
  { text: 'My Section', link: '/my-section/' }  // Add this
]
\`\`\`

### Step 3: Test Locally

\`\`\`bash
make dev
# Visit http://localhost:5173/my-section/
\`\`\`

## Embedding Charts

Use ECharts code blocks for interactive visualizations that work in both browser and PDF.

**Syntax:**
\`\`\`markdown
<!-- chart: unique-id -->
\`\`\`echarts
{
  "title": { "text": "Sales Data" },
  "xAxis": {
    "type": "category",
    "data": ["Q1", "Q2", "Q3", "Q4"]
  },
  "yAxis": { "type": "value" },
  "series": [{
    "name": "Sales",
    "type": "line",
    "data": [120, 200, 150, 80]
  }]
}
\`\`\`
\`\`\`

**Chart ID:**
- The `<!-- chart: unique-id -->` comment is **optional**
- Without it, an auto-generated hash ID is used
- Use explicit IDs for better PDF filenames

**Chart Types:**
- `bar` - Bar chart
- `line` - Line chart
- `pie` - Pie chart
- `scatter` - Scatter plot
- Many more: see [ECharts documentation](https://echarts.apache.org/examples/)

**Behavior:**
- **VitePress site:** Interactive (hover, zoom, click)
- **PDF export:** Static SVG/PNG image

## Embedding Images

Standard Markdown syntax:

\`\`\`markdown
![Alt text](./images/diagram.png)

![With caption](./images/screenshot.jpg "Figure 1: Screenshot")
\`\`\`

**Image paths:**
- Relative to current markdown file: `./images/file.png`
- Relative to docs root: `/images/file.png`
- Absolute URLs: `https://example.com/image.png`

## Frontmatter Metadata

Add YAML frontmatter at the top of markdown files:

\`\`\`markdown
---
title: Custom Page Title
description: Page description for SEO
layout: doc
---

# Page Content
\`\`\`

**Common fields:**
- `title` - Page title (overrides H1)
- `description` - SEO description
- `layout` - Layout type (`doc`, `home`, `page`)

## Build Commands

**Development:**
\`\`\`bash
make dev              # Start dev server (no PDF)
make dev-with-pdf     # Start dev server with PDF available
\`\`\`

**Production:**
\`\`\`bash
make build            # Build site + PDF
make site             # Build site only
make pdf-full         # Build PDF only
\`\`\`

**Charts:**
\`\`\`bash
make charts           # Extract and render all charts
make extract-charts   # Extract chart definitions
make render-charts    # Render charts to images
\`\`\`

**Utilities:**
\`\`\`bash
make clean            # Remove build artifacts
make check            # Check dependencies
make help             # Show all commands
\`\`\`

## Publishing

{% if cookiecutter.publishing_platform == 'gitlab-pages' %}
**GitLab Pages** is configured for this project.

**Automatic deployment:**
- Push to `main` branch triggers CI/CD
- Site published to: `https://<username>.gitlab.io/{{cookiecutter.project_slug}}/`
{% if cookiecutter.include_pdf_download == 'yes' %}
- PDF available at: `https://<username>.gitlab.io/{{cookiecutter.project_slug}}/downloads/{{cookiecutter.project_slug}}.pdf`
{% endif %}

**CI/CD pipeline** (`.gitlab-ci.yml`):
1. `build-site` - Builds VitePress static site
{% if cookiecutter.include_pdf_download == 'yes' %}
2. `build-pdf` - Generates PDF with chart rendering
{% endif %}
3. `pages` - Deploys to GitLab Pages

**View pipeline:** GitLab project → CI/CD → Pipelines

{% elif cookiecutter.publishing_platform == 'gitlab-pages-selfhosted' %}
**Self-hosted GitLab Pages** is configured for this project.

**Automatic deployment:**
- Push to `main` branch triggers CI/CD
- Site published to: `{{cookiecutter.gitlab_selfhosted_url}}/pages/<username>/{{cookiecutter.project_slug}}/`
{% if cookiecutter.include_pdf_download == 'yes' %}
- PDF available at site + `/downloads/{{cookiecutter.project_slug}}.pdf`
{% endif %}

**CI/CD pipeline** (`.gitlab-ci.yml`):
1. `build-site` - Builds VitePress
{% if cookiecutter.include_pdf_download == 'yes' %}
2. `build-pdf` - Generates PDF
{% endif %}
3. `pages` - Deploys to Pages

{% elif cookiecutter.publishing_platform == 'github-pages' %}
**GitHub Pages** is configured for this project.

**Automatic deployment:**
- Push to `main` branch triggers workflow
- Site published to: `https://<username>.github.io/{{cookiecutter.project_slug}}/`
{% if cookiecutter.include_pdf_download == 'yes' %}
- PDF available at: `https://<username>.github.io/{{cookiecutter.project_slug}}/downloads/{{cookiecutter.project_slug}}.pdf`
{% endif %}

**GitHub Actions workflow** (`.github/workflows/deploy.yml`):
1. `build-site` - Builds VitePress
{% if cookiecutter.include_pdf_download == 'yes' %}
2. `build-pdf` - Generates PDF
{% endif %}
3. `deploy` - Deploys to GitHub Pages

**Enable GitHub Pages:**
1. Go to repository Settings → Pages
2. Source: "GitHub Actions"
3. Push to `main` to trigger deployment

**View workflow:** GitHub repository → Actions tab

{% else %}
**Manual publishing** is configured (no automatic CI/CD).

**To publish:**
1. Build locally: `make build`
2. Deploy `docs/.vitepress/dist/` to your hosting:
   - Upload via FTP/SFTP
   - Use `rsync` to remote server
   - Deploy to static hosting (Netlify, Vercel, etc.)

**Example rsync deployment:**
\`\`\`bash
make build
rsync -avz --delete docs/.vitepress/dist/ user@server:/var/www/html/
\`\`\`

{% endif %}

## Troubleshooting

**Charts not rendering in PDF:**
\`\`\`bash
# Verify Docker is running
docker ps

# Rebuild chart renderer
make docker-build-renderer

# Test renderer
make docker-test-renderer

# Check chart manifest
make extract-charts
cat .build/charts-manifest.json
\`\`\`

**VitePress build fails:**
\`\`\`bash
# Clean and rebuild
make clean
rm -rf node_modules package-lock.json
npm install
make build
\`\`\`

**PDF generation fails:**
\`\`\`bash
# Check XeLaTeX
xelatex --version

# Check Pandoc
pandoc --version

# Verify templates processed
make process-templates
cat .build/header.tex
\`\`\`

**Chapter numbering not working:**
- Ensure files use two-digit prefix: `01-`, not `1-`
- Use hyphen, not underscore: `01-intro.md`, not `01_intro.md`
- Check filename regex in `docs/.vitepress/theme/index.ts`

## More Information

- **Project README:** `../README.md` (root of repository)
- **VitePress docs:** https://vitepress.dev/
- **ECharts examples:** https://echarts.apache.org/examples/
- **Markdown guide:** https://www.markdownguide.org/
```

**Step 2: Rename to .jinja extension**

The file should be named `README.md.jinja` during template creation, but will become `README.md` after cookiecutter generation.

**Step 3: Commit**

```bash
git add "{{cookiecutter.project_slug}}/docs/README.md.jinja"
git commit -m "feat: add comprehensive docs README template"
```

---

## Task 13: Update Root README for Cookiecutter Usage

**Files:**
- Modify: `README.md`

**Step 1: Replace README content with cookiecutter instructions**

Create new `README.md` at repository root:

```markdown
# markdown-chartpress

> Cookiecutter template for professional documentation with VitePress (interactive charts) and PDF (static images) generation

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Cookiecutter](https://img.shields.io/badge/cookiecutter-template-blue)](https://github.com/cookiecutter/cookiecutter)
[![VitePress](https://img.shields.io/badge/VitePress-1.0-42b883.svg)](https://vitepress.dev/)

## Features

- 📊 **Interactive Charts** - Embed ECharts visualizations using ```echarts markdown code blocks
- 📄 **Professional PDFs** - Generate publication-quality PDFs via Pandoc + XeLaTeX
- ⚡ **Live Development** - VitePress dev server with hot reload
- 🎨 **Auto-Numbering** - Chapter/section numbers from filenames (01-intro.md → "1. Introduction")
- 🐳 **Docker-Powered** - Dockerized Puppeteer for chart rendering
- 🚀 **Built-in Publishing** - GitLab Pages & GitHub Pages support out of the box
- 🔧 **Highly Configurable** - Customize branding, colors, starter content during initialization

## Quick Start

### Install Cookiecutter

```bash
pip install cookiecutter
```

### Generate Your Documentation Project

```bash
cookiecutter gh:guglielmo/markdown-chartpress
```

You'll be prompted for:

- **project_title**: Your documentation title (e.g., "Technical Report 2024")
- **project_slug**: URL-friendly name (auto-generated from title)
- **company_name**: Your organization name
- **author_name**: Document author(s)
- **primary_color_hex**: Brand color (e.g., "0066cc")
- **primary_color_rgb**: RGB values (e.g., "0, 102, 204")
- **publishing_platform**: Choose from:
  - `gitlab-pages` - GitLab.com Pages
  - `gitlab-pages-selfhosted` - Self-hosted GitLab
  - `github-pages` - GitHub Pages
  - `none` - Manual deployment
- **include_pdf_download**: Add "Download PDF" button to site? (`yes`/`no`)
- **starter_content**: Choose from:
  - `example-full` - Complete example with 6 chapters, charts, appendices
  - `example-minimal` - 3 skeleton chapters to get started
  - `empty` - Blank slate
- **chart_format**: `svg` or `png` for PDF charts
- **initialize_git**: Auto-create git repo? (`yes`/`no`)

### Start Working

```bash
cd your-project-name
npm install
make dev
```

Visit http://localhost:5173

### Generate PDF

```bash
make pdf-full
```

### Deploy

Push to GitLab/GitHub - CI/CD will automatically build and deploy!

```bash
git remote add origin git@gitlab.com:username/your-project.git
git push -u origin main
```

## What You Get

### Project Structure

```
your-project-name/
├── docs/
│   ├── .vitepress/         # VitePress config, theme, components
│   ├── example/            # Starter content (if chosen)
│   ├── README.md           # How to organize your documentation
│   └── index.md            # Home page
├── scripts/                # Chart extraction & rendering
├── templates/              # LaTeX templates for PDF
├── assets/                 # Logo files
├── Makefile                # Build commands
├── .gitlab-ci.yml          # OR .github/workflows/deploy.yml
└── package.json
```

### Build Commands

```bash
make dev              # Development server
make dev-with-pdf     # Dev server with PDF available
make build            # Build site + PDF
make site             # Build site only
make pdf-full         # Build PDF only
make charts           # Extract and render charts
make clean            # Remove build artifacts
```

### Publishing Platforms

**GitLab Pages** (gitlab.com or self-hosted):
- Automatic deployment on push to main
- Site: `https://username.gitlab.io/project/`
- Includes PDF if enabled

**GitHub Pages**:
- Automatic deployment via GitHub Actions
- Site: `https://username.github.io/project/`
- Includes PDF if enabled

**Manual**:
- Build locally: `make build`
- Deploy `docs/.vitepress/dist/` to any static host

## Documentation

After generating your project, see:
- `docs/README.md` - How to organize and write documentation
- Root `README.md` in generated project - Complete usage guide

## Prerequisites

**Required:**
- Node.js 18+ and npm
- Python 3.8+ (for cookiecutter)
- Make
- Pandoc 2+
- XeLaTeX (from texlive-xetex package)

**Optional (recommended):**
- Docker (for chart rendering)

**Install on Ubuntu/Debian:**
```bash
pip install cookiecutter
sudo apt-get install pandoc texlive-xetex make nodejs npm
curl -fsSL https://get.docker.com | sh
```

**Install on macOS:**
```bash
pip install cookiecutter
brew install pandoc mactex make node
brew install --cask docker
```

## Examples

See the `example/` folder in generated projects for:
- Chapter numbering and structure
- ECharts integration
- Image embedding
- Frontmatter metadata

## Customization

After generation, customize:
- `Makefile` - Project metadata, colors, PDF settings
- `docs/.vitepress/config.ts` - Site configuration
- `docs/.vitepress/theme/style.css` - Visual styling
- `templates/*.tex.template` - LaTeX templates for PDF
- `assets/logo.png` and `assets/logo.svg` - Your logos

## Contributing

Issues and pull requests welcome!

## License

MIT © Guglielmo Celata

## Acknowledgments

- Built with [VitePress](https://vitepress.dev/), [ECharts](https://echarts.apache.org/), [Pandoc](https://pandoc.org/)
- Powered by [Cookiecutter](https://github.com/cookiecutter/cookiecutter)
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update README for cookiecutter usage"
```

---

## Task 14: Handle Jinja Template File Extensions

**Files:**
- Post-generation processing for `.jinja` files

**Step 1: Update post_gen_project.py to rename .jinja files**

Modify `hooks/post_gen_project.py` to add file renaming:

```python
def rename_jinja_files():
    """Rename .jinja files to remove the extension."""
    for root, dirs, files in os.walk('.'):
        for filename in files:
            if filename.endswith('.jinja'):
                old_path = os.path.join(root, filename)
                new_path = os.path.join(root, filename[:-6])  # Remove .jinja
                os.rename(old_path, new_path)
                print(f"Renamed: {old_path} → {new_path}")

# Add to main() function before cleanup:
def main():
    """Clean up files based on cookiecutter choices."""

    # ... existing variable declarations ...

    print("Running post-generation processing...")

    # Rename .jinja template files
    rename_jinja_files()

    # ... rest of cleanup logic ...
```

**Step 2: Test locally**

Create a test directory and try generating:

```bash
cd /tmp
cookiecutter /home/gu/Workspace/markdown-chartpress
```

Follow prompts and verify:
- `.gitlab-ci.yml.jinja` becomes `.gitlab-ci.yml` (if GitLab chosen)
- `.github/workflows/deploy.yml.jinja` becomes `deploy.yml` (if GitHub chosen)
- `docs/README.md.jinja` becomes `docs/README.md`

**Step 3: If test successful, commit**

```bash
git add hooks/post_gen_project.py
git commit -m "feat: rename .jinja template files in post-generation"
```

---

## Task 15: Test Complete Cookiecutter Generation

**Files:**
- Test generation with various option combinations

**Step 1: Test GitLab + PDF + Full example**

```bash
cd /tmp
cookiecutter /home/gu/Workspace/markdown-chartpress \
  --no-input \
  project_title="Test GitLab Full" \
  publishing_platform="gitlab-pages" \
  include_pdf_download="yes" \
  starter_content="example-full"

cd test-gitlab-full
ls -la  # Verify structure
cat .gitlab-ci.yml  # Verify GitLab CI exists and has PDF job
cat docs/.vitepress/config.ts | grep pdfDownload  # Verify enabled: true
ls docs/example/  # Verify full example exists
npm install
make dev  # Should start without errors
```

**Step 2: Test GitHub + No PDF + Minimal**

```bash
cd /tmp
cookiecutter /home/gu/Workspace/markdown-chartpress \
  --no-input \
  project_title="Test GitHub Minimal" \
  publishing_platform="github-pages" \
  include_pdf_download="no" \
  starter_content="example-minimal"

cd test-github-minimal
ls -la .github/workflows/  # Verify GitHub Actions exists
grep "build-pdf" .github/workflows/deploy.yml  # Should NOT exist
cat docs/.vitepress/config.ts | grep "enabled: false"  # Verify PDF disabled
ls docs/example/  # Verify minimal example (3 files)
```

**Step 3: Test None + Empty**

```bash
cd /tmp
cookiecutter /home/gu/Workspace/markdown-chartpress \
  --no-input \
  project_title="Test Empty" \
  publishing_platform="none" \
  starter_content="empty"

cd test-empty
ls -la | grep -E "\.gitlab-ci|\.github"  # Should not exist
ls docs/  # Should only have .vitepress/ and index.md, no example/
```

**Step 4: Document test results**

Create note in repository:

```bash
cd /home/gu/Workspace/markdown-chartpress
cat > TESTING.md << 'EOF'
# Cookiecutter Testing Checklist

## Test Scenarios

- [ ] GitLab + PDF + Full example
- [ ] GitLab + No PDF + Full example
- [ ] GitHub + PDF + Minimal
- [ ] GitHub + No PDF + Minimal
- [ ] None + Empty
- [ ] Self-hosted GitLab + PDF + Full

## Verification Points

For each test:
- [ ] Project generates without errors
- [ ] Correct CI/CD file present (or absent)
- [ ] PDF config matches choice (enabled: true/false)
- [ ] Starter content matches choice
- [ ] `npm install` succeeds
- [ ] `make dev` starts without errors
- [ ] Build commands work: `make build`, `make site`, `make pdf-full`

## Manual Tests

After automated tests:
- [ ] Push generated project to actual GitLab/GitHub
- [ ] Verify CI/CD pipeline runs
- [ ] Verify site deploys correctly
- [ ] Verify PDF is downloadable (if enabled)
- [ ] Test PDF button appears/doesn't appear as expected
EOF
```

**Step 5: Commit test documentation**

```bash
git add TESTING.md
git commit -m "docs: add cookiecutter testing checklist"
```

---

## Task 16: Create Placeholder Logos

**Files:**
- Ensure template has generic logos that users should replace

**Step 1: Verify logo files exist**

Check that `{{cookiecutter.project_slug}}/assets/` has:
- `logo.png` (800x800px placeholder)
- `logo.svg` (vector placeholder)

**Step 2: If logos don't exist, document requirement**

Add to `{{cookiecutter.project_slug}}/assets/README.md`:

```markdown
# Assets

## Logo Files

Replace these placeholder files with your organization's logos:

- **logo.png** - Used in PDF documents (recommended 800x800px, transparent background)
- **logo.svg** - Used in VitePress site (vector format preferred)

Both files are referenced in:
- `Makefile` - Variables LOGO_FILE and LOGO_SVG
- `docs/.vitepress/config.ts` - Site logo configuration
- `templates/title-page.tex.template` - PDF title page

## Colors

Brand colors are configured in `Makefile`:
- PRIMARY_COLOR_HEX - Hex color code (e.g., "003366")
- PRIMARY_COLOR_RGB - RGB values (e.g., "0, 51, 102")

These are used in LaTeX templates for PDF styling.
```

**Step 3: Commit**

```bash
git add "{{cookiecutter.project_slug}}/assets/README.md"
git commit -m "docs: add assets README with logo instructions"
```

---

## Task 17: Add .gitignore to Template

**Files:**
- Verify `{{cookiecutter.project_slug}}/.gitignore` exists and is comprehensive

**Step 1: Ensure .gitignore has necessary entries**

Check/update `{{cookiecutter.project_slug}}/.gitignore`:

```gitignore
# Build outputs
.build/
docs/.vitepress/dist/
docs/.vitepress/cache/
*.pdf
!assets/*.pdf

# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
package-lock.json

# OS
.DS_Store
Thumbs.db
*.swp
*.swo
*~

# IDE
.vscode/
.idea/
*.sublime-project
*.sublime-workspace

# LaTeX
*.aux
*.log
*.out
*.toc
*.fdb_latexmk
*.fls
*.synctex.gz

# Timestamps
.timestamps/

# Docker
.dockerignore

# Python (for post-generation hook)
__pycache__/
*.py[cod]
*$py.class
```

**Step 2: Commit if changes made**

```bash
git add "{{cookiecutter.project_slug}}/.gitignore"
git commit -m "chore: ensure comprehensive .gitignore"
```

---

## Task 18: Final Integration Test

**Files:**
- Complete end-to-end test

**Step 1: Generate fresh project with typical settings**

```bash
cd /tmp
cookiecutter /home/gu/Workspace/markdown-chartpress \
  project_title="Integration Test Docs" \
  company_name="Test Corp" \
  author_name="Tester" \
  publishing_platform="gitlab-pages" \
  include_pdf_download="yes" \
  starter_content="example-minimal" \
  initialize_git="yes"
```

**Step 2: Verify generated project builds**

```bash
cd integration-test-docs

# Install dependencies
npm install

# Test development server
timeout 10s make dev || true  # Start and stop after 10s

# Test builds
make site
ls docs/.vitepress/dist/index.html  # Verify site built

make docker-build-renderer
make pdf-full
ls .build/integration-test-docs.pdf  # Verify PDF created

make build  # Full build
ls docs/.vitepress/dist/downloads/integration-test-docs.pdf  # Verify PDF in dist
```

**Step 3: Verify git initialization**

```bash
git log --oneline  # Should show "Initial commit from markdown-chartpress template"
git status  # Should be clean
```

**Step 4: Verify PDF button configuration**

```bash
cat docs/.vitepress/config.ts | grep -A 4 "pdfDownload"
# Should show enabled: true and correct URL
```

**Step 5: Document results**

If all tests pass, create completion marker:

```bash
cd /home/gu/Workspace/markdown-chartpress
touch .cookiecutter-conversion-complete
git add .cookiecutter-conversion-complete
git commit -m "chore: mark cookiecutter conversion complete"
```

---

## Task 19: Update CLAUDE.md with New Structure

**Files:**
- Modify: `{{cookiecutter.project_slug}}/CLAUDE.md`

**Step 1: Update CLAUDE.md to reflect cookiecutter structure**

Modify the Overview and Build Commands sections to mention this is a generated project:

```markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This project was generated from the [markdown-chartpress](https://github.com/guglielmo/markdown-chartpress) cookiecutter template.

markdown-chartpress is a professional documentation template with dual output formats:
- **VitePress Site**: Interactive documentation with ECharts visualizations
- **PDF Documents**: Professional exports with static chart images via Pandoc + XeLaTeX

**Generated with:**
- Project: {{cookiecutter.project_title}}
- Company: {{cookiecutter.company_name}}
- Publishing: {{cookiecutter.publishing_platform}}
{% if cookiecutter.include_pdf_download == 'yes' %}
- PDF Download: Enabled
{% endif %}

Built on: VitePress 1.0, Vue 3, ECharts 5, Puppeteer (Docker), Pandoc, XeLaTeX

## Build Commands

[... rest of original content ...]
```

**Step 2: Commit**

```bash
git add "{{cookiecutter.project_slug}}/CLAUDE.md"
git commit -m "docs: update CLAUDE.md for generated projects"
```

---

## Task 20: Tag Release and Test from GitHub

**Files:**
- Create git tag for alpha release

**Step 1: Create annotated tag**

```bash
cd /home/gu/Workspace/markdown-chartpress
git tag -a v0.1.0-alpha -m "Alpha release: Cookiecutter-based template

Features:
- Cookiecutter project generation
- GitLab Pages & GitHub Pages support
- Conditional PDF download integration
- Flexible starter content (full/minimal/empty)
- Automated CI/CD templates
"
```

**Step 2: Push to remote**

```bash
git push origin main
git push origin v0.1.0-alpha
```

**Step 3: Test generation from GitHub**

```bash
cd /tmp
cookiecutter gh:guglielmo/markdown-chartpress
# Follow prompts and verify it works from remote repo
```

**Step 4: Verify and document**

If successful, update TESTING.md with final status:

```bash
echo "## v0.1.0-alpha Release Tests

- [x] Generate from GitHub works
- [x] All build commands functional
- [x] CI/CD templates correct
- [x] PDF integration works

Release date: $(date +%Y-%m-%d)" >> TESTING.md

git add TESTING.md
git commit -m "docs: document v0.1.0-alpha test results"
git push origin main
```

---

## Summary

This plan converts markdown-chartpress into a cookiecutter template with:

1. **Cookiecutter configuration** (`cookiecutter.json`) with all customization options
2. **Post-generation hook** to clean up unused files based on user choices
3. **Template directory structure** with all files in `{{cookiecutter.project_slug}}/`
4. **Jinja2 variables** throughout Makefile, VitePress config, CI/CD templates
5. **PDF download button** integrated into VitePress theme (conditional)
6. **CI/CD templates** for GitLab Pages and GitHub Pages with conditional PDF builds
7. **Flexible starter content** (full example, minimal, or empty)
8. **Comprehensive documentation** (docs/README.md) that adapts to user choices
9. **Testing checklist** to verify all combinations work

**Total estimated time:** 4-6 hours for careful implementation and testing

## Next Steps After Implementation

1. Test all platform combinations
2. Deploy test projects to actual GitLab/GitHub to verify CI/CD
3. Gather feedback from users
4. Iterate on:
   - Starter content quality
   - Documentation clarity
   - CI/CD template reliability
   - Cookiecutter prompts (add/remove/reorder)
5. Consider additional publishing platforms (Vercel, Netlify)
6. Add GitHub template repository features
