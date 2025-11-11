# Cookiecutter-Based Publishing Architecture

**Date:** 2025-11-11
**Status:** Approved for implementation

## Overview

Transform markdown-chartpress from a clone-and-modify repository into a cookiecutter-based project generator with built-in publishing platform support.

## Problem Statement

Current issues:
- Users clone the repo directly and work in it, creating confusion about upstream/origin
- No publishing configuration included
- Changes to user docs could accidentally be pushed to template repo
- No clear separation between template and user content

## Solution

Use cookiecutter to generate clean project instances with:
- Customized configuration (branding, colors, project metadata)
- Platform-specific CI/CD files (GitLab Pages, GitHub Pages, or none)
- Optional PDF download in published site
- Flexible starter content (full example, minimal, or empty)

## User Workflow

```bash
# Install cookiecutter (one-time)
pip install cookiecutter

# Generate project from template
cookiecutter gh:guglielmo/markdown-chartpress

# Answer prompts:
# - project_title: My Technical Report
# - company_name: Acme Corp
# - author_name: John Doe
# - primary_color_hex: 0066cc
# - publishing_platform: gitlab-pages
# - include_pdf_download: yes
# - starter_content: example-minimal

# Start working
cd my-technical-report
npm install
make dev

# Push to git hosting
git remote add origin git@gitlab.com:username/my-technical-report.git
git push -u origin main

# CI/CD automatically deploys
```

## Repository Structure

### Template Repository (markdown-chartpress)

```
markdown-chartpress/
├── cookiecutter.json                    # Template variables
├── hooks/                               # Cookiecutter hooks
│   └── post_gen_project.py             # Post-generation cleanup
├── {{cookiecutter.project_slug}}/      # Template directory
│   ├── docs/
│   │   ├── .vitepress/
│   │   │   ├── config.ts               # Uses {{cookiecutter.*}} variables
│   │   │   └── theme/
│   │   │       ├── components/
│   │   │       │   └── PdfDownloadButton.vue  # New component
│   │   │       └── index.ts
│   │   ├── example/                    # Conditional content
│   │   │   ├── index.md
│   │   │   ├── 01-*.md
│   │   │   └── appendici/
│   │   ├── README.md                   # Usage guide (Jinja template)
│   │   └── index.md                    # Home page
│   ├── scripts/
│   │   ├── extract-charts.js
│   │   ├── preprocess-markdown.js
│   │   └── docker/
│   ├── templates/                      # LaTeX templates
│   ├── assets/                         # Logo files
│   ├── Makefile                        # Uses cookiecutter variables
│   ├── .gitlab-ci.yml.jinja           # Conditional template
│   ├── .github/
│   │   └── workflows/
│   │       └── deploy.yml.jinja       # Conditional template
│   ├── package.json
│   └── .gitignore
└── README.md                           # Cookiecutter usage instructions
```

### Generated Project Structure

```
my-technical-report/                    # Generated from cookiecutter
├── docs/
│   ├── .vitepress/
│   │   ├── config.ts                   # Populated with user's values
│   │   └── theme/
│   ├── example/                        # If starter_content != empty
│   │   ├── index.md
│   │   └── 01-*.md
│   ├── README.md                       # How to organize docs
│   └── index.md
├── scripts/
├── templates/
├── assets/
├── Makefile                            # Project-specific values
├── .gitlab-ci.yml                      # OR .github/workflows/deploy.yml
├── package.json
└── .git/                               # If initialize_git=yes
```

## Cookiecutter Configuration

### Variables (`cookiecutter.json`)

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

### Post-Generation Hook

Removes unnecessary files based on user choices:

```python
# hooks/post_gen_project.py (pseudocode)

if publishing_platform not in ["gitlab-pages", "gitlab-pages-selfhosted"]:
    remove(".gitlab-ci.yml")

if publishing_platform != "github-pages":
    remove(".github/")

if starter_content == "empty":
    remove("docs/example/")

if include_pdf_download == "no":
    # Optionally clean up PDF-related scripts

if initialize_git == "yes":
    run("git init")
    run("git add .")
    run("git commit -m 'Initial commit from markdown-chartpress'")
```

## Publishing Platform Support

### GitLab Pages

**File:** `.gitlab-ci.yml` (generated from `.gitlab-ci.yml.jinja`)

**Features:**
- Builds VitePress site
- Conditionally builds PDF (if `include_pdf_download=yes`)
- Deploys to GitLab Pages (`https://username.gitlab.io/project`)
- Supports both gitlab.com and self-hosted instances

**Jobs:**
1. `build-site` - npm build VitePress
2. `build-pdf` - Docker + Make for PDF generation (conditional)
3. `pages` - Deploy to GitLab Pages

### GitHub Pages

**File:** `.github/workflows/deploy.yml` (generated from template)

**Features:**
- Builds VitePress site
- Conditionally builds PDF
- Deploys to GitHub Pages using official actions
- Uses artifacts for build artifacts coordination

**Jobs:**
1. `build-site` - npm build VitePress
2. `build-pdf` - apt install deps + Make (conditional)
3. `deploy` - Download artifacts, configure & deploy Pages

### Manual/None

No CI/CD file generated. Users run:
- `make build` locally
- Deploy `docs/.vitepress/dist/` manually to hosting

## PDF Download Integration

### VitePress Configuration

**config.ts:**
```typescript
export default defineConfig({
  themeConfig: {
    pdfDownload: {
      enabled: true,  // or false based on cookiecutter choice
      url: '/downloads/project-slug.pdf',
      label: 'Scarica PDF'
    }
  }
})
```

### PDF Download Button Component

**PdfDownloadButton.vue:**
- Reads `theme.pdfDownload` config
- Only renders if `enabled: true`
- Styled button with icon
- Placed in sidebar via theme Layout slot

**Integration in theme/index.ts:**
- Registers component globally
- Adds to `sidebar-nav-after` slot

### Dev vs Production Behavior

**Development (`make dev`):**
- Button appears if `pdfDownload.enabled: true`
- Link won't work unless user runs `make dev-with-pdf`

**Development with PDF (`make dev-with-pdf`):**
- New Makefile target
- Generates PDF, copies to `dist/downloads/`, starts dev server
- Button works in dev mode

**Production (`make build`):**
- If `include_pdf_download=yes`:
  - PDF generated during build
  - Copied to `dist/downloads/`
  - Button always works
- If `include_pdf_download=no`:
  - Button not shown (config.enabled=false)

## Starter Content Options

### example-full
- 6 chapters (01-06)
- 3 appendices (A1-A3)
- 2 working ECharts visualizations
- Images and formatting examples
- Complete demonstration of all features

### example-minimal
- 3 skeleton chapters (01-03)
- Commented placeholders
- Basic formatting examples
- Minimal but functional

### empty
- No `docs/example/` folder
- Only `docs/index.md` home page
- Clean slate for experienced users

## Documentation Structure Guidance

### docs/README.md

Generated Jinja template that explains:
- Role of `example/` folder (if present)
- How to rename/replace example content
- Chapter numbering conventions
- How to add new documentation sections
- VitePress config updates needed
- Chart embedding syntax
- Build commands

Content adapts based on `starter_content` choice.

## Makefile Integration

### Cookiecutter Variables

```makefile
PROJECT_TITLE := {{cookiecutter.project_title}}
COMPANY_NAME := {{cookiecutter.company_name}}
PROJECT_AUTHOR := {{cookiecutter.author_name}}
PROJECT_SLUG := {{cookiecutter.project_slug}}
PRIMARY_COLOR_RGB := {{cookiecutter.primary_color_rgb}}
PRIMARY_COLOR_HEX := {{cookiecutter.primary_color_hex}}
CHART_FORMAT := {{cookiecutter.chart_format}}
PDF_OUTPUT := {{cookiecutter.project_slug}}.pdf
```

### New Targets

**dev-with-pdf:**
```makefile
dev-with-pdf: pdf-full
	@mkdir -p $(DOCS_DIR)/.vitepress/dist/downloads
	@cp $(BUILD_DIR)/$(PDF_OUTPUT) $(DOCS_DIR)/.vitepress/dist/downloads/
	$(VITEPRESS) dev $(DOCS_DIR)
```

Allows testing PDF download button in development mode.

## CI/CD Template Details

### GitLab CI/CD (.gitlab-ci.yml.jinja)

```yaml
stages:
  - build
  - deploy

build-site:
  image: node:18
  script:
    - npm ci
    - npm run docs:build
  artifacts:
    paths:
      - docs/.vitepress/dist

{% if cookiecutter.include_pdf_download == 'yes' %}
build-pdf:
  image: docker:latest
  services:
    - docker:dind
  before_script:
    - apk add --no-cache make pandoc texlive-xetex nodejs npm
  script:
    - npm ci
    - make docker-build-renderer
    - make pdf-full
    - mkdir -p docs/.vitepress/dist/downloads
    - cp .build/{{cookiecutter.project_slug}}.pdf docs/.vitepress/dist/downloads/
  artifacts:
    paths:
      - docs/.vitepress/dist/downloads
{% endif %}

pages:
  script:
    - mv docs/.vitepress/dist public
  artifacts:
    paths:
      - public
  only:
    - main
```

### GitHub Actions (.github/workflows/deploy.yml.jinja)

```yaml
jobs:
  build-site:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run docs:build
      - uses: actions/upload-artifact@v4
        with:
          name: vitepress-dist
          path: docs/.vitepress/dist

{% if cookiecutter.include_pdf_download == 'yes' %}
  build-pdf:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: sudo apt-get install -y pandoc texlive-xetex
      - run: npm ci
      - run: make docker-build-renderer
      - run: make pdf-full
      - run: mkdir -p pdf-artifact && cp .build/*.pdf pdf-artifact/
      - uses: actions/upload-artifact@v4
        with:
          name: pdf
          path: pdf-artifact
{% endif %}

  deploy:
    needs: [build-site{% if cookiecutter.include_pdf_download == 'yes' %}, build-pdf{% endif %}]
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: vitepress-dist
          path: dist
{% if cookiecutter.include_pdf_download == 'yes' %}
      - uses: actions/download-artifact@v4
        with:
          name: pdf
          path: dist/downloads
{% endif %}
      - uses: actions/deploy-pages@v4
```

## Implementation Phases

### Phase 1: Repository Restructure
- Create cookiecutter.json
- Move files into `{{cookiecutter.project_slug}}/`
- Convert hardcoded values to Jinja2 variables
- Create CI/CD .jinja templates
- Write post_gen_project.py hook

### Phase 2: VitePress Integration
- Create PdfDownloadButton.vue component
- Modify theme/index.ts for sidebar integration
- Update config.ts with pdfDownload option
- Add dev-with-pdf Makefile target

### Phase 3: Documentation
- Write docs/README.md Jinja template (with conditional content)
- Update main README.md for cookiecutter usage
- Create example-full content
- Create example-minimal content

### Phase 4: Testing
- Test cookiecutter generation locally
- Test all platform combinations
- Test all starter_content options
- Test CI/CD configs in actual GitLab/GitHub repos
- Verify PDF download button behavior

### Phase 5: Release
- Tag as v0.1.0-alpha
- Publish to GitHub
- Test `cookiecutter gh:guglielmo/markdown-chartpress`
- Iterate based on feedback

## Design Decisions & Rationale

### Why cookiecutter over other templating?
- User is familiar with it (uses for Django projects)
- Mature, well-tested tool
- Jinja2 templates with powerful conditionals
- Post-generation hooks for cleanup
- No custom tooling to maintain

### Why `docs/example/` instead of `docs/{{project_slug}}/`?
- Avoids duplication: `my-report/docs/my-report/`
- Generic name works for all starter content types
- User can rename/replace easily
- Clear that it's an example, not their final structure

### Why config-based PDF button instead of file detection?
- Simpler mental model
- No filesystem watchers needed in dev mode
- Explicit user choice (Option E from design discussion)
- Consistent behavior between dev and production

### Why support both GitLab and GitHub Pages?
- Users may be on either platform
- Template should work for both ecosystems
- CI/CD syntax is similar enough to maintain both

### Why not support Vercel/Netlify initially?
- They're optimized for web apps, not PDF-heavy docs
- PDF artifact handling is more complex
- GitLab/GitHub Pages are git-native (where docs live anyway)
- Can add later if requested

## Success Criteria

- [ ] User can generate project with `cookiecutter gh:guglielmo/markdown-chartpress`
- [ ] All cookiecutter options work correctly
- [ ] Generated projects build successfully with `make build`
- [ ] GitLab Pages deployment works (tested on gitlab.com)
- [ ] GitHub Pages deployment works
- [ ] PDF download button appears when configured
- [ ] PDF is accessible in published site
- [ ] docs/README.md provides clear guidance
- [ ] Starter content options work as expected

## Future Enhancements

- Vercel/Netlify support
- Multiple documentation sections in single project
- Automated version numbering for PDFs
- PDF metadata customization (author, keywords, etc.)
- Dark mode support for VitePress theme
- Internationalization support

## References

- Cookiecutter: https://cookiecutter.readthedocs.io/
- VitePress: https://vitepress.dev/
- GitLab Pages: https://docs.gitlab.com/ee/user/project/pages/
- GitHub Pages: https://docs.github.com/en/pages
