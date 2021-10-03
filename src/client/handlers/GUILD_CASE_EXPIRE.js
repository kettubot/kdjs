'use strict'

/**
 * Emitted whenever a guild case expires.
 * @event KettuClient#guildCaseExpire
 * @param {KettuGuildCase} case The expired case
 */

module.exports = (kettu, packet) => {
  const guild = kettu.client.guilds.cache.get(packet.d.guild_id)
  let existing = guild.kettu.cases.cache.get(packet.d.id)

  if (!existing) {
    existing = guild.kettu.cases._add(packet.d)
  } else {
    existing._patch(packet.d)
  }

  kettu.emit('guildCaseExpire', existing)
}
