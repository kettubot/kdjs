'use strict'

const KettuGuildConfigModActions = require('../util/KettuGuildConfigModActions')

/**
 * Stores configuration for the logging aspect of Kettu
 */
class KettuGuildConfigLogs {
  /**
   * @param {Client} client The parent client
   * @param {Object} data The 'logs' data for the guild config
   * @param {Guild} guild The guild this config belongs to
   */
  constructor (client, data, guild) {
    /**
     * The parent client
     * @type {Client}
     */
    this.client = client

    /**
     * The guild this manager belongs to
     * @type {Guild}
     */
    this.guild = guild

    if (!data) return

    this._patch(data)
  }

  _patch (data) {
    /**
     * A style of message
     * * GIDDY
     * * YOU
     * * NEED
     * * TO
     * * PLAN
     * * THIS
     * @typedef {string} ResponseStyle
     */

    /**
     * The message style type for logs
     * @type {ResponseStyle}
     */
    this.type = data.type

    /**
     * Channel for join logs
     * @type {?TextChannel}
     */
    this.join = data.join && this.guild.channels.cache.get(data.join)

    /**
     * Channel for leave logs
     * @type {?TextChannel}
     */
    this.leave = data.leave && this.guild.channels.cache.get(data.leave)

    /**
     * Channel for mod logs
     * @type {?TextChannel}
     */
    this.mod = this.mod && this.guild.channels.cache.get(data.mod)

    /**
     * Action types which aren't logged
     * @type {KettuGuildConfigModActions}
     */
    this.modSkip = new KettuGuildConfigModActions(data.modSkip)
  }
}

module.exports = KettuGuildConfigLogs
