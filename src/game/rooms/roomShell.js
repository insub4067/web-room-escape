import * as THREE from 'three'

function addWallX(group, colliders, x0, x1, z, thickness, height, mat) {
  const w = x1 - x0
  if (w <= 0.001) return
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, height, thickness), mat)
  mesh.position.set((x0 + x1) / 2, height / 2, z)
  group.add(mesh)
  colliders.push({ minX: x0, maxX: x1, minZ: z - thickness / 2, maxZ: z + thickness / 2 })
}

function addWallZ(group, colliders, z0, z1, x, thickness, height, mat) {
  const d = z1 - z0
  if (d <= 0.001) return
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(thickness, height, d), mat)
  mesh.position.set(x, height / 2, (z0 + z1) / 2)
  group.add(mesh)
  colliders.push({ minX: x - thickness / 2, maxX: x + thickness / 2, minZ: z0, maxZ: z1 })
}

/**
 * Builds a rectangular room: floor, ceiling, 4 walls. The north wall (z = -half)
 * can have a door-sized gap; every other wall is solid. Rooms are always placed
 * at the world origin so local coordinates double as world/collision coordinates.
 */
export function createRoomShell({
  size = 8,
  height = 3,
  floorColor = 0x8a6d4b,
  wallColor = 0xcbb994,
  ceilingColor = 0x2e2a26,
  northDoorGap = null,
} = {}) {
  const half = size / 2
  const thickness = 0.3
  const group = new THREE.Group()
  const colliders = []

  const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.9 })
  const floorMat = new THREE.MeshStandardMaterial({ color: floorColor, roughness: 0.85 })
  const ceilMat = new THREE.MeshStandardMaterial({ color: ceilingColor, roughness: 1 })

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(size, size), floorMat)
  floor.rotation.x = -Math.PI / 2
  group.add(floor)

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(size, size), ceilMat)
  ceiling.rotation.x = Math.PI / 2
  ceiling.position.y = height
  group.add(ceiling)

  // south wall (solid, behind the player's spawn point)
  addWallX(group, colliders, -half, half, half, thickness, height, wallMat)
  // east / west walls (solid)
  addWallZ(group, colliders, -half, half, half, thickness, height, wallMat)
  addWallZ(group, colliders, -half, half, -half, thickness, height, wallMat)

  // north wall, optionally with a door gap
  if (northDoorGap) {
    const [gx0, gx1] = northDoorGap
    addWallX(group, colliders, -half, gx0, -half, thickness, height, wallMat)
    addWallX(group, colliders, gx1, half, -half, thickness, height, wallMat)
    const doorHeight = 2.35
    if (height > doorHeight) {
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(gx1 - gx0, height - doorHeight, thickness), wallMat)
      lintel.position.set((gx0 + gx1) / 2, doorHeight + (height - doorHeight) / 2, -half)
      group.add(lintel)
    }
  } else {
    addWallX(group, colliders, -half, half, -half, thickness, height, wallMat)
  }

  return { group, colliders, bounds: { minX: -half, maxX: half, minZ: -half, maxZ: half }, half }
}

/** A hinged door slab that blocks the north gap until unlocked, then swings open. */
export function createDoor({ gapX, zPos, height = 2.35, color = 0x33241a }) {
  const [gx0, gx1] = gapX
  const width = gx1 - gx0
  const doorMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 })
  const hinge = new THREE.Group()
  hinge.position.set(gx0, 0, zPos)
  const slab = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.08), doorMat)
  slab.position.set(width / 2, height / 2, 0)
  hinge.add(slab)

  function update(dt, unlocked) {
    const target = unlocked ? -Math.PI * 0.75 : 0
    hinge.rotation.y += (target - hinge.rotation.y) * Math.min(1, dt * 4)
  }

  function getCollider(unlocked) {
    if (unlocked) return null
    return { minX: gx0, maxX: gx1, minZ: zPos - 0.15, maxZ: zPos + 0.15 }
  }

  return { group: hinge, update, getCollider }
}
