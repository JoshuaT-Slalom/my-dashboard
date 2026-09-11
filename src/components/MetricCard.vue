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

.metric-card__label {
  letter-spacing: 0.08em;
}

.metric-card__value {
  margin-top: 18px;
}

.metric-card__trend {
  margin-top: 12px;
}
</style>