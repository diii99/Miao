from pathlib import Path
p=Path('D:/Miao/src/map-3d/MiaoVillageScene.tsx')
s=p.read_text(encoding='utf-8')
s=s.replace("import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'", "import { routeTo, snapToWalkway, walkableStep } from './navigation'")
s=s.replace('buildMiaoVillage, getTerrainHeight, LANDMARK_POIS', 'buildMiaoVillage, LANDMARK_POIS')
s=s.replace("  // Joystick state", "  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')\n  const [loadAttempt, setLoadAttempt] = useState(0)\n  const stateRef = useRef({ cameraMode, isSprinting, isDancing, nearbyPOI, timeOfDay })\n  stateRef.current = { cameraMode, isSprinting, isDancing, nearbyPOI, timeOfDay }\n  const routeRef = useRef<Array<{ x: number; y: number; z: number }>>([])\n\n  // Joystick state")
s=s.replace('camera.position.set(0, 34, 0.6)', 'camera.position.set(42, 48, 65)')
s=s.replace('controls.target.set(0, 1.2, 0)', 'controls.target.set(0, 2, -2)')
s=s.replace('    const targetY = getTerrainHeight(tx, tz)\n    sceneContext.current.targetPos.set(tx, targetY, tz)', '    const target = snapToWalkway(tx, tz)\n    const targetY = target.y\n    routeRef.current = routeTo(sceneContext.current.avatar.group.position, target)\n    sceneContext.current.targetPos.set(target.x, target.y, target.z)')
s=s.replace('    const width = container.clientWidth', "    let disposed = false\n    setLoadState('loading')\n    const width = container.clientWidth",1)
s=s.replace('new THREE.FogExp2(timeConf.fog, 0.018)', 'new THREE.FogExp2(timeConf.fog, 0.005)')
s=s.replace('renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))', 'renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))')
s=s.replace('renderer.toneMappingExposure = 1.15', 'renderer.toneMappingExposure = .95')
s=s.replace('= -28', '= -45').replace('= 28', '= 45')
start=s.index('    // Lux3D landmarks')
end=s.index('    // 5. Create',start)
s=s[:start]+'''    let modelReady = false
    village.ready.then(() => {
      if (disposed) return
      const conf = TIME_CONFIGS[stateRef.current.timeOfDay]
      village.windowMaterials.forEach(mat => { mat.emissiveIntensity = conf.windowEmissive; mat.emissive.setHex(conf.windowEmissiveColor) })
      modelReady = true
      setLoadState('ready')
    }).catch(error => { if (!disposed) { console.error('Map model failed to load', error); setLoadState('error') } })

'''+s[end:]
s=s.replace('    const startY = getTerrainHeight(startPOI.position[0], startPOI.position[2])', '    const startY = startPOI.position[1]\n    avatar.group.scale.setScalar(.48)')
s=s.replace("    const handlePointerUp = (e: PointerEvent) => {\n      if (Math.abs(e.movementX) > 5 || Math.abs(e.movementY) > 5) return", "    let pointerStart = { x: 0, y: 0 }\n    const handlePointerDown = (e: PointerEvent) => { pointerStart = { x: e.clientX, y: e.clientY } }\n    renderer.domElement.addEventListener('pointerdown', handlePointerDown)\n    const handlePointerUp = (e: PointerEvent) => {\n      if (!modelReady || Math.hypot(e.clientX - pointerStart.x, e.clientY - pointerStart.y) > 6) return")
s=s.replace('raycaster.intersectObjects(scene.children, true)', 'raycaster.intersectObjects(village.group.children, true)')
s=s.replace('distanceToLandmark < 4', 'distanceToLandmark < 1.6')
s=s.replace("            targetPos.set(lx, getTerrainHeight(lx, lz), lz)\n            beaconMesh.position.set(lx, getTerrainHeight(lx, lz) + 0.1, lz)", "            const target = snapToWalkway(lx, lz)\n            routeRef.current = routeTo(avatar.group.position, target)\n            targetPos.copy(target)\n            beaconMesh.position.set(target.x, target.y + .1, target.z)")
start=s.index('        const hx = THREE.MathUtils.clamp')
end=s.index('        beaconMesh.visible = true',start)
s=s[:start]+'''        const target = snapToWalkway(hit.point.x, hit.point.z)
        routeRef.current = routeTo(avatar.group.position, target)
        targetPos.copy(target)
        beaconMesh.position.set(target.x, target.y + .1, target.z)
'''+s[end:]
s=s.replace("        if (nearbyPOI) {\n          callbacksRef.current.onOpenExplore?.(nearbyPOI)", "        if (stateRef.current.nearbyPOI) {\n          if (stateRef.current.nearbyPOI.id === 'lusheng') { setIsLushengViewerOpen(true); setIsLushengCopyOpen(true) }\n          else callbacksRef.current.onOpenExplore?.(stateRef.current.nearbyPOI)")
s=s.replace("      keysDown.add(e.key.toLowerCase())", "      if ((e.target as HTMLElement)?.closest('input, textarea, select')) return\n      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault()\n      keysDown.add(e.key.toLowerCase())")
s=s.replace("    window.addEventListener('keyup', handleKeyUp)", "    window.addEventListener('keyup', handleKeyUp)\n    const handleBlur = () => { keysDown.clear(); setIsSprinting(false); joystickRef.current.active = false }\n    window.addEventListener('blur', handleBlur)")
s=s.replace("    window.addEventListener('resize', handleResize)", "    window.addEventListener('resize', handleResize)\n    const resizeObserver = new ResizeObserver(handleResize)\n    resizeObserver.observe(container)")
s=s.replace('      const elapsed = clock.getElapsedTime()', '      const elapsed = clock.getElapsedTime()\n      const { cameraMode, isSprinting, isDancing } = stateRef.current')
start=s.index('        avatar.group.position.addScaledVector')
end=s.index('        // Turn towards',start)
s=s[:start]+'''        const candidate = avatar.group.position.clone().addScaledVector(moveDir, moveSpeed)
        const next = walkableStep(candidate.x, candidate.z)
        if (next) avatar.group.position.copy(next)
        routeRef.current = []

'''+s[end:]
s=s.replace('        const dist = Math.hypot(targetPos.x - curPos.x, targetPos.z - curPos.z)', '''        while (routeRef.current.length && Math.hypot(routeRef.current[0].x - curPos.x, routeRef.current[0].z - curPos.z) < .09) routeRef.current.shift()
        const waypoint = routeRef.current[0]
        const dist = waypoint ? Math.hypot(waypoint.x - curPos.x, waypoint.z - curPos.z) : 0''')
s=s.replace('if (dist > 0.12)', 'if (waypoint && dist > .02)')
s=s.replace('new THREE.Vector3(targetPos.x - curPos.x, 0, targetPos.z - curPos.z)', 'new THREE.Vector3(waypoint.x - curPos.x, 0, waypoint.z - curPos.z)')
s=s.replace('curPos.y = getTerrainHeight(curPos.x, curPos.z)', 'curPos.y = waypoint.y')
s=s.replace('      let minDist = 4.0', '      let minDist = 1.6')
s=s.replace('new THREE.Vector3(0, 1.2, 0)\n        const deltaTarget = centerPos', 'new THREE.Vector3(0, 2, -2)\n        const deltaTarget = centerPos')
s=s.replace('      if (!hasRendered) {', '      if (!hasRendered && modelReady) {')
s=s.replace('      cancelAnimationFrame(animId)', '      disposed = true\n      routeRef.current = []\n      resizeObserver.disconnect()\n      village.dispose()\n      sceneContext.current = null\n      cancelAnimationFrame(animId)\n      renderer.domElement.removeEventListener(\'pointerdown\', handlePointerDown)\n      window.removeEventListener(\'blur\', handleBlur)')
s=s.replace('  }, [])\n\n  // Apply Time', '  }, [loadAttempt])\n\n  // Apply Time')
s=s.replace("timeOfDay === 'night' ? 0.024 : 0.016", "timeOfDay === 'night' ? 0.009 : 0.005")
s=s.replace('<h1>西江千户苗寨 模拟地图</h1>', '<h1>西江 · 河谷千户</h1>')
s=s.replace('<p>滚轮/双指自由缩放 · 俯瞰苗乡山水市井</p>', '<p>空间示意 · 2026.09 研究版 · 非实地导航</p>')
s=s.replace('      {/* Top HUD:', '''      {loadState !== 'ready' && <div className="map-model-status" role="status">
        <strong>{loadState === 'loading' ? '正在展开河谷与千户屋顶…' : '地图模型加载失败'}</strong>
        {loadState === 'error' && <button type="button" onClick={() => setLoadAttempt(n => n + 1)}>重新加载</button>}
      </div>}
      {/* Top HUD:''')
s=s.replace("                {poi.kind === 'waterwheel' && '🌊'}", "                {poi.kind === 'museum' && '🏛️'}")
s=s.replace('<p>{nearbyPOI.detail}</p>', '<p>{nearbyPOI.evidence}</p>')
s=s.replace("              else callbacksRef.current.onOpenExplore?.(nearbyPOI)", "              else if (nearbyPOI.id === 'lookout') handleSetCameraPreset('follow')\n              else callbacksRef.current.onOpenExplore?.(nearbyPOI)")
s=s.replace('          {LANDMARK_POIS.map((poi, idx) => (', '          {LANDMARK_POIS.map((poi, idx) => (')
s=s.replace('              className={`landmark-pill', "              disabled={loadState !== 'ready'}\n              className={`landmark-pill")
p.write_text(s,encoding='utf-8')
p=Path('D:/Miao/src/main.tsx');s=p.read_text(encoding='utf-8')
s=s.replace('西江千户苗寨 · 非遗实景', '{exploringPOI.evidence}')
s=s.replace("exploringPOI.kind === 'lookout'", "exploringPOI.kind === 'museum'")
s=s.replace('<i>🏞️ 真实古建</i>', '<i>🏞️ 空间示意</i>')
s=s.replace('<p>{exploringPOI.lore}</p>', '<p>{exploringPOI.lore}</p>\n                  {exploringPOI.sources.map((url, i) => <a key={url} href={url} target="_blank" rel="noreferrer">研究来源 {i + 1} ↗ </a>)}')
p.write_text(s,encoding='utf-8')
