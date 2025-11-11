# ==========================================
# markdown-chartpress Configuration
# ==========================================
# Customizable template for VitePress + PDF documentation generation
# Repository: https://github.com/guglielmo/markdown-chartpress

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

# DIRECTORIES
# -----------
DOCS_DIR := docs
IMAGES_DIR := images
BUILD_DIR := .build
TEMPLATES_DIR := templates
ASSETS_DIR := assets
SCRIPTS_DIR := scripts
TIMESTAMPS_DIR := .timestamps

# PDF CONFIGURATION
# -----------------
CHART_FORMAT := {{cookiecutter.chart_format}}
PDF_MARGIN := 2.5cm
PDF_FONTSIZE := 11pt
PDF_DOCCLASS := article

# TOOLS
# -----
PANDOC := pandoc
PDF_ENGINE := xelatex
VITEPRESS := npx vitepress
NODE := node
DOCKER := docker

# Detect Docker availability
HAS_DOCKER := $(shell command -v docker 2> /dev/null)
HAS_NODE := $(shell command -v node 2> /dev/null)

# ==========================================
# TEMPLATE PROCESSING
# ==========================================

# Process LaTeX templates with variable substitution
.PHONY: process-templates
process-templates:
	@mkdir -p $(BUILD_DIR)
	@echo "Processing LaTeX templates..."
	@sed -e 's/{{{PRIMARY_COLOR_NAME}}}/{$(PRIMARY_COLOR_NAME)}/g' \
	     -e 's/{{{PRIMARY_COLOR_RGB}}}/{$(PRIMARY_COLOR_RGB)}/g' \
	     -e 's/{{COMPANY_NAME}}/$(COMPANY_NAME)/g' \
	     -e 's/{{PROJECT_TITLE}}/$(PROJECT_TITLE)/g' \
	     -e 's/{{{PROJECT_TITLE}}}/{$(PROJECT_TITLE)}/g' \
	     -e 's/{{{PROJECT_AUTHOR}}}/{$(PROJECT_AUTHOR)}/g' \
	     -e 's/{{{LOGO_FILE}}}/{$(ASSETS_DIR)\/$(LOGO_FILE)}/g' \
	     $(TEMPLATES_DIR)/header.tex.template > $(BUILD_DIR)/header.tex
	@sed -e 's/{{{LOGO_FILE}}}/{$(ASSETS_DIR)\/$(LOGO_FILE)}/g' \
	     -e 's/{{{COMPANY_NAME}}}/{$(COMPANY_NAME)}/g' \
	     -e 's/{{{PROJECT_TITLE}}}/{$(PROJECT_TITLE)}/g' \
	     -e 's/{{COMPANY_NAME}}/$(COMPANY_NAME)/g' \
	     -e 's/{{PROJECT_TITLE}}/$(PROJECT_TITLE)/g' \
	     -e 's/{{PROJECT_SUBTITLE}}/$(PROJECT_SUBTITLE)/g' \
	     -e 's/{{PROJECT_DATE}}/$(PROJECT_DATE)/g' \
	     -e 's/{{PROJECT_AUTHOR}}/$(PROJECT_AUTHOR)/g' \
	     $(TEMPLATES_DIR)/title-page.tex.template > $(BUILD_DIR)/title-page.tex
	@echo "Templates processed to $(BUILD_DIR)/"

# ==========================================
# DOCKER CHART RENDERER
# ==========================================

DOCKER_IMAGE := markdown-chartpress/renderer
DOCKER_TAG := latest

.PHONY: docker-build-renderer
docker-build-renderer:
	@echo "Building Docker chart renderer image..."
	cd $(SCRIPTS_DIR)/docker && $(DOCKER) build -t $(DOCKER_IMAGE):$(DOCKER_TAG) .
	@echo "✓ Docker image built: $(DOCKER_IMAGE):$(DOCKER_TAG)"

.PHONY: docker-test-renderer
docker-test-renderer:
	@echo "Testing Docker renderer..."
	@echo '{"file":"test.md","charts":[{"id":"test","config":"{title:{text:\"Test\"},series:[{data:[1,2,3],type:\"line\"}]}","format":"svg","width":800,"height":600}]}' > /tmp/test-manifest.json
	$(DOCKER) run --rm -v /tmp:/workspace $(DOCKER_IMAGE):$(DOCKER_TAG) render /workspace/test-manifest.json /workspace svg
	@echo "✓ Check /tmp/test.svg"

# ==========================================
# CHART RENDERING
# ==========================================

MANIFEST_FILE := $(BUILD_DIR)/charts-manifest.json

.PHONY: extract-charts
extract-charts:
	@mkdir -p $(BUILD_DIR)
	@echo "Extracting charts from $(DOCS_DIR)..."
	$(NODE) $(SCRIPTS_DIR)/extract-charts.js $(DOCS_DIR) $(MANIFEST_FILE)

.PHONY: render-charts
render-charts: extract-charts
	@echo "Rendering charts..."
ifdef HAS_DOCKER
	@echo "Using Docker renderer..."
	$(DOCKER) run --rm \
	  -v $(PWD)/$(BUILD_DIR):/workspace/build \
	  -v $(PWD)/$(IMAGES_DIR):/workspace/images \
	  $(DOCKER_IMAGE):$(DOCKER_TAG) \
	  render /workspace/build/charts-manifest.json /workspace/images $(CHART_FORMAT)
else ifdef HAS_NODE
	@echo "Docker not found, using local Node.js..."
	@test -d node_modules/puppeteer && \
	  $(NODE) $(SCRIPTS_DIR)/docker/render-chart.js $(MANIFEST_FILE) $(IMAGES_DIR) $(CHART_FORMAT) || \
	  (echo "Error: puppeteer not installed. Run 'npm install puppeteer' or use Docker"; exit 1)
else
	@echo "Error: Neither Docker nor Node.js found"
	@exit 1
endif
	@echo "✓ Charts rendered to $(IMAGES_DIR)/"

.PHONY: charts
charts: render-charts

# ==========================================
# PDF GENERATION
# ==========================================

# Preprocess markdown files for Pandoc
.PHONY: preprocess-markdown
preprocess-markdown: charts
	@mkdir -p $(BUILD_DIR)/processed
	@echo "Preprocessing markdown files..."
	@for file in $(DOCS_DIR)/**/*.md; do \
	  if [ -f "$$file" ]; then \
	    outfile=$(BUILD_DIR)/processed/$$(basename $$file); \
	    $(NODE) $(SCRIPTS_DIR)/preprocess-markdown.js "$$file" $(IMAGES_DIR) > "$$outfile"; \
	  fi \
	done
	@echo "✓ Markdown preprocessed to $(BUILD_DIR)/processed/"

# Generate full PDF (all content)
.PHONY: pdf-full
pdf-full: process-templates preprocess-markdown
	@echo "Generating full PDF..."
	@cat $(BUILD_DIR)/processed/*.md > $(BUILD_DIR)/merged.md
	$(PANDOC) $(BUILD_DIR)/merged.md \
	  -o $(BUILD_DIR)/$(PROJECT_SLUG).pdf \
	  --pdf-engine=$(PDF_ENGINE) \
	  -H $(BUILD_DIR)/header.tex \
	  -B $(BUILD_DIR)/title-page.tex \
	  --number-sections \
	  -V geometry:margin=$(PDF_MARGIN) \
	  -V fontsize=$(PDF_FONTSIZE) \
	  -V documentclass=$(PDF_DOCCLASS)
	@echo "✓ Generated $(PROJECT_SLUG).pdf in $(BUILD_DIR)/"

# Generate chapter PDF (pattern: pdf-chapter-01)
.PHONY: pdf-chapter-%
pdf-chapter-%: process-templates preprocess-markdown
	@echo "Generating chapter $* PDF..."
	@file=$$(find $(DOCS_DIR) -name "$*-*.md" -type f | head -1); \
	if [ -z "$$file" ]; then \
	  echo "Error: Chapter $* not found"; \
	  exit 1; \
	fi; \
	outfile=$(BUILD_DIR)/processed/$$(basename $$file); \
	$(PANDOC) "$$outfile" \
	  -o chapter-$*.pdf \
	  --pdf-engine=$(PDF_ENGINE) \
	  -H $(BUILD_DIR)/header.tex \
	  --number-sections \
	  -V geometry:margin=$(PDF_MARGIN) \
	  -V fontsize=$(PDF_FONTSIZE)
	@echo "✓ Generated chapter-$*.pdf"

# Generate appendices PDF
.PHONY: pdf-appendices
pdf-appendices: process-templates preprocess-markdown
	@echo "Generating appendices PDF..."
	@find $(BUILD_DIR)/processed -name "A*-*.md" -exec cat {} \; > $(BUILD_DIR)/appendices.md
	$(PANDOC) $(BUILD_DIR)/appendices.md \
	  -o appendices.pdf \
	  --pdf-engine=$(PDF_ENGINE) \
	  -H $(BUILD_DIR)/header.tex \
	  --number-sections \
	  -V geometry:margin=$(PDF_MARGIN) \
	  -V fontsize=$(PDF_FONTSIZE)
	@echo "✓ Generated appendices.pdf"

.PHONY: pdf
pdf: pdf-full

# ==========================================
# VITEPRESS SITE
# ==========================================

.PHONY: dev
dev:
	@echo "Starting VitePress dev server..."
	@echo "Interactive charts will render in browser"
	$(VITEPRESS) dev $(DOCS_DIR)

# Development server with PDF available
.PHONY: dev-with-pdf
dev-with-pdf: pdf-full
	@echo "Copying PDF to dist for dev server..."
	@mkdir -p $(DOCS_DIR)/.vitepress/dist/downloads
	@cp $(BUILD_DIR)/$(PROJECT_SLUG).pdf $(DOCS_DIR)/.vitepress/dist/downloads/
	@echo "PDF available at /downloads/$(PROJECT_SLUG).pdf"
	@echo "Starting development server..."
	$(VITEPRESS) dev $(DOCS_DIR)

.PHONY: site
site:
	@echo "Building VitePress static site..."
	$(VITEPRESS) build $(DOCS_DIR)
	@echo "✓ Site built to $(DOCS_DIR)/.vitepress/dist/"

.PHONY: preview
preview: site
	@echo "Previewing built site..."
	$(VITEPRESS) preview $(DOCS_DIR)

# Full production build
.PHONY: build
build: charts site pdf-full
	@echo ""
	@echo "✓ Full build complete!"
	@echo "  - Static site: $(DOCS_DIR)/.vitepress/dist/"
	@echo "  - PDF: $(BUILD_DIR)/$(PROJECT_SLUG).pdf"
	@echo "  - Charts: $(IMAGES_DIR)/"

# TARGET MAKE
# ===========

# Target di default: full build
.PHONY: all
all: build

# ==========================================
# UTILITIES
# ==========================================

.PHONY: clean
clean:
	@echo "Cleaning build artifacts..."
	rm -rf $(BUILD_DIR)
	rm -rf $(IMAGES_DIR)
	rm -rf $(TIMESTAMPS_DIR)
	rm -rf $(DOCS_DIR)/.vitepress/dist
	rm -rf $(DOCS_DIR)/.vitepress/cache
	rm -f *.pdf
	@echo "✓ Clean complete"

.PHONY: check
check:
	@echo "Checking dependencies..."
	@command -v $(PANDOC) >/dev/null 2>&1 || echo "  ✗ pandoc not found"
	@command -v $(PDF_ENGINE) >/dev/null 2>&1 || echo "  ✗ xelatex not found"
	@command -v rsvg-convert >/dev/null 2>&1 || echo "  ✗ rsvg-convert not found (install librsvg2-bin)"
	@command -v $(NODE) >/dev/null 2>&1 || echo "  ✗ node not found"
	@command -v $(DOCKER) >/dev/null 2>&1 || echo "  ✗ docker not found"
	@command -v npm >/dev/null 2>&1 || echo "  ✗ npm not found"
	@test -d node_modules || echo "  ✗ node_modules not found (run npm install)"
	@echo "✓ Dependency check complete"

.PHONY: info
info:
	@echo "markdown-chartpress Configuration:"
	@echo "=================================="
	@echo "Project: $(PROJECT_TITLE)"
	@echo "Company: $(COMPANY_NAME)"
	@echo "Author: $(PROJECT_AUTHOR)"
	@echo ""
	@echo "Directories:"
	@echo "  Docs: $(DOCS_DIR)"
	@echo "  Images: $(IMAGES_DIR)"
	@echo "  Build: $(BUILD_DIR)"
	@echo ""
	@echo "PDF Config:"
	@echo "  Chart format: $(CHART_FORMAT)"
	@echo "  Margin: $(PDF_MARGIN)"
	@echo "  Font size: $(PDF_FONTSIZE)"
	@echo ""
	@echo "Tools:"
	@echo "  Docker: $(if $(HAS_DOCKER),✓ available,✗ not found)"
	@echo "  Node.js: $(if $(HAS_NODE),✓ available,✗ not found)"

.PHONY: help
help:
	@echo "markdown-chartpress - Makefile Targets"
	@echo "======================================"
	@echo ""
	@echo "Development:"
	@echo "  make dev              Start VitePress dev server"
	@echo "  make preview          Preview built site"
	@echo ""
	@echo "Building:"
	@echo "  make build            Full production build (site + PDF + charts)"
	@echo "  make site             Build VitePress static site only"
	@echo "  make pdf-full         Generate complete PDF"
	@echo "  make pdf-chapter-XX   Generate specific chapter PDF"
	@echo "  make pdf-appendices   Generate appendices PDF"
	@echo ""
	@echo "Charts:"
	@echo "  make charts           Extract and render all charts"
	@echo "  make extract-charts   Extract chart definitions only"
	@echo "  make render-charts    Render extracted charts"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build-renderer  Build chart renderer Docker image"
	@echo "  make docker-test-renderer   Test Docker renderer"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean            Remove all build artifacts"
	@echo "  make check            Check dependencies"
	@echo "  make info             Show current configuration"
	@echo "  make help             Show this help"
	@echo ""
	@echo "Configuration:"
	@echo "  Edit Makefile variables at top of file to customize"
