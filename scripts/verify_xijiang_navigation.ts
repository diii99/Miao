import { routeTo, snapToWalkway, walkableStep, navigationStats } from '../src/map-3d/navigation'
import layout from '../src/map-3d/xijiang-layout.json'
import { strict as assert } from 'node:assert'
const start = snapToWalkway(layout.pois[1].x, layout.pois[1].z)
for (const poi of layout.pois) {
  const target = snapToWalkway(poi.x, poi.z)
  const route = routeTo(start, target)
  assert(route.length > 0, `Unreachable: ${poi.id}`)
  for (const p of route) {
    assert(walkableStep(p.x, p.z), `Nonwalkable step: ${poi.id}`)
    const river = 5 + 3.4 * Math.sin(p.x * .092) + .65 * Math.sin(p.x * .21)
    if (Math.abs(p.z - river) < 1.8) {
      assert(layout.bridges.some(b => Math.abs(p.x - b.x) < b.halfWidth && Math.abs(p.z - b.z) < b.halfLength), 'Route crosses open water')
      assert(p.y >= .4, 'Avatar is below bridge deck')
    }
  }
  console.log(poi.id, route.length, 'valid path points')
}
assert.equal(walkableStep(8, 5 + 3.4 * Math.sin(8 * .092) + .65 * Math.sin(8 * .21)), null)
console.log(navigationStats)
