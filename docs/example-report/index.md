---
title: Example Business Report
description: Comprehensive business report with interactive charts and professional PDF generation
---

# Example Business Report

This is a comprehensive example report demonstrating the full capabilities of the markdown-chartpress template.

## Overview

This report showcases a complete business analysis including:
- **6 main chapters** with automatic numbering
- **3 appendices** (methodology, data sources, glossary)
- **9+ interactive charts** across multiple chart types
- **Professional structure** suitable for business reports and strategic documents
- **Dual output** - Interactive web site and print-ready PDF

## Report Structure

### Main Chapters

- [**1. Executive Summary**](/example-report/01-executive-summary) - Key findings and strategic recommendations with revenue overview chart

- [**2. Market Analysis**](/example-report/02-market-analysis) - Market trends, regional distribution, and competitive landscape
  - Multi-series line chart (market growth)
  - Donut chart (regional distribution)
  - Stacked bar chart (market segmentation)

- [**3. Financial Projections**](/example-report/03-financial-projections) - Revenue forecasts, cost structure, and profitability analysis
  - Bar + line combination (revenue vs. costs)
  - Stacked bar chart (cost breakdown)
  - Line chart with markings (cash flow)
  - Multi-scenario analysis

- [**4. Operational Metrics**](/example-report/04-operational-metrics) - KPIs, team performance, and operational efficiency
  - Gauge charts (KPI dashboards)
  - Multi-axis charts (customer acquisition metrics)
  - Line charts (system performance)

- [**5. Risk Assessment**](/example-report/05-risk-assessment) - Risk identification, impact analysis, and mitigation strategies
  - Scatter plot (risk matrix)
  - Line chart (risk trends)
  - Pie chart (risk categories)
  - Bar chart (mitigation investment)

- [**6. Conclusions and Next Steps**](/example-report/06-conclusions) - Summary, recommendations, and action plan

### Appendices

- [**Appendix A1: Methodology**](/example-report/A1-methodology) - Technical methodology and chart rendering pipeline

- [**Appendix A2: Data Sources**](/example-report/A2-data-sources) - Primary and secondary data sources used in this report

- [**Appendix A3: Glossary**](/example-report/A3-glossary) - Definitions of key terms, acronyms, and abbreviations

## Chart Types Demonstrated

This example report includes:

| Chart Type | Count | Use Cases |
|------------|-------|-----------|
| **Bar Charts** | 4 | Revenue, costs, investments, comparisons |
| **Line Charts** | 3 | Trends, growth projections, time series |
| **Stacked Bars** | 2 | Composition breakdown, segmentation |
| **Donut/Pie** | 2 | Proportions, distribution |
| **Gauge Charts** | 2 | KPIs, performance metrics |
| **Scatter Plot** | 1 | Risk matrix, correlation analysis |
| **Multi-series** | 5 | Comparative analysis across categories |

**Total:** 9+ distinct charts showcasing ECharts capabilities

## Key Features Demonstrated

### Document Features
- ✅ Automatic chapter numbering from filenames (01- to 06-)
- ✅ Appendix numbering (A1-, A2-, A3-)
- ✅ Table of contents (auto-generated)
- ✅ Cross-references and internal links
- ✅ Data tables and formatted lists
- ✅ Task lists with checkboxes
- ✅ Code blocks with syntax highlighting

### Chart Features
- ✅ Explicit chart IDs with `<!-- chart: id -->` comments
- ✅ Auto-generated IDs from content hash
- ✅ Interactive legends (click to show/hide)
- ✅ Rich tooltips with custom formatting
- ✅ Multi-axis support for different scales
- ✅ Custom color palettes (brand colors)
- ✅ Visual mapping (color gradients)
- ✅ Mark points and lines for annotations

### Output Formats
- ✅ **VitePress Site** - Interactive charts, responsive design
- ✅ **PDF Document** - Professional layout with static chart images
- ✅ **Chapter PDFs** - Generate individual chapters
- ✅ **Customizable Branding** - Logo, colors, company name

## Building This Report

### Development Mode

```bash
# Start development server with live reload
make dev

# Open browser to http://localhost:5173
# Changes to markdown files auto-reload
```

### Production Builds

```bash
# Full build (VitePress site + PDF + charts)
make build

# Site only (for web deployment)
make site

# PDF only
make pdf-full

# Extract and render charts
make charts
```

### Chapter-Specific Builds

```bash
# Generate individual chapter PDFs
make pdf-chapter-01  # Executive Summary
make pdf-chapter-02  # Market Analysis
make pdf-chapter-03  # Financial Projections
# ... etc
```

## Using This as a Template

### 1. Customize Branding

Edit `Makefile` variables:

```makefile
PROJECT_TITLE := Your Report Title
COMPANY_NAME := Your Company Name
PROJECT_AUTHOR := Your Name
PRIMARY_COLOR_RGB := 0, 51, 102  # Your brand color
PRIMARY_COLOR_HEX := 003366
```

### 2. Replace Assets

```bash
# Add your logo files
cp your-logo.png assets/logo.png
cp your-logo.svg assets/logo.svg
```

### 3. Modify Content

- **Keep chapters you want** - Delete or modify 01- through 06- files
- **Add new chapters** - Create files like `07-additional-topic.md`
- **Customize appendices** - Modify or remove A1-, A2-, A3- files
- **Update charts** - Replace ECharts configurations with your data

### 4. Chart Configuration

Create interactive charts using standard ECharts JSON:

```markdown
<!-- chart: your-chart-id -->
\`\`\`echarts
{
  "title": { "text": "Your Chart Title" },
  "xAxis": { "type": "category", "data": ["A", "B", "C"] },
  "yAxis": { "type": "value" },
  "series": [{
    "data": [10, 20, 30],
    "type": "bar"
  }]
}
\`\`\`
```

See [ECharts Examples](https://echarts.apache.org/examples/) for inspiration.

## Why This Template?

### Benefits

**For Business Reports:**
- Professional appearance suitable for executives and investors
- Consistent branding across web and print outputs
- Data visualization integrated with narrative
- Version control friendly (text-based format)

**For Technical Documentation:**
- Interactive charts in web version
- Static charts in PDF (no broken links)
- Automated build process
- Reproducible outputs

**For Teams:**
- Collaboration via Git
- Review via pull requests
- Continuous deployment ready
- Open source tools (no vendor lock-in)

### Comparison with Alternatives

| Feature | markdown-chartpress | PowerPoint | Google Docs | LaTeX only |
|---------|-------------------|------------|-------------|------------|
| **Interactive Charts** | ✅ | ❌ | ❌ | ❌ |
| **Professional PDF** | ✅ | ⚠️ | ⚠️ | ✅ |
| **Version Control** | ✅ | ❌ | ⚠️ | ✅ |
| **Web Output** | ✅ | ❌ | ✅ | ❌ |
| **Easy Editing** | ✅ | ✅ | ✅ | ⚠️ |
| **Chart Types** | 20+ | 10+ | 10+ | Limited |

## Technical Details

**Built with:**
- VitePress 1.0+ (static site generator)
- Vue 3 (component framework)
- ECharts 5.4+ (charting library)
- Puppeteer (chart rendering for PDF)
- Pandoc + XeLaTeX (PDF generation)

**Requirements:**
- Node.js 18+
- Docker (optional, for chart rendering)
- Make (build automation)

See [Appendix A1: Methodology](/example-report/A1-methodology) for detailed technical documentation.

## Next Steps

1. **Explore the Report** - Click through chapters to see different chart types
2. **Try Building** - Run `make dev` to see interactive version
3. **Customize** - Edit `Makefile` and content files
4. **Learn ECharts** - Visit [echarts.apache.org/examples](https://echarts.apache.org/examples/)
5. **Generate PDF** - Run `make pdf-full` to create print version

## Support and Resources

- **Documentation**: [markdown-chartpress on GitHub](https://github.com/guglielmo/markdown-chartpress)
- **ECharts Docs**: [echarts.apache.org](https://echarts.apache.org/)
- **VitePress Guide**: [vitepress.dev](https://vitepress.dev/)
- **Issues**: [GitHub Issues](https://github.com/guglielmo/markdown-chartpress/issues)

---

**Ready to build your own professional reports with interactive visualizations?**

Start by cloning this template and customizing it for your needs!
