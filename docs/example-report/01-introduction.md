---
title: Introduction and Market Analysis
description: Market trends and background context
---

# Introduction and Market Analysis

## Background

This chapter demonstrates how to embed interactive charts in your documentation using ECharts code blocks.

## Market Trends

The following chart shows market growth over a 5-year period:

<!-- chart: market-growth-trends -->
```echarts
{
  "title": {
    "text": "Market Growth 2024-2028",
    "left": "center"
  },
  "tooltip": {
    "trigger": "axis"
  },
  "xAxis": {
    "type": "category",
    "data": ["2024", "2025", "2026", "2027", "2028"],
    "name": "Year"
  },
  "yAxis": {
    "type": "value",
    "name": "Revenue (M€)"
  },
  "series": [{
    "data": [100, 150, 225, 320, 450],
    "type": "line",
    "smooth": true,
    "lineStyle": {
      "width": 3
    },
    "areaStyle": {
      "opacity": 0.3
    }
  }]
}
```

**Key observations:**
- Steady growth trajectory
- 45% CAGR over 5-year period
- Acceleration in years 2027-2028

## Regional Distribution

Market distribution by region:

```echarts
{
  "title": {
    "text": "Revenue by Region (2028)",
    "left": "center"
  },
  "tooltip": {
    "trigger": "item",
    "formatter": "{b}: €{c}M ({d}%)"
  },
  "series": [{
    "type": "pie",
    "radius": "70%",
    "data": [
      { "value": 180, "name": "Europe" },
      { "value": 135, "name": "North America" },
      { "value": 90, "name": "Asia Pacific" },
      { "value": 45, "name": "Other" }
    ],
    "emphasis": {
      "itemStyle": {
        "shadowBlur": 10,
        "shadowOffsetX": 0,
        "shadowColor": "rgba(0, 0, 0, 0.5)"
      }
    }
  }]
}
```

## Chart Features

Note how the charts above demonstrate:
- **Explicit IDs**: The first chart has `<!-- chart: market-growth-trends -->` comment
- **Auto IDs**: The second chart has no comment, will get auto-generated hash ID
- **Interactivity**: Hover over charts in the web view to see tooltips
- **PDF Export**: These same charts render as static SVG images in PDF output

## Technical Details

Charts are defined using standard ECharts JSON configuration. See [ECharts documentation](https://echarts.apache.org/) for full API reference.
