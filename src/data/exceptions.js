import { carriers } from './carriers.js'
import { shipments } from './shipments.js'

const exceptionTypes = ['Late Delivery', 'Missing Documentation', 'Invoice Discrepancy']

const makeDate = (daysAgo) => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

export const exceptions = Array.from({ length: 42 }, (_, index) => {
  const shipment = shipments[(index * 11) % shipments.length]
  const carrier = carriers.find((entry) => entry.id === shipment.carrier_id)
  const type = exceptionTypes[index % exceptionTypes.length]
  const daysAgo = (index * 3 + (index % 5)) % 42
  const status = index % 5 === 0 ? 'In Review' : 'Open'

  return {
    id: `EXC-${4200 + index}`,
    type,
    carrier_id: shipment.carrier_id,
    carrier_name: carrier?.name || 'Unknown Carrier',
    shipment_id: shipment.id,
    route: `${shipment.origin} → ${shipment.destination}`,
    date_opened: makeDate(daysAgo),
    status,
  }
})
