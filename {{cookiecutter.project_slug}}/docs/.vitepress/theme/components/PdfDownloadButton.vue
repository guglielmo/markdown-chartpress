<template>
  <div v-if="config.enabled" class="pdf-download">
    <a :href="config.url" class="pdf-link" download>
      <svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M10,19L12,19V14.5L13.5,16L14.9,14.6L12,11.7L9.1,14.6L10.5,16L12,14.5V19H10Z" />
      </svg>
      <span class="label">{{ config.label }}</span>
    </a>
  </div>
</template>

<script setup lang="ts">
import { useData } from 'vitepress'

const { theme } = useData()
const config = theme.value.pdfDownload || { enabled: false, url: '', label: 'Download PDF' }
</script>

<style scoped>
.pdf-download {
  padding: 12px 16px;
  border-top: 1px solid var(--vp-c-divider);
  margin-top: auto;
}

.pdf-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: var(--vp-c-brand-soft);
  border-radius: 8px;
  text-decoration: none;
  color: var(--vp-c-brand-1);
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;
}

.pdf-link:hover {
  background: var(--vp-c-brand);
  color: var(--vp-c-white);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.icon {
  flex-shrink: 0;
}

.label {
  flex: 1;
}

@media (max-width: 768px) {
  .pdf-download {
    padding: 8px 12px;
  }

  .pdf-link {
    padding: 8px 12px;
    font-size: 13px;
  }
}
</style>
