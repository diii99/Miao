import type { Quaternion } from 'three'

type GroundVector = { x: number; z: number }

/** Camera-right stays defined even when looking straight down at the map. */
export function mapGroundAxes(q: Pick<Quaternion, 'x' | 'y' | 'z' | 'w'>): { right: GroundVector; forward: GroundVector } {
  let x = 1 - 2 * (q.y * q.y + q.z * q.z)
  let z = 2 * (q.x * q.z - q.w * q.y)
  let length = Math.hypot(x, z)
  if (length < 1e-8) {
    // A rolled camera can point its right axis vertically; use its forward axis.
    const forwardX = -2 * (q.x * q.z + q.w * q.y)
    const forwardZ = 2 * (q.x * q.x + q.y * q.y) - 1
    x = -forwardZ
    z = forwardX
    length = Math.hypot(x, z)
  }
  const right = { x: x / length, z: z / length }
  return { right, forward: { x: right.z, z: -right.x } }
}

/** Input Y follows the screen/joystick convention: negative is up/forward. */
export function mapRelativeMovement(q: Pick<Quaternion, 'x' | 'y' | 'z' | 'w'>, inputX: number, inputY: number): GroundVector {
  const { right, forward } = mapGroundAxes(q)
  const divisor = Math.max(1, Math.hypot(inputX, inputY))
  return {
    x: (right.x * inputX - forward.x * inputY) / divisor,
    z: (right.z * inputX - forward.z * inputY) / divisor,
  }
}

export const GAMEPLAY_FOV = 45
export const GAMEPLAY_ZOOM = { min: 0.1, default: 0.3, max: 0.5 } as const

export function clampGameplayZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) return GAMEPLAY_ZOOM.default
  return Math.max(GAMEPLAY_ZOOM.min, Math.min(GAMEPLAY_ZOOM.max, zoom))
}

export function magnifyGameplayZoom(zoom: number, magnification: number): number {
  if (!Number.isFinite(magnification) || magnification <= 0) return clampGameplayZoom(zoom)
  return clampGameplayZoom(zoom * magnification)
}

/** Buttons land precisely on the next tenth, also after continuous wheel/pinch input. */
export function stepGameplayZoom(zoom: number, direction: -1 | 1): number {
  const current = clampGameplayZoom(zoom)
  const tenth = direction > 0 ? Math.floor(current * 10 + 1e-8) + 1 : Math.ceil(current * 10 - 1e-8) - 1
  return clampGameplayZoom(tenth / 10)
}

/** Fixed oblique gameplay bearing; zoom changes distance, never FOV or avatar-relative yaw. */
export function gameplayCameraOffset(zoom: number, aspect: number, yaw = 0): { x: number; y: number; z: number } {
  const distanceScale = GAMEPLAY_ZOOM.default / clampGameplayZoom(zoom) * (aspect < 0.8 ? 1.12 : 1)
  return {
    x: Math.sin(yaw) * 7.5 * distanceScale,
    y: 9 * distanceScale,
    z: Math.cos(yaw) * 7.5 * distanceScale,
  }
}
