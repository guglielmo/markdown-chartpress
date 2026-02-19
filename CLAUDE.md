# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a **cookiecutter template repository** for markdown-chartpress - a professional documentation system with dual output formats:
- **VitePress Site**: Interactive documentation with ECharts visualizations
- **PDF Documents**: Professional exports with static chart images via Pandoc + XeLaTeX

**Important**: This repository contains the *template definition*, not a generated project. Generated projects live in `{{cookiecutter.project_slug}}/`.

## Repository Structure

```
markdown-chartpress/                      # Template repository (this repo)
├── cookiecutter.json                     # Template configuration and variables
├── hooks/post_gen_project.py             # Post-generation cleanup script
├── {{cookiecutter.project_slug}}/        # Template directory (what users get)
│   ├── .github/workflows/*.jinja         # Templated CI/CD files
│   ├── .gitlab-ci.yml.jinja
│   ├── docs/                             # Documentation content
│   │   ├── .vitepress/                   # VitePress config, theme, components
│   │   ├── example/                      # Full example (6 chapters + appendices)
│   │   └── example-minimal/              # Minimal example (3 chapters)
│   ├── scripts/                          # Chart extraction/rendering
│   ├── templates/                        # LaTeX templates with {{PLACEHOLDERS}}
│   ├── Makefile                          # Build orchestration
│   └── package.json                      # Node dependencies
├── README.md                             # User-facing template documentation
└── design/                               # Design documents and historical context
```

## Testing the Template

### Generate a Test Project

```bash
# From parent directory
cookiecutter /path/to/markdown-chartpress

# Or from GitHub
cookiecutter gh:guglielmo/markdown-chartpress
```

### Test with Default Values (Quick)

```bash
# Non-interactive generation
cookiecutter --no-input /path/to/markdown-chartpress

# Enter generated project
cd professional-documentation/

# Install and test
npm install
make dev              # Test VitePress dev server
make build            # Test full build
```

### Test Specific Configurations

```bash
# Test GitHub Pages + PDF download
cookiecutter --no-input /path/to/markdown-chartpress \
  publishing_platform=github-pages \
  include_pdf_download=yes

# Test GitLab Pages + minimal starter
cookiecutter --no-input /path/to/markdown-chartpress \
  publishing_platform=gitlab-pages \
  starter_content=example-minimal

# Test empty starter with no CI/CD
cookiecutter --no-input /path/to/markdown-chartpress \
  publishing_platform=none \
  starter_content=empty
```

## Template Development

### Cookiecutter Variables

Defined in `cookiecutter.json`:
- `project_title`, `project_slug`, `company_name`, `author_name`
- `primary_color_hex`, `primary_color_rgb` (branding)
- `publishing_platform`: `none` | `gitlab-pages` | `gitlab-pages-selfhosted` | `github-pages`
- `include_pdf_download`: `yes` | `no`
- `starter_content`: `example-full` | `example-minimal` | `empty`
- `chart_format`: `svg` | `png`
- `initialize_git`: `yes` | `no`

### Jinja2 Template Files

Files ending in `.jinja` get renamed during generation (extension removed):
- `.github/workflows/deploy.yml.jinja` → `deploy.yml`
- `.gitlab-ci.yml.jinja` → `.gitlab-ci.yml`
- `docs/README.md.jinja` → `README.md`

**Conditional blocks:**
```jinja
{% if cookiecutter.include_pdf_download == 'yes' %}
  # PDF-specific content
{% endif %}
```

**Variable substitution:**
```jinja
{{cookiecutter.project_title}}
{{cookiecutter.company_name}}
```

### Post-Generation Hook

`hooks/post_gen_project.py` runs after generation:
1. Renames `.jinja` files (removes extension)
2. Removes unused CI/CD files based on `publishing_platform`
3. Removes example content if `starter_content=empty`
4. Initializes git if `initialize_git=yes`

**Testing hook changes:**
```bash
# Generate and watch hook output
cookiecutter --no-input /path/to/markdown-chartpress
# Hook logs appear during generation
```

### Modifying Template Files

When editing files in `{{cookiecutter.project_slug}}/`:

1. **Static files** (no variables) → edit directly
2. **Files with variables** → use `{{cookiecutter.var_name}}`
3. **Conditional sections** → use Jinja2 `{% if %}` blocks
4. **New CI/CD configs** → add `.jinja` extension, update hook

**Example: Adding a new variable**
```bash
# 1. Add to cookiecutter.json
"new_variable": "default_value"

# 2. Use in template files
{{cookiecutter.new_variable}}

# 3. Test generation
cookiecutter --no-input . new_variable="test_value"
```

## Generated Project Architecture

(Context for template developers - understanding what users get)

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
   - `header.tex.template`: LaTeX header with placeholders
   - `title-page.tex.template`: Title page template
   - Makefile: Variable substitution with sed, Pandoc invocation

4. **Configuration** (`Makefile`):
   - Project settings (title, company, author, date)
   - Branding (logo files, primary color RGB/HEX)
   - Directories and build paths
   - PDF settings (chart format, margins, font size)

### Chapter Numbering Convention

Files with numeric prefixes auto-number:
- `01-introduction.md` → "1. Introduction"
- `02-analysis.md` → "2. Analysis"
- `A1-appendix.md` → Appendix files

Implemented in `docs/.vitepress/theme/index.ts` via:
- Filename regex: `/(\d+)-[^/]+/` extracts chapter number
- Dynamic span injection to H2/H3 headings
- Format: `chapterNum.h2Counter.h3Counter`

### Chart Embedding

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
- Optional `<!-- chart: id -->` comment → explicit ID
- Without comment → auto-generated MD5 hash (`chart-abc12345`)

## CI/CD Configuration

### GitHub Actions (`deploy.yml.jinja`)

Three-job pipeline:
1. **build-site**: VitePress static site → artifact
2. **build-pdf**: Extract charts → Docker render → Pandoc PDF → artifact (if enabled)
3. **deploy**: Combine artifacts → GitHub Pages

### GitLab CI (`.gitlab-ci.yml.jinja`)

- **build-site**: Node.js image, VitePress build
- **build-pdf**: Docker-in-Docker image, chart rendering, Pandoc (if enabled)
- **pages**: Deployment to GitLab Pages (main branch only)

### Conditional PDF Build

Both pipelines conditionally include PDF jobs:
```jinja
{% if cookiecutter.include_pdf_download == 'yes' %}
  # PDF build job
{% endif %}
```

## Common Template Modifications

### Add New Publishing Platform

1. Add option to `cookiecutter.json`:
   ```json
   "publishing_platform": [
     "none",
     "gitlab-pages",
     "github-pages",
     "netlify"  // new
   ]
   ```

2. Create CI/CD template:
   ```bash
   touch {{cookiecutter.project_slug}}/.netlify.toml.jinja
   ```

3. Update `hooks/post_gen_project.py`:
   ```python
   if publishing_platform != "netlify":
       remove_file(".netlify.toml")
   ```

### Add New Starter Content Option

1. Create content directory:
   ```bash
   mkdir -p {{cookiecutter.project_slug}}/docs/example-custom/
   ```

2. Add option to `cookiecutter.json`:
   ```json
   "starter_content": [
     "example-full",
     "example-minimal",
     "example-custom",  // new
     "empty"
   ]
   ```

3. Update hook to handle cleanup:
   ```python
   if starter_content == "empty":
       remove_dir("docs/example")
       remove_dir("docs/example-minimal")
       remove_dir("docs/example-custom")
   elif starter_content != "example-custom":
       remove_dir("docs/example-custom")
   ```

### Customize LaTeX Templates

Templates use placeholder syntax:
- `{{COMPANY_NAME}}` → Two braces for text values
- `{{{PRIMARY_COLOR_NAME}}}` → Three braces for LaTeX commands

Processed by `make process-templates` with sed substitution in generated projects.

## Testing Checklist

Before releasing template changes:

- [ ] Generate with all `publishing_platform` options
- [ ] Generate with `include_pdf_download=yes` and `no`
- [ ] Generate with all `starter_content` options
- [ ] Test `make dev` in generated project
- [ ] Test `make build` in generated project
- [ ] Test `make pdf-full` in generated project
- [ ] Verify `.jinja` files are renamed correctly
- [ ] Verify unused CI/CD files are removed
- [ ] Check generated README.md makes sense
- [ ] Test actual deployment (GitHub/GitLab Pages)

## Notes for AI Assistants

- This is a **cookiecutter template repository** - the actual project files are in `{{cookiecutter.project_slug}}/`
- Files ending in `.jinja` use Jinja2 syntax and get renamed during generation
- The post-generation hook (`hooks/post_gen_project.py`) modifies the generated project
- Variables from `cookiecutter.json` are available as `{{cookiecutter.var_name}}`
- Testing requires generating projects with `cookiecutter` command
- Makefile in template uses `{{PLACEHOLDER}}` syntax (sed substitution, not Jinja2)
- VitePress config uses Node.js fs/path modules (runs server-side, not browser)
- Chart extraction uses MD5 hashing for auto-IDs (crypto library)
- Docker is optional but recommended for chart rendering
- Design documents in `design/` provide historical context and architecture decisions

## Origin

Originally built as DEPP Strategic Docs, genericized into markdown-chartpress cookiecutter template.
See `design/` directory for design documents and evolution history.
