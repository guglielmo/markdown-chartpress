---
title: Conclusions and Next Steps
description: Summary and recommendations
---

# Conclusions and Next Steps

## Summary

This example report demonstrated the core features of markdown-chartpress:

1. **Chapter Organization**: Files named `01-*.md`, `02-*.md` auto-number in sidebar and content
2. **Interactive Charts**: ECharts render live in browser, static in PDF
3. **Professional Output**: VitePress site + LaTeX PDF with customizable branding

## Recommendations

For your own documentation:

1. **Customize branding** - Edit `Makefile` variables:
   ```makefile
   PROJECT_TITLE := Your Project
   COMPANY_NAME := Your Company
   PRIMARY_COLOR_RGB := 0, 51, 102
   ```

2. **Replace logo** - Add your logo to `assets/logo.png` and `assets/logo.svg`

3. **Add content** - Create markdown files in `docs/your-project/` following naming convention

4. **Build outputs**:
   ```bash
   make dev      # Development with live reload
   make build    # Production build (site + PDF)
   ```

## Example Image

You can also embed regular images:

![markdown-chartpress](../../assets/logo.svg){ width=200px }

## Next Steps

Customize this template for your own documentation by following the [customization guide](/example-report/01-introduction#chart-features) and exploring different [ECharts examples](https://echarts.apache.org/examples/).
