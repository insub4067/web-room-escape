import * as THREE from 'three'
import { createRoomShell, createDoor } from './roomShell.js'

const DOOR_GAP = [-1.2, 1.2]

export function buildRoomVault({ ui, inventory }) {
  const shell = createRoomShell({
    size: 8,
    height: 3.2,
    wallColor: 0x555049,
    floorColor: 0x2f2b28,
    ceilingColor: 0x282420,
    northDoorGap: DOOR_GAP,
  })
  const group = shell.group
  const colliders = shell.colliders.slice()
  const interactables = []
  const state = { doorUnlocked: false }

  // vault wheel mechanism mounted in the doorway
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x8a7a4a, metalness: 0.6, roughness: 0.4 })
  const wheelGroup = new THREE.Group()
  // In front of the door slab (which spans z -3.89..-3.81) so it stays visible.
  wheelGroup.position.set(0, 1.4, -3.72)
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.08, 12, 24), wheelMat)
  wheelGroup.add(rim)
  for (let i = 0; i < 4; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.08, 0.08), wheelMat)
    spoke.rotation.z = (Math.PI / 4) * i
    wheelGroup.add(spoke)
  }
  // The rim is a thin ring, so a crosshair aimed at the middle of the wheel
  // shoots straight through the hole. This invisible disc gives the whole
  // wheel a solid surface to hit.
  const wheelTarget = new THREE.Mesh(
    new THREE.CircleGeometry(0.68, 24),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  )
  wheelTarget.position.z = 0.12
  wheelGroup.add(wheelTarget)
  group.add(wheelGroup)

  const door = createDoor({ gapX: DOOR_GAP, zPos: -3.85, color: 0x3a352c })
  group.add(door.group)

  interactables.push({
    mesh: wheelTarget,
    radius: 2.8,
    getPrompt: () => (state.doorUnlocked ? null : '금고 손잡이를 돌린다'),
    interact: () => {
      if (state.doorUnlocked) return
      if (inventory.hasItem('golden_key')) {
        inventory.removeItem('golden_key')
        state.doorUnlocked = true
        ui.showMessage('황금 열쇠로 금고 문을 열었다! 탈출구가 보인다.')
      } else {
        ui.showMessage('손잡이가 잠겨 있다. 열쇠가 필요할 것 같다.')
      }
    },
  })

  // decorative pedestal (obstacle)
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.9, 16), new THREE.MeshStandardMaterial({ color: 0x3d382f }))
  pedestal.position.set(-2.6, 0.45, 1)
  group.add(pedestal)
  colliders.push({ minX: -3.0, maxX: -2.2, minZ: 0.6, maxZ: 1.4 })

  function update(dt) {
    wheelGroup.rotation.z += dt * (state.doorUnlocked ? 1.2 : 0)
    door.update(dt, state.doorUnlocked)
  }

  return {
    key: 'vault',
    group,
    colliders,
    interactables,
    bounds: shell.bounds,
    spawn: new THREE.Vector3(0, 1.6, 3),
    spawnYaw: 0,
    isUnlocked: () => state.doorUnlocked,
    getDoorCollider: () => door.getCollider(state.doorUnlocked),
    update,
    next: null,
    enterMessage: '마지막 방, 금고실에 들어왔다.',
  }
}
