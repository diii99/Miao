import data from './xijiang-terrain.json'
import pads from './xijiang-terrain-pads.json'
import layout from './xijiang-layout.json'

export const riverCenter = (x: number) => 5 + 3.4 * Math.sin(x * .092) + .65 * Math.sin(x * .21)
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
function interpolate(values: number[], distance: number) {
  const ds = data.distancesM, d = clamp(distance, 0, ds.at(-1)!)
  const i = Math.min(ds.length - 2, Math.floor(d / (ds[1] - ds[0])))
  return values[i] + (values[i + 1] - values[i]) * (d - ds[i]) / (ds[i + 1] - ds[i])
}
/** Measured sectional grades, adapted to the schematic river; no vertical exaggeration. */
export function naturalTerrainHeight(x: number, z: number) {
  const river = riverCenter(x), distance = Math.abs(z - river)
  if (distance < 1.85) return -.62
  if (distance <= 3.1) return .32
  const profiles = data.profiles
  let index = profiles.findIndex((_, i) => i < profiles.length - 1 && x <= profiles[i + 1].sceneX)
  if (index < 0) index = profiles.length - 2
  const a = profiles[index], b = profiles[index + 1]
  const blend = clamp((x - a.sceneX) / (b.sceneX - a.sceneX), 0, 1)
  const side = z < river ? 'ne' : 'sw'
  const rise = (p: typeof a) => Math.max(0, interpolate(p[side], distance * data.horizontalMetresPerUnit) - interpolate(p[side], 31)) / data.verticalMetresPerUnit
  return .32 + rise(a) * (1 - blend) + rise(b) * blend
}
/** Civic pads are local authored grading; source samples retain their absolute elevations. */
export function ungradedTerrainHeight(x: number, z: number) {
  let value = naturalTerrainHeight(x, z)
  for (const pad of pads) {
    const d = Math.max(Math.abs(x - pad.x) - pad.halfWidth, Math.abs(z - pad.z) - pad.halfDepth, 0)
    if (d >= pad.feather) continue
    const t = d / pad.feather, weight = 1 - t * t * (3 - 2 * t)
    value = value * (1 - weight) + pad.y * weight
  }
  return value
}


type Segment = { a: number[]; b: number[]; dx: number; dz: number; length2: number; radius: number }
const walkwayCells = new Map<string, Segment[]>()
for (const path of layout.paths) {
  if (path.kind === 'bridge') continue
  const radius = path.width / 2 + .20, margin = radius + .28
  for (let i = 0; i < path.points.length - 1; i++) {
    const a = path.points[i], b = path.points[i + 1], dx = b[0] - a[0], dz = b[2] - a[2], length2 = dx * dx + dz * dz
    if (length2 < 1e-10) continue
    const segment = { a, b, dx, dz, length2, radius }
    for (let x = Math.floor(Math.min(a[0], b[0]) - margin); x <= Math.floor(Math.max(a[0], b[0]) + margin); x++) {
      for (let z = Math.floor(Math.min(a[2], b[2]) - margin); z <= Math.floor(Math.max(a[2], b[2]) + margin); z++) {
        const key = `${x},${z}`
        if (!walkwayCells.has(key)) walkwayCells.set(key, [])
        walkwayCells.get(key)!.push(segment)
      }
    }
  }
}
/** Local cut/fill benches match the same exported road heights, including their width. */
export function getTerrainHeight(x: number, z: number) {
  const base = ungradedTerrainHeight(x, z)
  if (Math.abs(z - riverCenter(x)) < 1.85) return base
  let best: number | undefined
  for (const s of walkwayCells.get(`${Math.floor(x)},${Math.floor(z)}`) ?? []) {
    const t = clamp(((x - s.a[0]) * s.dx + (z - s.a[2]) * s.dz) / s.length2, 0, 1)
    const d = Math.hypot(x - s.a[0] - s.dx * t, z - s.a[2] - s.dz * t)
    if (d > s.radius + .28) continue
    const target = s.a[1] + (s.b[1] - s.a[1]) * t - .10
    const weight = 1 - clamp((d - s.radius) / .28, 0, 1)
    const candidate = base * (1 - weight) + target * weight
    best = best === undefined ? candidate : Math.min(best, candidate)
  }
  return best ?? base
}
