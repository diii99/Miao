from pathlib import Path
p=Path('D:/Miao/scripts/verify_xijiang_navigation.ts')
s=p.read_text(encoding='utf-8')
s+='''
for (const bridge of layout.bridges) {
  const bankA = snapToWalkway(bridge.x, bridge.z - 2.75)
  const bankB = snapToWalkway(bridge.x, bridge.z + 2.75)
  const crossing = routeTo(bankA, bankB)
  assert(crossing.length > 2, `Bridge at ${bridge.x} does not connect both banks`)
  assert(crossing.some(p => Math.abs(p.x - bridge.x) < .15 && Math.abs(p.z - bridge.z) < .18), `Route avoids bridge at ${bridge.x}`)
  assert(crossing.every(p => p.y >= .4), `Bridge at ${bridge.x} crosses below its deck`)
}
console.log(`${layout.bridges.length} bridge crossings connect both banks`)
'''
p.write_text(s,encoding='utf-8')
