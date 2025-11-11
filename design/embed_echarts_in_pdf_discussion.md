ME:
I am using a makefile to streamline the pdf production.

I want to add the image generation to the makefile and only regenerate the images when the echarts definition changes, but I am guessing this is a difficult one because the echarts definition is just a part of the whole document and make works with file timestamps.

---

You're right that this is tricky with Make's file-based dependency system. Here are a few practical approaches:

## Option 1: Extract Chart Definitions to Separate Files

The cleanest Make-friendly approach:

```markdown
<!-- In your markdown -->
:::echarts
@include charts/sales-chart.js
:::
```

Then your Makefile:

```makefile
# Find all chart definition files
CHART_SOURCES := $(wildcard charts/*.js)
CHART_IMAGES := $(patsubst charts/%.js,images/%.png,$(CHART_SOURCES))

# Rule to generate images from chart definitions
images/%.png: charts/%.js render-chart.js
	node render-chart.js $< $@

# Your build targets depend on images
site: $(CHART_IMAGES)
	vitepress build

pdf: $(CHART_IMAGES)
	pandoc ...

.PHONY: site pdf
```

This way Make tracks each chart file individually and only regenerates changed ones.

## Option 2: Content-Based Dependencies (Hash Checking)

Use a script that extracts charts and checks if they've changed:

```makefile
MARKDOWN_FILES := $(wildcard docs/**/*.md)
CHART_MANIFEST := .chart-manifest

$(CHART_MANIFEST): $(MARKDOWN_FILES)
	node extract-and-check-charts.js $(MARKDOWN_FILES)

images/.charts-updated: $(CHART_MANIFEST)
	node render-all-charts.js $(CHART_MANIFEST)
	touch images/.charts-updated

pdf: images/.charts-updated
	pandoc ...
```

```javascript
// extract-and-check-charts.js
// Extracts charts, computes hashes, compares with previous manifest
// Only lists charts that need regeneration in manifest file
```

## Option 3: Pragmatic Per-Document Approach

Track at the document level (less granular but simpler):

```makefile
MD_FILES := $(wildcard docs/*.md)
MD_TIMESTAMPS := $(patsubst docs/%.md,.timestamps/%.md.ts,$(MD_FILES))

# Sentinel file per markdown document
.timestamps/%.md.ts: docs/%.md
	@mkdir -p .timestamps images
	node extract-and-render-charts.js $< images/
	touch $@

pdf: $(MD_TIMESTAMPS)
	pandoc ...
```

This regenerates all charts in a document when that document changes - not perfect, but often good enough.

## My Recommendation

**Option 1** if you're willing to reorganize (best Make integration, clearest dependencies).

**Option 3** if you want simplicity and your documents don't have too many charts (pragmatic, easy to maintain).

**Option 2** if you need fine-grained control and have many charts (most complex, but most efficient).

For most cases, I'd start with Option 3 - it's a good balance between Make's strengths and the reality that charts are embedded in larger documents.

Would you like me to flesh out any of these approaches with more complete code?

---
ME: Let's proceed with option 

---

Great choice! Let's build out Option 3. Here's a complete implementation:

## 1. Create the Chart Extraction and Rendering Script

```javascript
// extract-and-render-charts.js
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

async function renderChart(chartConfig, outputPath, width = 800, height = 600) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.setViewport({ width, height });
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
    </head>
    <body style="margin: 0; padding: 0;">
      <div id="chart" style="width: ${width}px; height: ${height}px;"></div>
      <script>
        const chart = echarts.init(document.getElementById('chart'));
        try {
          chart.setOption(${chartConfig});
        } catch (e) {
          console.error('Chart error:', e);
        }
      </script>
    </body>
    </html>
  `;
  
  await page.setContent(html);
  await page.waitForSelector('#chart');
  await page.waitForTimeout(1500); // Wait for chart to fully render
  
  const element = await page.$('#chart');
  await element.screenshot({ path: outputPath, type: 'png' });
  
  await browser.close();
}

async function extractAndRenderCharts(markdownFile, outputDir) {
  const content = await fs.readFile(markdownFile, 'utf-8');
  
  // Match echarts blocks with optional ID and dimensions
  // :::echarts [id] [width] [height]
  const chartRegex = /:::echarts\s+(\S+)(?:\s+(\d+))?(?:\s+(\d+))?\s*\n([\s\S]*?)\n:::/g;
  
  let match;
  const charts = [];
  
  while ((match = chartRegex.exec(content)) !== null) {
    const chartId = match[1];
    const width = parseInt(match[2] || '800');
    const height = parseInt(match[3] || '600');
    const chartConfig = match[4].trim();
    
    charts.push({ chartId, width, height, chartConfig });
  }
  
  if (charts.length === 0) {
    console.log(`No charts found in ${markdownFile}`);
    return;
  }
  
  console.log(`Found ${charts.length} chart(s) in ${markdownFile}`);
  
  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });
  
  // Render each chart
  for (const chart of charts) {
    const outputPath = path.join(outputDir, `${chart.chartId}.png`);
    console.log(`  Rendering ${chart.chartId} (${chart.width}x${chart.height})...`);
    
    try {
      await renderChart(chart.chartConfig, outputPath, chart.width, chart.height);
      console.log(`  ✓ Generated ${outputPath}`);
    } catch (error) {
      console.error(`  ✗ Error rendering ${chart.chartId}:`, error.message);
    }
  }
}

// Main execution
const [markdownFile, outputDir] = process.argv.slice(2);

if (!markdownFile || !outputDir) {
  console.error('Usage: node extract-and-render-charts.js <markdown-file> <output-dir>');
  process.exit(1);
}

extractAndRenderCharts(markdownFile, outputDir)
  .then(() => console.log('Done!'))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
```

## 2. Create the Makefile

```makefile
# Configuration
DOCS_DIR := docs
IMAGES_DIR := images
TIMESTAMPS_DIR := .timestamps

# Find all markdown files
MD_FILES := $(wildcard $(DOCS_DIR)/*.md)
# Create corresponding timestamp files
MD_TIMESTAMPS := $(patsubst $(DOCS_DIR)/%.md,$(TIMESTAMPS_DIR)/%.md.ts,$(MD_FILES))

# Default target
.PHONY: all
all: pdf

# Ensure directories exist
$(TIMESTAMPS_DIR):
	mkdir -p $(TIMESTAMPS_DIR)

$(IMAGES_DIR):
	mkdir -p $(IMAGES_DIR)

# Rule to process each markdown file and generate charts
$(TIMESTAMPS_DIR)/%.md.ts: $(DOCS_DIR)/%.md | $(TIMESTAMPS_DIR) $(IMAGES_DIR)
	@echo "Processing charts in $<..."
	node extract-and-render-charts.js $< $(IMAGES_DIR)
	@touch $@

# Build PDF - depends on all chart images being up to date
.PHONY: pdf
pdf: $(MD_TIMESTAMPS)
	@echo "Building PDF..."
	pandoc $(DOCS_DIR)/*.md -o output.pdf

# Build VitePress site
.PHONY: site
site: $(MD_TIMESTAMPS)
	@echo "Building site..."
	vitepress build

# Clean generated files
.PHONY: clean
clean:
	rm -rf $(TIMESTAMPS_DIR) $(IMAGES_DIR)
	rm -f output.pdf

# Clean only timestamps (forces regeneration)
.PHONY: clean-timestamps
clean-timestamps:
	rm -rf $(TIMESTAMPS_DIR)

# Show what would be rebuilt
.PHONY: status
status:
	@echo "Markdown files: $(MD_FILES)"
	@echo "Timestamp files: $(MD_TIMESTAMPS)"
	@echo ""
	@echo "Files that need processing:"
	@$(MAKE) -n pdf | grep "Processing" || echo "  (none - all up to date)"
```

## 3. Install Dependencies

```bash
npm install puppeteer
```

## 4. Example Markdown Format

```markdown
# My Document

Here's a chart showing sales data:

:::echarts sales-chart
{
  title: { text: 'Monthly Sales' },
  xAxis: {
    type: 'category',
    data: ['Jan', 'Feb', 'Mar', 'Apr', 'May']
  },
  yAxis: {
    type: 'value'
  },
  series: [{
    data: [120, 200, 150, 80, 70],
    type: 'bar'
  }]
}
:::

You can also specify custom dimensions:

:::echarts revenue-chart 1000 400
{
  title: { text: 'Revenue Trends' },
  xAxis: { type: 'category', data: ['Q1', 'Q2', 'Q3', 'Q4'] },
  yAxis: { type: 'value' },
  series: [{ data: [30, 45, 60, 80], type: 'line' }]
}
:::
```

## 5. Usage

```bash
# Generate all chart images and build PDF
make pdf

# Build VitePress site (also generates charts)
make site

# Force regeneration of all charts
make clean-timestamps pdf

# Clean everything
make clean

# Check what needs to be rebuilt
make status
```

## How It Works

1. Make tracks each markdown file's timestamp
2. When a markdown file changes, Make runs the extraction script for that file only
3. The script finds all `:::echarts` blocks and renders them to PNG files
4. A timestamp file is created to mark that file as processed
5. Only changed markdown files trigger chart regeneration

This gives you incremental builds - if you edit one document, only charts in that document are regenerated!

Would you like me to add any enhancements, like SVG output support or parallel processing for multiple documents?

---
ME: Yes, both.

---

Excellent! Let's add both SVG support and parallel processing:

## 1. Enhanced Chart Extraction Script with SVG Support

```javascript
// extract-and-render-charts.js
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { Worker } from 'worker_threads';
import os from 'os';

async function renderChartPNG(chartConfig, outputPath, width = 800, height = 600) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.setViewport({ width, height });
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
    </head>
    <body style="margin: 0; padding: 0;">
      <div id="chart" style="width: ${width}px; height: ${height}px;"></div>
      <script>
        const chart = echarts.init(document.getElementById('chart'));
        try {
          chart.setOption(${chartConfig});
        } catch (e) {
          console.error('Chart error:', e);
        }
      </script>
    </body>
    </html>
  `;
  
  await page.setContent(html);
  await page.waitForSelector('#chart');
  await page.waitForTimeout(1500);
  
  const element = await page.$('#chart');
  await element.screenshot({ path: outputPath, type: 'png' });
  
  await browser.close();
}

async function renderChartSVG(chartConfig, outputPath, width = 800, height = 600) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.setViewport({ width, height });
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
    </head>
    <body style="margin: 0; padding: 0;">
      <div id="chart" style="width: ${width}px; height: ${height}px;"></div>
      <script>
        // Use SVG renderer
        const chart = echarts.init(document.getElementById('chart'), null, {
          renderer: 'svg'
        });
        try {
          chart.setOption(${chartConfig});
        } catch (e) {
          console.error('Chart error:', e);
        }
      </script>
    </body>
    </html>
  `;
  
  await page.setContent(html);
  await page.waitForSelector('#chart');
  await page.waitForTimeout(1500);
  
  // Extract SVG content
  const svgContent = await page.evaluate(() => {
    const svgElement = document.querySelector('#chart svg');
    return svgElement ? svgElement.outerHTML : null;
  });
  
  if (svgContent) {
    await fs.writeFile(outputPath, svgContent, 'utf-8');
  } else {
    throw new Error('Failed to extract SVG content');
  }
  
  await browser.close();
}

async function renderChart(chartConfig, outputPath, width, height, format) {
  if (format === 'svg') {
    return renderChartSVG(chartConfig, outputPath, width, height);
  } else {
    return renderChartPNG(chartConfig, outputPath, width, height);
  }
}

async function extractAndRenderCharts(markdownFile, outputDir, format = 'png') {
  const content = await fs.readFile(markdownFile, 'utf-8');
  
  // Match echarts blocks with optional ID, dimensions, and format
  // :::echarts [id] [width] [height] [format]
  const chartRegex = /:::echarts\s+(\S+)(?:\s+(\d+))?(?:\s+(\d+))?(?:\s+(png|svg))?\s*\n([\s\S]*?)\n:::/g;
  
  let match;
  const charts = [];
  
  while ((match = chartRegex.exec(content)) !== null) {
    const chartId = match[1];
    const width = parseInt(match[2] || '800');
    const height = parseInt(match[3] || '600');
    const chartFormat = match[4] || format;
    const chartConfig = match[5].trim();
    
    charts.push({ chartId, width, height, format: chartFormat, chartConfig });
  }
  
  if (charts.length === 0) {
    console.log(`No charts found in ${markdownFile}`);
    return;
  }
  
  console.log(`Found ${charts.length} chart(s) in ${markdownFile}`);
  
  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });
  
  // Render each chart
  for (const chart of charts) {
    const extension = chart.format === 'svg' ? 'svg' : 'png';
    const outputPath = path.join(outputDir, `${chart.chartId}.${extension}`);
    console.log(`  Rendering ${chart.chartId} (${chart.width}x${chart.height}, ${chart.format})...`);
    
    try {
      await renderChart(chart.chartConfig, outputPath, chart.width, chart.height, chart.format);
      console.log(`  ✓ Generated ${outputPath}`);
    } catch (error) {
      console.error(`  ✗ Error rendering ${chart.chartId}:`, error.message);
    }
  }
}

// Main execution
const args = process.argv.slice(2);
const markdownFile = args[0];
const outputDir = args[1];
const format = args[2] || 'png'; // default format

if (!markdownFile || !outputDir) {
  console.error('Usage: node extract-and-render-charts.js <markdown-file> <output-dir> [format]');
  console.error('  format: png (default) or svg');
  process.exit(1);
}

extractAndRenderCharts(markdownFile, outputDir, format)
  .then(() => console.log('Done!'))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
```

## 2. Parallel Processing Makefile

```makefile
# Configuration
DOCS_DIR := docs
IMAGES_DIR := images
TIMESTAMPS_DIR := .timestamps
OUTPUT_FORMAT := svg  # Change to 'png' if you prefer

# Find all markdown files
MD_FILES := $(wildcard $(DOCS_DIR)/*.md)
# Create corresponding timestamp files
MD_TIMESTAMPS := $(patsubst $(DOCS_DIR)/%.md,$(TIMESTAMPS_DIR)/%.md.ts,$(MD_FILES))

# Number of parallel jobs (default to number of CPU cores)
NJOBS := $(shell nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)

# Default target
.PHONY: all
all: pdf

# Ensure directories exist
$(TIMESTAMPS_DIR):
	mkdir -p $(TIMESTAMPS_DIR)

$(IMAGES_DIR):
	mkdir -p $(IMAGES_DIR)

# Rule to process each markdown file and generate charts
$(TIMESTAMPS_DIR)/%.md.ts: $(DOCS_DIR)/%.md | $(TIMESTAMPS_DIR) $(IMAGES_DIR)
	@echo "Processing charts in $<..."
	node extract-and-render-charts.js $< $(IMAGES_DIR) $(OUTPUT_FORMAT)
	@touch $@

# Build PDF - depends on all chart images being up to date
# Use parallel processing
.PHONY: pdf
pdf: $(MD_TIMESTAMPS)
	@echo "Building PDF..."
	pandoc $(DOCS_DIR)/*.md -o output.pdf

# Build VitePress site with parallel processing
.PHONY: site
site: $(MD_TIMESTAMPS)
	@echo "Building site..."
	vitepress build

# Parallel build - explicitly set job count
.PHONY: pdf-parallel
pdf-parallel:
	@echo "Building with $(NJOBS) parallel jobs..."
	$(MAKE) -j$(NJOBS) pdf

.PHONY: site-parallel
site-parallel:
	@echo "Building with $(NJOBS) parallel jobs..."
	$(MAKE) -j$(NJOBS) site

# Force parallel rebuild
.PHONY: rebuild-parallel
rebuild-parallel: clean-timestamps
	$(MAKE) -j$(NJOBS) pdf

# Switch output format
.PHONY: use-png
use-png:
	$(MAKE) OUTPUT_FORMAT=png pdf

.PHONY: use-svg
use-svg:
	$(MAKE) OUTPUT_FORMAT=svg pdf

# Clean generated files
.PHONY: clean
clean:
	rm -rf $(TIMESTAMPS_DIR) $(IMAGES_DIR)
	rm -f output.pdf

# Clean only timestamps (forces regeneration)
.PHONY: clean-timestamps
clean-timestamps:
	rm -rf $(TIMESTAMPS_DIR)

# Show what would be rebuilt
.PHONY: status
status:
	@echo "Markdown files: $(words $(MD_FILES)) files"
	@echo "Output format: $(OUTPUT_FORMAT)"
	@echo "Parallel jobs: $(NJOBS)"
	@echo ""
	@echo "Files that need processing:"
	@$(MAKE) -n pdf | grep "Processing" || echo "  (none - all up to date)"

# Help target
.PHONY: help
help:
	@echo "Available targets:"
	@echo "  make pdf              - Build PDF (automatic parallelization)"
	@echo "  make site             - Build VitePress site"
	@echo "  make pdf-parallel     - Build PDF with explicit parallel jobs"
	@echo "  make use-svg          - Build with SVG output"
	@echo "  make use-png          - Build with PNG output"
	@echo "  make clean            - Remove all generated files"
	@echo "  make clean-timestamps - Force chart regeneration"
	@echo "  make status           - Show build status"
	@echo ""
	@echo "Configuration:"
	@echo "  DOCS_DIR=$(DOCS_DIR)"
	@echo "  IMAGES_DIR=$(IMAGES_DIR)"
	@echo "  OUTPUT_FORMAT=$(OUTPUT_FORMAT)"
	@echo "  NJOBS=$(NJOBS)"
```

## 3. Alternative: Worker-Based Parallel Processing Script

For even faster processing with a single make invocation, here's a script that processes multiple files in parallel:

```javascript
// batch-process-charts.js
import { Worker } from 'worker_threads';
import os from 'os';
import path from 'path';

function processFileInWorker(markdownFile, outputDir, format) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./chart-worker.js', {
      workerData: { markdownFile, outputDir, format }
    });
    
    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}

async function batchProcess(markdownFiles, outputDir, format, maxWorkers) {
  const results = [];
  const queue = [...markdownFiles];
  const activeWorkers = [];
  
  while (queue.length > 0 || activeWorkers.length > 0) {
    // Start workers up to maxWorkers
    while (activeWorkers.length < maxWorkers && queue.length > 0) {
      const file = queue.shift();
      console.log(`Starting processing: ${file}`);
      
      const workerPromise = processFileInWorker(file, outputDir, format)
        .then(result => {
          console.log(`Completed: ${file}`);
          return result;
        })
        .catch(error => {
          console.error(`Error processing ${file}:`, error.message);
          return { file, error: error.message };
        });
      
      activeWorkers.push(workerPromise);
    }
    
    // Wait for at least one worker to complete
    const result = await Promise.race(activeWorkers);
    results.push(result);
    
    // Remove completed worker from active list
    const index = activeWorkers.findIndex(p => p === Promise.resolve(result));
    if (index > -1) {
      activeWorkers.splice(index, 1);
    }
  }
  
  return results;
}

// Main execution
const args = process.argv.slice(2);
const outputDir = args[0];
const format = args[1] || 'png';
const markdownFiles = args.slice(2);
const maxWorkers = Math.min(os.cpus().length, markdownFiles.length);

if (!outputDir || markdownFiles.length === 0) {
  console.error('Usage: node batch-process-charts.js <output-dir> <format> <file1.md> <file2.md> ...');
  process.exit(1);
}

console.log(`Processing ${markdownFiles.length} files with ${maxWorkers} workers`);

batchProcess(markdownFiles, outputDir, format, maxWorkers)
  .then(results => {
    console.log('\nAll processing complete!');
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error(`\n${errors.length} files had errors`);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Batch processing error:', error);
    process.exit(1);
  });
```

## 4. Worker Thread Script

```javascript
// chart-worker.js
import { parentPort, workerData } from 'worker_threads';
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

async function renderChart(chartConfig, outputPath, width, height, format) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.setViewport({ width, height });
  
  const renderer = format === 'svg' ? 'svg' : 'canvas';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
    </head>
    <body style="margin: 0; padding: 0;">
      <div id="chart" style="width: ${width}px; height: ${height}px;"></div>
      <script>
        const chart = echarts.init(document.getElementById('chart'), null, {
          renderer: '${renderer}'
        });
        try {
          chart.setOption(${chartConfig});
        } catch (e) {
          console.error('Chart error:', e);
        }
      </script>
    </body>
    </html>
  `;
  
  await page.setContent(html);
  await page.waitForSelector('#chart');
  await page.waitForTimeout(1500);
  
  if (format === 'svg') {
    const svgContent = await page.evaluate(() => {
      const svgElement = document.querySelector('#chart svg');
      return svgElement ? svgElement.outerHTML : null;
    });
    
    if (svgContent) {
      await fs.writeFile(outputPath, svgContent, 'utf-8');
    }
  } else {
    const element = await page.$('#chart');
    await element.screenshot({ path: outputPath, type: 'png' });
  }
  
  await browser.close();
}

async function processFile(markdownFile, outputDir, format) {
  const content = await fs.readFile(markdownFile, 'utf-8');
  const chartRegex = /:::echarts\s+(\S+)(?:\s+(\d+))?(?:\s+(\d+))?(?:\s+(png|svg))?\s*\n([\s\S]*?)\n:::/g;
  
  let match;
  const charts = [];
  
  while ((match = chartRegex.exec(content)) !== null) {
    charts.push({
      chartId: match[1],
      width: parseInt(match[2] || '800'),
      height: parseInt(match[3] || '600'),
      format: match[4] || format,
      chartConfig: match[5].trim()
    });
  }
  
  await fs.mkdir(outputDir, { recursive: true });
  
  for (const chart of charts) {
    const extension = chart.format === 'svg' ? 'svg' : 'png';
    const outputPath = path.join(outputDir, `${chart.chartId}.${extension}`);
    
    await renderChart(chart.chartConfig, outputPath, chart.width, chart.height, chart.format);
  }
  
  return { file: markdownFile, chartsProcessed: charts.length };
}

// Process the file
const { markdownFile, outputDir, format } = workerData;

processFile(markdownFile, outputDir, format)
  .then(result => {
    parentPort.postMessage(result);
  })
  .catch(error => {
    parentPort.postMessage({ file: markdownFile, error: error.message });
  });
```

## 5. Enhanced Makefile with Batch Processing

```makefile
# Configuration
DOCS_DIR := docs
IMAGES_DIR := images
TIMESTAMPS_DIR := .timestamps
OUTPUT_FORMAT := svg

MD_FILES := $(wildcard $(DOCS_DIR)/*.md)
MD_TIMESTAMPS := $(patsubst $(DOCS_DIR)/%.md,$(TIMESTAMPS_DIR)/%.md.ts,$(MD_FILES))

.PHONY: all
all: pdf

$(TIMESTAMPS_DIR):
	mkdir -p $(TIMESTAMPS_DIR)

$(IMAGES_DIR):
	mkdir -p $(IMAGES_DIR)

# Individual file processing (for incremental builds)
$(TIMESTAMPS_DIR)/%.md.ts: $(DOCS_DIR)/%.md | $(TIMESTAMPS_DIR) $(IMAGES_DIR)
	@echo "Processing charts in $<..."
	node extract-and-render-charts.js $< $(IMAGES_DIR) $(OUTPUT_FORMAT)
	@touch $@

# Batch processing (for full rebuilds)
.PHONY: batch-process
batch-process: | $(TIMESTAMPS_DIR) $(IMAGES_DIR)
	@echo "Batch processing all markdown files..."
	node batch-process-charts.js $(IMAGES_DIR) $(OUTPUT_FORMAT) $(MD_FILES)
	@touch $(MD_TIMESTAMPS)

# Standard incremental build
.PHONY: pdf
pdf: $(MD_TIMESTAMPS)
	@echo "Building PDF..."
	pandoc $(DOCS_DIR)/*.md -o output.pdf

# Fast full rebuild using batch processing
.PHONY: pdf-fast
pdf-fast: clean-timestamps batch-process
	@echo "Building PDF..."
	pandoc $(DOCS_DIR)/*.md -o output.pdf

.PHONY: site
site: $(MD_TIMESTAMPS)
	@echo "Building site..."
	vitepress build

.PHONY: site-fast
site-fast: clean-timestamps batch-process
	@echo "Building site..."
	vitepress build

.PHONY: clean
clean:
	rm -rf $(TIMESTAMPS_DIR) $(IMAGES_DIR)
	rm -f output.pdf

.PHONY: clean-timestamps
clean-timestamps:
	rm -rf $(TIMESTAMPS_DIR)

.PHONY: help
help:
	@echo "Targets:"
	@echo "  make pdf       - Incremental build (only changed files)"
	@echo "  make pdf-fast  - Full rebuild with parallel processing"
	@echo "  make site      - Build VitePress site (incremental)"
	@echo "  make site-fast - Build site with parallel processing"
	@echo ""
	@echo "Format: OUTPUT_FORMAT=$(OUTPUT_FORMAT) (png|svg)"
```

## 6. Example Markdown with Format Options

```markdown
# Sales Report

PNG chart (default):
:::echarts sales-chart
{ title: { text: 'Sales' }, series: [{ data: [1,2,3], type: 'line' }] }
:::

SVG chart (better for PDFs):
:::echarts revenue-chart 800 600 svg
{ title: { text: 'Revenue' }, series: [{ data: [10,20,30], type: 'bar' }] }
:::

Custom size PNG:
:::echarts custom-chart 1200 400 png
{ title: { text: 'Wide Chart' }, series: [{ data: [5,10,15], type: 'line' }] }
:::
```

## Usage

```bash
# Incremental build (only processes changed files)
make pdf

# Fast full rebuild (parallel processing)
make pdf-fast

# Build with SVG (better for PDFs)
make OUTPUT_FORMAT=svg pdf

# Build with PNG (better for web)
make OUTPUT_FORMAT=png site
```

The key improvements:
1. **SVG support**: Better quality for PDFs, scalable graphics
2. **Parallel processing**: Process multiple markdown files simultaneously using worker threads
3. **Flexible**: Can use incremental builds OR fast batch processing
4. **Per-chart format**: Each chart can specify its own format

Which approach would you like to use - the Make-based parallelization or the worker-based batch processing?
