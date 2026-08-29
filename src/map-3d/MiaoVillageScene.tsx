import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createMiaoAvatar, OUTFIT_PRESETS, type AvatarRig } from './avatar'
import { buildMiaoVillage, getTerrainHeight, LANDMARK_POIS, type LandmarkPOI } from './villageBuilder'
import { miaoSound } from './audioAmbiance'

export type TimeOfDay = 'morning' | 'day' | 'sunset' | 'night'
export type CameraMode = 'follow' | 'panoramic' | 'photo'

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
    sky: 0x76b5d9,
    fog: 0x92cce5,
    sunColor: 0xfff3d6,
    sunIntensity: 3.6,
    sunPos: [-10, 22, 10],
    hemiSky: 0xe5f5ff,
    hemiGround: 0x2e4726,
    hemiIntensity: 2.2,
    windowEmissive: 0.2,
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
    hemiSky: 0x1a2e4a,
    hemiGround: 0x08120c,
    hemiIntensity: 0.9,
    windowEmissive: 2.4,
    windowEmissiveColor: 0xff8800,
    lanternIntensity: 2.2,
  },
}

export function MiaoVillageScene({ selected = 1, onWalkingChange, onOpenExplore }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Interactive UI States
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day')
  const [cameraMode, setCameraMode] = useState<CameraMode>('follow')
  const [outfitIndex, setOutfitIndex] = useState(0)
  const [isAudioOn, setIsAudioOn] = useState(false)
  const [isDancing, setIsDancing] = useState(false)
  const [, setActivePOI] = useState<LandmarkPOI | null>(null)
  const [nearbyPOI, setNearbyPOI] = useState<LandmarkPOI | null>(null)
  const [currentSelectedIdx, setCurrentSelectedIdx] = useState(selected)
  const [isSprinting, setIsSprinting] = useState(false)

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
  const callbacksRef = useRef({ onWalkingChange, onOpenExplore })
  callbacksRef.current = { onWalkingChange, onOpenExplore }

  // Zoom control helper
  const handleZoomInOut = useCallback((zoomOut: boolean) => {
    if (!sceneContext.current) return
    const { camera, controls } = sceneContext.current
    const dir = camera.position.clone().sub(controls.target)
    const factor = zoomOut ? 1.35 : 0.74
    dir.multiplyScalar(factor)
    const newLen = THREE.MathUtils.clamp(dir.length(), controls.minDistance, controls.maxDistance)
    dir.setLength(newLen)
    camera.position.copy(controls.target).add(dir)
  }, [])

  // Camera presets
  const handleSetCameraPreset = useCallback((preset: 'overview' | 'follow' | 'photo') => {
    if (!sceneContext.current) return
    const { camera, controls, avatar } = sceneContext.current
    if (preset === 'overview') {
      setCameraMode('panoramic')
      controls.target.set(0, 1.2, 1.2)
      camera.position.set(0, 32, 40)
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

  // Navigate to a specific landmark
  const navigateToLandmark = useCallback((poi: LandmarkPOI) => {
    if (!sceneContext.current) return
    const [tx, , tz] = poi.position
    const targetY = getTerrainHeight(tx, tz)
    sceneContext.current.targetPos.set(tx, targetY, tz)
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

    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight

    // 1. Three.js Scene, Camera, Renderer
    const scene = new THREE.Scene()
    const timeConf = TIME_CONFIGS[timeOfDay]
    scene.background = new THREE.Color(timeConf.sky)
    scene.fog = new THREE.FogExp2(timeConf.fog, 0.018)

    // Camera with large far clipping plane for deep zooming out
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 400)
    camera.position.set(0, 8, 12)

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15

    container.innerHTML = ''
    container.appendChild(renderer.domElement)

    // 2. Lighting
    const hemiLight = new THREE.HemisphereLight(timeConf.hemiSky, timeConf.hemiGround, timeConf.hemiIntensity)
    scene.add(hemiLight)

    const sunLight = new THREE.DirectionalLight(timeConf.sunColor, timeConf.sunIntensity)
    sunLight.position.set(...timeConf.sunPos)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.set(2048, 2048)
    sunLight.shadow.camera.left = -28
    sunLight.shadow.camera.right = 28
    sunLight.shadow.camera.top = 28
    sunLight.shadow.camera.bottom = -28
    sunLight.shadow.camera.near = 0.5
    sunLight.shadow.camera.far = 100
    sunLight.shadow.bias = -0.0004
    scene.add(sunLight)

    // 3. Orbit Controls: Configured for smooth and wide zoom range
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 1.0
    controls.maxDistance = 120.0
    controls.maxPolarAngle = Math.PI * 0.485
    controls.minPolarAngle = 0.02
    controls.zoomSpeed = 1.25
    controls.enableZoom = true
    controls.target.set(0, 1.2, 1.2)

    // 4. Build Real 3D Miao Village Scene
    const village = buildMiaoVillage()
    scene.add(village.group)

    // 5. Create 3D Animated Miao Girl Avatar
    const avatar = createMiaoAvatar(outfitIndex)
    const startPOI = LANDMARK_POIS[1] // Lusheng Plaza
    const startY = getTerrainHeight(startPOI.position[0], startPOI.position[2])
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

    const handlePointerUp = (e: PointerEvent) => {
      if (Math.abs(e.movementX) > 5 || Math.abs(e.movementY) > 5) return
      const rect = renderer.domElement.getBoundingClientRect()
      mousePointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mousePointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mousePointer, camera)
      const hits = raycaster.intersectObjects(scene.children, true)
      if (hits.length > 0) {
        const hit = hits[0]
        const hx = THREE.MathUtils.clamp(hit.point.x, -18, 18)
        const hz = THREE.MathUtils.clamp(hit.point.z, -18, 18)
        const hy = getTerrainHeight(hx, hz)

        targetPos.set(hx, hy, hz)
        beaconMesh.position.set(hx, hy + 0.1, hz)
        beaconMesh.visible = true
        sceneContext.current!.isMoving = true
        callbacksRef.current.onWalkingChange?.(true)
      }
    }
    renderer.domElement.addEventListener('pointerup', handlePointerUp)

    // 7. Keyboard Navigation (WASD / Arrow Keys)
    const keysDown = new Set<string>()
    const handleKeyDown = (e: KeyboardEvent) => {
      keysDown.add(e.key.toLowerCase())
      if (e.key === 'Shift') setIsSprinting(true)
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault()
        setIsDancing((prev) => !prev)
        miaoSound.playLushengNote()
      }
      if (e.key.toLowerCase() === 'e') {
        if (nearbyPOI) {
          callbacksRef.current.onOpenExplore?.(nearbyPOI)
        }
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown.delete(e.key.toLowerCase())
      if (e.key === 'Shift') setIsSprinting(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

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

    // 8. Main Animation Loop
    const clock = new THREE.Clock()
    let animId = 0

    const animate = () => {
      animId = requestAnimationFrame(animate)
      const delta = Math.min(clock.getDelta(), 0.1)
      const elapsed = clock.getElapsedTime()

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

      if (hasManualInput) {
        // Camera-relative movement
        const camEuler = new THREE.Euler(0, camera.rotation.y, 0, 'YXZ')
        const forward = new THREE.Vector3(0, 0, -1).applyEuler(camEuler).normalize()
        const right = new THREE.Vector3(1, 0, 0).applyEuler(camEuler).normalize()

        const moveDir = new THREE.Vector3()
          .addScaledVector(right, moveX)
          .addScaledVector(forward, -moveZ)
          .normalize()

        const moveSpeed = (isSprinting ? 5.2 : 3.0) * delta
        avatar.group.position.addScaledVector(moveDir, moveSpeed)
        avatar.group.position.x = THREE.MathUtils.clamp(avatar.group.position.x, -18, 18)
        avatar.group.position.z = THREE.MathUtils.clamp(avatar.group.position.z, -18, 18)
        avatar.group.position.y = getTerrainHeight(avatar.group.position.x, avatar.group.position.z)

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
        const dist = Math.hypot(targetPos.x - curPos.x, targetPos.z - curPos.z)

        if (dist > 0.12) {
          const moveSpeed = (isSprinting ? 4.8 : 2.8) * delta
          const nextDir = new THREE.Vector3(targetPos.x - curPos.x, 0, targetPos.z - curPos.z).normalize()
          curPos.addScaledVector(nextDir, Math.min(dist, moveSpeed))
          curPos.y = getTerrainHeight(curPos.x, curPos.z)

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
      let minDist = 4.0
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
        const centerPos = new THREE.Vector3(0, 1.2, 1.2)
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
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animId)
      renderer.domElement.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('resize', handleResize)
      controls.dispose()
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  // Apply Time of Day Lighting & Atmosphere
  useEffect(() => {
    if (!sceneContext.current) return
    const { scene, sunLight, hemiLight, village } = sceneContext.current
    const conf = TIME_CONFIGS[timeOfDay]

    scene.background = new THREE.Color(conf.sky)
    scene.fog = new THREE.FogExp2(conf.fog, timeOfDay === 'night' ? 0.024 : 0.016)

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

      {/* Top HUD: Title & Weather/Time of Day Switcher */}
      <header className="scene-top-hud">
        <div className="scene-brand">
          <span className="badge-flame">《烽火与炊烟》式市井实景</span>
          <h1>西江千户苗寨 · 实时三维大地图</h1>
          <p>滚轮/双指自由缩放 · 俯瞰苗乡山水市井</p>
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
        {/* Zoom In & Zoom Out Quick Controls */}
        <div className="zoom-btn-group" aria-label="地图缩放控制">
          <button
            type="button"
            className="tool-btn zoom-btn"
            onClick={() => handleZoomInOut(false)}
            title="放大地图视角 (更近)"
          >
            ➕ 放大
          </button>
          <button
            type="button"
            className="tool-btn zoom-btn"
            onClick={() => handleZoomInOut(true)}
            title="缩小地图视角 (看全局/更小)"
          >
            ➖ 缩小
          </button>
        </div>

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

        {/* Dance & Action Triggers */}
        <button
          type="button"
          className={`tool-btn dance-btn ${isDancing ? 'active' : ''}`}
          onClick={() => {
            setIsDancing((prev) => !prev)
            miaoSound.playLushengNote()
          }}
        >
          {isDancing ? '🎵 欢舞中...' : '💃 跳芦笙舞'}
        </button>

        <button
          type="button"
          className={`tool-btn sprint-btn ${isSprinting ? 'active' : ''}`}
          onClick={() => setIsSprinting((prev) => !prev)}
        >
          {isSprinting ? '⚡ 疾步快跑' : '🚶 悠然漫步'}
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
              className={`landmark-pill ${currentSelectedIdx === idx ? 'active' : ''}`}
              onClick={() => {
                setCurrentSelectedIdx(idx)
                navigateToLandmark(poi)
              }}
            >
              <span className="poi-icon">
                {poi.kind === 'gate' && '⛩️'}
                {poi.kind === 'lusheng' && '🥁'}
                {poi.kind === 'bridge' && '🌉'}
                {poi.kind === 'batik' && '🎨'}
                {poi.kind === 'silver' && '🔨'}
                {poi.kind === 'embroidery' && '🪡'}
                {poi.kind === 'banquet' && '🍲'}
                {poi.kind === 'waterwheel' && '🌊'}
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
            <p>{nearbyPOI.detail}</p>
          </div>
          <button
            type="button"
            className="bubble-action-btn"
            onClick={() => callbacksRef.current.onOpenExplore?.(nearbyPOI)}
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

      {/* Bottom Operation Keyboard Hints */}
      <footer className="controls-hint-bar">
        <span>🔍 滚轮/双指 缩放大小</span>
        <span>⌨️ WASD/方向键 移动</span>
        <span>🖱️ 拖拽转动视角</span>
        <span>⚡ Shift 快跑</span>
        <span>💃 空格 芦笙舞</span>
      </footer>
    </div>
  )
}
