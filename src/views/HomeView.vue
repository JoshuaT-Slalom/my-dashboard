<template>
  <main class="page-shell">
    <v-toolbar class="topbar" density="comfortable" elevation="0">
      <div class="brand-block"><v-avatar class="brand-mark" size="42">FF</v-avatar><div><div class="eyebrow">FastForward Logistics</div><h1>Ops Dashboard</h1></div></div>
      <div class="filter-row">
        <div class="header-duration" role="group" aria-label="Dashboard date range">
          <v-chip v-for="range in dateRanges" :key="range.value" :class="{ 'duration-chip-active': filters.dateRange === range.value }" class="duration-chip" pill variant="outlined" tabindex="0" @click="filters.dateRange = range.value" @keydown.enter.prevent="filters.dateRange = range.value" @keydown.space.prevent="filters.dateRange = range.value">{{ range.label }}</v-chip>
        </div>
        <v-select v-model="filters.region" :items="regionOptions" aria-label="Region filter" class="header-select" density="compact" hide-details variant="solo-filled" />
        <v-select v-model="filters.carrier" :items="carrierOptions" aria-label="Carrier filter" class="header-select carrier-select" density="compact" hide-details variant="solo-filled" />
        <v-select v-model="filters.status" :items="statusOptions" aria-label="Shipment status filter" class="header-select" density="compact" hide-details variant="solo-filled" />
      </div>
    </v-toolbar>

    <section class="summary-grid">
      <v-card v-for="card in summaryCards" :key="card.label" class="summary-card" elevation="0"><v-card-text><div class="card-label">{{ card.label }}</div><div class="card-value" :class="card.tone">{{ card.value }}</div><div class="card-trend" :class="card.trend >= 0 ? 'positive' : 'negative'"><v-icon :icon="card.trend >= 0 ? 'mdi-trending-up' : 'mdi-trending-down'" size="15" />{{ Math.abs(card.trend).toFixed(1) }}% vs prior period</div></v-card-text></v-card>
    </section>

    <section class="primary-grid">
      <v-card class="panel table-panel" elevation="0"><v-card-title class="panel-header"><h2>Carrier Performance Scorecard</h2><v-chip class="panel-tag" size="small">{{ durationLabel }}</v-chip></v-card-title>
        <v-table density="compact"><thead><tr><th v-for="column in scoreColumns" :key="column.key"><v-btn class="sort-button" size="x-small" variant="text" @click="toggleScoreSort(column.key)">{{ column.label }}<v-icon :icon="sortIcon(scoreSort, column.key)" size="14" /></v-btn></th></tr></thead>
          <tbody><tr v-for="carrier in sortedScorecard" :key="carrier.carrierId" :class="{ 'low-score': carrier.compositeScore < 70 }"><td>{{ carrier.rank }}</td><td>{{ carrier.carrierName }}</td><td>{{ carrier.shipments.toLocaleString() }}</td><td><span class="status-pill" :class="getStatusTone(carrier.onTimeRate)">{{ formatPercent(carrier.onTimeRate) }}</span></td><td><span class="status-pill" :class="getExceptionTone(carrier.exceptionRate)">{{ formatPercent(carrier.exceptionRate) }}</span></td><td><span class="status-pill" :class="getCostTone(carrier.costVariance)">{{ formatVariance(carrier.costVariance) }}</span></td><td><span class="score-badge" :class="getScoreTone(carrier.compositeScore)">{{ carrier.compositeScore.toFixed(1) }}</span></td><td>{{ carrier.compositeScore >= 80 ? '↑' : '↓' }}</td></tr></tbody>
        </v-table>
      </v-card>
      <v-card class="panel trend-panel" elevation="0"><v-card-title class="panel-header stacked-header"><h2>Exception Trend</h2><div class="trend-chip-group" role="group" aria-label="Exception trend grouping"><v-chip :class="{ 'trend-chip-active': trendView === 'type' }" class="trend-chip" pill @click="trendView = 'type'">By Exception Type</v-chip><v-chip :class="{ 'trend-chip-active': trendView === 'carrier' }" class="trend-chip" pill @click="trendView = 'carrier'">By Carrier</v-chip></div></v-card-title>
        <div class="trend-chip-group metric-toggle" role="group" aria-label="Exception trend metric"><v-chip :class="{ 'trend-chip-active': trendMetric === 'count' }" class="trend-chip" pill @click="trendMetric = 'count'">Count</v-chip><v-chip :class="{ 'trend-chip-active': trendMetric === 'percent' }" class="trend-chip" pill @click="trendMetric = 'percent'">% of Shipments</v-chip></div>
        <div class="bar-chart"><div v-for="point in trendData" :key="point.label" class="bar-group"><div class="stacked-bars"><span class="bar late" :style="{ height: barHeight(point.late) }" /><span class="bar docs" :style="{ height: barHeight(point.docs) }" /><span class="bar invoice" :style="{ height: barHeight(point.invoice) }" /></div><label>{{ point.label }}</label></div></div>
        <div class="legend-row"><span><i class="dot late" />Late Delivery</span><span><i class="dot docs" />Missing Documentation</span><span><i class="dot invoice" />Invoice Discrepancy</span></div>
      </v-card>
    </section>

    <section class="secondary-grid">
      <v-card class="panel volume-panel" elevation="0"><v-card-title class="panel-header"><h2>Shipment Volume</h2><v-chip class="panel-tag" size="small">{{ durationLabel }}</v-chip></v-card-title><v-card-text><svg viewBox="0 0 360 170" class="volume-chart" aria-label="Shipment volume chart" role="img"><path :d="volumePaths.gap" class="volume-gap" /><path :d="volumePaths.total" class="volume-line total" /><path :d="volumePaths.onTime" class="volume-line ontime" /><g class="volume-axis"><text v-for="point in volumeSeries" :key="point.label" :x="point.x" y="156" text-anchor="middle">{{ point.label }}</text></g></svg><div class="chart-legend"><span><i class="line-swatch total" />Total Shipments</span><span><i class="line-swatch ontime" />On-Time Shipments</span><span><i class="line-swatch delayed" />Delayed / late gap</span></div></v-card-text></v-card>
      <v-card class="panel regional-panel" elevation="0"><v-card-title class="panel-header"><h2>Regional Performance</h2><v-chip class="panel-tag" size="small">Worst first</v-chip></v-card-title><v-card-text><div class="regional-grid"><v-sheet v-for="region in regionalSummary" :key="region.region" class="region-card" :class="getStatusTone(region.onTimeRate)" border><div class="region-name">{{ region.region }}</div><div class="region-stat">{{ region.shipments.toLocaleString() }} shipments</div><div class="region-rate" :class="getStatusTone(region.onTimeRate)">{{ formatPercent(region.onTimeRate) }}</div><div class="region-open">{{ region.openExceptions }} open exceptions</div></v-sheet></div></v-card-text></v-card>
    </section>

    <v-card class="panel exceptions-panel" elevation="0"><v-card-title class="panel-header compact-header"><h2>Open Exceptions</h2><div class="inline-filters"><v-select v-model="exceptionType" :items="exceptionTypeOptions" aria-label="Exception type filter" density="compact" hide-details label="Type" variant="outlined" /><v-select v-model="exceptionCarrier" :items="carrierOptions" aria-label="Exception carrier filter" density="compact" hide-details label="Carrier" variant="outlined" /></div></v-card-title>
      <v-table density="compact"><thead><tr><th v-for="column in exceptionColumns" :key="column.key"><v-btn class="sort-button" size="x-small" variant="text" @click="toggleExceptionSort(column.key)">{{ column.label }}<v-icon :icon="sortIcon(exceptionSort, column.key)" size="14" /></v-btn></th></tr></thead><tbody><tr v-for="exception in sortedExceptions" :key="exception.id"><td>{{ exception.id }}</td><td>{{ exception.type }}</td><td>{{ exception.carrier_name }}</td><td>{{ exception.route }}</td><td>{{ exception.shipment_id }}</td><td>{{ formatDate(exception.date_opened) }}</td><td><span :class="{ 'danger-days': exception.daysOpen > 5 }">{{ exception.daysOpen }}</span></td><td><v-chip :color="exception.status === 'Open' ? 'success' : 'warning'" size="x-small" variant="tonal">{{ exception.status }}</v-chip></td></tr><tr v-if="!sortedExceptions.length"><td colspan="8" class="empty-state">No open exceptions match the selected filters.</td></tr></tbody></v-table>
    </v-card>
  </main>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { carriers } from '../data/carriers'
import { exceptions } from '../data/exceptions'
import { shipments } from '../data/shipments'
import { filterShipments, formatPercent, formatVariance, getCarrierScorecard, getCostTone, getDurationLabel, getExceptionTrendData, getOpenExceptions, getRegionalSummary, getStatusTone, getSummaryMetrics, type FilterState } from '../utils/metrics'

const filters = reactive<FilterState>({ dateRange: '30', region: 'all', carrier: 'all', status: 'all' })
const dateRanges = [{ label: 'Last 7 days', value: '7' }, { label: 'Last 30 days', value: '30' }, { label: 'Last 90 days', value: '90' }]
const regions = ['Northeast', 'Southeast', 'Midwest', 'West', 'Southwest']
const exceptionTypes = ['Late Delivery', 'Missing Documentation', 'Invoice Discrepancy']
const regionOptions = [{ title: 'All Regions', value: 'all' }, ...regions.map((region) => ({ title: region, value: region }))]
const carrierOptions = [{ title: 'All Carriers', value: 'all' }, ...carriers.map((carrier) => ({ title: carrier.name, value: carrier.id }))]
const statusOptions = [{ title: 'All Shipment Statuses', value: 'all' }, { title: 'In Transit', value: 'In Transit' }, { title: 'Delivered', value: 'Delivered' }, { title: 'Delayed', value: 'Delayed' }]
const exceptionTypeOptions = [{ title: 'All Types', value: 'all' }, ...exceptionTypes.map((type) => ({ title: type, value: type }))]
const trendView = ref<'type' | 'carrier'>('type')
const trendMetric = ref<'count' | 'percent'>('count')
const exceptionType = ref('all')
const exceptionCarrier = ref('all')
const scoreSort = reactive({ key: 'compositeScore', direction: 'desc' as 'asc' | 'desc' })
const exceptionSort = reactive({ key: 'daysOpen', direction: 'desc' as 'asc' | 'desc' })
const scoreColumns = [{ key: 'rank', label: 'Rank' }, { key: 'carrierName', label: 'Carrier' }, { key: 'shipments', label: 'Shipments' }, { key: 'onTimeRate', label: 'On-Time' }, { key: 'exceptionRate', label: 'Exception' }, { key: 'costVariance', label: 'Cost vs. Contract' }, { key: 'compositeScore', label: 'Composite' }, { key: 'trend', label: 'Trend' }]
const exceptionColumns = [{ key: 'id', label: 'Exception ID' }, { key: 'type', label: 'Type' }, { key: 'carrier_name', label: 'Carrier' }, { key: 'route', label: 'Route' }, { key: 'shipment_id', label: 'Shipment #' }, { key: 'date_opened', label: 'Date Opened' }, { key: 'daysOpen', label: 'Days Open' }, { key: 'status', label: 'Status' }]

const summary = computed(() => getSummaryMetrics(shipments, exceptions, filters))
const durationLabel = computed(() => getDurationLabel(Number(filters.dateRange)))
const summaryCards = computed(() => [{ label: 'Total Shipments', value: summary.value.totalShipments.toLocaleString(), trend: summary.value.trend.shipments, tone: '' }, { label: 'Network On-Time Rate', value: formatPercent(summary.value.onTimeRate), trend: summary.value.trend.onTime, tone: getStatusTone(summary.value.onTimeRate) }, { label: 'Open Exceptions', value: summary.value.openExceptions.toLocaleString(), trend: summary.value.trend.exceptions, tone: summary.value.openExceptions > 30 ? 'alert' : '' }, { label: 'Avg Cost vs. Contract', value: formatVariance(summary.value.costVariance), trend: summary.value.trend.cost, tone: getCostTone(summary.value.costVariance) }])
const scorecard = computed(() => getCarrierScorecard(shipments, exceptions, filters))
const sortedScorecard = computed(() => [...scorecard.value].sort((left, right) => compare(left, right, scoreSort.key, scoreSort.direction)))
const trendData = computed(() => getExceptionTrendData(shipments, exceptions, filters, trendView.value, trendMetric.value))
const regionalSummary = computed(() => getRegionalSummary(shipments, exceptions, filters))
const filteredExceptions = computed(() => getOpenExceptions(shipments, exceptions, filters).filter((exception) => (exceptionType.value === 'all' || exception.type === exceptionType.value) && (exceptionCarrier.value === 'all' || exception.carrier_id === exceptionCarrier.value)))
const sortedExceptions = computed(() => [...filteredExceptions.value].sort((left, right) => compare(left, right, exceptionSort.key, exceptionSort.direction)))
const maximumTrendValue = computed(() => Math.max(1, ...trendData.value.flatMap((point) => [point.late, point.docs, point.invoice])))
const barHeight = (value: number) => `${Math.max(8, (value / maximumTrendValue.value) * 100)}%`

const volumeSeries = computed(() => {
  const days = Number(filters.dateRange)
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
  const data = Array.from({ length: 8 }, (_, index) => {
    const daysAgo = Math.floor((7 - index) * (days / 8))
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    return { total: 0, onTime: 0, index, label: formatter.format(date), x: 18 + index * 44 }
  })
  filterShipments(shipments, filters).forEach((shipment) => {
    const daysAgo = (Date.now() - new Date(shipment.date_created).getTime()) / 86400000
    const bucket = Math.max(0, Math.min(7, 7 - Math.floor(daysAgo / (days / 8))))
    data[bucket].total += 1
    if (shipment.actual_delivery && new Date(shipment.actual_delivery) <= new Date(shipment.estimated_delivery)) data[bucket].onTime += 1
  })
  return data
})

const volumePaths = computed(() => {
  const data = volumeSeries.value
  const maximum = Math.max(1, ...data.flatMap((point) => [point.total, point.onTime]))
  const y = (value: number) => 126 - (value / maximum) * 96
  const path = (key: 'total' | 'onTime') => data.map((point) => `${point.index ? 'L' : 'M'} ${point.x} ${y(point[key])}`).join(' ')
  const gap = `${path('total')} L ${data[data.length - 1].x} ${y(data[data.length - 1].onTime)} ${data.slice().reverse().map((point) => `L ${point.x} ${y(point.onTime)}`).join(' ')} Z`
  return { total: path('total'), onTime: path('onTime'), gap }
})

function compare(left: object, right: object, key: string, direction: 'asc' | 'desc') { const result = typeof Reflect.get(left, key) === 'number' && typeof Reflect.get(right, key) === 'number' ? Number(Reflect.get(left, key)) - Number(Reflect.get(right, key)) : String(Reflect.get(left, key)).localeCompare(String(Reflect.get(right, key))); return direction === 'asc' ? result : -result }
function toggleScoreSort(key: string) { scoreSort.direction = scoreSort.key === key && scoreSort.direction === 'desc' ? 'asc' : 'desc'; scoreSort.key = key }
function toggleExceptionSort(key: string) { exceptionSort.direction = exceptionSort.key === key && exceptionSort.direction === 'desc' ? 'asc' : 'desc'; exceptionSort.key = key }
function sortIcon(sort: { key: string; direction: string }, key: string) { return sort.key !== key ? 'mdi-swap-vertical' : sort.direction === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down' }
function getExceptionTone(value: number) { return value <= 10 ? 'good' : value <= 20 ? 'warn' : 'bad' }
function getScoreTone(value: number) { return value >= 90 ? 'excellent' : value >= 70 ? 'good' : 'alert' }
function formatDate(value: string) { return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date(value)) }
</script>