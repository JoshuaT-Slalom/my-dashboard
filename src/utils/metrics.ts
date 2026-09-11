import { carriers } from '../data/carriers'
import type { DashboardException } from '../data/exceptions'
import type { Shipment } from '../data/shipments'

const DAY_IN_MS = 24 * 60 * 60 * 1000

export type FilterState = {
  dateRange: string
  region: string
  carrier: string
  status: string
}

export type SummaryMetrics = {
  totalShipments: number
  onTimeRate: number
  openExceptions: number
  costVariance: number
  trend: {
    shipments: number
    onTime: number
    exceptions: number
    cost: number
  }
}

export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export const getDateWindow = (days: number) => {
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  const start = new Date(end)
  start.setDate(start.getDate() - (days - 1))
  start.setHours(0, 0, 0, 0)
  return { start, end }
}

export const getPreviousWindow = (days: number) => {
  const current = getDateWindow(days)
  const previousEnd = new Date(current.start)
  previousEnd.setTime(previousEnd.getTime() - DAY_IN_MS)
  const previousStart = new Date(previousEnd)
  previousStart.setDate(previousStart.getDate() - (days - 1))
  previousStart.setHours(0, 0, 0, 0)
  return { start: previousStart, end: previousEnd }
}

export const formatPercent = (value: number) => `${Number(value).toFixed(1)}%`
export const formatVariance = (value: number) => `${value >= 0 ? '+' : ''}${Number(value).toFixed(1)}%`
export const getStatusTone = (value: number) => {
  if (value >= 90) return 'good'
  if (value >= 80) return 'warn'
  return 'bad'
}
export const getCostTone = (value: number) => (value <= 0 ? 'good' : 'bad')
export const getDurationLabel = (days: number) => {
  if (days <= 7) return 'Last 7 days'
  if (days <= 30) return 'Last 30 days'
  return 'Last 90 days'
}

export function filterShipments(shipments: Shipment[], filters: FilterState) {
  const days = Number(filters.dateRange || 30)
  const { start, end } = getDateWindow(days)

  return shipments.filter((shipment) => {
    const date = new Date(shipment.date_created)
    if (date < start || date > end) return false
    if (filters.region && filters.region !== 'all' && shipment.region !== filters.region) return false
    if (filters.carrier && filters.carrier !== 'all' && shipment.carrier_id !== filters.carrier) return false
    if (filters.status && filters.status !== 'all' && shipment.status !== filters.status) return false
    return true
  })
}

export function getTrendDelta(current: number, previous: number) {
  if (!previous || previous === 0) return 0
  return Number((((current - previous) / previous) * 100).toFixed(1))
}

export function getSummaryMetrics(shipments: Shipment[], exceptions: DashboardException[], filters: FilterState): SummaryMetrics {
  const activeShipments = filterShipments(shipments, filters)
  const openExceptions = exceptions.filter((exception) => exception.status !== 'Resolved')
  const totalShipments = activeShipments.length

  const onTimeCount = activeShipments.filter((shipment) => {
    if (!shipment.actual_delivery) return false
    return new Date(shipment.actual_delivery) <= new Date(shipment.estimated_delivery)
  }).length
  const onTimeRate = totalShipments ? (onTimeCount / totalShipments) * 100 : 0

  const shippingCosts = activeShipments.filter((shipment) => shipment.contracted_cost > 0)
  const costVariance = shippingCosts.length
    ? shippingCosts.reduce((sum, shipment) => {
        const variance = ((shipment.actual_cost - shipment.contracted_cost) / shipment.contracted_cost) * 100
        return sum + variance
      }, 0) / shippingCosts.length
    : 0

  const currentPeriodDays = Number(filters.dateRange || 30)
  const previousWindow = getPreviousWindow(currentPeriodDays)
  const previousShipments = shipments.filter((shipment) => {
    const date = new Date(shipment.date_created)
    return date >= previousWindow.start && date <= previousWindow.end
  })

  const previousTotal = previousShipments.length
  const previousOnTime = previousShipments.filter((shipment) => shipment.status === 'Delivered').length
  const previousOnTimeRate = previousTotal ? (previousOnTime / previousTotal) * 100 : 0

  return {
    totalShipments,
    onTimeRate,
    openExceptions: openExceptions.length,
    costVariance,
    trend: {
      shipments: getTrendDelta(totalShipments, previousTotal),
      onTime: getTrendDelta(onTimeRate, previousOnTimeRate),
      exceptions: getTrendDelta(openExceptions.length, openExceptions.length),
      cost: getTrendDelta(costVariance, 0),
    },
  }
}

export function getCarrierScorecard(shipments: Shipment[], exceptions: DashboardException[], filters: FilterState) {
  const relevantShipments = filterShipments(shipments, filters)

  return carriers
    .map((carrier) => {
      const carrierShipments = relevantShipments.filter((shipment) => shipment.carrier_id === carrier.id)
      const total = carrierShipments.length || 1
      const onTimeCount = carrierShipments.filter((shipment) => {
        if (!shipment.actual_delivery) return false
        return new Date(shipment.actual_delivery) <= new Date(shipment.estimated_delivery)
      }).length
      const onTimeRate = (onTimeCount / total) * 100

      const carrierExceptions = exceptions.filter(
        (exception) => exception.carrier_id === carrier.id && exception.status !== 'Resolved',
      )
      const exceptionRate = (carrierExceptions.length / total) * 100

      const costVariance = carrierShipments.length
        ? carrierShipments.reduce((sum, shipment) => {
            const variance = ((shipment.actual_cost - shipment.contracted_cost) / shipment.contracted_cost) * 100
            return sum + variance
          }, 0) / carrierShipments.length
        : 0

      const normalizedExceptionScore = clamp(100 - exceptionRate * 2.2, 0, 100)
      const normalizedCostScore = clamp(100 - Math.max(costVariance, 0) * 3.5, 0, 100)
      const compositeScore = Number(
        (onTimeRate * 0.5 + normalizedExceptionScore * 0.3 + normalizedCostScore * 0.2).toFixed(1),
      )

      return {
        carrierId: carrier.id,
        carrierName: carrier.name,
        shipments: total,
        onTimeRate: Number(onTimeRate.toFixed(1)),
        exceptionRate: Number(exceptionRate.toFixed(1)),
        costVariance: Number(costVariance.toFixed(1)),
        compositeScore,
      }
    })
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
}

export function getExceptionTrendData(shipments: Shipment[], exceptions: DashboardException[], filters: FilterState, view = 'type', metric = 'count') {
  const days = Number(filters.dateRange || 30)
  const points = Array.from({ length: days >= 90 ? 12 : 7 }, (_, index) => ({
    label: days >= 90 ? `W${index + 1}` : `D${index + 1}`,
    late: 0,
    docs: 0,
    invoice: 0,
  }))

  const relevantShipments = filterShipments(shipments, filters)
  const exceptionBuckets = exceptions.filter((exception) => {
    const opened = new Date(exception.date_opened)
    const { start, end } = getDateWindow(days)
    return opened >= start && opened <= end
  })

  if (view === 'carrier') {
    return carriers.map((carrier) => {
      const series = { label: carrier.name, late: 0, docs: 0, invoice: 0 }
      const bucketed = exceptionBuckets.filter((exception) => exception.carrier_id === carrier.id)
      bucketed.forEach((exception) => {
        if (exception.type === 'Late Delivery') series.late += 1
        if (exception.type === 'Missing Documentation') series.docs += 1
        if (exception.type === 'Invoice Discrepancy') series.invoice += 1
      })
      return series
    })
  }

  exceptionBuckets.forEach((exception) => {
    const opened = new Date(exception.date_opened)
    const bucketIndex = Math.min(
      points.length - 1,
      Math.max(0, Math.round(((new Date().getTime() - opened.getTime()) / DAY_IN_MS) / (days / points.length))),
    )

    if (exception.type === 'Late Delivery') points[bucketIndex].late += 1
    if (exception.type === 'Missing Documentation') points[bucketIndex].docs += 1
    if (exception.type === 'Invoice Discrepancy') points[bucketIndex].invoice += 1
  })

  if (metric === 'percent') {
    return points.map((point) => {
      const total = relevantShipments.length || 1
      return {
        label: point.label,
        late: Number(((point.late / total) * 100).toFixed(1)),
        docs: Number(((point.docs / total) * 100).toFixed(1)),
        invoice: Number(((point.invoice / total) * 100).toFixed(1)),
      }
    })
  }

  return points
}

export function getRegionalSummary(shipments: Shipment[], exceptions: DashboardException[], filters: FilterState) {
  const relevantShipments = filterShipments(shipments, filters)
  const regionNames = ['Northeast', 'Southeast', 'Midwest', 'West', 'Southwest']

  const regions = regionNames.map((region) => {
    const matches = relevantShipments.filter((shipment) => shipment.region === region)
    const onTime = matches.filter((shipment) => {
      if (!shipment.actual_delivery) return false
      return new Date(shipment.actual_delivery) <= new Date(shipment.estimated_delivery)
    }).length
    const count = matches.length
    const rate = count ? (onTime / count) * 100 : 0
    const openExceptions = exceptions.filter(
      (exception) => exception.status !== 'Resolved' && matches.some((shipment) => shipment.carrier_id === exception.carrier_id),
    ).length

    return {
      region,
      shipments: count,
      onTimeRate: Number(rate.toFixed(1)),
      openExceptions,
    }
  })

  return regions.sort((a, b) => a.onTimeRate - b.onTimeRate)
}

export function getOpenExceptions(shipments: Shipment[], exceptions: DashboardException[], filters: FilterState) {
  const relevantShipments = filterShipments(shipments, filters)

  return exceptions
    .filter((exception) => exception.status !== 'Resolved')
    .map((exception) => {
      const shipment = relevantShipments.find((entry) => entry.id === exception.shipment_id) || shipments.find((entry) => entry.id === exception.shipment_id)
      const opened = new Date(exception.date_opened)
      const today = new Date()
      const daysOpen = Math.max(0, Math.ceil((today.getTime() - opened.getTime()) / DAY_IN_MS))

      return {
        ...exception,
        shipment,
        route: exception.route || (shipment ? `${shipment.origin} → ${shipment.destination}` : 'Unknown route'),
        daysOpen,
      }
    })
    .filter((exception) => {
      if (!exception.shipment) return false
      if (filters.region && filters.region !== 'all' && exception.shipment.region !== filters.region) return false
      if (filters.carrier && filters.carrier !== 'all' && exception.shipment.carrier_id !== filters.carrier) return false
      return true
    })
    .sort((a, b) => b.daysOpen - a.daysOpen)
}
