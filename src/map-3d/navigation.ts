import layout from './xijiang-layout.json'

type Point = { x: number; y: number; z: number }
type Node = Point & { width: number; edges: Set<number> }
const nodes: Node[] = []
const cells = new Map<string, number[]>()
const cellSize = .3
function add(p: number[], width: number) {
  const cx = Math.floor(p[0] / cellSize), cz = Math.floor(p[2] / cellSize)
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    for (const id of cells.get(`${cx + dx},${cz + dz}`) ?? []) {
      const n = nodes[id]
      if (Math.hypot(n.x - p[0], n.z - p[2]) < .13 && Math.abs(n.y - p[1]) < .25) {
        n.width = Math.max(n.width, width)
        return id
      }
    }
  }
  const id = nodes.length
  nodes.push({ x: p[0], y: p[1], z: p[2], width, edges: new Set() })
  const key = `${cx},${cz}`
  cells.set(key, [...(cells.get(key) ?? []), id])
  return id
}
for (const path of layout.paths) {
  let last: number | undefined
  for (let i = 0; i < path.points.length - 1; i++) {
    const a = path.points[i], b = path.points[i + 1]
    const steps = Math.max(1, Math.ceil(Math.hypot(a[0] - b[0], a[2] - b[2]) / .18))
    for (let k = 0; k <= steps; k++) {
      const id = add(a.map((v, axis) => v + (b[axis] - v) * k / steps), path.width)
      if (last !== undefined && last !== id) { nodes[last].edges.add(id); nodes[id].edges.add(last) }
      last = id
    }
  }
}
function nearest(x: number, z: number) {
  let best = 0, distance = Infinity
  nodes.forEach((n, id) => { const d = Math.hypot(x - n.x, z - n.z); if (d < distance) { distance = d; best = id } })
  return { id: best, node: nodes[best], distance }
}
export function snapToWalkway(x: number, z: number): Point { return nearest(x, z).node }
export function walkableStep(x: number, z: number): Point | null {
  // Manual movement uses local spatial cells, not a full 3,600-node scan each frame.
  const cx = Math.floor(x / cellSize), cz = Math.floor(z / cellSize)
  let best: Node | undefined, distance = Infinity
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) {
    for (const id of cells.get(`${cx + dx},${cz + dz}`) ?? []) {
      const n = nodes[id], d = Math.hypot(x - n.x, z - n.z)
      if (d < distance) { best = n; distance = d }
    }
  }
  return best && distance <= best.width / 2 - .06 ? { x, z, y: best.y } : null
}
/** A* on the same paths exported with the model; rivers can only be crossed on bridges. */
export function routeTo(from: Point, to: Point): Point[] {
  const start = nearest(from.x, from.z).id, end = nearest(to.x, to.z).id
  const open = new Set([start]), came = new Map<number, number>(), cost = new Map([[start, 0]])
  const heuristic = (id: number) => Math.hypot(nodes[id].x - nodes[end].x, nodes[id].z - nodes[end].z)
  while (open.size) {
    let current = -1, score = Infinity
    for (const id of open) { const f = cost.get(id)! + heuristic(id); if (f < score) { score = f; current = id } }
    if (current === end) {
      const result: Point[] = [nodes[end]]
      while (came.has(current)) { current = came.get(current)!; result.unshift(nodes[current]) }
      return result
    }
    open.delete(current)
    for (const next of nodes[current].edges) {
      const a = nodes[current], b = nodes[next]
      const g = cost.get(current)! + Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
      if (g < (cost.get(next) ?? Infinity)) { came.set(next, current); cost.set(next, g); open.add(next) }
    }
  }
  return []
}
export const navigationStats = { nodes: nodes.length, paths: layout.paths.length }
