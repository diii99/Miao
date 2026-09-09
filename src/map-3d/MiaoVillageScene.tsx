import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { routeTo, snapToWalkway, walkableStep } from './navigation'
import { createMiaoAvatar, OUTFIT_PRESETS, type AvatarRig } from './avatar'
import { buildMiaoVillage, LANDMARK_POIS, type LandmarkPOI } from './villageBuilder'
import { miaoSound } from './audioAmbiance'

export type TimeOfDay = 'morning' | 'day' | 'sunset' | 'night'
export type CameraMode = 'follow' | 'panoramic' | 'photo' | 'lookout' | 'landmark'

export interface VillagePlace {
  name: string
  note: string
  detail: string
  kind: string
  world: [number, number]
}

type Props = {
  places?: VillagePlace[]
  selected?: number
  onSelect?: (index: number) => void
  onWalkingChange?: (walking: boolean) => void
  onOpenExplore?: (poi: LandmarkPOI) => void
  onReady?: () => void
}

const TIME_CONFIGS: Record<TimeOfDay, {
  name: string
  sky: number
  fog: number
  sunColor: number
  sunIntensity: number
  sunPos: [number, number, number]
  hemiSky: number
  hemiGround: number
  hemiIntensity: number
  windowEmissive: number
  windowEmissiveColor: number
  lanternIntensity: number
}> = {
  morning: {
    name: '晨曦晨雾',
    sky: 0x98c5d9,
    fog: 0xaecfe0,
    sunColor: 0xffdfba,
    sunIntensity: 2.8,
    sunPos: [-18, 10, 12],
    hemiSky: 0xd4ecf7,
    hemiGround: 0x3d5236,
    hemiIntensity: 1.8,
    windowEmissive: 0.4,
    windowEmissiveColor: 0xffaa44,
    lanternIntensity: 0.3,
  },
  day: {
    name: '晴空丽日',
    sky: 0xdce4e8,
    fog: 0xdce4e8,
    sunColor: 0xfffaf2,
    sunIntensity: 1.7,
    sunPos: [-10, 22, 10],
    hemiSky: 0xe5f5ff,
    hemiGround: 0x2e4726,
    hemiIntensity: 1.15,
    windowEmissive: 0,
    windowEmissiveColor: 0xffbb55,
    lanternIntensity: 0.2,
  },
  sunset: {
    name: '落日晚霞',
    sky: 0xdf7a52,
    fog: 0xd6724d,
    sunColor: 0xff6b35,
    sunIntensity: 3.2,
    sunPos: [20, 7, -15],
    hemiSky: 0xffcca6,
    hemiGround: 0x42261b,
    hemiIntensity: 1.6,
    windowEmissive: 1.2,
    windowEmissiveColor: 0xff7722,
    lanternIntensity: 1.1,
  },
  night: {
    name: '千户夜景',
    sky: 0x081528,
    fog: 0x0a182d,
    sunColor: 0x5a7ca8,
    sunIntensity: 0.8,
    sunPos: [-12, 16, 8],
    hemiSky: 0x536b8b,
    hemiGround: 0x24382e,
    hemiIntensity: 1.5,
    windowEmissive: 2.4,
    windowEmissiveColor: 0xff8800,
    lanternIntensity: 2.2,
  },
}

export function MiaoVillageScene({ selected = 1, onWalkingChange, onOpenExplore, onReady }: Props) {
  const labelRefs = useRef(new Map<string, HTMLButtonElement>())
  const [showAccess, setShowAccess] = useState(false)
  const [focusedPOI, setFocusedPOI] = useState<LandmarkPOI | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Interactive UI States
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day')
  const [cameraMode, setCameraMode] = useState<CameraMode>('panoramic')
  const [outfitIndex, setOutfitIndex] = useState(0)
  const [isAudioOn, setIsAudioOn] = useState(false)
  const [isDancing, setIsDancing] = useState(false)
  const [, setActivePOI] = useState<LandmarkPOI | null>(null)
  const [nearbyPOI, setNearbyPOI] = useState<LandmarkPOI | null>(null)
  const [currentSelectedIdx, setCurrentSelectedIdx] = useState(selected)
  const [isSprinting, setIsSprinting] = useState(false)
  const [isLushengViewerOpen, setIsLushengViewerOpen] = useState(false)
  const [isLushengCopyOpen, setIsLushengCopyOpen] = useState(true)

  const [localPOI, setLocalPOI] = useState<LandmarkPOI | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadAttempt, setLoadAttempt] = useState(0)
  const stateRef = useRef({ cameraMode, isSprinting, isDancing, nearbyPOI, timeOfDay })
  stateRef.current = { cameraMode, isSprinting, isDancing, nearbyPOI, timeOfDay }
  const routeRef = useRef<Array<{ x: number; y: number; z: number }>>([])

  // Joystick state
  const joystickRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false })
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 })
  const [joystickActive, setJoystickActive] = useState(false)

  // Internal references to 3D scene objects
  const sceneContext = useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    controls: OrbitControls
    sunLight: THREE.DirectionalLight
    hemiLight: THREE.HemisphereLight
    avatar: AvatarRig
    village: ReturnType<typeof buildMiaoVillage>
    targetPos: THREE.Vector3
    beaconMesh: THREE.Mesh
    isMoving: boolean
    chimeTimer: number
  } | null>(null)

  // Keep latest callbacks
  const callbacksRef = useRef({ onWalkingChange, onOpenExplore: onOpenExplore ?? setLocalPOI, onReady })
  callbacksRef.current = { onWalkingChange, onOpenExplore: onOpenExplore ?? setLocalPOI, onReady }

  // Camera presets
  const handleSetCameraPreset = useCallback((preset: 'overview' | 'follow' | 'photo' | 'lookout') => {
    if (!sceneContext.current) return
    const { camera, controls, avatar } = sceneContext.current
    if (preset === 'overview') {
      setCameraMode('panoramic')
      controls.target.set(0, 2, -2)
      camera.position.set(42, 48, 65).multiplyScalar(camera.aspect < .8 ? 1.8 : 1)
    } else if (preset === 'lookout') {
      setCameraMode('lookout')
      const p = LANDMARK_POIS.find(p => p.id === 'lookout')!.position
      camera.position.set(p[0], p[1] + 2.8, p[2] - 2)
      controls.target.set(0, 1, 7)
    } else if (preset === 'follow') {
      setCameraMode('follow')
      const aPos = avatar.group.position
      controls.target.set(aPos.x, aPos.y + 1.2, aPos.z)
      camera.position.set(aPos.x, aPos.y + 3.2, aPos.z + 5.5)
    } else if (preset === 'photo') {
      setCameraMode('photo')
      const aPos = avatar.group.position
      controls.target.set(aPos.x, aPos.y + 1.2, aPos.z)
      camera.position.set(aPos.x + 1.2, aPos.y + 1.3, aPos.z + 2.0)
    }
  }, [])

  const focusLandmark = useCallback((poi: LandmarkPOI) => {
    const context = sceneContext.current
    if (!context) return
    setFocusedPOI(poi)
    setCurrentSelectedIdx(LANDMARK_POIS.findIndex(p => p.id === poi.id))
    setCameraMode('landmark')
    const [x, y, z] = poi.position
    context.controls.target.set(x, y, z)
    const distance = context.camera.aspect < .8 ? 1.35 : 1
    context.camera.position.set(x + 9 * distance, y + 14 * distance, z + 19 * distance)
  }, [])

  // Navigate to a specific landmark
  const navigateToLandmark = useCallback((poi: LandmarkPOI) => {
    if (!sceneContext.current) return
    const [tx, , tz] = poi.position
    const target = snapToWalkway(tx, tz)
    const targetY = target.y
    routeRef.current = routeTo(sceneContext.current.avatar.group.position, target)
    sceneContext.current.targetPos.set(target.x, target.y, target.z)
    sceneContext.current.beaconMesh.position.set(tx, targetY + 0.12, tz)
    sceneContext.current.beaconMesh.visible = true
    sceneContext.current.isMoving = true
    setActivePOI(poi)
    callbacksRef.current.onWalkingChange?.(true)
  }, [])

  // Initialize WebGL Scene
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let disposed = false
    setLoadState('loading')
    document.documentElement.classList.remove('miniapp-map-booting')
    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight

    // 1. Three.js Scene, Camera, Renderer
    const scene = new THREE.Scene()
    const timeConf = TIME_CONFIGS[timeOfDay]
    scene.background = new THREE.Color(timeConf.sky)
    scene.fog = new THREE.FogExp2(timeConf.fog, 0.002)

    // Camera with large far clipping plane for deep zooming out
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 400)
    // Start in the same overhead composition as “宏观全景”, centred on 芦笙场.
    camera.position.set(42, 48, 65).multiplyScalar(camera.aspect < .8 ? 1.8 : 1)

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = .95

    container.innerHTML = ''
    container.appendChild(renderer.domElement)

    // 2. Lighting
    const hemiLight = new THREE.HemisphereLight(timeConf.hemiSky, timeConf.hemiGround, timeConf.hemiIntensity)
    scene.add(hemiLight)

    const sunLight = new THREE.DirectionalLight(timeConf.sunColor, timeConf.sunIntensity)
    sunLight.position.set(...timeConf.sunPos)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.set(2048, 2048)
    sunLight.shadow.camera.left = -45
    sunLight.shadow.camera.right = 45
    sunLight.shadow.camera.top = 45
    sunLight.shadow.camera.bottom = -45
    sunLight.shadow.camera.near = 0.5
    sunLight.shadow.camera.far = 100
    sunLight.shadow.bias = -0.0004
    scene.add(sunLight)

    // 3. Orbit Controls: Configured for smooth and wide zoom range
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 1.0
    controls.maxDistance = 200.0
    controls.maxPolarAngle = Math.PI * 0.485
    controls.minPolarAngle = 0.02
    controls.zoomSpeed = 1.25
    controls.enableZoom = true
    controls.target.set(0, 2, -2)

    // 4. Build Real 3D Miao Village Scene
    const village = buildMiaoVillage()
    scene.add(village.group)

    let modelReady = false
    village.ready.then(() => {
      if (disposed) return
      const conf = TIME_CONFIGS[stateRef.current.timeOfDay]
      village.windowMaterials.forEach(mat => { mat.emissiveIntensity = conf.windowEmissive; mat.emissive.setHex(conf.windowEmissiveColor) })
      modelReady = true
      setLoadState('ready')
    }).catch(error => { if (!disposed) { console.error('Map model failed to load', error); setLoadState('error') } })

    // 5. Create 3D Animated Miao Girl Avatar
    const avatar = createMiaoAvatar(outfitIndex)
    const startPOI = LANDMARK_POIS[1] // Lusheng Plaza
    const startY = startPOI.position[1]
    avatar.group.scale.setScalar(.48)
    avatar.group.position.set(startPOI.position[0], startY, startPOI.position[2])
    scene.add(avatar.group)

    // Destination Beacon
    const beaconGeo = new THREE.RingGeometry(0.3, 0.65, 24)
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0xffd23f,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    })
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat)
    beaconMesh.rotation.x = -Math.PI / 2
    beaconMesh.visible = false
    scene.add(beaconMesh)

    const targetPos = new THREE.Vector3(startPOI.position[0], startY, startPOI.position[2])

    sceneContext.current = {
      scene,
      camera,
      renderer,
      controls,
      sunLight,
      hemiLight,
      avatar,
      village,
      targetPos,
      beaconMesh,
      isMoving: false,
      chimeTimer: 0,
    }

    // 6. Raycast Navigation (Click / Tap to Move)
    const raycaster = new THREE.Raycaster()
    const mousePointer = new THREE.Vector2()

    let pointerStart = { x: 0, y: 0 }
    const handlePointerDown = (e: PointerEvent) => { pointerStart = { x: e.clientX, y: e.clientY } }
    renderer.domElement.addEventListener('pointerdown', handlePointerDown)
    const handlePointerUp = (e: PointerEvent) => {
      if (!modelReady || Math.hypot(e.clientX - pointerStart.x, e.clientY - pointerStart.y) > 6) return
      const rect = renderer.domElement.getBoundingClientRect()
      mousePointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mousePointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mousePointer, camera)
      const hits = raycaster.intersectObjects(village.group.children, true)
      if (hits.length > 0) {
        const hit = hits[0]
        let landmarkObject: THREE.Object3D | null = hit.object
        while (landmarkObject && !landmarkObject.userData.poiId) landmarkObject = landmarkObject.parent
        const landmarkId = landmarkObject?.userData.poiId as string | undefined
        const landmark = landmarkId ? LANDMARK_POIS.find((poi) => poi.id === landmarkId) : undefined

        if (landmark) {
          const [lx, , lz] = landmark.position
          const distanceToLandmark = Math.hypot(avatar.group.position.x - lx, avatar.group.position.z - lz)
          if (distanceToLandmark < 1.6) {
            if (landmark.id === 'lusheng') {
              setIsLushengCopyOpen(true)
              setIsLushengViewerOpen(true)
            }
            else callbacksRef.current.onOpenExplore?.(landmark)
          } else {
            const target = snapToWalkway(lx, lz)
            routeRef.current = routeTo(avatar.group.position, target)
            targetPos.copy(target)
            beaconMesh.position.set(target.x, target.y + .1, target.z)
            beaconMesh.visible = true
            sceneContext.current!.isMoving = true
            callbacksRef.current.onWalkingChange?.(true)
          }
          return
        }
        const target = snapToWalkway(hit.point.x, hit.point.z)
        routeRef.current = routeTo(avatar.group.position, target)
        targetPos.copy(target)
        beaconMesh.position.set(target.x, target.y + .1, target.z)
        beaconMesh.visible = true
        sceneContext.current!.isMoving = true
        callbacksRef.current.onWalkingChange?.(true)
      }
    }
    renderer.domElement.addEventListener('pointerup', handlePointerUp)

    // 7. Keyboard Navigation (WASD / Arrow Keys)
    const keysDown = new Set<string>()
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input, textarea, select')) return
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault()
      keysDown.add(e.key.toLowerCase())
      if (e.key === 'Shift') setIsSprinting(true)
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault()
        setIsDancing((prev) => !prev)
        miaoSound.playLushengNote()
      }
      if (e.key.toLowerCase() === 'e') {
        if (stateRef.current.nearbyPOI) {
          if (stateRef.current.nearbyPOI.id === 'lusheng') { setIsLushengViewerOpen(true); setIsLushengCopyOpen(true) }
          else callbacksRef.current.onOpenExplore?.(stateRef.current.nearbyPOI)
        }
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown.delete(e.key.toLowerCase())
      if (e.key === 'Shift') setIsSprinting(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    const handleBlur = () => { keysDown.clear(); setIsSprinting(false); joystickRef.current.active = false }
    window.addEventListener('blur', handleBlur)

    // Resize Handler
    const handleResize = () => {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)
    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)

    // 8. Main Animation Loop
    const clock = new THREE.Clock()
    let animId = 0
    let hasRendered = false

    const animate = () => {
      animId = requestAnimationFrame(animate)
      const delta = Math.min(clock.getDelta(), 0.1)
      const elapsed = clock.getElapsedTime()
      const { cameraMode, isSprinting, isDancing } = stateRef.current

      // Update Village Scene (waterwheel, smoke particles, petals, cloths, NPCs)
      village.updateScene(delta, elapsed)

      // Beacon pulsating animation
      if (beaconMesh.visible) {
        const pulse = 1 + Math.sin(elapsed * 8) * 0.15
        beaconMesh.scale.set(pulse, pulse, pulse)
        ;(beaconMesh.material as THREE.MeshBasicMaterial).opacity = 0.5 + Math.sin(elapsed * 6) * 0.35
      }

      // Keyboard & Joystick Input Processing
      let moveX = 0
      let moveZ = 0
      if (keysDown.has('w') || keysDown.has('arrowup')) moveZ -= 1
      if (keysDown.has('s') || keysDown.has('arrowdown')) moveZ += 1
      if (keysDown.has('a') || keysDown.has('arrowleft')) moveX -= 1
      if (keysDown.has('d') || keysDown.has('arrowright')) moveX += 1

      if (joystickRef.current.active) {
        moveX = joystickRef.current.x
        moveZ = joystickRef.current.y
      }

      const hasManualInput = Math.abs(moveX) > 0.05 || Math.abs(moveZ) > 0.05

      if (hasManualInput && modelReady) {
        // Camera-relative movement
        const camEuler = new THREE.Euler(0, camera.rotation.y, 0, 'YXZ')
        const forward = new THREE.Vector3(0, 0, -1).applyEuler(camEuler).normalize()
        const right = new THREE.Vector3(1, 0, 0).applyEuler(camEuler).normalize()

        const moveDir = new THREE.Vector3()
          .addScaledVector(right, moveX)
          .addScaledVector(forward, -moveZ)
          .normalize()

        const moveSpeed = (isSprinting ? 5.2 : 3.0) * delta
        const candidate = avatar.group.position.clone().addScaledVector(moveDir, moveSpeed)
        const next = walkableStep(candidate.x, candidate.z)
        if (next) avatar.group.position.copy(next)
        routeRef.current = []

        // Turn towards movement direction
        const targetAngle = Math.atan2(moveDir.x, moveDir.z)
        avatar.group.rotation.y = THREE.MathUtils.lerp(avatar.group.rotation.y, targetAngle, 0.2)

        targetPos.copy(avatar.group.position)
        beaconMesh.visible = false
        sceneContext.current!.isMoving = true

        // Silver chime step sound
        sceneContext.current!.chimeTimer += delta
        if (sceneContext.current!.chimeTimer > (isSprinting ? 0.28 : 0.45)) {
          miaoSound.playSilverChime()
          sceneContext.current!.chimeTimer = 0
        }
      } else {
        // Target-following movement (Click to Move)
        const curPos = avatar.group.position
        while (routeRef.current.length && Math.hypot(routeRef.current[0].x - curPos.x, routeRef.current[0].z - curPos.z) < .09) routeRef.current.shift()
        const waypoint = routeRef.current[0]
        const dist = waypoint ? Math.hypot(waypoint.x - curPos.x, waypoint.z - curPos.z) : 0

        if (waypoint && dist > .02) {
          const moveSpeed = (isSprinting ? 4.8 : 2.8) * delta
          const nextDir = new THREE.Vector3(waypoint.x - curPos.x, 0, waypoint.z - curPos.z).normalize()
          curPos.addScaledVector(nextDir, Math.min(dist, moveSpeed))
          curPos.y = waypoint.y

          const targetAngle = Math.atan2(nextDir.x, nextDir.z)
          avatar.group.rotation.y = THREE.MathUtils.lerp(avatar.group.rotation.y, targetAngle, 0.18)

          sceneContext.current!.isMoving = true
          callbacksRef.current.onWalkingChange?.(true)

          sceneContext.current!.chimeTimer += delta
          if (sceneContext.current!.chimeTimer > (isSprinting ? 0.28 : 0.45)) {
            miaoSound.playSilverChime()
            sceneContext.current!.chimeTimer = 0
          }
        } else {
          if (sceneContext.current!.isMoving) {
            sceneContext.current!.isMoving = false
            beaconMesh.visible = false
            callbacksRef.current.onWalkingChange?.(false)
          }
        }
      }

      // Update Avatar Animations (articulated arms, legs, torso, head, silver bells, skirt)
      avatar.updateAnimation(
        delta,
        sceneContext.current!.isMoving,
        isSprinting,
        isDancing,
        isSprinting ? 1.4 : 1.0
      )

      // Check Proximity to Landmark POIs
      let closest: LandmarkPOI | null = null
      let minDist = 1.6
      for (const poi of LANDMARK_POIS) {
        const [px, , pz] = poi.position
        const d = Math.hypot(avatar.group.position.x - px, avatar.group.position.z - pz)
        if (d < minDist) {
          minDist = d
          closest = poi
        }
      }
      setNearbyPOI(closest)

      // Seamless Camera Controller:
      // Preserves user's zoom distance and angle while smoothly translating with the target
      if (cameraMode === 'follow') {
        const avatarHeadPos = avatar.group.position.clone().add(new THREE.Vector3(0, 1.2, 0))
        const deltaTarget = avatarHeadPos.clone().sub(controls.target)
        if (deltaTarget.lengthSq() > 0.00001) {
          const step = deltaTarget.multiplyScalar(0.12)
          controls.target.add(step)
          camera.position.add(step)
        }
      } else if (cameraMode === 'panoramic') {
        const centerPos = new THREE.Vector3(0, 2, -2)
        const deltaTarget = centerPos.clone().sub(controls.target)
        if (deltaTarget.lengthSq() > 0.00001) {
          controls.target.add(deltaTarget.multiplyScalar(0.08))
        }
      } else if (cameraMode === 'photo') {
        const photoTarget = avatar.group.position.clone().add(new THREE.Vector3(0, 1.2, 0))
        const deltaTarget = photoTarget.clone().sub(controls.target)
        if (deltaTarget.lengthSq() > 0.00001) {
          controls.target.add(deltaTarget.multiplyScalar(0.1))
        }
      }

      controls.update()
      // Project DOM labels without a React render per animation frame.
      const labelBounds: Array<{ x: number; y: number; w: number; h: number }> = []
      for (const poi of [...LANDMARK_POIS].sort((a, b) => Number(b.id === 'lusheng') - Number(a.id === 'lusheng'))) {
        const label = labelRefs.current.get(poi.id)
        if (!label) continue
        const world = new THREE.Vector3(poi.position[0], poi.position[1] + 1.8, poi.position[2])
        const projected = world.project(camera)
        const visible = modelReady && projected.z > -1 && projected.z < 1 && Math.abs(projected.x) < .96 && Math.abs(projected.y) < .85
        label.hidden = !visible
        if (visible) {
          const x = (projected.x + 1) * container.clientWidth / 2, y = (1 - projected.y) * container.clientHeight / 2
          const w = label.offsetWidth, h = label.offsetHeight
          const collision = labelBounds.some(b => Math.abs(x - b.x) < (w + b.w) / 2 + 6 && Math.abs(y - b.y) < Math.max(h, b.h) + 5)
          label.hidden = collision
          if (!collision) { labelBounds.push({ x, y, w, h }); label.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)` }
        }
      }
      renderer.render(scene, camera)
      if (!hasRendered && modelReady) {
        hasRendered = true
        callbacksRef.current.onReady?.()
      }
    }
    animate()

    return () => {
      disposed = true
      routeRef.current = []
      resizeObserver.disconnect()
      village.dispose()
      sceneContext.current = null
      cancelAnimationFrame(animId)
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('blur', handleBlur)
      renderer.domElement.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('resize', handleResize)
      const geometries = new Set<THREE.BufferGeometry>()
      const materials = new Set<THREE.Material>()
      avatar.group.traverse(child => {
        if (child instanceof THREE.Mesh) {
          geometries.add(child.geometry)
          for (const mat of Array.isArray(child.material) ? child.material : [child.material]) materials.add(mat)
        }
      })
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose())
      beaconGeo.dispose(); beaconMat.dispose()
      controls.dispose()
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [loadAttempt])

  // Apply Time of Day Lighting & Atmosphere
  useEffect(() => {
    if (!sceneContext.current) return
    const { scene, sunLight, hemiLight, village } = sceneContext.current
    const conf = TIME_CONFIGS[timeOfDay]

    scene.background = new THREE.Color(conf.sky)
    scene.fog = new THREE.FogExp2(conf.fog, timeOfDay === 'night' ? 0.0045 : 0.002)

    sunLight.color.setHex(conf.sunColor)
    sunLight.intensity = conf.sunIntensity
    sunLight.position.set(...conf.sunPos)

    hemiLight.color.setHex(conf.hemiSky)
    hemiLight.groundColor.setHex(conf.hemiGround)
    hemiLight.intensity = conf.hemiIntensity

    village.windowMaterials.forEach((mat) => {
      mat.emissiveIntensity = conf.windowEmissive
      mat.emissive.setHex(conf.windowEmissiveColor)
    })

    village.lanternLights.forEach((l) => {
      l.intensity = conf.lanternIntensity
    })
  }, [timeOfDay])

  // Apply Avatar Outfit Change
  useEffect(() => {
    if (!sceneContext.current) return
    sceneContext.current.avatar.setOutfitIndex(outfitIndex)
  }, [outfitIndex])

  // Joystick touch/drag handlers
  const handleJoystickMove = (clientX: number, clientY: number, baseRect: DOMRect) => {
    const centerX = baseRect.left + baseRect.width / 2
    const centerY = baseRect.top + baseRect.height / 2
    const maxRadius = baseRect.width / 2

    let dx = clientX - centerX
    let dy = clientY - centerY
    const dist = Math.hypot(dx, dy)

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius
      dy = (dy / dist) * maxRadius
    }

    const normX = dx / maxRadius
    const normY = dy / maxRadius

    joystickRef.current = { x: normX, y: normY, active: true }
    setJoystickPos({ x: dx, y: dy })
    setJoystickActive(true)
  }

  const handleJoystickEnd = () => {
    joystickRef.current = { x: 0, y: 0, active: false }
    setJoystickPos({ x: 0, y: 0 })
    setJoystickActive(false)
  }

  return (
    <div className="miao-real-scene-container" aria-label="西江千户苗寨三维漫游场景">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={containerRef} className="miao-3d-canvas-viewport" />

      {loadState !== 'ready' && <div className="map-model-status" role="status">
        <strong>{loadState === 'loading' ? '正在展开河谷与千户屋顶…' : '地图模型加载失败'}</strong>
        {loadState === 'error' && <button type="button" onClick={() => setLoadAttempt(n => n + 1)}>重新加载</button>}
      </div>}
      <div className="map-landmark-labels" aria-label="地图地标标注">
        {LANDMARK_POIS.filter(p => ['lusheng','museum','lookout','bridge','terraces','gaga','yedong'].includes(p.id)).map(poi => <button
          key={poi.id} ref={el => { if (el) labelRefs.current.set(poi.id, el); else labelRefs.current.delete(poi.id) }}
          hidden type="button" className={`map-world-label ${poi.id === 'lusheng' ? 'primary' : ''}`}
          onClick={() => focusLandmark(poi)} aria-label={`定位${poi.name}`}>{poi.name}</button>)}
      </div>
      {focusedPOI && <section className="map-focus-card" aria-label="选中地标">
        <button type="button" className="map-focus-close" aria-label="关闭地标卡片" onClick={() => setFocusedPOI(null)}>×</button>
        <small>已定位 · {focusedPOI.evidence}</small><h2>{focusedPOI.name}</h2><p>{focusedPOI.detail}</p>
        <button type="button" onClick={() => { navigateToLandmark(focusedPOI); setFocusedPOI(null) }}>沿路步行前往</button>
        <button type="button" onClick={() => { if (focusedPOI.id === 'lusheng') { setIsLushengViewerOpen(true); setIsLushengCopyOpen(true) } else callbacksRef.current.onOpenExplore?.(focusedPOI) }}>查看详情</button>
      </section>}
      <button type="button" className="map-access-toggle" onClick={() => setShowAccess(true)}>入寨入口与换乘</button>
      {showAccess && <section className="map-local-detail" role="dialog" aria-modal="true" aria-label="入寨入口与换乘">
        <button className="map-local-close" type="button" onClick={() => setShowAccess(false)} aria-label="关闭入口说明">×</button>
        <small>外围关系示意 · 核心寨区之外</small><h2>从哪里进入西江</h2>
        <h3>西门方向</h3><p>西门游客服务中心 — 西街 — 长肖 — 观景台 — 一号风雨桥 — 核心寨区</p>
        <h3>北门方向</h3><p>大北门 — 小北门 — 古街 / 游方街 — 芦笙场与核心寨区</p>
        <h3>索道与观光车</h3><p>历史官方游线包含西门与大北门间的索道，以及部分摆渡车段。这些节点关系不是逐段步行路线；运行区间、停运和班次请以景区当日公告为准。</p>
        <p>地图中的“河谷入口”是虚拟漫游起点，不代表西门或北门。外围入口没有被压缩放进核心村寨模型。</p>
        <a href="https://www.xjqhmz.com/news/detail?id=663340855012204545" target="_blank" rel="noreferrer">景区官方历史游线（2023） ↗</a>
      </section>}
      {/* Top HUD: Title & Weather/Time of Day Switcher */}
      <header className="scene-top-hud">
        <div className="scene-brand">
          <h1>西江 · 河谷千户</h1>
          <button type="button" className="find-lusheng" disabled={loadState !== 'ready'} onClick={() => focusLandmark(LANDMARK_POIS.find(p => p.id === 'lusheng')!)}>⌖ 芦笙广场在哪里</button>
        </div>

        {/* Time of Day Switcher */}
        <div className="tod-switcher" aria-label="时间与光影切换">
          {(Object.keys(TIME_CONFIGS) as TimeOfDay[]).map((tod) => (
            <button
              key={tod}
              type="button"
              className={`tod-btn ${timeOfDay === tod ? 'active' : ''}`}
              onClick={() => setTimeOfDay(tod)}
            >
              {tod === 'morning' && '🌅 晨曦'}
              {tod === 'day' && '☀️ 晴日'}
              {tod === 'sunset' && '🌇 晚霞'}
              {tod === 'night' && '🏮 千户夜景'}
            </button>
          ))}
        </div>
      </header>

      {/* Camera Mode & Action Floating Toolbar */}
      <aside className="scene-float-tools">
        {/* Camera Perspective Mode */}
        <div className="cam-mode-group">
          <button
            type="button"
            className={`tool-btn ${cameraMode === 'follow' ? 'active' : ''}`}
            onClick={() => handleSetCameraPreset('follow')}
            title="追随向导纠笙漫步"
          >
            🎥 追随视角
          </button>
          <button
            type="button"
            className={`tool-btn ${cameraMode === 'panoramic' ? 'active' : ''}`}
            onClick={() => handleSetCameraPreset('overview')}
            title="俯瞰千户苗寨全景大地图 (大幅缩小查看)"
          >
            🗺️ 宏观全景
          </button>
          <button
            type="button"
            className={`tool-btn ${cameraMode === 'photo' ? 'active' : ''}`}
            onClick={() => handleSetCameraPreset('photo')}
            title="近景打卡特写"
          >
            📸 拍照打卡
          </button>
        </div>

        {/* Audio Toggle */}
        <button
          type="button"
          className={`tool-btn ${isAudioOn ? 'on' : ''}`}
          onClick={() => setIsAudioOn(miaoSound.toggleSound())}
          title="切换苗乡自然音效 (山溪、清风、银铃、芦笙)"
        >
          {isAudioOn ? '🔊 声音开' : '🔇 声音关'}
        </button>

      </aside>

      {/* Avatar Outfit Selector (Model Selection from @public/人物/images/) */}
      <section className="avatar-selector-bar" aria-label="纠笙盛装形象切换">
        <span className="bar-label">向导纠笙装扮：</span>
        <div className="outfit-pills">
          {OUTFIT_PRESETS.map((preset, idx) => (
            <button
              key={preset.id}
              type="button"
              className={`outfit-pill ${outfitIndex === idx ? 'selected' : ''}`}
              onClick={() => setOutfitIndex(idx)}
            >
              <img src={preset.image} alt={preset.name} className="pill-avatar-img" />
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Landmarks Fast-Travel Rail */}
      <nav className="landmarks-quick-nav" aria-label="苗寨非遗与市井地点">
        <span className="nav-title">苗寨漫步地标：</span>
        <div className="nav-scroll">
          {LANDMARK_POIS.map((poi, idx) => (
            <button
              key={poi.id}
              type="button"
              disabled={loadState !== 'ready'}
              className={`landmark-pill ${currentSelectedIdx === idx ? 'active' : ''}`}
              onClick={() => {
                setCurrentSelectedIdx(idx)
                focusLandmark(poi)
              }}
            >
              <span className="poi-icon">
                {!['gate','lusheng','bridge','batik','silver','embroidery','banquet','museum','lookout'].includes(poi.kind) && '⌖'}
                {poi.kind === 'gate' && '⛩️'}
                {poi.kind === 'lusheng' && '🥁'}
                {poi.kind === 'bridge' && '🌉'}
                {poi.kind === 'batik' && '🎨'}
                {poi.kind === 'silver' && '🔨'}
                {poi.kind === 'embroidery' && '🪡'}
                {poi.kind === 'banquet' && '🍲'}
                {poi.kind === 'museum' && '🏛️'}
                {poi.kind === 'lookout' && '⛰️'}
              </span>
              <b>{poi.name}</b>
            </button>
          ))}
        </div>
      </nav>

      {/* Interactive Landmark Proximity Bubble */}
      {nearbyPOI && (
        <section className="poi-interaction-bubble" aria-live="polite">
          <div className="bubble-content">
            <span className="bubble-tag">🌟 已抵达 · {nearbyPOI.title}</span>
            <h3>{nearbyPOI.name}</h3>
            <p>{nearbyPOI.evidence}</p>
          </div>
          <button
            type="button"
            className="bubble-action-btn"
            onClick={() => {
              if (nearbyPOI.id === 'lusheng') {
                setIsLushengCopyOpen(true)
                setIsLushengViewerOpen(true)
              }
              else if (nearbyPOI.id === 'lookout') handleSetCameraPreset('lookout')
              else callbacksRef.current.onOpenExplore?.(nearbyPOI)
            }}
          >
            {nearbyPOI.actionPrompt} ›
          </button>
        </section>
      )}

      {/* On-Screen Virtual Joystick for Touch / Mouse Dragging */}
      <div
        className={`virtual-joystick-zone ${joystickActive ? 'active' : ''}`}
        onPointerDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          handleJoystickMove(e.clientX, e.clientY, rect)
          const onMove = (moveEvt: PointerEvent) => handleJoystickMove(moveEvt.clientX, moveEvt.clientY, rect)
          const onUp = () => {
            handleJoystickEnd()
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerup', onUp)
          }
          window.addEventListener('pointermove', onMove)
          window.addEventListener('pointerup', onUp)
        }}
      >
        <div className="joystick-base">
          <div
            className="joystick-thumb"
            style={{
              transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
            }}
          />
        </div>
        <span className="joystick-tip">摇杆移动</span>
      </div>

      {localPOI && <section className="map-local-detail" role="dialog" aria-modal="true" aria-label={`${localPOI.name}详情`}>
        <button className="map-local-close" type="button" onClick={() => setLocalPOI(null)} aria-label="返回苗寨">×</button>
        <small>{localPOI.evidence}</small><h2>{localPOI.name}</h2><p>{localPOI.detail}</p><p>{localPOI.lore}</p>
        {localPOI.sources.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer">研究来源 {index + 1} ↗ </a>)}
        {['silver', 'batik', 'banquet'].includes(localPOI.id) && <iframe title={localPOI.name} src={localPOI.id === 'silver' ? '/games/silver/index.html' : localPOI.id === 'batik' ? '/games/wax-dye' : '/games/miao-feast/index.html'} />}
      </section>}

      {isLushengViewerOpen && (
        <section className={`lusheng-viewer-modal${isLushengCopyOpen ? '' : ' copy-collapsed'}`} role="dialog" aria-modal="true" aria-label="芦笙细节查看">
          <button type="button" className="lusheng-viewer-close" onClick={() => setIsLushengViewerOpen(false)}>×</button>
          {isLushengCopyOpen ? (
            <div className="lusheng-viewer-copy">
              <button type="button" className="lusheng-copy-toggle" onClick={() => setIsLushengCopyOpen(false)} aria-label="收起芦笙说明">收起说明 ‹</button>
              <span>芦笙场 · 中央陈列</span>
              <h2>近观苗族芦笙</h2>
              <p>拖动模型查看竹管、簧片与吹口的细节。芦笙是苗族礼俗、歌舞和节庆中不可或缺的乐器。</p>
            </div>
          ) : (
            <button type="button" className="lusheng-copy-toggle lusheng-copy-reopen" onClick={() => setIsLushengCopyOpen(true)} aria-label="展开芦笙说明">展开说明 ›</button>
          )}
          <model-viewer
            src="/map-assets/models/lusheng.glb"
            alt="Lux3D 生成的苗族芦笙模型"
            camera-controls
            auto-rotate
            shadow-intensity="1"
            environment-image="neutral"
          />
        </section>
      )}
    </div>
  )
}
