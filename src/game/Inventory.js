export class Inventory {
  constructor(ui) {
    this.items = []
    this.ui = ui
  }

  addItem(item) {
    if (this.hasItem(item.id)) return
    this.items.push(item)
    this.ui?.updateInventory(this.items)
  }

  removeItem(id) {
    this.items = this.items.filter((i) => i.id !== id)
    this.ui?.updateInventory(this.items)
  }

  hasItem(id) {
    return this.items.some((i) => i.id === id)
  }

  getItem(id) {
    return this.items.find((i) => i.id === id)
  }
}
