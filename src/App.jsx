import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { carriers } from './data/carriers.js'
import { exceptions } from './data/exceptions.js'
import { shipments } from './data/shipments.js'
import {
  filterShipments,
  formatPercent,
  formatVariance,
  getCarrierScorecard,
  getExceptionTrendData,
  getOpenExceptions,
  getRegionalSummary,
  getStatusTone,
  getSummaryMetrics,
  getCostTone,
  getDurationLabel,
} from './utils/metrics.js'

const defaultFilters = {
  dateRange: '30',
  region: 'all',
  carrier: 'all',
  status: 'all',
}

const dateOptions = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
]

const regionOptions = ['all', 'Northeast', 'Southeast', 'Midwest', 'West', 'Southwest']
const statusOptions = ['all', 'In Transit', 'Delivered', 'Delayed']

function App() {
  const [filters, setFilters] = useState(defaultFilters)
  const [sortKey, setSortKey] = useState('compositeScore')
  const [sortDirection, setSortDirection] = useState('desc')
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('type')
  const [metricMode, setMetricMode] = useState('count')
  const [inlineTypeFilter, setInlineTypeFilter] = useState('all')
  const [inlineCarrierFilter, setInlineCarrierFilter] = useState('all')

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 350)
    return () => window.clearTimeout(timer)
  }, [])

  const setFilterValue = (key, value) => {
    setFilters((previous) => ({ ...previous, [key]: value }))
  }

  const filteredShipments = useMemo(() => filterShipments(shipments, filters), [filters])
  const summary = useMemo(() => getSummaryMetrics(shipments, exceptions, filters), [filters])
  const scorecard = useMemo(() => getCarrierScorecard(shipments, exceptions, filters), [filters])

  const tableRows = useMemo(() => {
    const rows = [...scorecard]
    const direction = sortDirection === 'asc' ? 1 : -1
    rows.sort((a, b) => (a[sortKey] - b[sortKey]) * direction)
    return rows
  }, [scorecard, sortDirection, sortKey])

  const exceptionTrend = useMemo(
    () => getExceptionTrendData(shipments, exceptions, filters, viewMode, metricMode),
    [filters, metricMode, viewMode],
  )

  const regionalCards = useMemo(() => getRegionalSummary(shipments, exceptions, filters), [filters])

  const exceptionTable = useMemo(() => {
    let rows = getOpenExceptions(shipments, exceptions, filters)
    if (inlineTypeFilter !== 'all') rows = rows.filter((row) => row.type === inlineTypeFilter)
    if (inlineCarrierFilter !== 'all') rows = rows.filter((row) => row.carrier_id === inlineCarrierFilter)
    return rows.sort((a, b) => b.daysOpen - a.daysOpen)
  }, [filters, inlineCarrierFilter, inlineTypeFilter])

  const volumeData = useMemo(() => {
    const days = Number(filters.dateRange || 30)
    const bucketCount = days >= 90 ? 12 : 7
    const periodLength = days / bucketCount
    const currentDate = new Date()

    return Array.from({ length: bucketCount }, (_, index) => {
      const endDate = new Date(currentDate)
      endDate.setDate(currentDate.getDate() - index * periodLength)
      const startDate = new Date(endDate)
      startDate.setDate(endDate.getDate() - periodLength + 1)

      const bucket = filteredShipments.filter((shipment) => {
        const date = new Date(shipment.date_created)
        return date >= startDate && date <= endDate
      })

      const onTime = bucket.filter((shipment) => {
        if (!shipment.actual_delivery) return false
        return new Date(shipment.actual_delivery) <= new Date(shipment.estimated_delivery)
      }).length

      return {
        label: days >= 90 ? `W${index + 1}` : `D${index + 1}`,
        total: bucket.length,
        onTime,
      }
    }).reverse()
  }, [filteredShipments, filters])

  const volumePath = useMemo(() => {
    const max = Math.max(...volumeData.map((point) => point.total), 1)
    return volumeData
      .map((point, index) => {
        const x = 18 + index * 26
        const y = 120 - (point.total / max) * 80
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
      })
      .join(' ')
  }, [volumeData])

  const onTimePath = useMemo(() => {
    const max = Math.max(...volumeData.map((point) => point.total), 1)
    return volumeData
      .map((point, index) => {
        const x = 18 + index * 26
        const y = 120 - (point.onTime / max) * 80
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
      })
      .join(' ')
  }, [volumeData])

  const getToneClass = (value, kind = 'percent') => {
    if (kind === 'cost') return getCostTone(value)
    return getStatusTone(value)
  }

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection((previous) => (previous === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDirection('desc')
  }

  const activeFilterCount = Object.values(filters).filter((value) => value !== 'all' && value !== '30').length

  return (
    <div className="dashboard-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark">FF</div>
          <div>
            <div className="eyebrow">FastForward Logistics</div>
            <h1>Ops Dashboard</h1>
          </div>
        </div>

        <div className="filter-row">
          {dateOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`filter-chip ${filters.dateRange === option.value ? 'active' : ''}`}
              onClick={() => setFilterValue('dateRange', option.value)}
            >
              {option.label}
            </button>
          ))}

          <select value={filters.region} onChange={(event) => setFilterValue('region', event.target.value)}>
            {regionOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? 'All Regions' : option}
              </option>
            ))}
          </select>

          <select value={filters.carrier} onChange={(event) => setFilterValue('carrier', event.target.value)}>
            <option value="all">All Carriers</option>
            {carriers.map((carrier) => (
              <option key={carrier.id} value={carrier.id}>
                {carrier.name}
              </option>
            ))}
          </select>

          <select value={filters.status} onChange={(event) => setFilterValue('status', event.target.value)}>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? 'All Shipment Status' : option}
              </option>
            ))}
          </select>

          {activeFilterCount > 0 && <span className="filter-pill">{activeFilterCount} active</span>}
        </div>
      </header>

      <main className="dashboard-main">
        <section className="summary-grid">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => <div key={index} className="summary-card skeleton" />)
          ) : (
            <>
              <div className="summary-card">
                <div className="card-label">Total Shipments</div>
                <div className="card-value">{summary.totalShipments.toLocaleString()}</div>
                <div className="card-trend positive">
                  <span>↗</span> {summary.trend.shipments}% vs prior period
                </div>
              </div>

              <div className="summary-card">
                <div className="card-label">Network On-Time Rate</div>
                <div className={`card-value ${getToneClass(summary.onTimeRate)}`}>
                  {formatPercent(summary.onTimeRate)}
                </div>
                <div className="card-trend positive">
                  <span>↗</span> {summary.trend.onTime}% vs prior period
                </div>
              </div>

              <div className="summary-card">
                <div className="card-label">Open Exceptions</div>
                <div className={`card-value ${summary.openExceptions > 30 ? 'alert' : ''}`}>
                  {summary.openExceptions}
                </div>
                <div className="card-trend negative">
                  <span>↘</span> {summary.trend.exceptions}% vs prior period
                </div>
              </div>

              <div className="summary-card">
                <div className="card-label">Avg Cost vs. Contract</div>
                <div className={`card-value ${getToneClass(summary.costVariance, 'cost')}`}>
                  {formatVariance(summary.costVariance)}
                </div>
                <div className="card-trend negative">
                  <span>↘</span> {summary.trend.cost}% vs prior period
                </div>
              </div>
            </>
          )}
        </section>

        <section className="primary-grid">
          <div className="panel scorecard-panel">
            <div className="panel-header">
              <h2>Carrier Performance Scorecard</h2>
              <span className="panel-tag">{getDurationLabel(Number(filters.dateRange))}</span>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Carrier</th>
                    <th onClick={() => handleSort('shipments')} style={{ cursor: 'pointer' }}>Shipments</th>
                    <th onClick={() => handleSort('onTimeRate')} style={{ cursor: 'pointer' }}>On-Time</th>
                    <th onClick={() => handleSort('exceptionRate')} style={{ cursor: 'pointer' }}>Exception</th>
                    <th onClick={() => handleSort('costVariance')} style={{ cursor: 'pointer' }}>Cost vs. Contract</th>
                    <th onClick={() => handleSort('compositeScore')} style={{ cursor: 'pointer' }}>Composite</th>
                    <th>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row) => (
                    <tr key={row.carrierId} className={row.compositeScore < 70 ? 'low-score' : ''}>
                      <td>{row.rank}</td>
                      <td>{row.carrierName}</td>
                      <td>{row.shipments}</td>
                      <td>
                        <span className={`status-pill ${getToneClass(row.onTimeRate)}`}>
                          {formatPercent(row.onTimeRate)}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill ${getToneClass(row.exceptionRate)}`}>
                          {formatPercent(row.exceptionRate)}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill ${getToneClass(row.costVariance, 'cost')}`}>
                          {formatVariance(row.costVariance)}
                        </span>
                      </td>
                      <td>
                        <span className={`score-badge ${row.compositeScore >= 85 ? 'excellent' : row.compositeScore >= 70 ? 'good' : 'alert'}`}>
                          {row.compositeScore}
                        </span>
                      </td>
                      <td>{row.compositeScore >= 80 ? '▲' : '▼'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel trend-panel">
            <div className="panel-header stacked-header">
              <h2>Exception Trend</h2>
              <div className="segmented-control">
                <button
                  type="button"
                  className={viewMode === 'type' ? 'selected' : ''}
                  onClick={() => setViewMode('type')}
                >
                  By Exception Type
                </button>
                <button
                  type="button"
                  className={viewMode === 'carrier' ? 'selected' : ''}
                  onClick={() => setViewMode('carrier')}
                >
                  By Carrier
                </button>
              </div>
            </div>

            <div className="segmented-control metric-toggle">
              <button
                type="button"
                className={metricMode === 'count' ? 'selected' : ''}
                onClick={() => setMetricMode('count')}
              >
                Count
              </button>
              <button
                type="button"
                className={metricMode === 'percent' ? 'selected' : ''}
                onClick={() => setMetricMode('percent')}
              >
                % of Shipments
              </button>
            </div>

            <div className="bar-chart">
              {exceptionTrend.map((point, index) => {
                const maxValue = Math.max(
                  1,
                  ...exceptionTrend.map((entry) => Math.max(entry.late, entry.docs, entry.invoice)),
                )
                const lateHeight = (point.late / maxValue) * 100
                const docsHeight = (point.docs / maxValue) * 100
                const invoiceHeight = (point.invoice / maxValue) * 100

                return (
                  <div key={point.label || index} className="bar-group">
                    <div className="stacked-bars">
                      <span className="bar late" style={{ height: `${lateHeight}%` }} />
                      <span className="bar docs" style={{ height: `${docsHeight}%` }} />
                      <span className="bar invoice" style={{ height: `${invoiceHeight}%` }} />
                    </div>
                    <label>{point.label}</label>
                  </div>
                )
              })}
            </div>

            <div className="legend-row">
              <span><i className="dot late" />Late Delivery</span>
              <span><i className="dot docs" />Missing Documentation</span>
              <span><i className="dot invoice" />Invoice Discrepancy</span>
            </div>
          </div>
        </section>

        <section className="secondary-grid">
          <div className="panel volume-panel">
            <div className="panel-header">
              <h2>Shipment Volume</h2>
              <span className="panel-tag">{getDurationLabel(Number(filters.dateRange))}</span>
            </div>

            <svg viewBox="0 0 360 140" className="volume-chart" role="img" aria-label="Shipment volume chart">
              <path d={volumePath} className="volume-line total" />
              <path d={onTimePath} className="volume-line ontime" />
              <path d="M 18 120 L 18 40" className="axis-line" />
              <path d="M 18 120 L 338 120" className="axis-line" />
            </svg>

            <div className="chart-legend">
              <span><i className="line-swatch total" />Total Shipments</span>
              <span><i className="line-swatch ontime" />On-Time Shipments</span>
            </div>
          </div>

          <div className="panel regional-panel">
            <div className="panel-header">
              <h2>Regional Performance</h2>
              <span className="panel-tag">Worst first</span>
            </div>

            <div className="regional-grid">
              {regionalCards.map((region) => (
                <div key={region.region} className={`region-card ${getToneClass(region.onTimeRate)}`}>
                  <div className="region-name">{region.region}</div>
                  <div className="region-stat">{region.shipments.toLocaleString()} shipments</div>
                  <div className={`region-rate ${getToneClass(region.onTimeRate)}`}>
                    {formatPercent(region.onTimeRate)}
                  </div>
                  <div className="region-open">{region.openExceptions} open exceptions</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="panel exceptions-panel">
          <div className="panel-header compact-header">
            <h2>Open Exceptions</h2>
            <div className="inline-filters">
              <select value={inlineTypeFilter} onChange={(event) => setInlineTypeFilter(event.target.value)}>
                <option value="all">All Types</option>
                <option value="Late Delivery">Late Delivery</option>
                <option value="Missing Documentation">Missing Documentation</option>
                <option value="Invoice Discrepancy">Invoice Discrepancy</option>
              </select>
              <select value={inlineCarrierFilter} onChange={(event) => setInlineCarrierFilter(event.target.value)}>
                <option value="all">All Carriers</option>
                {carriers.map((carrier) => (
                  <option key={carrier.id} value={carrier.id}>
                    {carrier.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="table-wrap compact-table">
            <table>
              <thead>
                <tr>
                  <th>Exception ID</th>
                  <th>Type</th>
                  <th>Carrier</th>
                  <th>Route</th>
                  <th>Shipment #</th>
                  <th>Date Opened</th>
                  <th>Days Open</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {exceptionTable.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.type}</td>
                    <td>{row.carrier_name}</td>
                    <td>{row.route}</td>
                    <td>{row.shipment_id}</td>
                    <td>{new Date(row.date_opened).toLocaleDateString()}</td>
                    <td>
                      <span className={row.daysOpen > 5 ? 'danger-days' : ''}>{row.daysOpen}</span>
                    </td>
                    <td>
                      <span className={`status-pill ${row.status === 'Open' ? 'open' : 'review'}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
