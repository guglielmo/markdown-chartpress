# Project Status

## Current release

**v1.1.0** — 2026-05-12

First public release of `markdown-chartpress`.

## Milestone summary

This release establishes the project as a dual-purpose tool:

1. **npm CLI package** (`npx markdown-chartpress` / `mkpress build`) — zero-install conversion of any Markdown directory into a VitePress static site with ECharts and Mermaid support.
2. **Cookiecutter template** — full project scaffold for professional documentation with VitePress + PDF dual output, CI/CD pipelines, and branding.

## Component status

| Component | Status |
|---|---|
| `mkpress` CLI (`bin/mkpress.js`) | Stable |
| VitePress shared config + theme (`.vitepress/`) | Stable |
| ECharts plugin + Vue component | Stable |
| Mermaid diagram support | Stable |
| Cookiecutter template (`{{cookiecutter.project_slug}}/`) | Stable |
| Post-generation hook (`hooks/post_gen_project.py`) | Stable |
| PDF pipeline (Pandoc + XeLaTeX + Puppeteer) | Stable |
| GitHub Actions CI/CD template | Stable |
| GitLab CI/CD template | Stable |
| Integration tests | Stable |

## Next

- Publish v1.1.0 to npm (`npm publish`)
- Add `mkpress serve` command for local preview without building
- Investigate GitHub Codespaces / devcontainer configuration for template users
