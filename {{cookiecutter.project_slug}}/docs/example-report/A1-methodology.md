---
title: Appendix A1 - Methodology
description: Technical methodology and chart rendering process
---

# Appendix A1: Methodology

## Overview

This appendix details the technical methodology used throughout this report, including data collection, analysis frameworks, and the chart rendering pipeline.

## Chart Rendering Pipeline

### Architecture Overview

markdown-chartpress uses a dual-output pipeline to generate both interactive web content and static PDF documents from the same markdown source:

```
┌─────────────────┐
│ Markdown Source │
│ (```echarts)    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│VitePress│ │ Extract  │
│  Build  │ │ Charts   │
└────┬────┘ └────┬─────┘
     │           │
     ▼           ▼
 ┌────────┐  ┌─────────┐
 │  Web   │  │ Manifest│
 │  Site  │  │  JSON   │
 └────────┘  └────┬────┘
                  │
                  ▼
             ┌─────────┐
             │ Puppeteer│
             │ Renderer │
             └────┬─────┘
                  │
                  ▼
             ┌─────────┐
             │   SVG   │
             │  Images │
             └────┬─────┘
                  │
                  ▼
             ┌─────────┐
             │ Pandoc  │
             │  + TeX  │
             └────┬─────┘
                  │
                  ▼
             ┌─────────┐
             │   PDF   │
             └─────────┘
```

### Step-by-Step Process

#### 1. Chart Definition

Charts are embedded in markdown using ECharts JSON configuration:

```markdown
<!-- chart: unique-id -->
\`\`\`echarts
{
  "title": { "text": "Chart Title" },
  "xAxis": { "type": "category", "data": ["A", "B", "C"] },
  "yAxis": { "type": "value" },
  "series": [{ "data": [10, 20, 30], "type": "bar" }]
}
\`\`\`
```

**Chart ID Assignment:**
- **Explicit**: Use `<!-- chart: id -->` comment before code block
- **Auto-generated**: MD5 hash of chart configuration if no ID provided
- **Format**: `chart-<hash>` for auto-generated IDs

#### 2. VitePress Processing

For web output, the `echarts-plugin.ts` transforms code blocks:

```typescript
// Detects ```echarts blocks
if (token.info === 'echarts') {
  // Extracts chart ID from preceding HTML comment
  const chartId = extractChartId(tokens, idx)

  // Transforms to Vue component
  return `<EChartFromCode id="${chartId}" :option='${content}' />`
}
```

The `EChart.vue` component renders charts using ECharts library in the browser.

#### 3. Chart Extraction

For PDF output, `extract-charts.js` scans markdown files:

```javascript
// Parse markdown, find ```echarts blocks
const charts = []
for (const file of markdownFiles) {
  const content = readFileSync(file, 'utf-8')
  const matches = findEChartsBlocks(content)

  charts.push({
    id: chartId,
    file: file,
    config: JSON.parse(chartConfig)
  })
}

// Write manifest
writeFileSync('charts-manifest.json', JSON.stringify(charts))
```

**Output**: `.build/charts-manifest.json` with all chart definitions

#### 4. Chart Rendering

Using Puppeteer in Docker container:

```javascript
// render-chart.js
const page = await browser.newPage()
await page.setViewport({ width: 1200, height: 800 })

// Create HTML page with ECharts
const html = `
  <div id="chart" style="width: 1200px; height: 800px;"></div>
  <script src="echarts.min.js"></script>
  <script>
    const chart = echarts.init(document.getElementById('chart'))
    chart.setOption(${JSON.stringify(chartConfig)})
  </script>
`

await page.setContent(html)
await page.waitForFunction('window.chartReady')

// Export as SVG or PNG
const element = await page.$('#chart')
await element.screenshot({
  path: `images/${chartId}.svg`,
  type: 'svg'
})
```

**Why Docker?**
- Consistent rendering environment
- Includes required fonts and dependencies
- Isolated from host system
- Reproducible builds

#### 5. Markdown Preprocessing

Before Pandoc conversion, `preprocess-markdown.js` replaces chart blocks:

```javascript
// Replace ```echarts blocks with image references
content = content.replace(
  /```echarts\n([\s\S]*?)\n```/g,
  (match, config) => {
    const chartId = findChartId(config)
    return `![Chart](images/${chartId}.svg)`
  }
)
```

**Output**: `.build/processed/*.md` files with image references

#### 6. PDF Generation

Pandoc processes markdown with LaTeX backend:

```bash
pandoc \
  --from markdown+yaml_metadata_block \
  --to pdf \
  --pdf-engine=xelatex \
  --template=templates/header.tex \
  --include-before-body=templates/title-page.tex \
  --toc \
  --toc-depth=3 \
  --number-sections \
  --output=output.pdf \
  .build/processed/*.md
```

**LaTeX Processing:**
- Title page with logo and branding
- Table of contents with chapter numbers
- Header/footer customization
- SVG image embedding
- Professional typography

## Data Analysis Framework

### Market Sizing Methodology

**Top-Down Approach:**
1. Total addressable market (TAM) from industry reports
2. Serviceable addressable market (SAM) by geography
3. Serviceable obtainable market (SOM) by segment
4. Market share assumptions based on competitive analysis

**Validation:**
- Cross-reference multiple industry sources
- Bottom-up customer count × ARPU validation
- Triangulation with comparable company data

### Financial Modeling

**Assumptions:**
- Revenue: Customer count × average contract value
- Costs: Activity-based costing by department
- Growth rates: Historical performance + market trends
- Scenarios: Monte Carlo simulation (1000 iterations)

**Key Metrics:**
- CAC: Total sales & marketing spend ÷ new customers
- LTV: ARPU × (1 / churn rate) × gross margin
- Rule of 40: Growth rate + profit margin ≥ 40%

### Risk Assessment

**Probability Estimation:**
- Historical frequency analysis
- Expert judgment (Delphi method)
- Industry benchmarking
- Calibration against actual outcomes

**Impact Quantification:**
- Financial impact: Revenue/cost effect
- Timeline impact: Project delays
- Reputational impact: Customer/brand damage
- Strategic impact: Long-term positioning

**Risk Score Calculation:**
```
Risk Score = Probability (0-10) × Impact (0-10)
  - Low: 0-25
  - Medium: 26-49
  - High: 50-74
  - Critical: 75-100
```

## Chart Configuration Best Practices

### Performance Optimization

**Data Volume:**
- Max 1000 data points per series
- Use data sampling for large datasets
- Aggregate time series data appropriately

**Rendering:**
- Use `lazyUpdate: true` for large datasets
- Enable `animation: false` for print output
- Optimize SVG output size

### Accessibility

**Color Choices:**
- Use colorblind-safe palettes
- Minimum 4.5:1 contrast ratio
- Avoid color as sole differentiator

**Labels and Legends:**
- Clear, descriptive labels
- Units specified on axes
- Legends for multi-series charts

### Responsive Design

**Web Output:**
- Container width: 100%
- Automatic resizing on viewport change
- Touch-friendly interactions

**PDF Output:**
- Fixed dimensions: 1200×800px
- 2x scale for high-DPI printing
- SVG format for scalability

## Tools and Technologies

### Core Stack

| Tool | Version | Purpose |
|------|---------|---------|
| **VitePress** | 1.0+ | Static site generator |
| **Vue 3** | 3.3+ | Component framework |
| **ECharts** | 5.4+ | Charting library |
| **Puppeteer** | 21.0+ | Headless browser |
| **Pandoc** | 3.0+ | Document converter |
| **XeLaTeX** | TeX Live 2023 | PDF typesetting |

### Development Tools

- **Node.js** 18+ - JavaScript runtime
- **Docker** - Container platform
- **Make** - Build automation
- **Git** - Version control

## Quality Assurance

### Validation Checks

1. **Chart Syntax**: JSON validation on extraction
2. **Data Integrity**: Range checks on numeric values
3. **Rendering**: Visual diff testing
4. **PDF Quality**: Manual review of print output

### Testing Procedure

```bash
# Extract charts and validate JSON
make extract-charts

# Render charts (with Docker)
make render-charts

# Generate test PDF
make pdf-chapter-01

# Verify no errors in build log
grep -i error .build/build.log
```

## Limitations and Considerations

### Known Limitations

1. **Chart Complexity**: Very complex charts may timeout in Puppeteer
2. **Font Support**: Custom fonts require Docker image update
3. **Animation**: Not supported in PDF output
4. **Interactivity**: Lost in PDF conversion (hover, zoom, etc.)

### Performance Considerations

- Chart rendering: ~2-5 seconds per chart
- Full PDF build: ~30-60 seconds (6 chapters + appendices)
- Development rebuild: <5 seconds (VitePress HMR)

## Version Control

All chart configurations are version-controlled in markdown:

- **Auditability**: Full history of chart changes
- **Collaboration**: Branching and merging workflows
- **Rollback**: Easy reversion to previous versions
- **Documentation**: Git commit messages explain changes

## References

- [ECharts Documentation](https://echarts.apache.org/en/option.html)
- [VitePress Guide](https://vitepress.dev/guide/what-is-vitepress)
- [Pandoc User's Guide](https://pandoc.org/MANUAL.html)
- [Puppeteer Documentation](https://pptr.dev/)
