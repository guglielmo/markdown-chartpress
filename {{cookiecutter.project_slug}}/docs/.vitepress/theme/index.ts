import { h, onMounted, watch, nextTick } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { useRoute } from 'vitepress'
import './style.css'

// Import custom components
import EChart from '../components/EChart.vue'
import EChartFromCode from '../components/EChartFromCode.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app, router, siteData }) {
    // Register global components
    app.component('EChart', EChart)
    app.component('EChartFromCode', EChartFromCode)
  },
  setup() {
    const route = useRoute()

    // Extract chapter number from filename (e.g., "01-intro.md" -> "1")
    const getChapterFromPath = (path: string): string | null => {
      const match = path.match(/\/(\d+)-[^/]+/)
      if (match) {
        return String(parseInt(match[1], 10))
      }
      return null
    }

    // Add heading numbers to content and TOC
    const addHeadingNumbers = () => {
      nextTick(() => {
        const chapterNum = getChapterFromPath(route.path)
        if (!chapterNum) {
          document.querySelectorAll('.heading-number').forEach(el => el.remove())
          return
        }

        document.querySelectorAll('.heading-number').forEach(el => el.remove())

        let h2Counter = 0
        let h3Counter = 0

        // Process H2 and H3 headings in main content
        const docElement = document.querySelector('.vp-doc')
        if (docElement) {
          docElement.querySelectorAll('h2, h3').forEach(heading => {
            const level = heading.tagName.toLowerCase()

            if (level === 'h2') {
              h2Counter++
              h3Counter = 0
              const span = document.createElement('span')
              span.className = 'heading-number'
              span.textContent = `${chapterNum}.${h2Counter} `
              heading.insertBefore(span, heading.firstChild)
            } else if (level === 'h3') {
              h3Counter++
              const span = document.createElement('span')
              span.className = 'heading-number'
              span.textContent = `${chapterNum}.${h2Counter}.${h3Counter} `
              heading.insertBefore(span, heading.firstChild)
            }
          })
        }

        // Also add numbers to TOC (right sidebar)
        const tocContainer = document.querySelector('.VPDocAsideOutline')
        if (tocContainer) {
          h2Counter = 0
          h3Counter = 0

          const rootList = tocContainer.querySelector('ul')
          if (rootList) {
            rootList.querySelectorAll(':scope > li').forEach(h2Item => {
              h2Counter++
              h3Counter = 0

              const h2Link = h2Item.querySelector('.outline-link')
              if (h2Link && !h2Link.querySelector('.heading-number')) {
                const span = document.createElement('span')
                span.className = 'heading-number'
                span.textContent = `${chapterNum}.${h2Counter} `
                h2Link.insertBefore(span, h2Link.firstChild)
              }

              const h3List = h2Item.querySelector('ul')
              if (h3List) {
                h3List.querySelectorAll(':scope > li').forEach(h3Item => {
                  h3Counter++

                  const h3Link = h3Item.querySelector('.outline-link')
                  if (h3Link && !h3Link.querySelector('.heading-number')) {
                    const span = document.createElement('span')
                    span.className = 'heading-number'
                    span.textContent = `${chapterNum}.${h2Counter}.${h3Counter} `
                    h3Link.insertBefore(span, h3Link.firstChild)
                  }
                })
              }
            })
          }
        }
      })
    }

    onMounted(() => {
      addHeadingNumbers()

      // Watch for DOM changes
      const observer = new MutationObserver(() => {
        const docElement = document.querySelector('.vp-doc')
        if (docElement) {
          const h2 = docElement.querySelector('h2')
          if (h2 && !h2.querySelector('.heading-number')) {
            addHeadingNumbers()
          }
        }
      })

      const content = document.querySelector('.VPContent')
      if (content) {
        observer.observe(content, {
          childList: true,
          subtree: true
        })
      }
    })

    watch(() => route.path, () => {
      addHeadingNumbers()
    })
  }
} satisfies Theme
