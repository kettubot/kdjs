'use strict'

/**
 * Stores configuration for kettu boost messages
 */
class KettuGuildConfigBoost {
  /**
   * @param {Client} client The parent client
   * @param {Object} data The 'boost' data for the guild config
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
     * Whether boost messages are enabled
     * @type {boolean}
     */
    this.enabled = data.enabled

    /**
     * The channel for boost messages
     * @type {?TextChannel}
     */
    this.channel = data.channelId && this.guild.channels.cache.get(data.channelId)

    /**
     * The message content for a boost message
     * @type {?string}
     */
    this.message = data.message

    /**
     * The embed data for a boost message
     * @type {?Object}
     */
    this.embed = data.embed
  }
}

module.exports = KettuGuildConfigBoost
