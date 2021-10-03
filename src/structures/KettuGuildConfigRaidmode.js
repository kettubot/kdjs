'use strict'

/**
 * Stores configuration for auto raidmode
 */
class KettuGuildConfigRaidmode {
  /**
   * @param {Client} client The parent client
   * @param {Object} data The 'raidmode' data for the guild config
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
     * Current raidmode state (off, auto, or on)
     * @type {string}
     */
    this.state = data.state

    /**
     * Action for members joining while raidmode is enabled (kick or ban)
     * @type {string}
     */
    this.action = data.action

    /**
     * Number of joins per n time to trigger auto raidmode
     * @type {integer}
     */
    this.joins = data.joins

    /**
     * Length of n time
     * @type {integer}
     */
    this.seconds = data.seconds
  }
}

module.exports = KettuGuildConfigRaidmode
