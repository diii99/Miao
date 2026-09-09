import * as THREE from 'three'

// Cache generated textures to avoid redundant canvas rendering
const textureCache = new Map<string, THREE.CanvasTexture>()

/**
 * Procedural Chinese blue-gray roof tiles (小青瓦)
 */
export function createRoofTileTexture(): THREE.CanvasTexture {
  const key = 'roof_tiles'
  if (textureCache.has(key)) return textureCache.get(key)!

  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#2c2f35'
  ctx.fillRect(0, 0, 512, 512)

  const rows = 16
  const cols = 8
  const rowH = 512 / rows
  const colW = 512 / cols

  for (let r = 0; r < rows; r++) {
    const y = r * rowH
    const shift = (r % 2) * (colW * 0.5)

    for (let c = -1; c <= cols; c++) {
      const x = c * colW + shift

      const grad = ctx.createLinearGradient(x, y, x, y + rowH)
      grad.addColorStop(0, '#1c1e22')
      grad.addColorStop(0.15, '#3b4049')
      grad.addColorStop(0.85, '#2e3239')
      grad.addColorStop(1, '#15171a')

      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.roundRect(x + 2, y + 1, colW - 4, rowH - 2, 3)
      ctx.fill()

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(x + 4, y + 2)
      ctx.lineTo(x + colW - 4, y + 2)
      ctx.stroke()

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x + 2, y + rowH - 1)
      ctx.lineTo(x + colW - 2, y + rowH - 1)
      ctx.stroke()
    }
  }

  for (let i = 0; i < 4000; i++) {
    const nx = Math.random() * 512
    const ny = Math.random() * 512
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.06)'
    ctx.fillRect(nx, ny, 2, 2)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(2, 2)
  textureCache.set(key, texture)
  return texture
}

/**
 * Procedural Miao timber wood planks (杉木板与木立柱纹理)
 */
export function createWoodPlankTexture(): THREE.CanvasTexture {
  const key = 'wood_planks'
  if (textureCache.has(key)) return textureCache.get(key)!

  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#65412b'
  ctx.fillRect(0, 0, 512, 512)

  const planks = 8
  const plankH = 512 / planks

  for (let p = 0; p < planks; p++) {
    const y = p * plankH
    const baseColor = p % 2 === 0 ? '#5d3822' : '#6b432a'
    ctx.fillStyle = baseColor
    ctx.fillRect(0, y, 512, plankH)

    ctx.strokeStyle = 'rgba(40, 20, 10, 0.25)'
    ctx.lineWidth = 1
    for (let g = 0; g < 14; g++) {
      ctx.beginPath()
      const gy = y + Math.random() * plankH
      ctx.moveTo(0, gy)
      ctx.bezierCurveTo(170, gy + (Math.random() - 0.5) * 8, 340, gy + (Math.random() - 0.5) * 8, 512, gy)
      ctx.stroke()
    }

    ctx.fillStyle = '#27140b'
    ctx.fillRect(0, y + plankH - 2, 512, 2)
    ctx.fillStyle = 'rgba(255, 230, 200, 0.08)'
    ctx.fillRect(0, y, 512, 1.5)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1, 2)
  textureCache.set(key, texture)
  return texture
}

/**
 * Procedural Bronze Drum Sun-Ray & Bird Motif (铜鼓太阳纹与翔鹭纹)
 */
export function createBronzeDrumTexture(): THREE.CanvasTexture {
  const key = 'bronze_drum'
  if (textureCache.has(key)) return textureCache.get(key)!

  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#7a6e62'
  ctx.fillRect(0, 0, 512, 512)

  const cx = 256
  const cy = 256

  const rings = [30, 60, 95, 135, 175, 215, 245]
  ctx.strokeStyle = '#c49a45'
  ctx.lineWidth = 3

  rings.forEach((r) => {
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()
  })

  ctx.fillStyle = '#dbab52'
  ctx.beginPath()
  const rays = 12
  for (let i = 0; i < rays; i++) {
    const a1 = (i * Math.PI * 2) / rays
    const a2 = ((i + 0.5) * Math.PI * 2) / rays
    const a3 = ((i + 1) * Math.PI * 2) / rays
    ctx.moveTo(cx + Math.cos(a1) * 8, cy + Math.sin(a1) * 8)
    ctx.lineTo(cx + Math.cos(a2) * 55, cy + Math.sin(a2) * 55)
    ctx.lineTo(cx + Math.cos(a3) * 8, cy + Math.sin(a3) * 8)
  }
  ctx.fill()

  ctx.fillStyle = '#e8c26f'
  const birdCount = 16
  const birdRadius = 115
  for (let i = 0; i < birdCount; i++) {
    const angle = (i * Math.PI * 2) / birdCount
    ctx.save()
    ctx.translate(cx + Math.cos(angle) * birdRadius, cy + Math.sin(angle) * birdRadius)
    ctx.rotate(angle + Math.PI / 2)
    ctx.beginPath()
    ctx.ellipse(0, 0, 10, 4, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(-4, 0)
    ctx.lineTo(0, -12)
    ctx.lineTo(4, 0)
    ctx.stroke()
    ctx.restore()
  }

  const teethCount = 64
  const outerR = 195
  ctx.strokeStyle = '#d4aa50'
  ctx.lineWidth = 2
  for (let i = 0; i < teethCount; i++) {
    const a1 = (i * Math.PI * 2) / teethCount
    const a2 = ((i + 0.5) * Math.PI * 2) / teethCount
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(a1) * (outerR - 15), cy + Math.sin(a1) * (outerR - 15))
    ctx.lineTo(cx + Math.cos(a2) * (outerR + 5), cy + Math.sin(a2) * (outerR + 5))
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  textureCache.set(key, texture)
  return texture
}

/**
 * Procedural Indigo Batik Textile (苗寨蓝白蜡染图样)
 */
export function createBatikTexture(variant = 0): THREE.CanvasTexture {
  const key = `batik_cloth_${variant}`
  if (textureCache.has(key)) return textureCache.get(key)!

  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = variant === 0 ? '#103058' : variant === 1 ? '#18446b' : '#0c274b'
  ctx.fillRect(0, 0, 512, 512)

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)'
  ctx.lineWidth = 1.2
  for (let i = 0; i < 30; i++) {
    ctx.beginPath()
    let x = Math.random() * 512
    let y = Math.random() * 512
    ctx.moveTo(x, y)
    for (let step = 0; step < 4; step++) {
      x += (Math.random() - 0.5) * 90
      y += (Math.random() - 0.5) * 90
      ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  ctx.fillStyle = '#f0f6ff'
  ctx.strokeStyle = '#f0f6ff'
  ctx.lineWidth = 3

  const drawButterfly = (bx: number, by: number, scale: number) => {
    ctx.save()
    ctx.translate(bx, by)
    ctx.scale(scale, scale)

    ctx.beginPath()
    ctx.ellipse(0, 0, 4, 18, 0, 0, Math.PI * 2)
    ctx.fill()

    for (const s of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(s * 3, -6)
      ctx.bezierCurveTo(s * 35, -40, s * 55, 5, s * 4, 4)
      ctx.fill()
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(s * 3, 6)
      ctx.bezierCurveTo(s * 30, 25, s * 25, 45, s * 3, 16)
      ctx.fill()
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(s * 2, -18)
      ctx.bezierCurveTo(s * 10, -32, s * 20, -28, s * 14, -20)
      ctx.stroke()
    }
    ctx.restore()
  }

  drawButterfly(256, 256, 1.3)
  drawButterfly(128, 128, 0.7)
  drawButterfly(384, 128, 0.7)
  drawButterfly(128, 384, 0.7)
  drawButterfly(384, 384, 0.7)

  ctx.strokeStyle = '#e4eeff'
  ctx.lineWidth = 4
  ctx.strokeRect(16, 16, 480, 480)
  ctx.strokeRect(28, 28, 456, 456)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  textureCache.set(key, texture)
  return texture
}

/**
 * Procedural Ancient Stone & Cobblestone Path (青石板与鹅卵石纹理)
 */
export function createStonePathTexture(): THREE.CanvasTexture {
  const key = 'stone_path'
  if (textureCache.has(key)) return textureCache.get(key)!

  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#6e726b'
  ctx.fillRect(0, 0, 512, 512)

  const stones = [
    { x: 10, y: 10, w: 230, h: 140, c: '#7d837a' },
    { x: 260, y: 15, w: 240, h: 130, c: '#696f67' },
    { x: 15, y: 170, w: 150, h: 160, c: '#747a71' },
    { x: 185, y: 165, w: 310, h: 170, c: '#80877e' },
    { x: 20, y: 350, w: 260, h: 145, c: '#6a7067' },
    { x: 300, y: 355, w: 195, h: 140, c: '#798076' },
  ]

  stones.forEach((s) => {
    ctx.fillStyle = s.c
    ctx.beginPath()
    ctx.roundRect(s.x, s.y, s.w, s.h, 12)
    ctx.fill()

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(s.x + s.w, s.y)
    ctx.lineTo(s.x + s.w, s.y + s.h)
    ctx.lineTo(s.x, s.y + s.h)
    ctx.stroke()
  })

  ctx.fillStyle = '#3f4738'
  for (let i = 0; i < 2000; i++) {
    const rx = Math.random() * 512
    const ry = Math.random() * 512
    ctx.fillRect(rx, ry, 3, 3)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(3, 3)
  textureCache.set(key, texture)
  return texture
}

/**
 * Procedural Chimney Smoke Particle Texture (炊烟袅袅)
 */
export function createSmokeParticleTexture(): THREE.CanvasTexture {
  const key = 'smoke_particle'
  if (textureCache.has(key)) return textureCache.get(key)!

  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')!

  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 60)
  grad.addColorStop(0, 'rgba(245, 240, 235, 0.85)')
  grad.addColorStop(0.35, 'rgba(225, 220, 215, 0.55)')
  grad.addColorStop(0.7, 'rgba(200, 195, 190, 0.2)')
  grad.addColorStop(1, 'rgba(180, 180, 180, 0)')

  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(64, 64, 60, 0, Math.PI * 2)
  ctx.fill()

  const texture = new THREE.CanvasTexture(canvas)
  textureCache.set(key, texture)
  return texture
}

/**
 * Procedural Peach Blossom Petal Particle (落英缤纷花瓣)
 */
export function createPetalParticleTexture(): THREE.CanvasTexture {
  const key = 'petal_particle'
  if (textureCache.has(key)) return textureCache.get(key)!

  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')!

  const grad = ctx.createRadialGradient(32, 28, 2, 32, 32, 28)
  grad.addColorStop(0, '#ffffff')
  grad.addColorStop(0.35, '#ffb8cb')
  grad.addColorStop(0.85, '#f56e92')
  grad.addColorStop(1, 'rgba(240, 90, 130, 0)')

  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.moveTo(32, 6)
  ctx.bezierCurveTo(48, 14, 56, 38, 32, 58)
  ctx.bezierCurveTo(8, 38, 16, 14, 32, 6)
  ctx.fill()

  const texture = new THREE.CanvasTexture(canvas)
  textureCache.set(key, texture)
  return texture
}
