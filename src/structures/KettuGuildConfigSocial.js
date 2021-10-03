'use strict'

/**
 * Stores configuration for the social aspect of Kettu
 */
class KettuGuildConfigSocial {
  /**
   * @param {Client} client The parent client
   * @param {Object} data The 'social' data for the guild config
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
     * Whether social command trigger messages are deleted
     * @type {boolean}
     */
    this.sDelete = Boolean(data.sDelete)

    /**
     * A social image that is blacklisted in a guild
     * @typedef {Object} KettuGuildConfigSocialBlacklistedImage
     * @property {number} id Image ID
     * @property {string} category Image category
     */

    /**
     * Blacklisted social command images for this server
     * @type {Array<KettuGuildConfigSocialBlacklistedImage>}
     */
    this.blacklist = data.blacklist
  }
}

module.exports = KettuGuildConfigSocial
