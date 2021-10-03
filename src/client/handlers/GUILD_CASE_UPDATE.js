'use strict'

/**
 * Emitted whenever a guild case is updated.
 * @event KettuClient#guildCaseUpdate
 * @param {KettuGuildCase} case The updated case
 */

module.exports = (kettu, packet) => {
  const guild = kettu.client.guilds.cache.get(packet.d.guild_id)
  let existing = guild.kettu.cases.cache.get(packet.d.id)

  if (!existing) {
    existing = guild.kettu.cases._add(packet.d)
  } else {
    existing._patch(packet.d)
  }

  kettu.emit('guildCaseUpdate', existing)
}
