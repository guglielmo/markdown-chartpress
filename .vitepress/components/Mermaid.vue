<template>
  <div ref="mermaidContainer" class="mermaid-container">
    <div ref="mermaid" v-html="svg"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import mermaid from 'mermaid'

const props = defineProps({
  code: {
    type: String,
    required: true
  }
})

const mermaidContainer = ref(null)
const svg = ref('')

// Initialize mermaid with configuration
mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'loose',
  fontFamily: 'sans-serif'
})

const renderDiagram = async () => {
  try {
    const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`
    const { svg: renderedSvg } = await mermaid.render(id, props.code)
    svg.value = renderedSvg
  } catch (error) {
    console.error('Mermaid rendering error:', error)
    svg.value = `<pre class="mermaid-error">Failed to render diagram:\n${error.message}</pre>`
  }
}

onMounted(() => {
  renderDiagram()
})

watch(() => props.code, () => {
  renderDiagram()
})
</script>

<style scoped>
.mermaid-container {
  margin: 1.5rem 0;
  overflow-x: auto;
}

.mermaid-error {
  color: #d73a49;
  background-color: #ffeef0;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #d73a49;
}
</style>
