import './style.css'
import { Game } from './game/Game.js'

const canvas = document.getElementById('game-canvas')
const game = new Game(canvas)

const overlay = document.getElementById('start-overlay')
const startBtn = document.getElementById('start-btn')

startBtn.addEventListener('click', () => {
  overlay.classList.add('hidden')
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(() => {})
  }
  game.start()
})
