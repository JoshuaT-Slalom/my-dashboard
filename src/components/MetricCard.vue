<template>
  <v-card border class="metric-card" elevation="0">
    <v-card-text>
      <div class="text-caption text-uppercase text-medium-emphasis metric-card__label">{{ label }}</div>
      <div class="text-h4 font-weight-bold metric-card__value" :style="{ color: valueColor }">{{ value }}</div>
      <div class="d-flex align-center ga-1 metric-card__trend" :class="trendColorClass">
        <v-icon :icon="trendIcon" size="16" />
        <span class="text-caption">{{ trendText }}</span>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type TrendDirection = 'up' | 'down' | 'neutral'

const props = withDefaults(defineProps<{
  label: string
  value: string
  valueColor?: string
  trendDirection: TrendDirection
  trendText: string
}>(), {
  valueColor: 'inherit',
})

const trendIcon = computed(() => {
  if (props.trendDirection === 'up') return 'mdi-trending-up'
  if (props.trendDirection === 'down') return 'mdi-trending-down'
  return 'mdi-minus'
})

const trendColorClass = computed(() => ({
  'text-success': props.trendDirection === 'up',
  'text-error': props.trendDirection === 'down',
  'text-medium-emphasis': props.trendDirection === 'neutral',
}))
</script>

<style scoped>
.metric-card {
  min-height: 130px;
}

.metric-card :deep(.v-card-text) {
  padding: 24px;
}

.metric-card__label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.metric-card__value {
  margin-top: 18px;
  font-size: 32px;
  font-weight: 700;
}

.metric-card__trend {
  margin-top: 12px;
}

.metric-card__trend :deep(.text-caption) {
  color: #4A5D79;
  font-size: 12px;
}

.metric-card__trend.text-success :deep(.text-caption),
.metric-card__trend.text-success :deep(.v-icon) {
  color: #147d73 !important;
}

.metric-card__trend.text-error :deep(.text-caption),
.metric-card__trend.text-error :deep(.v-icon) {
  color: #c92e3c !important;
}
</style>