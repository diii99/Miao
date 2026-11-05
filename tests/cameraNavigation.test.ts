import { describe, expect, test } from 'bun:test'
import { Euler, PerspectiveCamera, Quaternion, Vector3 } from 'three'
import { GAMEPLAY_FOV, GAMEPLAY_ZOOM, clampGameplayZoom, gameplayCameraOffset, mapRelativeMovement, magnifyGameplayZoom, stepGameplayZoom } from '../src/map-3d/cameraNavigation'

const expectVector = (actual: { x: number; z: number }, x: number, z: number) => {
  expect(actual.x).toBeCloseTo(x, 9)
  expect(actual.z).toBeCloseTo(z, 9)
}

describe('movement follows the currently rendered map', () => {
  test('up and right preserve their bearings across a complete rotation and vertical views', () => {
    for (let degrees = -360; degrees <= 360; degrees += 15) {
      const yaw = degrees * Math.PI / 180
      for (const pitch of [-Math.PI / 2, -1.56, -1.2, -.6, 0, .6, 1.56, Math.PI / 2]) {
        const q = new Quaternion().setFromEuler(new Euler(pitch, yaw, 0, 'YXZ'))
        expectVector(mapRelativeMovement(q, 0, -1), -Math.sin(yaw), -Math.cos(yaw))
        expectVector(mapRelativeMovement(q, 1, 0), Math.cos(yaw), -Math.sin(yaw))
      }
    }
  })

  test('up is screen-up after OrbitControls lookAt, including all XYZ Euler quadrants', () => {
    const target = new Vector3(0, 0, 0)
    for (let azimuth = 0; azimuth < 360; azimuth += 15) {
      for (const elevation of [.1, 10, 48, 10000]) {
        const angle = azimuth * Math.PI / 180
        const camera = new PerspectiveCamera(45, 1.5, .01, 20000)
        camera.position.set(65 * Math.sin(angle), elevation, 65 * Math.cos(angle))
        camera.lookAt(target)
        camera.updateMatrixWorld()
        const move = mapRelativeMovement(camera.quaternion, 0, -1)
        const projectedOrigin = target.clone().project(camera)
        const projectedMove = new Vector3(move.x, 0, move.z).project(camera).sub(projectedOrigin)
        expect(projectedMove.y).toBeGreaterThan(0)
        expect(projectedMove.x).toBeCloseTo(0, 9)
      }
    }
  })

  test('the original oblique view does not use the misleading XYZ Euler y component', () => {
    const camera = new PerspectiveCamera()
    camera.position.set(42, 48, 65)
    camera.lookAt(0, 2, -2)
    const expectedLength = Math.hypot(42, 67)
    const move = mapRelativeMovement(camera.quaternion, 0, -1)
    expectVector(move, -42 / expectedLength, -67 / expectedLength)
    const oldDirection = new Vector3(0, 0, -1).applyEuler(new Euler(0, camera.rotation.y, 0, 'YXZ'))
    expect(Math.abs(oldDirection.x - move.x)).toBeGreaterThan(.01)
  })

  test('analog strength is preserved and keyboard diagonals cannot exceed full speed', () => {
    const q = new Quaternion().setFromEuler(new Euler(-1.2, 2.7, 0, 'YXZ'))
    for (const [x, y, expected] of [[0, 0, 0], [0, -.25, .25], [.3, .4, .5], [1, -1, 1], [4, -3, 1]]) {
      const movement = mapRelativeMovement(q, x, y)
      expect(Math.hypot(movement.x, movement.z)).toBeCloseTo(expected, 9)
    }
    const up = mapRelativeMovement(q, 0, -1)
    expectVector(mapRelativeMovement(q, 0, 1), -up.x, -up.z)
  })

  test('a rolled vertical right axis falls back to a finite horizontal basis', () => {
    const q = new Quaternion().setFromEuler(new Euler(0, 0, Math.PI / 2))
    expectVector(mapRelativeMovement(q, 0, -1), 0, -1)
    expectVector(mapRelativeMovement(q, 1, 0), 1, 0)
  })
})


describe('fixed-angle gameplay camera', () => {
  test('zoom changes camera distance inversely while preserving the 50-degree pitch and yaw', () => {
    for (const aspect of [1.44, .46]) {
      const defaultOffset = gameplayCameraOffset(GAMEPLAY_ZOOM.default, aspect)
      const baseDistance = Math.hypot(defaultOffset.x, defaultOffset.y, defaultOffset.z)
      for (const zoom of [.1,.2,.3,.4,.5]) for (const yaw of [0, Math.PI/2, Math.PI, -Math.PI/2]) {
        const offset = gameplayCameraOffset(zoom, aspect, yaw)
        expect(Math.hypot(offset.x,offset.y,offset.z) / baseDistance).toBeCloseTo(.3 / zoom, 10)
        expect(Math.atan2(offset.y, Math.hypot(offset.x,offset.z)) * 180 / Math.PI).toBeCloseTo(50.1944289077348, 10)
        expect(offset.x / Math.hypot(offset.x,offset.z)).toBeCloseTo(Math.sin(yaw),10)
        expect(offset.z / Math.hypot(offset.x,offset.z)).toBeCloseTo(Math.cos(yaw),10)
      }
    }
  })

  test('default framing is elevated, outside the avatar, and slightly wider on portrait screens', () => {
    expect(gameplayCameraOffset(.3, 1.44)).toEqual({x:0,y:9,z:7.5})
    const portrait = gameplayCameraOffset(.3,.46)
    expect(portrait.y / 9).toBeCloseTo(1.12,10)
    expect(portrait.z / 7.5).toBeCloseTo(1.12,10)
    expect(gameplayCameraOffset(.5,.46).y).toBeGreaterThan(5)
    expect(gameplayCameraOffset(-5,1.44)).toEqual(gameplayCameraOffset(.1,1.44))
    expect(gameplayCameraOffset(100,1.44)).toEqual(gameplayCameraOffset(.5,1.44))
  })

  test('target stays centered and detail grows through distance without changing lens or map-up', () => {
    for (const aspect of [1.44,.46]) for (const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2]) {
      const camera = new PerspectiveCamera(GAMEPLAY_FOV,aspect,.1,400)
      const target = new Vector3(4,.7,-3)
      // A point sideways from the target sits at the same depth for each zoom.
      const point = target.clone().add(new Vector3(Math.cos(yaw),0,-Math.sin(yaw)))
      let baselineWidth = 0
      for (const zoom of [.3,.1,.5]) {
        const offset = gameplayCameraOffset(zoom,aspect,yaw)
        camera.position.copy(target).add(new Vector3(offset.x,offset.y,offset.z))
        camera.lookAt(target)
        camera.updateMatrixWorld()
        const projectedTarget = target.clone().project(camera)
        expect(projectedTarget.x).toBeCloseTo(0,10)
        expect(projectedTarget.y).toBeCloseTo(0,10)
        const projected = point.clone().project(camera)
        if (zoom === .3) baselineWidth = projected.x
        expect(projected.x / baselineWidth).toBeCloseTo(zoom/.3,10)
        expect(camera.zoom).toBe(1)
        expect(camera.getEffectiveFOV()).toBe(GAMEPLAY_FOV)
        expectVector(mapRelativeMovement(camera.quaternion,0,-1),-Math.sin(yaw),-Math.cos(yaw))
      }
    }
  })

  test('buttons reach every tenth precisely and stop at the user bounds', () => {
    let zoom: number = GAMEPLAY_ZOOM.default
    zoom = stepGameplayZoom(zoom, -1)
    expect(zoom).toBe(.2)
    expect(stepGameplayZoom(zoom, -1)).toBe(.1)
    expect(stepGameplayZoom(.1, -1)).toBe(.1)
    for (const [from, expected] of [[.1, .2], [.2, .3], [.3, .4], [.4, .5], [.5, .5]]) expect(stepGameplayZoom(from, 1)).toBe(expected)
    expect(stepGameplayZoom(.347, 1)).toBe(.4)
    expect(stepGameplayZoom(.347, -1)).toBe(.3)
  })

  test('wheel and pinch smoothly change zoom within 0.1x-0.5x', () => {
    expect(magnifyGameplayZoom(.3, 1.5)).toBeCloseTo(.45, 10)
    expect(magnifyGameplayZoom(.45, 1 / 1.5)).toBeCloseTo(.3, 10)
    expect(magnifyGameplayZoom(.3, 100)).toBe(.5)
    expect(magnifyGameplayZoom(.3, .001)).toBe(.1)
    for (const ratio of [0, -1, NaN, Infinity]) expect(magnifyGameplayZoom(.3, ratio)).toBe(.3)
    for (const invalid of [NaN,Infinity,-Infinity]) expect(clampGameplayZoom(invalid)).toBe(.3)
  })
})
