<template>
  <div class="chart-from-code-wrapper">
    <EChart
      :option="parsedOption"
      :height="height"
      :width="width"
      :theme="theme"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import EChart from './EChart.vue'
import type { EChartsOption } from 'echarts'

const props = withDefaults(defineProps<{
  code: string
  height?: string
  width?: string
  theme?: 'light' | 'dark'
}>(), {
  height: '400px',
  width: '100%',
  theme: 'light'
})

const parsedOption = computed<EChartsOption>(() => {
  try {
    // The code prop contains the chart configuration as a string
    // It can be either JSON or JavaScript object notation
    // We need to evaluate it safely
    const evalCode = `(${props.code})`
    return eval(evalCode)
  } catch (error) {
    console.error('Error parsing chart code:', error)
    return {
      title: {
        text: 'Chart Error',
        subtext: 'Failed to parse chart configuration'
      }
    }
  }
})
</script>

<style scoped>
.chart-from-code-wrapper {
  margin: 1rem 0;
}
</style>
