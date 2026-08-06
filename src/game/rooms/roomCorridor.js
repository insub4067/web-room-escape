import * as THREE from 'three'
import { createRoomShell, createDoor } from './roomShell.js'
import { muralTexture } from '../textureUtils.js'

const DOOR_GAP = [-1, 1]
const GEMS = [
  { id: 'gem_red', name: '빨간 보석', color: '#d43b32' },
  { id: 'gem_green', name: '초록 보석', color: '#3fae5c' },
  { id: 'gem_blue', name: '파란 보석', color: '#3b6fd4' },
]
const CORRECT_ORDER = ['gem_green', 'gem_red', 'gem_blue']

export function buildRoomCorridor({ ui, inventory }) {
  const shell = createRoomShell({
    size: 8,
    height: 3,
    wallColor: 0x8c8272,
    floorColor: 0x4a4640,
    ceilingColor: 0x322f2c,
    northDoorGap: DOOR_GAP,
  })
  const group = shell.group
  const colliders = shell.colliders.slice()
  const interactables = []
  const state = { doorUnlocked: false }

  const crateMat = new THREE.MeshStandardMaterial({ color: 0x6b5335, roughness: 0.9 })
  const openedCrateMat = new THREE.MeshStandardMaterial({ color: 0x4a3a24, roughness: 0.9 })
  const cratePositions = [
    [-2.6, -2.2],
    [0, -2.6],
    [2.6, -2.2],
  ]
  const crateOpened = [false, false, false]

  cratePositions.forEach(([x, z], idx) => {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), crateMat.clone())
    crate.position.set(x, 0.4, z)
    group.add(crate)
    colliders.push({ minX: x - 0.4, maxX: x + 0.4, minZ: z - 0.4, maxZ: z + 0.4 })

    const gem = GEMS[idx]
    interactables.push({
      mesh: crate,
      radius: 2.4,
      getPrompt: () => (crateOpened[idx] ? null : '상자를 열어본다'),
      interact: () => {
        if (crateOpened[idx]) return
        crateOpened[idx] = true
        crate.material = openedCrateMat
        inventory.addItem(gem)
        ui.showMessage(`상자 안에서 ${gem.name}을 찾았다!`)
      },
    })
  })

  // mural hint on the east wall
  const mural = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 1.0),
    new THREE.MeshStandardMaterial({ map: muralTexture([GEMS[1].color, GEMS[0].color, GEMS[2].color]) })
  )
  mural.position.set(3.82, 1.7, 0)
  mural.rotation.y = -Math.PI / 2
  group.add(mural)
  interactables.push({
    mesh: mural,
    radius: 3,
    getPrompt: () => '벽화를 살펴본다',
    interact: () => ui.showMessage('벽화에 순서가 그려져 있다: 초록 → 빨강 → 파랑'),
  })

  // cabinet with gem slots near the north door
  const cabinet = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 0.5), new THREE.MeshStandardMaterial({ color: 0x3d2f22 }))
  cabinet.position.set(1.6, 0.5, -3.6)
  group.add(cabinet)
  colliders.push({ minX: 1.0, maxX: 2.2, minZ: -3.85, maxZ: -3.35 })

  interactables.push({
    mesh: cabinet,
    radius: 2.4,
    getPrompt: () => (state.doorUnlocked ? null : '보석 자물쇠를 조작한다'),
    interact: () => {
      const owned = GEMS.filter((g) => inventory.hasItem(g.id))
      if (owned.length < 3) {
        ui.showMessage('아직 보석이 부족하다.')
        return
      }
      ui.openSequencePanel({
        items: GEMS,
        slotCount: 3,
        onResult: (selection) => {
          if (!selection) return
          const ok = selection.length === 3 && selection.every((id, i) => id === CORRECT_ORDER[i])
          if (ok) {
            GEMS.forEach((g) => inventory.removeItem(g.id))
            inventory.addItem({ id: 'golden_key', name: '황금 열쇠', color: '#e0c040' })
            state.doorUnlocked = true
            ui.showMessage('보석이 딸깍 소리를 내며 자물쇠가 풀렸다! 황금 열쇠를 얻었다.')
          } else {
            ui.showMessage('순서가 맞지 않는다...')
          }
        },
      })
    },
  })

  const door = createDoor({ gapX: DOOR_GAP, zPos: -3.85, color: 0x2a2a2a })
  group.add(door.group)

  function update(dt) {
    door.update(dt, state.doorUnlocked)
  }

  return {
    key: 'corridor',
    group,
    colliders,
    interactables,
    bounds: shell.bounds,
    spawn: new THREE.Vector3(0, 1.6, 3),
    spawnYaw: 0,
    isUnlocked: () => state.doorUnlocked,
    getDoorCollider: () => door.getCollider(state.doorUnlocked),
    update,
    next: 'vault',
    enterMessage: '창고를 지나 안쪽 통로로 들어왔다.',
  }
}
