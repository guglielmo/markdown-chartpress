#!/usr/bin/env node

/**
 * Render charts from manifest using Puppeteer
 */

import puppeteer from 'puppeteer'
import fs from 'fs/promises'
import path from 'path'
import { setTimeout } from 'node:timers/promises'

async function renderChartPNG(chartConfig, outputPath, width = 800, height = 600) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const page = await browser.newPage()
  await page.setViewport({ width, height })

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
    </head>
    <body style="margin: 0; padding: 0;">
      <div id="chart" style="width: ${width}px; height: ${height}px;"></div>
      <script>
        const chart = echarts.init(document.getElementById('chart'));
        try {
          chart.setOption(${chartConfig});
        } catch (e) {
          console.error('Chart error:', e);
        }
      </script>
    </body>
    </html>
  `

  await page.setContent(html)
  await page.waitForSelector('#chart')
  await setTimeout(1500) // Wait for chart render

  const element = await page.$('#chart')
  await element.screenshot({ path: outputPath, type: 'png' })

  await browser.close()
}

async function renderChartSVG(chartConfig, outputPath, width = 800, height = 600) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const page = await browser.newPage()
  await page.setViewport({ width, height })

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
    </head>
    <body style="margin: 0; padding: 0;">
      <div id="chart" style="width: ${width}px; height: ${height}px;"></div>
      <script>
        const chart = echarts.init(document.getElementById('chart'), null, {
          renderer: 'svg'
        });
        try {
          chart.setOption(${chartConfig});
        } catch (e) {
          console.error('Chart error:', e);
        }
      </script>
    </body>
    </html>
  `

  await page.setContent(html)
  await page.waitForSelector('#chart')
  await setTimeout(1500)

  const svgContent = await page.evaluate(() => {
    const svgElement = document.querySelector('#chart svg')
    return svgElement ? svgElement.outerHTML : null
  })

  if (svgContent) {
    await fs.writeFile(outputPath, svgContent, 'utf-8')
  } else {
    throw new Error('Failed to extract SVG content')
  }

  await browser.close()
}

async function renderChart(chartConfig, outputPath, width, height, format) {
  if (format === 'svg') {
    return renderChartSVG(chartConfig, outputPath, width, height)
  } else {
    return renderChartPNG(chartConfig, outputPath, width, height)
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2)

  if (args.length < 2) {
    console.error('Usage: node render-chart.js <manifest> <output-dir> [format]')
    console.error('  format: svg (default) or png')
    process.exit(1)
  }

  const manifestPath = args[0]
  const outputDir = args[1]
  const format = args[2] || 'svg'

  // Read manifest
  const manifestContent = await fs.readFile(manifestPath, 'utf-8')
  const manifest = JSON.parse(manifestContent)

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true })

  console.log(`Rendering charts to ${outputDir} (format: ${format})`)

  let totalCharts = 0

  // Process each file's charts
  for (const fileEntry of manifest) {
    console.log(`\nProcessing ${fileEntry.file}:`)

    for (const chart of fileEntry.charts) {
      const extension = format === 'svg' ? 'svg' : 'png'
      const outputPath = path.join(outputDir, `${chart.id}.${extension}`)

      console.log(`  Rendering ${chart.id} (${chart.width}x${chart.height})...`)

      try {
        await renderChart(
          chart.config,
          outputPath,
          chart.width,
          chart.height,
          format
        )
        console.log(`  ✓ Generated ${outputPath}`)
        totalCharts++
      } catch (error) {
        console.error(`  ✗ Error rendering ${chart.id}:`, error.message)
      }
    }
  }

  console.log(`\n✓ Rendered ${totalCharts} charts`)
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
