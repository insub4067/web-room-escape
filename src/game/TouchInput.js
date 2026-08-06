export class TouchInput {
  constructor({ joystickZone, lookZone, interactButton, onInteract }) {
    this.move = { x: 0, z: 0 }
    this.yaw = 0
    this.pitch = 0
    this._active = true

    this._setupJoystick(joystickZone)
    this._setupLook(lookZone)

    interactButton.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      onInteract()
    })
  }

  setActive(active) {
    this._active = active
    if (!active) {
      this.move.x = 0
      this.move.z = 0
    }
  }

  _setupJoystick(zone) {
    const knob = zone.querySelector('.joystick-knob')
    const radius = 44
    let activeId = null
    let center = { x: 0, y: 0 }

    const start = (e) => {
      if (!this._active || activeId !== null) return
      activeId = e.pointerId
      const rect = zone.getBoundingClientRect()
      center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      zone.setPointerCapture(e.pointerId)
      e.preventDefault()
    }
    const move = (e) => {
      if (e.pointerId !== activeId) return
      let dx = e.clientX - center.x
      let dy = e.clientY - center.y
      const dist = Math.min(Math.hypot(dx, dy), radius)
      const angle = Math.atan2(dy, dx)
      dx = Math.cos(angle) * dist
      dy = Math.sin(angle) * dist
      knob.style.transform = `translate(${dx}px, ${dy}px)`
      this.move.x = dx / radius
      this.move.z = -dy / radius
      e.preventDefault()
    }
    const end = (e) => {
      if (e.pointerId !== activeId) return
      activeId = null
      knob.style.transform = 'translate(0px, 0px)'
      this.move.x = 0
      this.move.z = 0
    }

    zone.addEventListener('pointerdown', start)
    zone.addEventListener('pointermove', move)
    zone.addEventListener('pointerup', end)
    zone.addEventListener('pointercancel', end)
  }

  _setupLook(zone) {
    const sensitivity = 0.0035
    const limit = Math.PI / 2 - 0.05
    let activeId = null
    let last = { x: 0, y: 0 }

    const start = (e) => {
      if (!this._active || activeId !== null) return
      activeId = e.pointerId
      last = { x: e.clientX, y: e.clientY }
      zone.setPointerCapture(e.pointerId)
    }
    const move = (e) => {
      if (e.pointerId !== activeId) return
      const dx = e.clientX - last.x
      const dy = e.clientY - last.y
      last = { x: e.clientX, y: e.clientY }
      this.yaw -= dx * sensitivity
      this.pitch -= dy * sensitivity
      this.pitch = Math.max(-limit, Math.min(limit, this.pitch))
    }
    const end = (e) => {
      if (e.pointerId === activeId) activeId = null
    }

    zone.addEventListener('pointerdown', start)
    zone.addEventListener('pointermove', move)
    zone.addEventListener('pointerup', end)
    zone.addEventListener('pointercancel', end)
  }
}
