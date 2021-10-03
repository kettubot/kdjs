'use strict'

const { Client } = require('discord.js')

module.exports = (Structure, KettuStructure, id) => {
  const cache = new Map()

  Object.defineProperty(Structure.prototype, 'kettu', {
    get: function () {
      const found = cache.get(id ? this[id] : this)
      if (found) return found

      const created = Structure === Client ? new KettuStructure(this) : new KettuStructure(this.client, this)
      cache.set(id ? this[id] : this, created)
      return created
    }
  })
}
