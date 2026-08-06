import * as THREE from 'three'
import { TouchInput } from './TouchInput.js'
import { UI } from './UI.js'
import { Inventory } from './Inventory.js'
import { resolveBoxCollision, clampToBounds } from './collision.js'
import { buildRoomStudy } from './rooms/roomStudy.js'
import { buildRoomCorridor } from './rooms/roomCorridor.js'
import { buildRoomVault } from './rooms/roomVault.js'

const _forward = new THREE.Vector3()
const _right = new THREE.Vector3()
const _move = new THREE.Vector3()
const _euler = new THREE.Euler()
const _dir = new THREE.Vector3()

export class Game {
  constructor(canvas) {
    this.canvas = canvas
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x14100c)
    this.scene.fog = new THREE.Fog(0x14100c, 7, 18)

    this.camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 100)

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this._resize()

    window.addEventListener('resize', () => this._resize())
    window.addEventListener('orientationchange', () => setTimeout(() => this._resize(), 200))

    this.ui = new UI()
    this.inventory = new Inventory(this.ui)

    this.player = { pos: new THREE.Vector3(), yaw: 0, pitch: 0, height: 1.6, radius: 0.35, speed: 2.6 }

    this.input = new TouchInput({
      joystickZone: this.ui.getJoystickZone(),
      lookZone: this.ui.getLookZone(),
      interactButton: this.ui.getInteractButton(),
      onInteract: () => this._tryInteract(),
    })

    this.rooms = {
      study: buildRoomStudy({ ui: this.ui, inventory: this.inventory }),
      corridor: buildRoomCorridor({ ui: this.ui, inventory: this.inventory }),
      vault: buildRoomVault({ ui: this.ui, inventory: this.inventory }),
    }

    this.raycaster = new THREE.Raycaster()
    this.clock = new THREE.Clock()
    this.startTime = 0
    this.finished = false
    this.currentTarget = null

    this._setupLights()
    this.loadRoom('study', true)

    this._animate = this._animate.bind(this)
  }

  _setupLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.85))
    this.scene.add(new THREE.HemisphereLight(0x6a5c48, 0x231d16, 0.5))
    const dir = new THREE.DirectionalLight(0xfff2df, 0.55)
    dir.position.set(3, 6, 2)
    this.scene.add(dir)
    this.playerLight = new THREE.PointLight(0xffe6c0, 1.0, 10)
    this.scene.add(this.playerLight)
  }

  loadRoom(key, initial = false) {
    if (this.currentRoom) this.scene.remove(this.currentRoom.group)
    const room = this.rooms[key]
    this.currentRoomKey = key
    this.currentRoom = room
    this.scene.add(room.group)
    this.player.pos.copy(room.spawn)
    this.player.yaw = room.spawnYaw ?? 0
    this.player.pitch = 0
    this.input.yaw = this.player.yaw
    this.input.pitch = this.player.pitch
    if (!initial) this.ui.showMessage(room.enterMessage || '다음 방으로 이동했다.')
  }

  start() {
    this.startTime = this.clock.getElapsedTime()
    this._animate()
  }

  _resize() {
    const w = window.innerWidth
    const h = window.innerHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }

  _tryInteract() {
    if (this.ui.isModalOpen()) return
    if (this.currentTarget) this.currentTarget.interact()
  }

  _updatePlayer(dt) {
    const room = this.currentRoom
    const modalOpen = this.ui.isModalOpen()

    this.player.yaw = this.input.yaw
    this.player.pitch = this.input.pitch

    if (!modalOpen) {
      _euler.set(0, this.player.yaw, 0)
      _forward.set(0, 0, -1).applyEuler(_euler)
      _right.set(1, 0, 0).applyEuler(_euler)
      _move.set(0, 0, 0)
      _move.addScaledVector(_forward, this.input.move.z)
      _move.addScaledVector(_right, this.input.move.x)
      if (_move.lengthSq() > 1) _move.normalize()
      _move.multiplyScalar(this.player.speed * dt)

      const next = this.player.pos.clone().add(_move)
      clampToBounds(next, room.bounds, this.player.radius)
      for (const box of room.colliders) resolveBoxCollision(next, this.player.radius, box)
      const doorBox = room.getDoorCollider?.()
      if (doorBox) resolveBoxCollision(next, this.player.radius, doorBox)
      this.player.pos.copy(next)
    }

    this.camera.position.set(this.player.pos.x, this.player.height, this.player.pos.z)
    this.camera.rotation.order = 'YXZ'
    this.camera.rotation.y = this.player.yaw
    this.camera.rotation.x = this.player.pitch
    this.playerLight.position.copy(this.camera.position)

    if (!modalOpen && room.isUnlocked() && this.player.pos.z < room.bounds.minZ + 0.6) {
      if (room.next) this.loadRoom(room.next)
      else this._win()
    }
  }

  _updateInteraction() {
    if (this.ui.isModalOpen()) {
      this.currentTarget = null
      this.ui.setPrompt(null)
      return
    }
    this.camera.getWorldDirection(_dir)
    this.raycaster.set(this.camera.position, _dir)
    const meshes = this.currentRoom.interactables.map((i) => i.mesh)
    const hits = this.raycaster.intersectObjects(meshes, false)
    let target = null
    if (hits.length) {
      const hit = hits[0]
      const found = this.currentRoom.interactables.find((i) => i.mesh === hit.object)
      if (found && hit.distance <= (found.radius ?? 3)) target = found
    }
    this.currentTarget = target
    this.ui.setPrompt(target?.getPrompt?.() || null)
  }

  _animate() {
    if (this.finished) return
    requestAnimationFrame(this._animate)
    const dt = Math.min(this.clock.getDelta(), 0.05)
    this._updatePlayer(dt)
    this.currentRoom.update?.(dt)
    this._updateInteraction()
    this.ui.updateTimer(this.clock.getElapsedTime() - this.startTime)
    this.renderer.render(this.scene, this.camera)
  }

  _win() {
    this.finished = true
    this.ui.setPrompt(null)
    const total = this.clock.getElapsedTime() - this.startTime
    this.ui.showWinScreen(total, () => location.reload())
  }
}
