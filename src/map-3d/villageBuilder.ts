import * as THREE from 'three'
import {
  createRoofTileTexture,
  createWoodPlankTexture,
  createBronzeDrumTexture,
  createBatikTexture,
  createStonePathTexture,
  createSmokeParticleTexture,
  createPetalParticleTexture,
} from './textures'

export interface LandmarkPOI {
  id: string
  name: string
  title: string
  note: string
  detail: string
  kind: 'gate' | 'lusheng' | 'bridge' | 'batik' | 'silver' | 'embroidery' | 'banquet' | 'waterwheel' | 'lookout'
  position: [number, number, number]
  actionPrompt: string
  lore: string
}

export const LANDMARK_POIS: LandmarkPOI[] = [
  {
    id: 'gate',
    name: '迎宾寨门',
    title: '苗寨大门 · 十二道拦路酒',
    note: '高山流水 · 迎客盛礼',
    detail: '古木飞檐的寨门立在山口，牛角图腾守护着寨落。逢盛节时，盛装阿妹在此唱响拦路歌，端出醇香的米酒。',
    kind: 'gate',
    position: [0, 0, 14.5],
    actionPrompt: '品尝十二道拦路米酒',
    lore: '苗族同胞热情好客，“拦路酒”是苗寨最隆重的迎宾礼仪。',
  },
  {
    id: 'lusheng',
    name: '铜鼓芦笙坪',
    title: '中央广场 · 芦笙欢歌',
    note: '铜鼓声声 · 踩堂欢舞',
    detail: '铺满太阳纹与翔鹭纹的巨型铜鼓广场，是整座苗寨的节庆心脏。阿哥吹起芦笙，姑娘们摇曳银铃翩翩起舞。',
    kind: 'lusheng',
    position: [0, 0.4, 1.2],
    actionPrompt: '加入芦笙踩堂欢舞',
    lore: '芦笙是苗族文化的灵魂乐器，相传能与祖先神灵对话。',
  },
  {
    id: 'bridge',
    name: '风雨廊桥',
    title: '接龙桥 · 凭栏听泉',
    note: '重檐飞阁 · 溪水欢歌',
    detail: '横跨白水河的传统木构廊桥，檐角高翘，内设美人靠。既遮风避雨，也是村民休憩闲谈、青年对歌的胜地。',
    kind: 'bridge',
    position: [-2.5, 0.3, -2.5],
    actionPrompt: '在廊桥美人靠凭栏观景',
    lore: '风雨桥亦称“接龙桥”，寓意锁住村寨风水，护佑风调雨顺。',
  },
  {
    id: 'batik',
    name: '百米晒布蜡染坊',
    title: '非遗工坊 · 蓝靛白花',
    note: '青出于蓝 · 冰裂成画',
    detail: '依山而建的染坊外耸立着高大木架，数十匹深蓝蜡染长布在山风中随风飘扬。铜刀点蜡，板蓝根大缸深浸岁月。',
    kind: 'batik',
    position: [-10.5, 1.2, 5.5],
    actionPrompt: '体验执刀点蜡与蓝靛浸染',
    lore: '苗族蜡染以蜂蜡为防染剂，自然冰裂纹使得每匹布都独一无二。',
  },
  {
    id: 'silver',
    name: '银匠锻打铺',
    title: '非遗工坊 · 叮当万锤',
    note: '炉火纯青 · 银花绽放',
    detail: '火塘炭火熊熊，铁砧上锤声清脆。老银匠正手持錾刀，在银片上一锤一凿錾刻出栩栩如生的展翅银凤与蝴蝶。',
    kind: 'silver',
    position: [10.2, 1.1, 4.8],
    actionPrompt: '观摩老银匠錾刻大银冠',
    lore: '苗族银饰锻制技艺需经化银、锻打、拉丝、錾刻等多道工序，无图纸全凭匠心。',
  },
  {
    id: 'embroidery',
    name: '苗绣传习楼',
    title: '非遗阁楼 · 指尖山河',
    note: '一针一线 · 穿引古歌',
    detail: '二层吊脚木楼上，彩丝如瀑。绣娘们手持绣绷，以平绣、乱针绣将蝴蝶妈妈孕育万物的创世神话绣入锦缎。',
    kind: 'embroidery',
    position: [9.8, 2.2, -6.5],
    actionPrompt: '欣赏蝴蝶妈妈双面绣卷',
    lore: '苗绣被称为“穿在身上的史诗”，以针线记录迁徙历史与自然崇拜。',
  },
  {
    id: 'banquet',
    name: '西江长桌宴',
    title: '市井长街 · 盛筵欢歌',
    note: '酸汤飘香 · 高山流水',
    detail: '沿着青石古巷绵延数十米的木桌，摆满了热气腾腾的红酸汤鱼、鼓藏肉和五彩糯米饭，展现《烽火与炊烟》般的市井烟火。',
    kind: 'banquet',
    position: [-8.8, 1.8, -7.2],
    actionPrompt: '入席品尝苗寨酸汤鱼与米酒',
    lore: '长桌宴是苗族最高规格的宴席，象征家寨团圆与兴旺。',
  },
  {
    id: 'waterwheel',
    name: '水车磨坊与古渡',
    title: '河畔古渡 · 悠悠水车',
    note: '水碾吱呀 · 乌篷泊岸',
    detail: '巨大的古法木制水车在急流中悠悠旋转，激起串串白浪。水渠边停靠着轻舟木船，宛如世外桃源。',
    kind: 'waterwheel',
    position: [4.2, 0.2, -4.2],
    actionPrompt: '驻足倾听古水车转动回响',
    lore: '传统水车利用水流势能灌溉与舂米，是苗乡农耕智慧的结晶。',
  },
  {
    id: 'lookout',
    name: '瞰寨云顶观景台',
    title: '千户全景 · 云雾缭绕',
    note: '群山环抱 · 梯田层叠',
    detail: '耸立在东侧高崖上的八角观景亭，登高远眺，千座吊脚楼如星罗棋布密布山坡，炊烟袅袅，尽收眼底。',
    kind: 'lookout',
    position: [13.2, 4.6, -11.5],
    actionPrompt: '俯瞰千户苗寨全景与炊烟',
    lore: '西江千户苗寨是世界最大的苗族聚居村寨，被誉为“露天的苗族历史博物馆”。',
  },
]

/**
 * Natural Terrain Height Map with Mountain Terraces & River Canyon
 */
export function getTerrainHeight(x: number, z: number): number {
  // River Valley Channel cutting from SW to NE
  const riverDist = Math.abs(x * 0.707 - z * 0.707)
  const riverBed = Math.exp(-Math.pow(riverDist / 3.2, 2)) * -1.25

  // Terraced mountain slopes on sides
  const mountainWest = Math.max(0, -x - 2) * 0.28 + Math.pow(Math.max(0, -x - 6) * 0.2, 1.6)
  const mountainEast = Math.max(0, x - 2) * 0.32 + Math.pow(Math.max(0, x - 5) * 0.22, 1.7)
  const mountainNorth = Math.max(0, -z - 1) * 0.3 + Math.pow(Math.max(0, -z - 6) * 0.22, 1.6)

  // Gentle central plateau for plaza and gate
  const centerFlatten = Math.exp(-(x * x + (z - 2) * (z - 2)) / 32) * 0.25

  // Natural undulating micro-hills
  const micro = Math.sin(x * 0.35) * 0.18 + Math.cos(z * 0.3) * 0.16 + Math.sin((x + z) * 0.22) * 0.12

  return riverBed + mountainWest + mountainEast + mountainNorth + micro + centerFlatten
}

export interface VillageSceneObjects {
  group: THREE.Group
  waterMesh: THREE.Mesh
  waterwheelMesh: THREE.Group
  smokeParticles: THREE.Points
  petalParticles: THREE.Points
  lanternLights: THREE.PointLight[]
  windowMaterials: THREE.MeshStandardMaterial[]
  clothMeshes: THREE.Mesh[]
  animatedNpcs: Array<{ group: THREE.Group; update: (t: number) => void }>
  updateScene: (delta: number, elapsed: number) => void
}

/**
 * Builds the complete authentic 3D Miao Village Scene.
 */
export function buildMiaoVillage(): VillageSceneObjects {
  const root = new THREE.Group()

  // Textures
  const roofTex = createRoofTileTexture()
  const woodTex = createWoodPlankTexture()
  const drumTex = createBronzeDrumTexture()
  const pathTex = createStonePathTexture()
  const batikTex1 = createBatikTexture(0)
  const batikTex2 = createBatikTexture(1)
  const smokeTex = createSmokeParticleTexture()
  const petalTex = createPetalParticleTexture()

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x5a351f,
    roughness: 0.85,
    map: woodTex,
  })

  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x2e1910,
    roughness: 0.9,
    map: woodTex,
  })

  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x32363e,
    roughness: 0.7,
    map: roofTex,
  })

  const windowWarmMat = new THREE.MeshStandardMaterial({
    color: 0xffd27d,
    emissive: 0xff8820,
    emissiveIntensity: 0.85,
    roughness: 0.3,
  })

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x82887e,
    roughness: 0.92,
    map: pathTex,
  })

  const bronzeDrumMat = new THREE.MeshStandardMaterial({
    color: 0xd69e45,
    metalness: 0.65,
    roughness: 0.35,
    map: drumTex,
  })

  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xd8e4ed,
    metalness: 0.92,
    roughness: 0.15,
  })

  const redClothMat = new THREE.MeshStandardMaterial({
    color: 0xba1a1a,
    roughness: 0.7,
  })

  const cornMat = new THREE.MeshStandardMaterial({ color: 0xebb417, roughness: 0.8 })
  const chiliMat = new THREE.MeshStandardMaterial({ color: 0xd62828, roughness: 0.6 })

  const lanternLights: THREE.PointLight[] = []
  const windowMaterials: THREE.MeshStandardMaterial[] = [windowWarmMat]
  const clothMeshes: THREE.Mesh[] = []
  const animatedNpcs: Array<{ group: THREE.Group; update: (t: number) => void }> = []

  // ==========================================
  // 1. TERRAIN & WATER
  // ==========================================
  const terrainGeo = new THREE.PlaneGeometry(42, 42, 96, 96)
  const posAttr = terrainGeo.attributes.position
  const colorAttr = new THREE.BufferAttribute(new Float32Array(posAttr.count * 3), 3)

  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i)
    const vz = -posAttr.getY(i)
    const vy = getTerrainHeight(vx, vz)
    posAttr.setZ(i, vy)

    if (vy < -0.15) {
      colorAttr.setXYZ(i, 0.42, 0.44, 0.38)
    } else if (vy < 0.6) {
      colorAttr.setXYZ(i, 0.34, 0.56, 0.28)
    } else if (vy < 2.5) {
      colorAttr.setXYZ(i, 0.28, 0.48, 0.24)
    } else {
      colorAttr.setXYZ(i, 0.38, 0.46, 0.32)
    }
  }
  terrainGeo.setAttribute('color', colorAttr)
  terrainGeo.computeVertexNormals()

  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.95,
    flatShading: false,
  })
  const terrain = new THREE.Mesh(terrainGeo, terrainMat)
  terrain.rotation.x = -Math.PI / 2
  terrain.receiveShadow = true
  root.add(terrain)

  // Animated Clear Mountain River
  const riverGeo = new THREE.PlaneGeometry(36, 9, 48, 16)
  const riverMat = new THREE.MeshStandardMaterial({
    color: 0x489aa8,
    emissive: 0x0a3340,
    emissiveIntensity: 0.2,
    metalness: 0.3,
    roughness: 0.12,
    transparent: true,
    opacity: 0.86,
  })
  const riverMesh = new THREE.Mesh(riverGeo, riverMat)
  riverMesh.rotation.x = -Math.PI / 2
  riverMesh.rotation.z = Math.PI / 4
  riverMesh.position.set(0, -0.22, 0)
  riverMesh.receiveShadow = true
  root.add(riverMesh)

  // ==========================================
  // 2. CENTRAL BRONZE DRUM & LUSHENG PLAZA
  // ==========================================
  const plazaGroup = new THREE.Group()
  plazaGroup.position.set(0, getTerrainHeight(0, 1.2) + 0.04, 1.2)

  const drumFloor = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.4, 0.14, 32), bronzeDrumMat)
  drumFloor.receiveShadow = true
  plazaGroup.add(drumFloor)

  const plazaRing = new THREE.Mesh(new THREE.TorusGeometry(4.35, 0.25, 8, 32), stoneMat)
  plazaRing.rotation.x = Math.PI / 2
  plazaRing.position.y = 0.08
  plazaGroup.add(plazaRing)

  const totemPole = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 3.8, 12), darkWoodMat)
  totemPole.position.y = 1.9
  totemPole.castShadow = true
  plazaGroup.add(totemPole)

  const centralDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.58, 0.55, 20), bronzeDrumMat)
  centralDrum.position.y = 3.8
  centralDrum.castShadow = true
  plazaGroup.add(centralDrum)

  const silverHornTopper = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.06, 8, 16, Math.PI), silverMat)
  silverHornTopper.rotation.z = Math.PI
  silverHornTopper.position.y = 4.2
  plazaGroup.add(silverHornTopper)

  for (let b = 0; b < 6; b++) {
    const angle = (b * Math.PI * 2) / 6
    const bx = Math.sin(angle) * 3.4
    const bz = Math.cos(angle) * 3.4
    const by = 0.08

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.8, 6), darkWoodMat)
    post.position.set(bx, by + 1.4, bz)
    post.castShadow = true
    plazaGroup.add(post)

    const banner = new THREE.Mesh(
      new THREE.PlaneGeometry(0.35, 1.2),
      b % 2 === 0 ? redClothMat : new THREE.MeshStandardMaterial({ map: batikTex1, side: THREE.DoubleSide })
    )
    banner.position.set(bx, by + 2.0, bz)
    banner.rotation.y = angle + Math.PI / 2
    plazaGroup.add(banner)
    clothMeshes.push(banner)
  }
  root.add(plazaGroup)

  // ==========================================
  // 3. GRAND VILLAGE ENTRANCE GATE (迎宾寨门)
  // ==========================================
  const gateGroup = new THREE.Group()
  const gx = 0
  const gz = 14.5
  gateGroup.position.set(gx, getTerrainHeight(gx, gz), gz)

  for (const sx of [-2.2, 2.2]) {
    const stoneBase = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.9), stoneMat)
    stoneBase.position.set(sx, 0.3, 0)
    stoneBase.castShadow = true
    gateGroup.add(stoneBase)

    const timberPost = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 4.4, 8), darkWoodMat)
    timberPost.position.set(sx, 2.8, 0)
    timberPost.castShadow = true
    gateGroup.add(timberPost)
  }

  const beam1 = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.38, 0.45), woodMat)
  beam1.position.set(0, 3.8, 0)
  beam1.castShadow = true
  gateGroup.add(beam1)

  const beam2 = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.32, 0.42), woodMat)
  beam2.position.set(0, 4.4, 0)
  beam2.castShadow = true
  gateGroup.add(beam2)

  const gateRoof1 = new THREE.Mesh(new THREE.ConeGeometry(3.6, 1.1, 4), roofMat)
  gateRoof1.position.set(0, 5.2, 0)
  gateRoof1.rotation.y = Math.PI / 4
  gateRoof1.scale.set(1.4, 1.0, 0.85)
  gateRoof1.castShadow = true
  gateGroup.add(gateRoof1)

  const gateHorns = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.08, 8, 20, Math.PI), silverMat)
  gateHorns.rotation.z = Math.PI
  gateHorns.position.set(0, 5.9, 0)
  gateHorns.castShadow = true
  gateGroup.add(gateHorns)

  const plaque = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.65, 0.08), redClothMat)
  plaque.position.set(0, 3.8, 0.25)
  gateGroup.add(plaque)

  for (const sx of [-1.8, 1.8]) {
    const lantern = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xff3b30, emissive: 0xff5b4f, emissiveIntensity: 0.9 })
    )
    lantern.scale.set(1, 1.25, 1)
    lantern.position.set(sx, 3.2, 0.4)
    gateGroup.add(lantern)

    const light = new THREE.PointLight(0xff7a45, 1.2, 6)
    light.position.set(sx, 3.1, 0.5)
    gateGroup.add(light)
    lanternLights.push(light)
  }
  root.add(gateGroup)

  // ==========================================
  // 4. COVERED WIND AND RAIN BRIDGE (风雨廊桥)
  // ==========================================
  const bridgeGroup = new THREE.Group()
  const bx = -2.5
  const bz = -2.5
  bridgeGroup.position.set(bx, 0.25, bz)
  bridgeGroup.rotation.y = -Math.PI / 4

  for (const px of [-3.5, 0, 3.5]) {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 2.6), stoneMat)
    pier.position.set(px, -0.6, 0)
    pier.castShadow = true
    bridgeGroup.add(pier)
  }

  const deck = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.22, 2.4), woodMat)
  deck.position.set(0, 0.35, 0)
  deck.castShadow = true
  deck.receiveShadow = true
  bridgeGroup.add(deck)

  for (let i = -4; i <= 4; i++) {
    const cx = i * 1.05
    for (const cz of [-1.05, 1.05]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 1.9, 6), darkWoodMat)
      col.position.set(cx, 1.3, cz)
      col.castShadow = true
      bridgeGroup.add(col)
    }
  }

  for (const cz of [-1.1, 1.1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.45, 0.12), redClothMat)
    rail.position.set(0, 0.75, cz)
    bridgeGroup.add(rail)
  }

  const bridgeRoof = new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.3, 3.2), roofMat)
  bridgeRoof.position.set(0, 2.35, 0)
  bridgeRoof.castShadow = true
  bridgeGroup.add(bridgeRoof)

  const pavilionTower = new THREE.Group()
  pavilionTower.position.set(0, 2.4, 0)

  const pavCol1 = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.0, 4), roofMat)
  pavCol1.rotation.y = Math.PI / 4
  pavCol1.position.y = 0.6
  pavCol1.castShadow = true
  pavilionTower.add(pavCol1)

  const pavCol2 = new THREE.Mesh(new THREE.ConeGeometry(1.6, 0.9, 4), roofMat)
  pavCol2.rotation.y = Math.PI / 4
  pavCol2.position.y = 1.35
  pavCol2.castShadow = true
  pavilionTower.add(pavCol2)
  bridgeGroup.add(pavilionTower)

  for (const lx of [-2.5, 0, 2.5]) {
    const lantern = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xff5533, emissive: 0xff6644, emissiveIntensity: 0.9 })
    )
    lantern.position.set(lx, 1.9, 0)
    bridgeGroup.add(lantern)

    const bLight = new THREE.PointLight(0xffaa55, 0.9, 4)
    bLight.position.set(lx, 1.8, 0)
    bridgeGroup.add(bLight)
    lanternLights.push(bLight)
  }
  root.add(bridgeGroup)

  // ==========================================
  // 5. ROTATING WATERWHEEL & RIVER DOCK
  // ==========================================
  const waterwheelGroup = new THREE.Group()
  const wx = 4.2
  const wz = -4.2
  waterwheelGroup.position.set(wx, 0.1, wz)

  const dock = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.25, 4.2), woodMat)
  dock.position.set(-1.2, 0.1, 0)
  dock.castShadow = true
  dock.receiveShadow = true
  waterwheelGroup.add(dock)

  const boat = new THREE.Group()
  boat.position.set(0.6, -0.22, 1.8)
  boat.rotation.y = 0.35

  const boatHull = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.35, 2.8, 8, 1, false, 0, Math.PI), darkWoodMat)
  boatHull.rotation.x = Math.PI / 2
  boatHull.rotation.y = Math.PI
  boatHull.scale.set(1.4, 0.7, 1)
  boatHull.castShadow = true
  boat.add(boatHull)

  const boatCanopy = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.2, 8, 1, true, 0, Math.PI), darkWoodMat)
  boatCanopy.rotation.z = Math.PI / 2
  boatCanopy.position.set(0, 0.15, 0)
  boat.add(boatCanopy)
  waterwheelGroup.add(boat)

  const wheelRotating = new THREE.Group()
  wheelRotating.position.set(0.6, 1.2, -1.2)

  const rim1 = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.08, 8, 24), darkWoodMat)
  wheelRotating.add(rim1)
  const rim2 = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.08, 8, 24), darkWoodMat)
  rim2.position.z = 0.45
  wheelRotating.add(rim2)

  for (let s = 0; s < 12; s++) {
    const angle = (s * Math.PI * 2) / 12
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.2, 0.08), woodMat)
    spoke.rotation.z = angle
    spoke.position.z = 0.22
    wheelRotating.add(spoke)

    const bucket = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.48), darkWoodMat)
    bucket.position.set(Math.cos(angle) * 1.55, Math.sin(angle) * 1.55, 0.22)
    bucket.rotation.z = angle + Math.PI / 2
    wheelRotating.add(bucket)
  }

  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.1, 8), darkWoodMat)
  axle.rotation.x = Math.PI / 2
  axle.position.z = 0.22
  wheelRotating.add(axle)
  waterwheelGroup.add(wheelRotating)

  for (const sz of [-0.2, 0.65]) {
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 2.2, 6), darkWoodMat)
      leg.position.set(0.6 + side * 0.6, 0.8, -1.2 + sz)
      leg.rotation.z = side * -0.32
      leg.castShadow = true
      waterwheelGroup.add(leg)
    }
  }
  root.add(waterwheelGroup)

  // ==========================================
  // 6. STILT HOUSE GENERATOR
  // ==========================================
  const buildStiltHouse = (
    hx: number,
    hz: number,
    rotY: number,
    stories = 2,
    hasForge = false,
    hasLongTable = false,
    hasBatikDrying = false
  ) => {
    const hy = getTerrainHeight(hx, hz)
    const house = new THREE.Group()
    house.position.set(hx, hy, hz)
    house.rotation.y = rotY

    const stiltHeight = 1.4
    for (const px of [-1.6, 0, 1.6]) {
      for (const pz of [-1.3, 0, 1.3]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, stiltHeight + 0.8, 6), darkWoodMat)
        post.position.set(px, (stiltHeight + 0.8) * 0.5 - 0.4, pz)
        post.castShadow = true
        house.add(post)
      }
    }

    const floor1 = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.16, 3.0), woodMat)
    floor1.position.y = stiltHeight
    floor1.castShadow = true
    floor1.receiveShadow = true
    house.add(floor1)

    const wall1 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.6, 2.6), woodMat)
    wall1.position.y = stiltHeight + 0.8
    wall1.castShadow = true
    wall1.receiveShadow = true
    house.add(wall1)

    const door = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.2, 0.08), darkWoodMat)
    door.position.set(0, stiltHeight + 0.6, 1.32)
    house.add(door)

    for (const wx of [-1.0, 1.0]) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.06), windowWarmMat)
      win.position.set(wx, stiltHeight + 0.9, 1.32)
      house.add(win)
    }

    for (let step = 0; step < 5; step++) {
      const stair = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.28), darkWoodMat)
      stair.position.set(1.4, step * 0.25 + 0.15, 1.45 + step * 0.25)
      stair.castShadow = true
      house.add(stair)
    }

    let topY = stiltHeight + 1.6
    if (stories >= 2) {
      const floor2 = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.14, 3.4), woodMat)
      floor2.position.y = topY
      floor2.castShadow = true
      house.add(floor2)

      const wall2 = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.5, 2.4), woodMat)
      wall2.position.y = topY + 0.75
      wall2.castShadow = true
      house.add(wall2)

      const verandaRail = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.5, 0.08), redClothMat)
      verandaRail.position.set(0, topY + 0.35, 1.62)
      house.add(verandaRail)

      for (const wx of [-0.9, 0.9]) {
        const win2 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.06), windowWarmMat)
        win2.position.set(wx, topY + 0.85, 1.22)
        house.add(win2)
      }
      topY += 1.5
    }

    const roofBase = new THREE.Mesh(new THREE.ConeGeometry(3.2, 1.2, 4), roofMat)
    roofBase.position.y = topY + 0.65
    roofBase.rotation.y = Math.PI / 4
    roofBase.scale.set(1.3, 1.0, 1.1)
    roofBase.castShadow = true
    house.add(roofBase)

    const ridge = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.2, 0.25), darkWoodMat)
    ridge.position.y = topY + 1.3
    house.add(ridge)

    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.2, 0.42), stoneMat)
    chimney.position.set(1.1, topY + 0.9, -0.6)
    chimney.castShadow = true
    house.add(chimney)

    for (let c = -3; c <= 3; c++) {
      if (c === 0) continue
      const cx = c * 0.45
      const cornStrand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.05, 0.45, 6),
        c % 2 === 0 ? cornMat : chiliMat
      )
      cornStrand.position.set(cx, topY + 0.05, 1.5)
      house.add(cornStrand)
    }

    const houseLantern = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xff6633, emissive: 0xff7744, emissiveIntensity: 0.9 })
    )
    houseLantern.position.set(-1.6, topY + 0.1, 1.55)
    house.add(houseLantern)

    const hLight = new THREE.PointLight(0xff8833, 0.8, 5)
    hLight.position.set(-1.6, topY, 1.6)
    house.add(hLight)
    lanternLights.push(hLight)

    if (hasBatikDrying) {
      const scaffoldGroup = new THREE.Group()
      scaffoldGroup.position.set(-3.2, 0, 0)

      for (const sx of [-1.5, 0, 1.5]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4.8, 6), darkWoodMat)
        pole.position.set(sx, 2.4, 0)
        pole.castShadow = true
        scaffoldGroup.add(pole)
      }

      const topBar = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.1, 0.1), darkWoodMat)
      topBar.position.set(0, 4.6, 0)
      scaffoldGroup.add(topBar)

      for (let cl = 0; cl < 3; cl++) {
        const cloth = new THREE.Mesh(
          new THREE.PlaneGeometry(0.9, 3.8, 4, 12),
          new THREE.MeshStandardMaterial({
            map: cl % 2 === 0 ? batikTex1 : batikTex2,
            side: THREE.DoubleSide,
            roughness: 0.75,
          })
        )
        cloth.position.set(-1.0 + cl * 1.0, 2.5, 0)
        scaffoldGroup.add(cloth)
        clothMeshes.push(cloth)
      }

      for (let vat = 0; vat < 3; vat++) {
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.3, 0.7, 12), darkWoodMat)
        barrel.position.set(-1.2 + vat * 1.1, 0.35, 1.6)
        barrel.castShadow = true
        scaffoldGroup.add(barrel)
      }
      house.add(scaffoldGroup)
    }

    if (hasForge) {
      const forgeGroup = new THREE.Group()
      forgeGroup.position.set(2.8, 0, 0.5)

      const furnace = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, 0.85, 12), stoneMat)
      furnace.position.y = 0.42
      forgeGroup.add(furnace)

      const embers = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 10, 10),
        new THREE.MeshStandardMaterial({ color: 0xff3b00, emissive: 0xff5500, emissiveIntensity: 1.8 })
      )
      embers.position.y = 0.8
      forgeGroup.add(embers)

      const forgeLight = new THREE.PointLight(0xff5511, 2.2, 6)
      forgeLight.position.set(0, 1.2, 0)
      forgeGroup.add(forgeLight)
      lanternLights.push(forgeLight)

      const anvil = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.35), darkWoodMat)
      anvil.position.set(1.2, 0.3, 0)
      anvil.castShadow = true
      forgeGroup.add(anvil)

      const displayTable = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.75, 0.6), woodMat)
      displayTable.position.set(0, 0.38, 1.8)
      forgeGroup.add(displayTable)

      const silverCrownDisplay = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.05, 8, 16), silverMat)
      silverCrownDisplay.rotation.x = Math.PI / 2
      silverCrownDisplay.position.set(0, 0.88, 1.8)
      forgeGroup.add(silverCrownDisplay)
      house.add(forgeGroup)
    }

    if (hasLongTable) {
      const banquetGroup = new THREE.Group()
      banquetGroup.position.set(0, 0, 3.2)

      const table = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.72, 1.1), woodMat)
      table.position.y = 0.36
      table.castShadow = true
      banquetGroup.add(table)

      for (const bz of [-0.75, 0.75]) {
        const bench = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.42, 0.3), darkWoodMat)
        bench.position.set(0, 0.21, bz)
        bench.castShadow = true
        banquetGroup.add(bench)
      }

      for (let d = -4; d <= 4; d++) {
        const dx = d * 0.55
        const bowl = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.08, 0.08, 10),
          new THREE.MeshStandardMaterial({ color: 0x2255aa, roughness: 0.2 })
        )
        bowl.position.set(dx, 0.76, 0.2)
        banquetGroup.add(bowl)

        const steamer = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.14, 12), cornMat)
        steamer.position.set(dx, 0.8, -0.2)
        banquetGroup.add(steamer)
      }

      const canopy = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 2.2), redClothMat)
      canopy.position.set(0, 2.4, 0)
      canopy.rotation.x = Math.PI / 2 + 0.1
      banquetGroup.add(canopy)
      house.add(banquetGroup)
    }

    root.add(house)
    return house
  }

  // ==========================================
  // 7. PLACE ALL VILLAGE WORKSHOPS & HOMESTEADS
  // ==========================================
  buildStiltHouse(-10.5, 5.5, 0.35, 2, false, false, true) // Batik
  buildStiltHouse(10.2, 4.8, -0.4, 2, true, false, false)  // Silver
  buildStiltHouse(9.8, -6.5, -0.75, 3, false, false, false) // Embroidery
  buildStiltHouse(-8.8, -7.2, 0.8, 2, false, true, false)  // Long Table

  buildStiltHouse(-12.8, -1.5, 0.55, 2)
  buildStiltHouse(-6.5, 9.8, 0.15, 2)
  buildStiltHouse(-11.2, 10.5, 0.45, 2)
  buildStiltHouse(6.8, 8.5, -0.25, 2)
  buildStiltHouse(12.5, 0.5, -0.65, 2)
  buildStiltHouse(7.2, -11.5, -0.85, 2)
  buildStiltHouse(-4.5, -12.5, 0.95, 2)
  buildStiltHouse(11.5, -12.8, -0.9, 2)

  // Lookout Gazebo on Mountain Peak
  const lookoutGazebo = new THREE.Group()
  const lox = 13.2
  const loz = -11.5
  lookoutGazebo.position.set(lox, getTerrainHeight(lox, loz), loz)

  const gazBase = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 0.4, 8), stoneMat)
  gazBase.position.y = 0.2
  lookoutGazebo.add(gazBase)

  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI * 2) / 8
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 2.4, 6), redClothMat)
    col.position.set(Math.sin(angle) * 2.1, 1.4, Math.cos(angle) * 2.1)
    col.castShadow = true
    lookoutGazebo.add(col)
  }

  const gazRoof = new THREE.Mesh(new THREE.ConeGeometry(3.1, 1.6, 8), roofMat)
  gazRoof.position.y = 3.2
  gazRoof.castShadow = true
  lookoutGazebo.add(gazRoof)
  root.add(lookoutGazebo)

  // ==========================================
  // 8. COBBLESTONE & FLAGSTONE PATHWAYS
  // ==========================================
  const makePath = (points: Array<[number, number]>) => {
    const curve = new THREE.CatmullRomCurve3(
      points.map(([x, z]) => new THREE.Vector3(x, getTerrainHeight(x, z) + 0.05, z))
    )
    const pathMesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.48, 8, false), stoneMat)
    pathMesh.scale.y = 0.14
    pathMesh.receiveShadow = true
    root.add(pathMesh)
  }

  makePath([[0, 14.5], [0, 9.5], [0, 4.5], [0, 1.2]])
  makePath([[0, 1.2], [-1.2, -0.6], [-2.5, -2.5]])
  makePath([[-2.5, -2.5], [-5.5, -4.8], [-8.8, -7.2]])
  makePath([[0, 1.2], [-4.5, 3.2], [-10.5, 5.5]])
  makePath([[0, 1.2], [4.8, 2.8], [10.2, 4.8]])
  makePath([[-2.5, -2.5], [2.0, -3.2], [4.2, -4.2], [7.5, -5.2], [9.8, -6.5]])
  makePath([[9.8, -6.5], [11.5, -9.0], [13.2, -11.5]])

  // ==========================================
  // 9. LUSH FLORA: BAMBOO & PEACH TREES
  // ==========================================
  const addBambooCluster = (bx: number, bz: number) => {
    const by = getTerrainHeight(bx, bz)
    const bambooMat = new THREE.MeshStandardMaterial({ color: 0x4d8033, roughness: 0.6 })
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x5fa83b, roughness: 0.55 })

    const bGroup = new THREE.Group()
    bGroup.position.set(bx, by, bz)

    for (let c = 0; c < 5; c++) {
      const cx = (Math.random() - 0.5) * 0.9
      const cz = (Math.random() - 0.5) * 0.9
      const stalkH = 2.8 + Math.random() * 1.5

      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, stalkH, 6), bambooMat)
      stalk.position.set(cx, stalkH * 0.5, cz)
      stalk.rotation.z = (Math.random() - 0.5) * 0.12
      bGroup.add(stalk)

      const leaves = new THREE.Mesh(new THREE.SphereGeometry(0.45, 6, 6), leafMat)
      leaves.scale.set(1.4, 0.6, 1.4)
      leaves.position.set(cx, stalkH * 0.85, cz)
      bGroup.add(leaves)
    }
    root.add(bGroup)
  }

  const addPeachTree = (tx: number, tz: number, scale = 1.0) => {
    const ty = getTerrainHeight(tx, tz)
    const treeGroup = new THREE.Group()
    treeGroup.position.set(tx, ty, tz)
    treeGroup.scale.setScalar(scale)

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 1.8, 6), darkWoodMat)
    trunk.position.y = 0.9
    trunk.castShadow = true
    treeGroup.add(trunk)

    const blossomMat = new THREE.MeshStandardMaterial({ color: 0xfca5b9, roughness: 0.7 })
    for (const [fx, fy, fz, fr] of [
      [0, 2.2, 0, 1.1],
      [-0.6, 1.8, 0.4, 0.8],
      [0.6, 1.9, -0.4, 0.85],
      [0, 2.8, 0, 0.75],
    ]) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(fr, 8, 8), blossomMat)
      puff.position.set(fx, fy, fz)
      puff.castShadow = true
      treeGroup.add(puff)
    }
    root.add(treeGroup)
  }

  for (const [bx, bz] of [
    [-4.5, 0.5], [-3.8, 4.2], [5.2, -1.5], [6.8, -7.5],
    [-7.2, -2.5], [8.5, 1.2], [-1.5, 7.8], [2.2, 10.5],
  ]) {
    addBambooCluster(bx, bz)
  }

  for (const [tx, tz, ts] of [
    [-6.2, 2.8, 1.1],
    [3.5, 4.5, 1.0],
    [-2.2, -6.5, 1.2],
    [6.2, -4.5, 0.95],
    [-11.5, -4.2, 1.15],
    [11.8, 8.2, 1.05],
    [-5.5, 12.2, 0.9],
    [4.8, 13.5, 1.1],
  ]) {
    addPeachTree(tx, tz, ts)
  }

  // ==========================================
  // 10. ANIMATED LIVING VILLAGERS (市井NPC)
  // ==========================================
  const dancerNpc = new THREE.Group()
  dancerNpc.position.set(1.5, getTerrainHeight(1.5, 1.8), 1.8)

  const dBody = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.9, 8), darkWoodMat)
  dBody.position.y = 0.7
  dancerNpc.add(dBody)
  const dHead = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), new THREE.MeshStandardMaterial({ color: 0xf5caa6 }))
  dHead.position.y = 1.3
  dancerNpc.add(dHead)

  const lushengInst = new THREE.Group()
  lushengInst.position.set(0, 1.0, 0.35)
  for (let p = 0; p < 6; p++) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.8 + p * 0.15, 6), cornMat)
    pipe.position.set((p - 2.5) * 0.05, (0.8 + p * 0.15) * 0.5, 0)
    pipe.rotation.x = -0.3
    lushengInst.add(pipe)
  }
  dancerNpc.add(lushengInst)
  root.add(dancerNpc)

  animatedNpcs.push({
    group: dancerNpc,
    update: (t) => {
      dancerNpc.position.y = getTerrainHeight(1.5, 1.8) + Math.abs(Math.sin(t * 5)) * 0.08
      dancerNpc.rotation.y = Math.sin(t * 2.5) * 0.45
      lushengInst.rotation.z = Math.sin(t * 5) * 0.15
    },
  })

  // ==========================================
  // 11. PARTICLE SYSTEMS: SMOKE & PETALS
  // ==========================================
  const smokeCount = 180
  const smokeGeo = new THREE.BufferGeometry()
  const smokePos = new Float32Array(smokeCount * 3)
  const smokeMeta: Array<{ origX: number; origY: number; origZ: number; speedY: number; drift: number }> = []

  const chimneys: Array<[number, number]> = [
    [-10.5, 5.5], [10.2, 4.8], [9.8, -6.5], [-8.8, -7.2],
    [-12.8, -1.5], [-6.5, 9.8], [6.8, 8.5], [12.5, 0.5],
  ]

  for (let i = 0; i < smokeCount; i++) {
    const chim = chimneys[i % chimneys.length]
    const cy = getTerrainHeight(chim[0], chim[1]) + 4.2
    const sx = chim[0] + 1.1 + (Math.random() - 0.5) * 0.3
    const sz = chim[1] - 0.6 + (Math.random() - 0.5) * 0.3
    const sy = cy + Math.random() * 4.5

    smokePos[i * 3] = sx
    smokePos[i * 3 + 1] = sy
    smokePos[i * 3 + 2] = sz

    smokeMeta.push({
      origX: chim[0] + 1.1,
      origY: cy,
      origZ: chim[1] - 0.6,
      speedY: 0.8 + Math.random() * 0.6,
      drift: (Math.random() - 0.5) * 0.4,
    })
  }
  smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePos, 3))

  const smokeMat = new THREE.PointsMaterial({
    size: 1.2,
    map: smokeTex,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
    blending: THREE.NormalBlending,
  })
  const smokeParticles = new THREE.Points(smokeGeo, smokeMat)
  root.add(smokeParticles)

  // Peach Blossom Petals
  const petalCount = 120
  const petalGeo = new THREE.BufferGeometry()
  const petalPos = new Float32Array(petalCount * 3)
  const petalVel: Array<{ vx: number; vy: number; vz: number }> = []

  for (let i = 0; i < petalCount; i++) {
    petalPos[i * 3] = (Math.random() - 0.5) * 36
    petalPos[i * 3 + 1] = 0.5 + Math.random() * 8
    petalPos[i * 3 + 2] = (Math.random() - 0.5) * 36

    petalVel.push({
      vx: 0.4 + Math.random() * 0.4,
      vy: -(0.3 + Math.random() * 0.3),
      vz: (Math.random() - 0.5) * 0.4,
    })
  }
  petalGeo.setAttribute('position', new THREE.BufferAttribute(petalPos, 3))

  const petalMat = new THREE.PointsMaterial({
    size: 0.35,
    map: petalTex,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  })
  const petalParticles = new THREE.Points(petalGeo, petalMat)
  root.add(petalParticles)

  // ==========================================
  // 12. SCENE UPDATE ANIMATION LOOP
  // ==========================================
  const updateScene = (delta: number, elapsed: number) => {
    wheelRotating.rotation.z -= delta * 0.85

    clothMeshes.forEach((mesh, idx) => {
      mesh.rotation.y = Math.sin(elapsed * 2.2 + idx * 1.3) * 0.18
      mesh.rotation.z = Math.sin(elapsed * 1.8 + idx * 0.8) * 0.08
    })

    animatedNpcs.forEach((npc) => npc.update(elapsed))

    const sPos = smokeParticles.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < smokeCount; i++) {
      let py = sPos.getY(i) + smokeMeta[i].speedY * delta
      let px = sPos.getX(i) + (smokeMeta[i].drift + Math.sin(elapsed + i) * 0.02) * delta
      let pz = sPos.getZ(i) + (0.2 + Math.cos(elapsed + i) * 0.02) * delta

      if (py > smokeMeta[i].origY + 5.5) {
        py = smokeMeta[i].origY
        px = smokeMeta[i].origX + (Math.random() - 0.5) * 0.2
        pz = smokeMeta[i].origZ + (Math.random() - 0.5) * 0.2
      }
      sPos.setXYZ(i, px, py, pz)
    }
    sPos.needsUpdate = true

    const pPos = petalParticles.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < petalCount; i++) {
      let px = pPos.getX(i) + petalVel[i].vx * delta
      let py = pPos.getY(i) + petalVel[i].vy * delta
      let pz = pPos.getZ(i) + petalVel[i].vz * delta

      const groundY = getTerrainHeight(px, pz)
      if (py < groundY || px > 18) {
        px = -18 + Math.random() * 4
        py = 4 + Math.random() * 5
        pz = (Math.random() - 0.5) * 36
      }
      pPos.setXYZ(i, px, py, pz)
    }
    pPos.needsUpdate = true

    riverMat.opacity = 0.84 + Math.sin(elapsed * 2.0) * 0.05
  }

  return {
    group: root,
    waterMesh: riverMesh,
    waterwheelMesh: wheelRotating,
    smokeParticles,
    petalParticles,
    lanternLights,
    windowMaterials,
    clothMeshes,
    animatedNpcs,
    updateScene,
  }
}
