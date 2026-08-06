export function clampToBounds(pos, bounds, margin = 0.35) {
  pos.x = Math.min(bounds.maxX - margin, Math.max(bounds.minX + margin, pos.x))
  pos.z = Math.min(bounds.maxZ - margin, Math.max(bounds.minZ + margin, pos.z))
}

export function resolveBoxCollision(pos, radius, box) {
  const closestX = Math.max(box.minX, Math.min(pos.x, box.maxX))
  const closestZ = Math.max(box.minZ, Math.min(pos.z, box.maxZ))
  const dx = pos.x - closestX
  const dz = pos.z - closestZ
  const distSq = dx * dx + dz * dz

  if (distSq >= radius * radius) return

  if (distSq > 1e-6) {
    const dist = Math.sqrt(distSq)
    const overlap = radius - dist
    pos.x += (dx / dist) * overlap
    pos.z += (dz / dist) * overlap
  } else {
    // Player center is inside the box; push out along the shallowest axis.
    const pushLeft = pos.x - box.minX
    const pushRight = box.maxX - pos.x
    const pushDown = pos.z - box.minZ
    const pushUp = box.maxZ - pos.z
    const min = Math.min(pushLeft, pushRight, pushDown, pushUp)
    if (min === pushLeft) pos.x = box.minX - radius
    else if (min === pushRight) pos.x = box.maxX + radius
    else if (min === pushDown) pos.z = box.minZ - radius
    else pos.z = box.maxZ + radius
  }
}
