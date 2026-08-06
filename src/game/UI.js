export class UI {
  constructor() {
    this.root = document.getElementById('ui-root')
    this._buildHUD()
    this._messageTimer = null
  }

  _buildHUD() {
    this.root.innerHTML = `
      <div id="look-zone"></div>
      <div id="crosshair"></div>
      <div id="prompt-box" class="hidden"><span id="prompt-text"></span></div>
      <div id="timer">00:00</div>
      <div id="inventory-bar"></div>
      <div id="message-toast"></div>
      <div id="joystick-zone"><div class="joystick-knob"></div></div>
      <button id="interact-btn" class="hidden">👆</button>

      <div id="keypad-modal" class="modal hidden">
        <div class="modal-card">
          <h2>숫자 자물쇠</h2>
          <div id="keypad-display">___</div>
          <div id="keypad-grid"></div>
          <div class="modal-actions">
            <button id="keypad-clear">지우기</button>
            <button id="keypad-cancel">취소</button>
            <button id="keypad-submit">확인</button>
          </div>
        </div>
      </div>

      <div id="sequence-modal" class="modal hidden">
        <div class="modal-card">
          <h2>보석을 순서대로 배치하세요</h2>
          <div id="sequence-slots"></div>
          <div id="sequence-items"></div>
          <div class="modal-actions">
            <button id="sequence-reset">초기화</button>
            <button id="sequence-cancel">취소</button>
            <button id="sequence-submit">확인</button>
          </div>
        </div>
      </div>

      <div id="win-screen" class="modal hidden">
        <div class="modal-card">
          <h2>탈출 성공!</h2>
          <p id="win-time"></p>
          <button id="win-restart">다시 하기</button>
        </div>
      </div>
    `
    this._cache()
    this._buildKeypadGrid()
  }

  _cache() {
    const ids = [
      'look-zone', 'crosshair', 'prompt-box', 'prompt-text', 'timer', 'inventory-bar', 'message-toast',
      'joystick-zone', 'interact-btn',
      'keypad-modal', 'keypad-display', 'keypad-grid', 'keypad-clear', 'keypad-cancel', 'keypad-submit',
      'sequence-modal', 'sequence-slots', 'sequence-items', 'sequence-reset', 'sequence-cancel', 'sequence-submit',
      'win-screen', 'win-time', 'win-restart',
    ]
    this.el = {}
    ids.forEach((id) => {
      const key = id.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
      this.el[key] = document.getElementById(id)
    })
  }

  _buildKeypadGrid() {
    const grid = this.el.keypadGrid
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']
    keys.forEach((k) => {
      const btn = document.createElement('button')
      btn.className = 'keypad-key'
      btn.textContent = k
      if (!k) btn.style.visibility = 'hidden'
      btn.addEventListener('click', () => {
        if (k === '⌫') this._keypadBackspace()
        else if (k) this._keypadPress(k)
      })
      grid.appendChild(btn)
    })
  }

  getLookZone() {
    return this.el.lookZone
  }
  getJoystickZone() {
    return this.el.joystickZone
  }
  getInteractButton() {
    return this.el.interactBtn
  }

  setPrompt(text) {
    if (text) {
      this.el.promptText.textContent = text
      this.el.promptBox.classList.remove('hidden')
      this.el.interactBtn.classList.remove('hidden')
    } else {
      this.el.promptBox.classList.add('hidden')
      this.el.interactBtn.classList.add('hidden')
    }
  }

  showMessage(text, duration = 2800) {
    const t = this.el.messageToast
    t.textContent = text
    t.classList.add('show')
    clearTimeout(this._messageTimer)
    this._messageTimer = setTimeout(() => t.classList.remove('show'), duration)
  }

  updateInventory(items) {
    const bar = this.el.inventoryBar
    bar.innerHTML = ''
    items.forEach((item) => {
      const chip = document.createElement('div')
      chip.className = 'inv-item'
      if (item.color) chip.style.background = item.color
      chip.title = item.name
      bar.appendChild(chip)
    })
  }

  updateTimer(seconds) {
    const s = Math.max(0, Math.floor(seconds))
    const mm = String(Math.floor(s / 60)).padStart(2, '0')
    const ss = String(s % 60).padStart(2, '0')
    this.el.timer.textContent = `${mm}:${ss}`
  }

  openKeypad({ length = 3, title, onSubmit, onCancel }) {
    this._keypadValue = ''
    this._keypadLength = length
    if (title) this.el.keypadModal.querySelector('h2').textContent = title
    this._renderKeypad()
    this.el.keypadModal.classList.remove('hidden')

    const submit = () => {
      cleanup()
      onSubmit(this._keypadValue)
    }
    const cancel = () => {
      cleanup()
      onCancel?.()
    }
    const clearFn = () => {
      this._keypadValue = ''
      this._renderKeypad()
    }
    const cleanup = () => {
      this.el.keypadModal.classList.add('hidden')
      this.el.keypadSubmit.removeEventListener('click', submit)
      this.el.keypadCancel.removeEventListener('click', cancel)
      this.el.keypadClear.removeEventListener('click', clearFn)
    }

    this.el.keypadSubmit.addEventListener('click', submit)
    this.el.keypadCancel.addEventListener('click', cancel)
    this.el.keypadClear.addEventListener('click', clearFn)
  }

  _keypadPress(d) {
    if (this._keypadValue.length >= this._keypadLength) return
    this._keypadValue += d
    this._renderKeypad()
  }
  _keypadBackspace() {
    this._keypadValue = this._keypadValue.slice(0, -1)
    this._renderKeypad()
  }
  _renderKeypad() {
    const padded = this._keypadValue.padEnd(this._keypadLength, '_')
    this.el.keypadDisplay.textContent = padded.split('').join(' ')
  }

  openSequencePanel({ items, slotCount, onResult }) {
    const selection = []
    const slotsEl = this.el.sequenceSlots
    const itemsEl = this.el.sequenceItems

    const render = () => {
      slotsEl.innerHTML = ''
      for (let i = 0; i < slotCount; i++) {
        const slot = document.createElement('div')
        slot.className = 'seq-slot'
        const id = selection[i]
        if (id) {
          const item = items.find((it) => it.id === id)
          slot.style.background = item.color
          slot.addEventListener('click', () => {
            selection.splice(i, 1)
            render()
          })
        }
        slotsEl.appendChild(slot)
      }
      itemsEl.innerHTML = ''
      items.forEach((item) => {
        const used = selection.includes(item.id)
        const btn = document.createElement('button')
        btn.className = 'seq-item' + (used ? ' used' : '')
        btn.style.background = item.color
        btn.disabled = used || selection.length >= slotCount
        btn.addEventListener('click', () => {
          if (selection.length < slotCount) {
            selection.push(item.id)
            render()
          }
        })
        itemsEl.appendChild(btn)
      })
    }
    render()
    this.el.sequenceModal.classList.remove('hidden')

    const submit = () => {
      cleanup()
      onResult(selection.slice())
    }
    const cancel = () => {
      cleanup()
      onResult(null)
    }
    const resetFn = () => {
      selection.length = 0
      render()
    }
    const cleanup = () => {
      this.el.sequenceModal.classList.add('hidden')
      this.el.sequenceSubmit.removeEventListener('click', submit)
      this.el.sequenceCancel.removeEventListener('click', cancel)
      this.el.sequenceReset.removeEventListener('click', resetFn)
    }

    this.el.sequenceSubmit.addEventListener('click', submit)
    this.el.sequenceCancel.addEventListener('click', cancel)
    this.el.sequenceReset.addEventListener('click', resetFn)
  }

  showWinScreen(seconds, onRestart) {
    const s = Math.max(0, Math.floor(seconds))
    const mm = String(Math.floor(s / 60)).padStart(2, '0')
    const ss = String(s % 60).padStart(2, '0')
    this.el.winTime.textContent = `탈출 시간: ${mm}:${ss}`
    this.el.winScreen.classList.remove('hidden')
    this.el.winRestart.addEventListener('click', onRestart, { once: true })
  }

  isModalOpen() {
    return !this.el.keypadModal.classList.contains('hidden') ||
      !this.el.sequenceModal.classList.contains('hidden') ||
      !this.el.winScreen.classList.contains('hidden')
  }
}
