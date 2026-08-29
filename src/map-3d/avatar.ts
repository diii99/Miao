import * as THREE from 'three'

export interface AvatarRig {
  group: THREE.Group
  pelvis: THREE.Group
  torso: THREE.Group
  head: THREE.Group
  horns: THREE.Group
  tassels: THREE.Group[]
  leftShoulder: THREE.Group
  leftElbow: THREE.Group
  rightShoulder: THREE.Group
  rightElbow: THREE.Group
  leftHip: THREE.Group
  leftKnee: THREE.Group
  rightHip: THREE.Group
  rightKnee: THREE.Group
  skirt: THREE.Group
  costumeMaterials: THREE.MeshStandardMaterial[]
  silverMaterials: THREE.MeshStandardMaterial[]
  updateAnimation: (delta: number, isMoving: boolean, isRunning: boolean, isDancing: boolean, speedMultiplier?: number) => void
  setOutfitIndex: (index: number) => void
}

export const OUTFIT_PRESETS = [
  { id: 0, name: '盛装银冠 · 霁蓝', clothColor: 0x133763, trimColor: 0xdb4437, skirtTrim: 0xf4b400, image: '/人物/images/miao_girl_1.jpg' },
  { id: 1, name: '百褶盛服 · 黛青', clothColor: 0x194544, trimColor: 0xe06d53, skirtTrim: 0x5bb8a6, image: '/人物/images/miao_girl_2.jpg' },
  { id: 2, name: '姊妹欢聚 · 绯红', clothColor: 0x7c2635, trimColor: 0x3d70b2, skirtTrim: 0xffd166, image: '/人物/images/miao_girl_3.jpg' },
  { id: 3, name: '蓝靛古风 · 藏青', clothColor: 0x0f2540, trimColor: 0x4cc9f0, skirtTrim: 0xef476f, image: '/人物/images/miao_girl_4.jpg' },
  { id: 4, name: '锦绣花袄 · 翠绿', clothColor: 0x225740, trimColor: 0xffa07a, skirtTrim: 0xffd700, image: '/人物/images/miao_girl_5.jpg' },
  { id: 5, name: '银花飞歌 · 紫罗', clothColor: 0x4a2e58, trimColor: 0x06d6a0, skirtTrim: 0xff99c8, image: '/人物/images/miao_girl_6.jpg' },
]

/**
 * Creates an authentic 3D Miao Girl character with articulated skeletal joints and dynamic silver adornments.
 */
export function createMiaoAvatar(initialOutfit = 0): AvatarRig {
  const root = new THREE.Group()

  // Materials
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xf5caa6,
    roughness: 0.72,
    metalness: 0.05,
  })

  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x1f1917,
    roughness: 0.9,
    metalness: 0.1,
  })

  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xdee7ee,
    metalness: 0.92,
    roughness: 0.18,
    envMapIntensity: 1.5,
  })

  const silverGoldMat = new THREE.MeshStandardMaterial({
    color: 0xe8e2c8,
    metalness: 0.88,
    roughness: 0.22,
  })

  const preset = OUTFIT_PRESETS[initialOutfit] || OUTFIT_PRESETS[0]
  const clothMat = new THREE.MeshStandardMaterial({
    color: preset.clothColor,
    roughness: 0.75,
    metalness: 0.1,
  })

  const trimMat = new THREE.MeshStandardMaterial({
    color: preset.trimColor,
    roughness: 0.65,
  })

  const skirtTrimMat = new THREE.MeshStandardMaterial({
    color: preset.skirtTrim,
    roughness: 0.7,
  })

  const bootMat = new THREE.MeshStandardMaterial({
    color: 0x241d1d,
    roughness: 0.8,
  })

  const costumeMaterials = [clothMat, trimMat, skirtTrimMat]
  const silverMaterials = [silverMat, silverGoldMat]

  // Pelvis / Core
  const pelvis = new THREE.Group()
  pelvis.position.y = 0.82
  root.add(pelvis)

  // Torso / Upper Body
  const torso = new THREE.Group()
  pelvis.add(torso)

  // Vest Body (苗族短上衣与对襟)
  const torsoMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.52, 12), clothMat)
  torsoMesh.position.y = 0.26
  torsoMesh.castShadow = true
  torsoMesh.receiveShadow = true
  torso.add(torsoMesh)

  // Embroidered Front Placket (刺绣对襟领口)
  const placketMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.53, 0.3), trimMat)
  placketMesh.position.set(0, 0.26, 0.08)
  torso.add(placketMesh)

  // Silver Chest Collar / Torque (大银项圈与压领)
  const silverCollarGroup = new THREE.Group()
  silverCollarGroup.position.set(0, 0.38, 0.05)
  torso.add(silverCollarGroup)

  const collarRing1 = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.024, 8, 24, Math.PI * 1.3), silverMat)
  collarRing1.rotation.x = Math.PI * 0.45
  collarRing1.rotation.z = -Math.PI * 0.65
  silverCollarGroup.add(collarRing1)

  const collarRing2 = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.02, 8, 24, Math.PI * 1.2), silverMat)
  collarRing2.position.set(0, -0.06, 0.04)
  collarRing2.rotation.x = Math.PI * 0.48
  collarRing2.rotation.z = -Math.PI * 0.6
  silverCollarGroup.add(collarRing2)

  // Silver Butterfly Chest Locket (胸前银锁/银凤蝶)
  const silverLock = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.03), silverMat)
  silverLock.position.set(0, -0.14, 0.23)
  silverLock.castShadow = true
  silverCollarGroup.add(silverLock)

  // Hanging small bells from collar
  const tassels: THREE.Group[] = []
  for (let i = -2; i <= 2; i++) {
    const tGroup = new THREE.Group()
    tGroup.position.set(i * 0.04, -0.22, 0.23)
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.07, 4), silverMat)
    chain.position.y = -0.035
    tGroup.add(chain)
    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 6), silverMat)
    bell.position.y = -0.075
    tGroup.add(bell)
    silverCollarGroup.add(tGroup)
    tassels.push(tGroup)
  }

  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.16, 8), skinMat)
  neck.position.y = 0.56
  torso.add(neck)

  // Head
  const head = new THREE.Group()
  head.position.y = 0.72
  torso.add(head)

  // Face
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 16), skinMat)
  face.scale.set(0.95, 1.1, 1.0)
  face.castShadow = true
  head.add(face)

  // Cheeks / Blush
  const blushMat = new THREE.MeshBasicMaterial({ color: 0xf28b82, transparent: true, opacity: 0.4 })
  for (const s of [-1, 1]) {
    const blush = new THREE.Mesh(new THREE.CircleGeometry(0.04, 8), blushMat)
    blush.position.set(s * 0.11, -0.02, 0.17)
    blush.rotation.y = s * 0.4
    head.add(blush)
  }

  // Hair Base (乌黑发髻)
  const hairBase = new THREE.Mesh(new THREE.SphereGeometry(0.21, 16, 16), hairMat)
  hairBase.scale.set(1.02, 1.05, 1.05)
  hairBase.position.set(0, 0.04, -0.03)
  head.add(hairBase)

  // High Topknot Bun (苗女高发髻)
  const hairBun = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.22, 12), hairMat)
  hairBun.position.set(0, 0.22, -0.04)
  hairBun.castShadow = true
  head.add(hairBun)

  // Forehead Bangs & Side Locks
  const bangs = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.09, 12, 1, false, 0, Math.PI), hairMat)
  bangs.position.set(0, 0.12, 0.05)
  bangs.rotation.x = 0.3
  head.add(bangs)

  // === Authentic Miao Silver Headdress (苗族大银角与银冠) ===
  const horns = new THREE.Group()
  horns.position.set(0, 0.24, -0.02)
  head.add(horns)

  // Crown Base Band (银额带)
  const crownBand = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.025, 8, 24), silverMat)
  crownBand.rotation.x = Math.PI * 0.5
  crownBand.position.y = -0.08
  horns.add(crownBand)

  // Central Silver Sun / Bird Plate (银雀花冠)
  const crownCenter = new THREE.Mesh(new THREE.CircleGeometry(0.12, 12), silverMat)
  crownCenter.position.set(0, 0.08, 0.18)
  crownCenter.rotation.x = -0.1
  horns.add(crownCenter)

  // Magnificent Silver Ox Horns (双叉大银角)
  for (const s of [-1, 1]) {
    const hornCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(s * 0.08, 0.0, 0),
      new THREE.Vector3(s * 0.32, 0.22, -0.02),
      new THREE.Vector3(s * 0.52, 0.52, 0.02),
      new THREE.Vector3(s * 0.62, 0.82, 0.05),
      new THREE.Vector3(s * 0.58, 0.95, 0.08),
    ])
    const hornMesh = new THREE.Mesh(new THREE.TubeGeometry(hornCurve, 20, 0.038, 8, false), silverMat)
    hornMesh.castShadow = true
    horns.add(hornMesh)

    // Silver Horn Filigree Butterfly (角上银蝶)
    const hornWing = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.32, 4), silverMat)
    hornWing.position.set(s * 0.42, 0.45, 0)
    hornWing.rotation.z = s * -0.7
    hornWing.rotation.y = Math.PI / 4
    horns.add(hornWing)

    // Side Dangling Silver Tassels (银流苏垂落耳际)
    const sideTasselGroup = new THREE.Group()
    sideTasselGroup.position.set(s * 0.22, -0.06, 0.08)
    for (let t = 0; t < 3; t++) {
      const strand = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.22 + t * 0.05, 4), silverMat)
      strand.position.set(t * 0.02 * s, -(0.11 + t * 0.025), 0)
      sideTasselGroup.add(strand)
      const tipBell = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 6), silverMat)
      tipBell.position.set(t * 0.02 * s, -(0.22 + t * 0.05), 0)
      sideTasselGroup.add(tipBell)
    }
    horns.add(sideTasselGroup)
    tassels.push(sideTasselGroup)
  }

  // === Arms (Shoulders + Forearms / Hands) ===
  const leftShoulder = new THREE.Group()
  leftShoulder.position.set(-0.32, 0.44, 0)
  torso.add(leftShoulder)

  const leftUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.07, 0.28, 8), clothMat)
  leftUpperArm.position.y = -0.14
  leftUpperArm.castShadow = true
  leftShoulder.add(leftUpperArm)

  // Embroidered Cuff
  const leftCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.08, 8), trimMat)
  leftCuff.position.y = -0.24
  leftShoulder.add(leftCuff)

  const leftElbow = new THREE.Group()
  leftElbow.position.set(0, -0.28, 0)
  leftShoulder.add(leftElbow)

  const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.26, 8), skinMat)
  leftForearm.position.y = -0.13
  leftForearm.castShadow = true
  leftElbow.add(leftForearm)

  // Silver Bangle (银手镯)
  const leftBangle = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.014, 6, 16), silverMat)
  leftBangle.rotation.x = Math.PI / 2
  leftBangle.position.y = -0.19
  leftElbow.add(leftBangle)

  const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), skinMat)
  leftHand.scale.set(0.8, 1.2, 0.6)
  leftHand.position.y = -0.27
  leftElbow.add(leftHand)

  // Right Arm
  const rightShoulder = new THREE.Group()
  rightShoulder.position.set(0.32, 0.44, 0)
  torso.add(rightShoulder)

  const rightUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.07, 0.28, 8), clothMat)
  rightUpperArm.position.y = -0.14
  rightUpperArm.castShadow = true
  rightShoulder.add(rightUpperArm)

  const rightCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.08, 8), trimMat)
  rightCuff.position.y = -0.24
  rightShoulder.add(rightCuff)

  const rightElbow = new THREE.Group()
  rightElbow.position.set(0, -0.28, 0)
  rightShoulder.add(rightElbow)

  const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.26, 8), skinMat)
  rightForearm.position.y = -0.13
  rightForearm.castShadow = true
  rightElbow.add(rightForearm)

  const rightBangle = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.014, 6, 16), silverMat)
  rightBangle.rotation.x = Math.PI / 2
  rightBangle.position.y = -0.19
  rightElbow.add(rightBangle)

  const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), skinMat)
  rightHand.scale.set(0.8, 1.2, 0.6)
  rightHand.position.y = -0.27
  rightElbow.add(rightHand)

  // === Miao Pleated Skirt (百褶裙与刺绣飘带) ===
  const skirt = new THREE.Group()
  skirt.position.set(0, 0.02, 0)
  pelvis.add(skirt)

  // Flared Skirt Upper
  const skirtCone = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.48, 0.48, 16, 1, true), clothMat)
  skirtCone.position.y = -0.24
  skirtCone.castShadow = true
  skirtCone.receiveShadow = true
  skirt.add(skirtCone)

  // Skirt Embroidered Border Trim (裙摆刺绣边栏)
  const skirtHem = new THREE.Mesh(new THREE.CylinderGeometry(0.475, 0.52, 0.12, 16, 1, true), skirtTrimMat)
  skirtHem.position.y = -0.46
  skirt.add(skirtHem)

  // Silver Belt (苗族银腰带)
  const silverBelt = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.026, 8, 24), silverMat)
  silverBelt.rotation.x = Math.PI / 2
  silverBelt.position.y = 0.01
  skirt.add(silverBelt)

  // Hanging Embroidered Sashes (刺绣腰间彩带)
  for (const angle of [-0.35, 0.35]) {
    const sash = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.45, 0.02), trimMat)
    sash.position.set(Math.sin(angle) * 0.28, -0.22, Math.cos(angle) * 0.28)
    sash.rotation.y = angle
    skirt.add(sash)
  }

  // === Legs & Boots ===
  const leftHip = new THREE.Group()
  leftHip.position.set(-0.13, -0.05, 0)
  pelvis.add(leftHip)

  const leftThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.075, 0.36, 8), skinMat)
  leftThigh.position.y = -0.18
  leftThigh.castShadow = true
  leftHip.add(leftThigh)

  const leftKnee = new THREE.Group()
  leftKnee.position.set(0, -0.36, 0)
  leftHip.add(leftKnee)

  const leftCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.38, 8), skinMat)
  leftCalf.position.y = -0.19
  leftCalf.castShadow = true
  leftKnee.add(leftCalf)

  const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.24), bootMat)
  leftBoot.position.set(0, -0.38, 0.04)
  leftBoot.castShadow = true
  leftKnee.add(leftBoot)

  // Right Leg
  const rightHip = new THREE.Group()
  rightHip.position.set(0.13, -0.05, 0)
  pelvis.add(rightHip)

  const rightThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.075, 0.36, 8), skinMat)
  rightThigh.position.y = -0.18
  rightThigh.castShadow = true
  rightHip.add(rightThigh)

  const rightKnee = new THREE.Group()
  rightKnee.position.set(0, -0.36, 0)
  rightHip.add(rightKnee)

  const rightCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.38, 8), skinMat)
  rightCalf.position.y = -0.19
  rightCalf.castShadow = true
  rightKnee.add(rightCalf)

  const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.24), bootMat)
  rightBoot.position.set(0, -0.38, 0.04)
  rightBoot.castShadow = true
  rightKnee.add(rightBoot)

  // === Animation State ===
  let walkPhase = 0
  let idleTimer = 0

  const updateAnimation = (
    delta: number,
    isMoving: boolean,
    isRunning: boolean,
    isDancing: boolean,
    speedMultiplier = 1.0
  ) => {
    idleTimer += delta

    if (isDancing) {
      // Joyous Miao Lusheng Dance Step (芦笙欢舞步法)
      walkPhase += delta * 6.5
      const danceBeat = Math.sin(walkPhase)
      const hop = Math.abs(Math.cos(walkPhase)) * 0.12

      pelvis.position.y = 0.82 + hop
      pelvis.rotation.y = Math.sin(walkPhase * 0.5) * 0.28
      pelvis.rotation.z = Math.sin(walkPhase) * 0.1

      torso.rotation.x = Math.sin(walkPhase * 2) * 0.06
      head.rotation.z = -Math.sin(walkPhase) * 0.15
      head.rotation.x = Math.sin(walkPhase * 2) * 0.08

      // Waving celebratory arms
      leftShoulder.rotation.x = -0.8 + Math.sin(walkPhase) * 0.5
      leftShoulder.rotation.z = -0.6 + Math.cos(walkPhase) * 0.4
      leftElbow.rotation.x = -0.8 + Math.sin(walkPhase) * 0.3

      rightShoulder.rotation.x = -0.8 - Math.sin(walkPhase) * 0.5
      rightShoulder.rotation.z = 0.6 - Math.cos(walkPhase) * 0.4
      rightElbow.rotation.x = -0.8 - Math.sin(walkPhase) * 0.3

      leftHip.rotation.x = Math.sin(walkPhase) * 0.6
      leftKnee.rotation.x = Math.max(0, -Math.sin(walkPhase) * 0.8)
      rightHip.rotation.x = -Math.sin(walkPhase) * 0.6
      rightKnee.rotation.x = Math.max(0, Math.sin(walkPhase) * 0.8)

      skirt.rotation.z = Math.sin(walkPhase) * 0.2
      horns.rotation.z = Math.sin(walkPhase) * 0.12

      tassels.forEach((t, idx) => {
        t.rotation.z = Math.sin(walkPhase + idx * 0.5) * 0.35
      })
      return
    }

    if (isMoving) {
      // Walking / Running Cycle
      const cycleSpeed = (isRunning ? 12.0 : 7.2) * speedMultiplier
      walkPhase += delta * cycleSpeed

      const armSwing = isRunning ? 0.95 : 0.62
      const legStride = isRunning ? 0.9 : 0.58
      const bobAmount = isRunning ? 0.07 : 0.038

      const sinP = Math.sin(walkPhase)
      const cosP = Math.cos(walkPhase)

      // Pelvis bob & sway
      pelvis.position.y = 0.82 + Math.abs(sinP) * bobAmount
      pelvis.rotation.y = sinP * 0.12
      pelvis.rotation.z = cosP * 0.04

      // Torso counter-twist & slight forward lean
      torso.rotation.x = isRunning ? 0.18 : 0.06
      torso.rotation.y = -sinP * 0.1

      // Head bounce & looking ahead
      head.rotation.x = -torso.rotation.x * 0.5 + Math.sin(walkPhase * 2) * 0.03
      head.rotation.y = sinP * 0.05
      head.rotation.z = -cosP * 0.03

      // Silver horns secondary vibration
      horns.rotation.x = Math.sin(walkPhase * 2) * 0.06
      horns.rotation.z = cosP * 0.05

      // Left Arm (moves counter to Left Leg)
      leftShoulder.rotation.x = -sinP * armSwing
      leftShoulder.rotation.z = -0.15 - Math.abs(cosP) * 0.1
      leftElbow.rotation.x = isRunning ? -1.1 - sinP * 0.4 : -0.35 - Math.max(0, -sinP) * 0.5

      // Right Arm
      rightShoulder.rotation.x = sinP * armSwing
      rightShoulder.rotation.z = 0.15 + Math.abs(cosP) * 0.1
      rightElbow.rotation.x = isRunning ? -1.1 + sinP * 0.4 : -0.35 - Math.max(0, sinP) * 0.5

      // Left Leg
      leftHip.rotation.x = sinP * legStride
      leftHip.rotation.z = -0.03
      // Knee bends on the back-to-front swing
      leftKnee.rotation.x = sinP < 0 ? -sinP * (isRunning ? 1.4 : 0.95) : 0

      // Right Leg
      rightHip.rotation.x = -sinP * legStride
      rightHip.rotation.z = 0.03
      rightKnee.rotation.x = sinP > 0 ? sinP * (isRunning ? 1.4 : 0.95) : 0

      // Skirt Swish
      skirt.rotation.x = Math.sin(walkPhase * 2) * 0.08
      skirt.rotation.z = cosP * 0.09

      // Silver Tassels Physics
      tassels.forEach((t, idx) => {
        t.rotation.x = Math.sin(walkPhase * 2 + idx * 0.4) * 0.35
        t.rotation.z = cosP * 0.25
      })
    } else {
      // Idle Breathing & Micro-gestures
      const breath = Math.sin(idleTimer * 2.2)
      const lookAround = Math.sin(idleTimer * 0.6)

      pelvis.position.y = 0.82 + breath * 0.008
      pelvis.rotation.set(0, 0, 0)

      torso.rotation.x = breath * 0.015
      torso.rotation.y = 0

      head.rotation.x = -breath * 0.01
      head.rotation.y = lookAround * 0.18
      head.rotation.z = Math.sin(idleTimer * 1.1) * 0.03

      horns.rotation.set(0, 0, 0)

      // Relaxed arms with subtle breathing
      leftShoulder.rotation.x = breath * 0.03
      leftShoulder.rotation.z = -0.12 - breath * 0.02
      leftElbow.rotation.x = -0.22

      rightShoulder.rotation.x = breath * 0.03
      rightShoulder.rotation.z = 0.12 + breath * 0.02
      rightElbow.rotation.x = -0.22

      // Neutral legs
      leftHip.rotation.set(0, 0, 0)
      leftKnee.rotation.set(0, 0, 0)
      rightHip.rotation.set(0, 0, 0)
      rightKnee.rotation.set(0, 0, 0)

      skirt.rotation.set(0, 0, 0)

      tassels.forEach((t) => {
        t.rotation.set(breath * 0.05, 0, 0)
      })
    }
  }

  const setOutfitIndex = (index: number) => {
    const p = OUTFIT_PRESETS[index] || OUTFIT_PRESETS[0]
    clothMat.color.setHex(p.clothColor)
    trimMat.color.setHex(p.trimColor)
    skirtTrimMat.color.setHex(p.skirtTrim)
  }

  return {
    group: root,
    pelvis,
    torso,
    head,
    horns,
    tassels,
    leftShoulder,
    leftElbow,
    rightShoulder,
    rightElbow,
    leftHip,
    leftKnee,
    rightHip,
    rightKnee,
    skirt,
    costumeMaterials,
    silverMaterials,
    updateAnimation,
    setOutfitIndex,
  }
}
