import { carriers } from './carriers'

export type ShipmentStatus = 'Delivered' | 'Delayed' | 'In Transit'

export type Shipment = {
  id: string
  carrier_id: string
  carrier_name: string
  region: string
  origin: string
  destination: string
  status: ShipmentStatus
  estimated_delivery: string
  actual_delivery: string | null
  contracted_cost: number
  actual_cost: number
  date_created: string
}

const regions = ['Northeast', 'Southeast', 'Midwest', 'West', 'Southwest']
const origins = [
  'Chicago, IL',
  'Dallas, TX',
  'Atlanta, GA',
  'Los Angeles, CA',
  'Philadelphia, PA',
  'Denver, CO',
  'Columbus, OH',
  'Phoenix, AZ',
  'Boston, MA',
  'Jacksonville, FL',
  'Kansas City, MO',
  'Seattle, WA',
]
const destinations = [
  'Atlanta, GA',
  'Chicago, IL',
  'Dallas, TX',
  'Los Angeles, CA',
  'Houston, TX',
  'Denver, CO',
  'Boston, MA',
  'Phoenix, AZ',
  'Nashville, TN',
  'Charlotte, NC',
  'Portland, OR',
  'Detroit, MI',
]

const round = (value: number) => Number(value.toFixed(2))

const makeDate = (daysAgo: number) => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

export const shipments: Shipment[] = Array.from({ length: 420 }, (_, index) => {
  const carrier = carriers[index % carriers.length]
  const profile = carrier.profile
  const daysAgo = (index * 7 + (index % 11) * 3) % 90
  const dateCreated = new Date(makeDate(daysAgo))
  const routeIndex = index % origins.length
  const origin = origins[routeIndex]
  const destination = destinations[(routeIndex + 2 + (index % 4)) % destinations.length]
  const region = regions[(routeIndex + index) % regions.length]
  const contractedCost = round(520 + (index % 17) * 42 + (routeIndex * 11))
  const variance = profile.costVariance + ((index % 9) - 4) / 100
  const actualCost = round(contractedCost * (1 + variance))
  const statusRoll = ((index * 17) % 100) / 100

  let status: ShipmentStatus = 'Delivered'
  if (statusRoll < profile.onTime) {
    status = 'Delivered'
  } else if (statusRoll < profile.onTime + 0.15) {
    status = 'Delayed'
  } else {
    status = 'In Transit'
  }

  const estimatedDelivery = new Date(dateCreated)
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 2 + (index % 5))

  let actualDelivery: string | null = null
  if (status === 'Delivered') {
    actualDelivery = new Date(estimatedDelivery).toISOString()
    const onTimeDelta = (index % 6) - 2
    if (onTimeDelta < 0) {
      const adjusted = new Date(actualDelivery)
      adjusted.setDate(adjusted.getDate() + onTimeDelta)
      actualDelivery = adjusted.toISOString()
    }
  } else if (status === 'Delayed') {
    const delayed = new Date(estimatedDelivery.getTime() + (index % 4 + 1) * 86400000)
    actualDelivery = delayed.toISOString()
  }

  return {
    id: `SHP-${10000 + index}`,
    carrier_id: carrier.id,
    carrier_name: carrier.name,
    region,
    origin,
    destination,
    status,
    estimated_delivery: estimatedDelivery.toISOString(),
    actual_delivery: actualDelivery,
    contracted_cost: contractedCost,
    actual_cost: actualCost,
    date_created: dateCreated.toISOString(),
  }
})
