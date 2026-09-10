import { carriers } from './carriers.js'

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

const round = (value) => Number(value.toFixed(2))

const makeDate = (daysAgo) => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

const getCarrierProfile = (carrierId) => {
  const carrier = carriers.find((entry) => entry.id === carrierId)
  return carrier?.profile || { onTime: 0.86, exceptionRate: 0.12, costVariance: 0.04 }
}

export const shipments = Array.from({ length: 420 }, (_, index) => {
  const carrier = carriers[index % carriers.length]
  const profile = getCarrierProfile(carrier.id)
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

  let status = 'Delivered'
  if (statusRoll < profile.onTime) {
    status = 'Delivered'
  } else if (statusRoll < profile.onTime + 0.15) {
    status = 'Delayed'
  } else {
    status = 'In Transit'
  }

  const estimatedDelivery = new Date(dateCreated)
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 2 + (index % 5))

  const actualDelivery =
    status === 'Delivered'
      ? new Date(estimatedDelivery)
      : status === 'Delayed'
        ? new Date(estimatedDelivery.getTime() + (index % 4 + 1) * 86400000)
        : null

  if (status === 'Delivered') {
    const onTimeDelta = (index % 6) - 2
    if (onTimeDelta < 0) {
      actualDelivery.setDate(actualDelivery.getDate() + onTimeDelta)
    }
  }

  const shipment = {
    id: `SHP-${10000 + index}`,
    carrier_id: carrier.id,
    carrier_name: carrier.name,
    region,
    origin,
    destination,
    status,
    estimated_delivery: estimatedDelivery.toISOString(),
    actual_delivery: actualDelivery ? actualDelivery.toISOString() : null,
    contracted_cost: contractedCost,
    actual_cost: actualCost,
    date_created: dateCreated.toISOString(),
  }

  return shipment
})
