'use strict'

const KettuGuildCase = require('../../../structures/KettuGuildCase')

/**
 * Emitted whenever a guild case is deleted.
 * @event KettuClient#guildCaseDelete
 * @param {KettuGuildCase} case The deleted case
 */

module.exports = (kettu, packet) => {
  const guild = kettu.client.guilds.cache.get(packet.d.guild_id)
  guild.kettu.cases.cache.delete(packet.d.id)
  const deletedcase = new KettuGuildCase(kettu.client, packet.d, guild)
  kettu.emit('guildCaseDelete', deletedcase)
}
