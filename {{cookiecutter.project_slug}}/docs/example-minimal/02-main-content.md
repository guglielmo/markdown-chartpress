---
title: Main Content
---

# Main Content

<!-- This is Chapter 2 -->

## Overview

Add your main content here.

## Embedding Charts

You can embed interactive charts using ECharts:

<!-- chart: example-chart -->
```echarts
{
  "title": {
    "text": "Sample Chart"
  },
  "tooltip": {},
  "xAxis": {
    "type": "category",
    "data": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  },
  "yAxis": {
    "type": "value"
  },
  "series": [{
    "name": "Sales",
    "type": "bar",
    "data": [120, 200, 150, 80, 70, 110, 130]
  }]
}
```

The chart above is interactive in the browser and will be rendered as a static image in the PDF.

## Code Examples

```python
def hello_world():
    print("Hello, World!")
```

## Tables

| Feature | Description |
|---------|-------------|
| Charts | Interactive ECharts visualizations |
| PDF | Professional PDF export |
| Numbering | Automatic chapter/section numbering |
