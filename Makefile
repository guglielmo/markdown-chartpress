# ==========================================
# markdown-chartpress Configuration
# ==========================================
# Customizable template for VitePress + PDF documentation generation
# Repository: https://github.com/guglielmo/markdown-chartpress

# PROJECT CONFIGURATION
# ---------------------
PROJECT_TITLE := Professional Documentation
COMPANY_NAME := Your Company
PROJECT_AUTHOR := Documentation Team
PROJECT_DATE := $(shell date +%Y-%m-%d)

# BRANDING
# --------
LOGO_FILE := logo.png
LOGO_SVG := logo.svg
PRIMARY_COLOR_NAME := primarycolor
PRIMARY_COLOR_RGB := 0, 51, 102
PRIMARY_COLOR_HEX := 003366

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
CHART_FORMAT := svg
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
	@sed -e 's/{{{PRIMARY_COLOR_NAME}}}/$(PRIMARY_COLOR_NAME)/g' \
	     -e 's/{{{PRIMARY_COLOR_RGB}}}/$(PRIMARY_COLOR_RGB)/g' \
	     -e 's/{{COMPANY_NAME}}/$(COMPANY_NAME)/g' \
	     -e 's/{{{LOGO_FILE}}}/$(ASSETS_DIR)\/$(LOGO_FILE)/g' \
	     $(TEMPLATES_DIR)/header.tex.template > $(BUILD_DIR)/header.tex
	@sed -e 's/{{{LOGO_FILE}}}/$(ASSETS_DIR)\/$(LOGO_FILE)/g' \
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
	  -o $(PROJECT_TITLE)-full.pdf \
	  --pdf-engine=$(PDF_ENGINE) \
	  -H $(BUILD_DIR)/header.tex \
	  -B $(BUILD_DIR)/title-page.tex \
	  --number-sections \
	  -V geometry:margin=$(PDF_MARGIN) \
	  -V fontsize=$(PDF_FONTSIZE) \
	  -V documentclass=$(PDF_DOCCLASS)
	@echo "✓ Generated $(PROJECT_TITLE)-full.pdf"

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
	@echo "  - PDF: $(PROJECT_TITLE)-full.pdf"
	@echo "  - Charts: $(IMAGES_DIR)/"

# TARGET MAKE
# ===========

# Target di default: full build
.PHONY: all
all: build
