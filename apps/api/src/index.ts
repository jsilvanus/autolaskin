import express, { type Express, Request, Response, NextFunction } from 'express'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { StorageFile, StorageEntry, Calculation, VehicleVersion, MaintenanceItem, SourceRef, DrivingProfile } from '@autolaskin/domain'
import { computeMaintenanceForecast } from '@autolaskin/vehicle-catalog'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_FILE = path.resolve(__dirname, '../data/calculations.json')
const VEHICLES_FILE = path.resolve(__dirname, '../data/vehicle-catalog.json')
const MAINTENANCE_FILE = path.resolve(__dirname, '../data/maintenance-data.json')
const SOURCES_FILE = path.resolve(__dirname, '../data/source-registry.json')
const PIN_RE = /^\d{6,8}$/

const app: Express = express()
app.use(express.json())

function isValidPin(pin: string): boolean {
  return PIN_RE.test(pin)
}

async function readStorage(): Promise<StorageFile> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8')
    return JSON.parse(raw) as StorageFile
  } catch {
    return { version: 1, calculations: {} }
  }
}

async function writeStorage(data: StorageFile): Promise<void> {
  const dir = path.dirname(DATA_FILE)
  await fs.mkdir(dir, { recursive: true })
  const tmp = DATA_FILE + '.tmp'
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf-8')
  await fs.rename(tmp, DATA_FILE)
}

// Vehicle catalog helpers
let _vehicles: VehicleVersion[] | null = null
let _maintenanceItems: MaintenanceItem[] | null = null

async function getVehicles(): Promise<VehicleVersion[]> {
  if (_vehicles) return _vehicles
  const raw = await fs.readFile(VEHICLES_FILE, 'utf-8')
  _vehicles = JSON.parse(raw) as VehicleVersion[]
  return _vehicles
}

async function getMaintenanceItems(): Promise<MaintenanceItem[]> {
  if (_maintenanceItems) return _maintenanceItems
  const raw = await fs.readFile(MAINTENANCE_FILE, 'utf-8')
  _maintenanceItems = JSON.parse(raw) as MaintenanceItem[]
  return _maintenanceItems
}

// GET /api/v1/calculations/:pin
app.get('/api/v1/calculations/:pin', async (req: Request, res: Response) => {
  const { pin } = req.params
  if (!isValidPin(pin)) {
    res.status(400).json({ error: 'Invalid PIN. Must be 6-8 digits.' })
    return
  }
  const storage = await readStorage()
  const entry = storage.calculations[pin]
  if (!entry) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  res.json(entry)
})

// PUT /api/v1/calculations/:pin
app.put('/api/v1/calculations/:pin', async (req: Request, res: Response) => {
  const { pin } = req.params
  if (!isValidPin(pin)) {
    res.status(400).json({ error: 'Invalid PIN. Must be 6-8 digits.' })
    return
  }
  const body = req.body as Calculation & { name?: string }
  const storage = await readStorage()
  const existing = storage.calculations[pin]
  const now = new Date().toISOString()

  const entry: StorageEntry = {
    name: body.name ?? existing?.name ?? pin,
    data: body,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
  storage.calculations[pin] = entry
  await writeStorage(storage)
  res.status(200).json(entry)
})

// DELETE /api/v1/calculations/:pin/data
app.delete('/api/v1/calculations/:pin/data', async (req: Request, res: Response) => {
  const { pin } = req.params
  if (!isValidPin(pin)) {
    res.status(400).json({ error: 'Invalid PIN. Must be 6-8 digits.' })
    return
  }
  const storage = await readStorage()
  const existing = storage.calculations[pin]
  if (!existing) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const now = new Date().toISOString()
  storage.calculations[pin] = {
    ...existing,
    data: null,
    updatedAt: now,
  }
  await writeStorage(storage)
  res.json({ message: 'Data cleared', pin })
})

// GET /api/v1/vehicles — list all vehicle versions (summary)
app.get('/api/v1/vehicles', async (_req: Request, res: Response) => {
  const vehicles = await getVehicles()
  const summary = vehicles.map(v => ({
    id: v.id,
    make: v.make,
    model: v.model,
    generation: v.generation,
    years: v.years,
    powertrain: v.powertrain,
    bodyStyle: v.bodyStyle,
    wltpKm: v.range?.wltpKm,
    estimatedWinterKm: v.range?.estimatedWinterKm,
    netKwh: v.battery?.netKwh,
  }))
  res.json(summary)
})

// GET /api/v1/vehicles/:id — full vehicle version details
app.get('/api/v1/vehicles/:id', async (req: Request, res: Response) => {
  const vehicles = await getVehicles()
  const vehicle = vehicles.find(v => v.id === req.params['id'])
  if (!vehicle) {
    res.status(404).json({ error: 'Vehicle not found' })
    return
  }
  res.json(vehicle)
})

// GET /api/v1/vehicles/:id/maintenance — maintenance items for this vehicle
app.get('/api/v1/vehicles/:id/maintenance', async (req: Request, res: Response) => {
  const vehicles = await getVehicles()
  const vehicle = vehicles.find(v => v.id === req.params['id'])
  if (!vehicle) {
    res.status(404).json({ error: 'Vehicle not found' })
    return
  }
  const items = await getMaintenanceItems()
  const applicable = items.filter(item => item.vehicleVersionIds.includes(vehicle.id))
  res.json(applicable)
})

// GET /api/v1/vehicles/:id/forecast
app.get('/api/v1/vehicles/:id/forecast', async (req: Request, res: Response) => {
  const vehicles = await getVehicles()
  const vehicle = vehicles.find(v => v.id === req.params['id'])
  if (!vehicle) {
    res.status(404).json({ error: 'Vehicle not found' })
    return
  }

  const q = req.query
  const annualKm = q['annualKm'] ? parseInt(q['annualKm'] as string) : 15000
  const ownershipYears = q['ownershipYears'] ? parseInt(q['ownershipYears'] as string) : 5
  const currentOdometerKm = q['currentOdometerKm'] ? parseInt(q['currentOdometerKm'] as string) : 0
  const winterDriving = q['winterDriving'] !== 'false'

  const profile: DrivingProfile = {
    annualKm,
    ownershipYears,
    currentOdometerKm,
    winterDriving,
    drivingStyle: 'mixed',
    homeCharging: true,
    workCharging: false,
    publicCharging: false,
  }

  const items = await getMaintenanceItems()
  const forecast = computeMaintenanceForecast(vehicle, profile, items, 0)
  res.json(forecast)
})

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' })
})

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env['PORT'] ? parseInt(process.env['PORT']) : 3001
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`)
})

export default app
