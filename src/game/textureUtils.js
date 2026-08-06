import * as THREE from 'three'

function makeCanvasTexture(draw, w = 256, h = 256) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  draw(ctx, w, h)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function labelTexture(text, { bg = '#3b2a1e', color = '#f2e6c9', fontSize = 130 } = {}) {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'
    ctx.lineWidth = 8
    ctx.strokeRect(4, 4, w - 8, h - 8)
    ctx.fillStyle = color
    ctx.font = `bold ${fontSize}px Georgia, serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, w / 2, h / 2)
  })
}

export function clockTexture(hourDigit) {
  return makeCanvasTexture((ctx, w, h) => {
    const cx = w / 2, cy = h / 2, r = w / 2 - 10
    ctx.fillStyle = '#e8dcc0'
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#1c1a17'
    ctx.lineWidth = 6
    ctx.stroke()
    ctx.fillStyle = '#1c1a17'
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      ctx.beginPath()
      ctx.arc(cx + Math.sin(a) * (r - 14), cy - Math.cos(a) * (r - 14), 3, 0, Math.PI * 2)
      ctx.fill()
    }
    // hour hand points at hourDigit
    const angle = (hourDigit / 12) * Math.PI * 2
    ctx.strokeStyle = '#1c1a17'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + Math.sin(angle) * r * 0.5, cy - Math.cos(angle) * r * 0.5)
    ctx.stroke()
    // minute hand fixed
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + Math.sin(0.4) * r * 0.75, cy - Math.cos(0.4) * r * 0.75)
    ctx.stroke()
  }, 256, 256)
}

export function muralTexture(orderColors) {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#2b2320'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#c9b48f'
    ctx.font = 'bold 22px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('올바른 순서', w / 2, 36)
    const cx = [w * 0.25, w * 0.5, w * 0.75]
    orderColors.forEach((c, i) => {
      ctx.beginPath()
      ctx.arc(cx[i], h * 0.6, 34, 0, Math.PI * 2)
      ctx.fillStyle = c
      ctx.fill()
      ctx.strokeStyle = '#111'
      ctx.lineWidth = 4
      ctx.stroke()
      if (i < orderColors.length - 1) {
        ctx.strokeStyle = '#c9b48f'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(cx[i] + 40, h * 0.6)
        ctx.lineTo(cx[i + 1] - 40, h * 0.6)
        ctx.stroke()
      }
    })
  }, 384, 256)
}
