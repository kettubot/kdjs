'use strict'

/**
 * Emitted whenever a guild member starts boosting.
 * @event KettuClient#guildMemberBoost
 * @param {Guild} guild The target guild
 * @param {Snowflake} member The member id
 */

module.exports = (kettu, packet) => {
  const guild = kettu.client.guilds.cache.get(packet.d.guild_id)
  if (!guild) return

  kettu.emit('guildMemberBoost', guild, packet.d.id)
}
