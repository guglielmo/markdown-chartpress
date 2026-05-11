{% raw %}<template>
  <div class="chart-wrapper">
    <h3 v-if="title" class="chart-title">{{ title }}</h3>
    <p v-if="description" class="chart-description">{{ description }}</p>
    <div
      ref="chartRef"
      :style="{ height, width, minHeight: '300px' }"
      class="echart-container"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

const props = withDefaults(defineProps<{
  option: EChartsOption
  height?: string
  width?: string
  theme?: 'light' | 'dark'
  title?: string
  description?: string
}>(), {
  height: '400px',
  width: '100%',
  theme: 'light'
})

const chartRef = ref<HTMLDivElement>()
let chartInstance: echarts.ECharts | null = null

onMounted(() => {
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value, props.theme, {
      renderer: 'canvas'
    })

    const optionWithContainment = {
      ...props.option,
      tooltip: {
        ...((props.option as any).tooltip || {}),
        confine: true,
        appendToBody: false
      }
    }

    chartInstance.setOption(optionWithContainment)
    window.addEventListener('resize', handleResize)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})

watch(() => props.option, (newOption) => {
  if (chartInstance) {
    const optionWithContainment = {
      ...newOption,
      tooltip: {
        ...((newOption as any).tooltip || {}),
        confine: true,
        appendToBody: false
      }
    }
    chartInstance.setOption(optionWithContainment, true)
  }
}, { deep: true })

function handleResize() {
  chartInstance?.resize()
}
</script>

<style scoped>
.echart-container {
  border-radius: 8px;
}
</style>
{% endraw %}