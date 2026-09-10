export const carriers = [
  {
    id: 'carrier-1',
    name: 'Apex Freight Solutions',
    region: 'Midwest',
    profile: { onTime: 0.87, exceptionRate: 0.12, costVariance: 0.046 },
  },
  {
    id: 'carrier-2',
    name: 'BlueLine Transport',
    region: 'Northeast',
    profile: { onTime: 0.91, exceptionRate: 0.09, costVariance: -0.013 },
  },
  {
    id: 'carrier-3',
    name: 'Cardinal Logistics',
    region: 'Southwest',
    profile: { onTime: 0.84, exceptionRate: 0.16, costVariance: 0.071 },
  },
  {
    id: 'carrier-4',
    name: 'DeltaHaul Inc.',
    region: 'West',
    profile: { onTime: 0.93, exceptionRate: 0.08, costVariance: -0.011 },
  },
  {
    id: 'carrier-5',
    name: 'Evergreen Shipping Co.',
    region: 'Southeast',
    profile: { onTime: 0.79, exceptionRate: 0.19, costVariance: 0.092 },
  },
  {
    id: 'carrier-6',
    name: 'FrontLine Carriers',
    region: 'Northeast',
    profile: { onTime: 0.95, exceptionRate: 0.06, costVariance: -0.019 },
  },
]

export const carrierMap = Object.fromEntries(
  carriers.map((carrier) => [carrier.id, carrier]),
)
