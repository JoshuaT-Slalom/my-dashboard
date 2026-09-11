<template>
  <main class="page-shell">
    <header class="topbar">
      <div class="brand-block"><div class="brand-mark">FF</div><div><div class="eyebrow">FastForward Logistics</div><h1>Ops Dashboard</h1></div></div>
      <div class="filter-row">
        <button v-for="range in dateRanges" :key="range.value" type="button" class="filter-chip" :class="{ active: filters.dateRange === range.value }" @click="filters.dateRange = range.value">{{ range.label }}</button>
        <select v-model="filters.region" aria-label="Region filter"><option value="all">All Regions</option><option v-for="region in regions" :key="region">{{ region }}</option></select>
        <select v-model="filters.carrier" aria-label="Carrier filter"><option value="all">All Carriers</option><option v-for="carrier in carriers" :key="carrier.id" :value="carrier.id">{{ carrier.name }}</option></select>
        <select v-model="filters.status" aria-label="Shipment status filter"><option value="all">All Shipment Status</option><option value="In Transit">In Transit</option><option value="Delivered">Delivered</option><option value="Delayed">Delayed</option></select>
      </div>
    </header>

    <section class="summary-grid">
      <article v-for="card in summaryCards" :key="card.label" class="summary-card"><div class="card-label">{{ card.label }}</div><div class="card-value" :class="card.tone">{{ card.value }}</div><div class="card-trend" :class="card.trend >= 0 ? 'positive' : 'negative'">{{ card.trend >= 0 ? '↑' : '↓' }} {{ Math.abs(card.trend).toFixed(1) }}% vs prior period</div></article>
    </section>

    <section class="primary-grid">
      <div class="panel table-panel"><div class="panel-header"><h2>Carrier Performance Scorecard</h2><span class="panel-tag">{{ durationLabel }}</span></div>
        <table><thead><tr><th v-for="column in scoreColumns" :key="column.key"><button class="sort-button" type="button" @click="toggleScoreSort(column.key)">{{ column.label }} {{ sortIndicator(scoreSort, column.key) }}</button></th></tr></thead>
          <tbody><tr v-for="carrier in sortedScorecard" :key="carrier.carrierId" :class="{ 'low-score': carrier.compositeScore < 70 }"><td>{{ carrier.rank }}</td><td>{{ carrier.carrierName }}</td><td>{{ carrier.shipments.toLocaleString() }}</td><td><span class="status-pill" :class="getStatusTone(carrier.onTimeRate)">{{ formatPercent(carrier.onTimeRate) }}</span></td><td><span class="status-pill" :class="getExceptionTone(carrier.exceptionRate)">{{ formatPercent(carrier.exceptionRate) }}</span></td><td><span class="status-pill" :class="getCostTone(carrier.costVariance)">{{ formatVariance(carrier.costVariance) }}</span></td><td><span class="score-badge" :class="getScoreTone(carrier.compositeScore)">{{ carrier.compositeScore.toFixed(1) }}</span></td><td>{{ carrier.compositeScore >= 80 ? '↑' : '↓' }}</td></tr></tbody>
        </table>
      </div>
      <div class="panel trend-panel"><div class="panel-header stacked-header"><h2>Exception Trend</h2><div class="segmented-control"><button type="button" :class="{ selected: trendView === 'type' }" @click="trendView = 'type'">By Exception Type</button><button type="button" :class="{ selected: trendView === 'carrier' }" @click="trendView = 'carrier'">By Carrier</button></div></div>
        <div class="segmented-control metric-toggle"><button type="button" :class="{ selected: trendMetric === 'count' }" @click="trendMetric = 'count'">Count</button><button type="button" :class="{ selected: trendMetric === 'percent' }" @click="trendMetric = 'percent'">% of Shipments</button></div>
        <div class="bar-chart"><div v-for="point in trendData" :key="point.label" class="bar-group"><div class="stacked-bars"><span class="bar late" :style="{ height: barHeight(point.late) }" /><span class="bar docs" :style="{ height: barHeight(point.docs) }" /><span class="bar invoice" :style="{ height: barHeight(point.invoice) }" /></div><label>{{ point.label }}</label></div></div>
        <div class="legend-row"><span><i class="dot late" />Late Delivery</span><span><i class="dot docs" />Missing Documentation</span><span><i class="dot invoice" />Invoice Discrepancy</span></div>
      </div>
    </section>

    <section class="secondary-grid">
      <div class="panel volume-panel"><div class="panel-header"><h2>Shipment Volume</h2><span class="panel-tag">{{ durationLabel }}</span></div><svg viewBox="0 0 360 140" class="volume-chart" aria-label="Shipment volume chart" role="img"><path :d="volumePaths.total" class="volume-line total" /><path :d="volumePaths.onTime" class="volume-line ontime" /></svg><div class="chart-legend"><span><i class="line-swatch total" />Total Shipments</span><span><i class="line-swatch ontime" />On-Time Shipments</span></div></div>
      <div class="panel regional-panel"><div class="panel-header"><h2>Regional Performance</h2><span class="panel-tag">Worst first</span></div><div class="regional-grid"><div v-for="region in regionalSummary" :key="region.region" class="region-card" :class="getStatusTone(region.onTimeRate)"><div class="region-name">{{ region.region }}</div><div class="region-stat">{{ region.shipments.toLocaleString() }} shipments</div><div class="region-rate" :class="getStatusTone(region.onTimeRate)">{{ formatPercent(region.onTimeRate) }}</div><div class="region-open">{{ region.openExceptions }} open exceptions</div></div></div></div>
    </section>

    <section class="panel exceptions-panel"><div class="panel-header compact-header"><h2>Open Exceptions</h2><div class="inline-filters"><select v-model="exceptionType" aria-label="Exception type filter"><option value="all">All Types</option><option v-for="type in exceptionTypes" :key="type">{{ type }}</option></select><select v-model="exceptionCarrier" aria-label="Exception carrier filter"><option value="all">All Carriers</option><option v-for="carrier in carriers" :key="carrier.id" :value="carrier.id">{{ carrier.name }}</option></select></div></div>
      <table><thead><tr><th v-for="column in exceptionColumns" :key="column.key"><button class="sort-button" type="button" @click="toggleExceptionSort(column.key)">{{ column.label }} {{ sortIndicator(exceptionSort, column.key) }}</button></th></tr></thead><tbody><tr v-for="exception in sortedExceptions" :key="exception.id"><td>{{ exception.id }}</td><td>{{ exception.type }}</td><td>{{ exception.carrier_name }}</td><td>{{ exception.route }}</td><td>{{ exception.shipment_id }}</td><td>{{ formatDate(exception.date_opened) }}</td><td><span :class="{ 'danger-days': exception.daysOpen > 5 }">{{ exception.daysOpen }}</span></td><td><span class="status-pill" :class="exception.status === 'Open' ? 'open' : 'review'">{{ exception.status }}</span></td></tr><tr v-if="!sortedExceptions.length"><td colspan="8" class="empty-state">No open exceptions match the selected filters.</td></tr></tbody></table>
    </section>
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

const volumePaths = computed(() => {
  const data = Array.from({ length: 8 }, (_, index) => ({ total: 0, onTime: 0, index }))
  filterShipments(shipments, filters).forEach((shipment) => {
    const bucket = Math.min(7, Math.floor(((Date.now() - new Date(shipment.date_created).getTime()) / 86400000) / (Number(filters.dateRange) / 8)))
    data[bucket].total += 1
    if (shipment.actual_delivery && new Date(shipment.actual_delivery) <= new Date(shipment.estimated_delivery)) data[bucket].onTime += 1
  })
  const maximum = Math.max(1, ...data.flatMap((point) => [point.total, point.onTime]))
  const path = (key: 'total' | 'onTime') => data.map((point) => `${point.index ? 'L' : 'M'} ${18 + point.index * 44} ${118 - (point[key] / maximum) * 88}`).join(' ')
  return { total: path('total'), onTime: path('onTime') }
})

function compare(left: object, right: object, key: string, direction: 'asc' | 'desc') { const result = typeof Reflect.get(left, key) === 'number' && typeof Reflect.get(right, key) === 'number' ? Number(Reflect.get(left, key)) - Number(Reflect.get(right, key)) : String(Reflect.get(left, key)).localeCompare(String(Reflect.get(right, key))); return direction === 'asc' ? result : -result }
function toggleScoreSort(key: string) { scoreSort.direction = scoreSort.key === key && scoreSort.direction === 'desc' ? 'asc' : 'desc'; scoreSort.key = key }
function toggleExceptionSort(key: string) { exceptionSort.direction = exceptionSort.key === key && exceptionSort.direction === 'desc' ? 'asc' : 'desc'; exceptionSort.key = key }
function sortIndicator(sort: { key: string; direction: string }, key: string) { return sort.key !== key ? '↕' : sort.direction === 'asc' ? '↑' : '↓' }
function getExceptionTone(value: number) { return value <= 10 ? 'good' : value <= 20 ? 'warn' : 'bad' }
function getScoreTone(value: number) { return value >= 90 ? 'excellent' : value >= 70 ? 'good' : 'alert' }
function formatDate(value: string) { return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date(value)) }
</script>