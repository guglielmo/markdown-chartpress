---
title: Example Business Report
description: A simple documentation example with charts
---

# Example Business Report

This is a simple example report demonstrating the markdown-chartpress template.

## Overview

This report demonstrates:
- **Automatic chapter numbering** from filenames (01-, 02-)
- **Interactive charts** rendered from ```echarts blocks
- **Professional PDF** generation with static chart images
- **VitePress navigation** with sidebar and table of contents

## Contents

- [1. Introduction](/example-report/01-introduction) - Market analysis with charts
- [2. Conclusions](/example-report/02-conclusions) - Final thoughts

## Building This Report

```bash
# View in browser (interactive charts)
make dev

# Generate PDF
make pdf-full

# Generate specific chapter
make pdf-chapter-01
```

## Next Steps

Use this as a template for your own documentation. Add more chapters, charts, and customize the branding to match your needs.
