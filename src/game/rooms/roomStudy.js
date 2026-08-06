import * as THREE from 'three'
import { createRoomShell, createDoor } from './roomShell.js'
import { labelTexture, clockTexture } from '../textureUtils.js'

const DOOR_GAP = [-1, 1]
const CODE = '731'

export function buildRoomStudy({ ui, inventory }) {
  const shell = createRoomShell({
    size: 8,
    height: 3,
    wallColor: 0xc9b48f,
    floorColor: 0x6b4a30,
    ceilingColor: 0x3a332c,
    northDoorGap: DOOR_GAP,
  })
  const group = shell.group
  const colliders = shell.colliders.slice()
  const interactables = []
  const state = { doorUnlocked: false }

  // bookshelf against the west wall
  const shelfMat = new THREE.MeshStandardMaterial({ color: 0x4a3220, roughness: 0.85 })
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.4, 3.2), shelfMat)
  shelf.position.set(-3.5, 1.2, -0.5)
  group.add(shelf)
  colliders.push({ minX: -3.8, maxX: -3.2, minZ: -2.1, maxZ: 1.1 })

  // a distinct red book on the shelf (interactable clue)
  const bookMat = new THREE.MeshStandardMaterial({ color: 0xa33328, roughness: 0.6 })
  const book = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.35), bookMat)
  book.position.set(-3.15, 1.5, -0.5)
  group.add(book)

  // desk
  const deskMat = new THREE.MeshStandardMaterial({ color: 0x5b3d24, roughness: 0.8 })
  const desk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.85, 0.9), deskMat)
  desk.position.set(3, 0.425, 1.2)
  group.add(desk)
  colliders.push({ minX: 2.2, maxX: 3.8, minZ: 0.75, maxZ: 1.65 })

  // painting on the east wall (interactable clue)
  const paintingMat = new THREE.MeshStandardMaterial({ color: 0x1c1a17 })
  const painting = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.2, 0.9), paintingMat)
  // Wall inner faces sit at ±3.85, so anything mounted has to clear that.
  painting.position.set(3.81, 1.9, -2)
  group.add(painting)

  // wall clock on the west wall (interactable clue)
  const clockMat = new THREE.MeshStandardMaterial({ map: clockTexture(1) })
  // A flat disc rather than a cylinder cap — the cap showed its mirrored back
  // face, which flipped the hour hand to the wrong side of the dial.
  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.45, 48), clockMat)
  clock.rotation.y = Math.PI / 2
  clock.position.set(-3.82, 2.0, 1.6)
  group.add(clock)

  // keypad panel mounted beside the north doorway
  const keypadPanel = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.4, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x2b2b2b, emissive: 0x113322, emissiveIntensity: 0.5 })
  )
  keypadPanel.position.set(1.6, 1.3, -3.80)
  group.add(keypadPanel)

  const door = createDoor({ gapX: DOOR_GAP, zPos: -3.85 })
  group.add(door.group)

  interactables.push({
    mesh: painting,
    radius: 3,
    getPrompt: () => (state.doorUnlocked ? null : '액자를 살펴본다'),
    interact: () => {
      painting.material = new THREE.MeshStandardMaterial({ map: labelTexture('7', { bg: '#7a5c34' }) })
      ui.showMessage('액자 뒤쪽에 숫자가 새겨져 있다: 7')
    },
  })

  interactables.push({
    mesh: book,
    radius: 3,
    getPrompt: () => '책을 펼쳐본다',
    interact: () => {
      ui.showMessage('책 속표지에 숫자가 적혀 있다: 3')
    },
  })

  interactables.push({
    mesh: clock,
    radius: 3,
    getPrompt: () => '벽시계를 살펴본다',
    interact: () => {
      ui.showMessage('시계 바늘이 가리키는 숫자: 1')
    },
  })

  interactables.push({
    mesh: keypadPanel,
    radius: 2.5,
    getPrompt: () => (state.doorUnlocked ? null : '숫자 자물쇠를 조작한다'),
    interact: () => {
      ui.openKeypad({
        length: 3,
        title: '숫자 자물쇠',
        onSubmit: (code) => {
          if (code === CODE) {
            state.doorUnlocked = true
            ui.showMessage('철컥! 문이 열렸다.')
          } else {
            ui.showMessage('숫자가 맞지 않는다...')
          }
        },
      })
    },
  })

  function update(dt) {
    door.update(dt, state.doorUnlocked)
  }

  return {
    key: 'study',
    group,
    colliders,
    interactables,
    bounds: shell.bounds,
    spawn: new THREE.Vector3(0, 1.6, 3),
    spawnYaw: 0,
    isUnlocked: () => state.doorUnlocked,
    getDoorCollider: () => door.getCollider(state.doorUnlocked),
    update,
    next: 'corridor',
    enterMessage: '서재를 빠져나와 복도로 들어섰다.',
  }
}
