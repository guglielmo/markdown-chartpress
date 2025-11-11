# Assets Directory

## Logo Files

- `logo.png` - Company logo (PNG format for LaTeX/PDF)
- `logo.svg` - Company logo (SVG format for VitePress)

### Customization

Replace these files with your company logo. Recommended sizes:
- PNG: 800x800px minimum
- SVG: Vector format

### Usage

- **PDF**: Logo appears in header (0.8cm height) and title page (8cm width)
- **VitePress**: Logo appears in site header and footer

Configure logo filenames in `Makefile`:
```makefile
LOGO_FILE := logo.png
LOGO_SVG := logo.svg
```
