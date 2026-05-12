# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-05-12

### Added

- `mkpress` CLI tool runnable via `npx markdown-chartpress` (`bin/mkpress.js`)
- `mkpress build` command: reads `MCP_SRC_DIR` / `MCP_OUT_DIR` env vars, calls VitePress programmatic `build()` API
- Shared VitePress config, components, plugins, and theme at `.vitepress/` (root of repo)
- Auto-generation of `index.md` home page when missing; fallback to `md/` sub-directory if source already structured
- Root `package.json` making the repository an npm-distributable package (`markdown-chartpress`)
- Mermaid diagram support for both VitePress output and PDF output
- Automatic code block line wrapping in PDF output
- Full cookiecutter template system with post-generation hook (`hooks/post_gen_project.py`)
- GitHub Actions workflow template (`deploy.yml.jinja`) with build-site, build-pdf, and deploy jobs
- GitLab CI/CD workflow template (`.gitlab-ci.yml.jinja`) with equivalent pipeline
- PDF download button Vue component integrated into VitePress theme
- Docker-based Puppeteer chart renderer producing SVG or PNG output
- ECharts markdown-it plugin (`echarts-plugin.ts`) and `EChart.vue` Vue component
- VitePress theme with automatic chapter heading numbering from numeric filename prefixes
- Minimal (`example-minimal`) and full (`example`) starter content for generated projects
- Integration tests for `mkpress build` idempotency (`test/cli.test.js`)
- MIT license

### Fixed

- Resolve `node_modules` via VitePress path to handle npm hoisting in `npx` execution
- Use `lstatSync` instead of `existsSync` to detect broken symlinks before `node_modules` link creation
- Handle missing `srcDir` in `generateSidebarItems` to avoid runtime errors
- Correct LaTeX template `sed` patterns and Jinja2 raw block wrapping
- Fix PDF path resolution for dev and production builds
- Puppeteer v22 compatibility: replace deprecated `waitForTimeout` with `setTimeout`
- Cookiecutter defaults and Jinja2 double-brace escaping fixes

### Changed

- Project restructured as dual-purpose: npm CLI package (`mkpress`) and cookiecutter template — both served from the same repository
- README restructured around two explicit use cases (browse existing Markdown vs. start a full project)

[Unreleased]: https://github.com/guglielmo/markdown-chartpress/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/guglielmo/markdown-chartpress/releases/tag/v1.1.0
