'use strict'

/**
 * Emitted whenever the connected instance has a data update.
 * @event KettuClient#shardInstanceUpdate
 * @param {Object} data The data payload
 */

module.exports = (kettu, packet) => {
  kettu.shard.instance = packet
  kettu.emit('shardInstanceUpdate', packet)
}
