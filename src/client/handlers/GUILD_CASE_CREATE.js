'use strict';

/**
 * Emitted whenever a guild case is created.
 * @event KettuClient#guildCaseCreate
 * @param {KettuGuildCase} case The new case
 */

module.exports = (kettu, packet) => {
  const guild = kettu.client.guilds.cache.get(packet.d.guild_id);
  const existing = guild.kettu.cases.cache.get(packet.d.id);
  const thecase = guild.kettu.cases._add(packet.d);
  if (!existing && thecase) {
    kettu.emit('guildCaseCreate', thecase);
  }
};
