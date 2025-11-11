{% raw %}<template>
  <div class="chart-from-code">
    <EChart
      :option="option"
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

const option = computed<EChartsOption>(() => {
  try {
    return JSON.parse(props.code)
  } catch (e) {
    console.error('Failed to parse ECharts option:', e)
    return {
      title: {
        text: 'Invalid Chart Configuration',
        left: 'center',
        top: 'middle'
      }
    }
  }
})
</script>

<style scoped>
.chart-from-code {
  margin: 1rem 0;
}
</style>
{% endraw %}