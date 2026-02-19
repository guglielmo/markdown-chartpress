# Non-Technical User Accessibility Exploration

**Date:** 2025-11-12
**Status:** Exploration / Open Questions
**Participants:** User (Product Owner), Claude (Design Assistant)

## Context

markdown-chartpress is a documentation system that generates dual outputs:
- Interactive VitePress websites with ECharts visualizations
- Professional PDFs with static chart images (via Pandoc + XeLaTeX)

**Current state:** Works well for technical users comfortable with:
- Command line (make commands)
- Markdown syntax
- Git workflows
- Development environment setup (Node.js, Pandoc, XeLaTeX, Docker)

**Problem:** Staff currently uses Google Docs/Office which are easy but produce inferior outputs:
- Poor typography
- No interactive charts
- Long documents lack structure/navigation/search
- Not suitable for important client-facing deliverables

**Goal:** Make markdown-chartpress accessible to non-technical users while maintaining output quality.

---

## Key Insight: AI-First Architecture

During exploration, a critical pivot emerged:

**Traditional assumption:** Users write documents manually
- Would require WYSIWYG editor, chart builder, etc.
- High complexity, 6-12 month timeline

**New paradigm:** AI generates documents, users review/approve
- Simplifies to: AI → markdown files → build system → outputs
- Users interact with AI, not markdown directly
- Much simpler architecture (1-2 month timeline)

---

## Customer Segmentation Analysis

### Initial Hypothesis
Target internal staff (CTOs, managers) who need to create professional documents.

### Pivot to Developer Market
**Rationale:**
1. End users (consultants, agencies, writers) have existing tools and habits
2. Aesthetic quality difference, while striking, may not overcome switching costs
3. Developers building AI tools need a **rendering backend** - they have budget and urgency

**Target Customer (Validated):**
Developers building AI applications that generate documents as output:
- Contract generators
- Proposal writers
- Report builders
- Documentation automation tools

**Their need:** High-quality PDF + hosted site from AI-generated markdown

---

## Product Architecture Decision

### Deployment Model: Hybrid (Cloud + Self-Hosted)

**Cloud API (SaaS):**
- Primary offering for quick adoption
- Handles infrastructure complexity
- Pay-per-use pricing

**Self-Hosted Option:**
- For enterprise customers with privacy/security requirements
- Annual license model
- Customer manages their own infrastructure

### Technical Stack

**API Service:**
- **Framework:** Node.js + Express (matches existing markdown-chartpress stack)
- **Async Processing:** BullMQ (Redis-based job queue)
- **Hosting:** Render.com (managed platform, free tier for MVP)
- **Storage:** S3-compatible (Cloudflare R2 or DigitalOcean Spaces)
- **Database:** PostgreSQL (customer accounts, job tracking, billing)

**Why Node.js:**
- Existing scripts already in JavaScript (extract-charts.js, preprocess-markdown.js, render-chart.js)
- No Python dependency (confirmed - system uses Node.js, Pandoc, XeLaTeX only)
- Node orchestrates subprocess calls to native binaries (Pandoc, XeLaTeX, Puppeteer)
- Job queue handles async processing, so no performance concerns

### API Design: Asynchronous Job Queue

**Workflow:**
1. Developer POSTs render request
2. API returns job ID immediately
3. Worker processes job in background
4. Optional webhook notification on completion
5. Developer polls or receives webhook with PDF URL + site URL

**Pricing Model:**
- $0.50 per PDF generated
- $1.00 per PDF + hosted VitePress site
- Volume discounts for bulk usage
- Self-hosted: Annual license ($500-2000/year range)

---

## Critical Unresolved Question

**The Fundamental Tension:**

We identified two distinct product visions during the conversation:

### Vision A: B2B API for Developers
- Developers integrate API into their AI tools
- Input: ZIP file of markdown docs + assets, or Git repo URL
- Output: PDF URL + hosted site URL
- Customer: Developer building AI document generation tools
- Use case: Backend rendering service

### Vision B: B2C GUI for Non-Tech Users
- CTO/manager interacts with AI chat interface
- AI generates markdown based on prompts/forms
- System auto-builds and presents outputs
- Customer: Business user creating documents
- Use case: AI-powered document creation tool

### The Problem
These require **different products** with different technical approaches:

**For Vision A (API):**
- Focus on reliable async processing
- Input format: ZIP upload or Git clone
- SDK/libraries for integration
- API documentation, rate limits, metering

**For Vision B (GUI):**
- Focus on user experience and AI interaction
- Input format: Natural language prompts
- Template library
- Web interface or desktop app

### Open Questions

1. **Which customer validates faster?**
   - Vision A: Find 5-10 developers building AI doc tools
   - Vision B: Get internal staff (CTO) using it successfully

2. **Which has clearer path to revenue?**
   - Vision A: Developers have budget, understand API pricing
   - Vision B: Individual users may resist SaaS subscriptions

3. **Can we do both?**
   - Sequential: Build one, validate, then add other
   - Parallel: Two separate products sharing core engine
   - Hybrid: API-first, add GUI later as "hosted frontend"

4. **What problem are we really solving?**
   - "Developers need rendering backend" (clear, focused)
   - "Non-tech users need AI doc creation" (broader, more complex)

---

## Input Format Problem (Unresolved)

When discussing API design, we hit a critical issue:

**Question:** How do developers send folder structures (multiple markdown files + assets) to the API?

**Options Discussed:**

1. **ZIP file upload** (multipart/form-data)
   - Preserves folder structure
   - Handles binary assets (images, logos)
   - Familiar to developers

2. **Git repository URL**
   - Developer pushes to Git
   - API clones and processes
   - Requires public repo or credentials

3. **JSON array with file objects**
   - `[{path: "docs/01-intro.md", content: "..."}, ...]`
   - Large payloads
   - Base64 encoding for binary files

**No decision made** - paused conversation before choosing.

---

## Recommended Next Steps

### Before Continuing Technical Implementation

**1. Clarify Target Customer (ONE to start with)**

Choose either:
- **Path A:** Find 3-5 developers building AI doc tools
  - Interview them about their rendering needs
  - Validate: Would they pay $0.50-1 per document?
  - MVP: API-only, no GUI needed

- **Path B:** Interview internal staff + similar companies
  - Understand their document creation workflow
  - Test: Will they use AI chat to create docs?
  - MVP: Simple web interface with AI integration

**2. Solve the Workflow Question for Chosen Customer**

For **Path A (API):**
- How do customers prepare markdown? (They're building AI tools that generate it)
- What format makes integration easiest? (ZIP, Git, or JSON)
- What's the minimum viable feature set?

For **Path B (GUI):**
- How does user describe what they want? (Chat? Forms? Templates?)
- Where do they see/edit the markdown? (Hidden? Simple editor?)
- What's the AI interaction model? (Streaming? Iterative refinement?)

**3. Pick a Phased Approach**

Suggestion:
1. **Phase 0 (Now):** Validate one customer type through interviews
2. **Phase 1 (Weeks 1-4):** Build MVP for that customer only
3. **Phase 2 (Weeks 5-8):** Get 5 paying customers, iterate on feedback
4. **Phase 3 (Month 3+):** Consider expanding to other customer type

---

## Technical Dependencies (Verified)

**No Python Required** (contrary to initial assumption)

markdown-chartpress dependencies:
- Node.js (JavaScript runtime, required)
- Pandoc (markdown → LaTeX conversion, required for PDF)
- XeLaTeX (LaTeX → PDF compilation, required for PDF)
- Docker (optional, for Puppeteer chart rendering)
- Redis (for job queue in API deployment)

All chart/markdown processing scripts are JavaScript, not Python.

---

## Competitive Positioning

**Unique Value Proposition:**
Dual output (interactive site + professional PDF) with interactive charts that work in both formats.

**Competitors:**
- Notion, GitBook: Beautiful sites OR PDFs, not both
- LaTeX/Overleaf: Beautiful PDFs, no interactive charts
- Google Docs: Easy but poor quality

**Target positioning:**
"API for AI tools to generate beautiful professional documents"

---

## Timeline Considerations

**Initial goal:** 1-2 months to MVP
**Constraint:** Low investment, validate quickly

**Realistic for API (Path A):**
- Week 1-2: API server + job queue + basic rendering
- Week 3-4: Testing, docs, first customer onboarding
- Week 5-8: Iterate based on feedback, add features

**Realistic for GUI (Path B):**
- Week 1-2: AI integration + chat interface
- Week 3-4: File management + build pipeline
- Week 5-8: UX polish, template library

Both achievable in 2 months, but **NOT BOTH** in parallel.

---

## Decision Required Before Proceeding

**The conversation ended here because we need to resolve:**

Which product are we building?
- API for developers (Vision A)
- GUI for business users (Vision B)
- Something else entirely?

This determines:
- Technical architecture
- Feature prioritization
- Go-to-market strategy
- Success metrics

**Recommendation:**
Schedule follow-up session to:
1. Review this document
2. Make explicit choice of target customer
3. Design specific solution for that customer
4. Create implementation plan

---

## Appendix: Render.com Deployment Notes

User has:
- Registered Render.com account
- Created workspace
- Ready to deploy when design is finalized

Render.com advantages for MVP:
- Free tier available (500 hours/month)
- Managed Redis for BullMQ
- Managed PostgreSQL
- Docker support (for Puppeteer)
- Simple git-based deployments
- Can scale when validated

User also has:
- DigitalOcean droplet available
- Kubernetes cluster for scaling later
- Strong ops experience (can self-host if needed)

---

## Open Questions Log

1. **Customer:** Developers (API) or business users (GUI)?
2. **Input format:** ZIP upload vs Git repo vs JSON array?
3. **Workflow:** How does AI generate the markdown? (Templates? Chat? Forms?)
4. **Scope:** Build both eventually, or pick one to validate first?
5. **Self-hosted packaging:** How to distribute for enterprise customers?
6. **AI provider:** Claude API? OpenAI? Local LLMs? Customer's own AI?

---

## Related Documents

- `2025-11-11-cookiecutter-publishing-design.md` - Original cookiecutter setup
- `2025-11-11-echarts-vitepress-integration-design.md` - Chart integration details
- `embed_echarts_in_pdf_discussion.md` - Technical approach for chart rendering

---

## Next Session Agenda

1. Review this document
2. Choose ONE target customer to validate
3. Interview 3-5 potential customers
4. Return with customer insights
5. Design specific MVP for validated customer
6. Create implementation plan

**Do not proceed with implementation until customer choice is validated.**
