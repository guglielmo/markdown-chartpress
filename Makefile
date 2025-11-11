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

# TARGET MAKE
# ===========

# Target di default: genera il PDF
.PHONY: all
all: pdf

# Genera PDF da Markdown
.PHONY: pdf
pdf: $(SOURCE) $(HEADER) $(TITLEPAGE)
	@echo "========================================="
	@echo "Generazione PDF in corso..."
	@echo "========================================="
	@echo "Sorgente:  $(SOURCE)"
	@echo "Output:    $(OUTPUT)"
	@echo "Engine:    $(PDF_ENGINE)"
	@echo "========================================="
	$(PANDOC) $(SOURCE) \
		-o $(OUTPUT) \
		--pdf-engine=$(PDF_ENGINE) \
		-V geometry:margin=$(MARGIN) \
		-V fontsize=$(FONTSIZE) \
		-V documentclass=$(DOCCLASS) \
		-H $(HEADER) \
		-B $(TITLEPAGE) \
		--number-sections
	@echo "========================================="
	@echo "✓ PDF generato con successo!"
	@echo "  File: $(OUTPUT)"
	@echo "========================================="

# Pulisce i file generati
.PHONY: clean
clean:
	@echo "Pulizia file generati..."
	rm -f $(OUTPUT)
	rm -f *.log *.aux *.out *.toc
	@echo "✓ Pulizia completata"

# Visualizza il PDF generato (Linux)
.PHONY: view
view: pdf
	@echo "Apertura PDF..."
	@if command -v xdg-open > /dev/null; then \
		xdg-open $(OUTPUT); \
	elif command -v evince > /dev/null; then \
		evince $(OUTPUT); \
	elif command -v okular > /dev/null; then \
		okular $(OUTPUT); \
	else \
		echo "Nessun visualizzatore PDF trovato"; \
		echo "Installa: evince, okular, o xdg-open"; \
	fi

# Compila e apre in un solo comando
.PHONY: preview
preview: pdf view

# Verifica dipendenze richieste
.PHONY: check
check:
	@echo "Verifica dipendenze..."
	@echo -n "Pandoc:   "
	@which pandoc > /dev/null && echo "✓ Installato" || echo "✗ NON installato"
	@echo -n "XeLaTeX:  "
	@which xelatex > /dev/null && echo "✓ Installato" || echo "✗ NON installato"
	@echo -n "Make:     "
	@which make > /dev/null && echo "✓ Installato" || echo "✗ NON installato"
	@echo ""
	@echo "File richiesti:"
	@echo -n "  $(SOURCE):  "
	@test -f $(SOURCE) && echo "✓ Presente" || echo "✗ MANCANTE"
	@echo -n "  $(HEADER):  "
	@test -f $(HEADER) && echo "✓ Presente" || echo "✗ MANCANTE"
	@echo -n "  $(TITLEPAGE):  "
	@test -f $(TITLEPAGE) && echo "✓ Presente" || echo "✗ MANCANTE"
	@echo -n "  logo-depp.png:  "
	@test -f logo-depp.png && echo "✓ Presente" || echo "✗ MANCANTE"

# Mostra informazioni e aiuto
.PHONY: help
help:
	@echo "========================================="
	@echo "Template Documenti DEPP Srl"
	@echo "========================================="
	@echo ""
	@echo "Target disponibili:"
	@echo ""
	@echo "  make pdf       - Genera PDF da Markdown (default)"
	@echo "  make view      - Genera e visualizza il PDF"
	@echo "  make preview   - Alias per 'make view'"
	@echo "  make clean     - Rimuove file generati"
	@echo "  make check     - Verifica dipendenze installate"
	@echo "  make help      - Mostra questo aiuto"
	@echo ""
	@echo "Personalizzazione:"
	@echo ""
	@echo "  Per personalizzare il documento, modifica:"
	@echo "  - SOURCE: nome file Markdown sorgente"
	@echo "  - OUTPUT: nome file PDF generato"
	@echo "  - MARGIN, FONTSIZE: geometria pagina"
	@echo ""
	@echo "  Per personalizzare la pagina iniziale:"
	@echo "  - Modifica title-page.tex"
	@echo ""
	@echo "  Per personalizzare header/footer:"
	@echo "  - Modifica header.tex"
	@echo ""
	@echo "Esempi:"
	@echo ""
	@echo "  make pdf                    # Genera PDF"
	@echo "  make pdf SOURCE=mio_doc.md  # Usa file diverso"
	@echo "  make clean && make pdf      # Rigenera da zero"
	@echo ""
	@echo "========================================="

# Info sulle variabili correnti
.PHONY: info
info:
	@echo "Configurazione corrente:"
	@echo "  SOURCE:     $(SOURCE)"
	@echo "  OUTPUT:     $(OUTPUT)"
	@echo "  PDF_ENGINE: $(PDF_ENGINE)"
	@echo "  MARGIN:     $(MARGIN)"
	@echo "  FONTSIZE:   $(FONTSIZE)"
	@echo "  DOCCLASS:   $(DOCCLASS)"
	@echo "  HEADER:     $(HEADER)"
	@echo "  TITLEPAGE:  $(TITLEPAGE)"
