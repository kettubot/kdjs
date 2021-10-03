'use strict'

const { Base } = require('discord.js')

/**
 * Interfaces with the kAPI for a guild channel
 * @extends {Base}
 */
class KettuGuildChannel extends Base {
  /**
   * @param {Client} client The parent client
   * @param {GuildChannel} channel The channel this data belongs to
   * @param {Object} data The data for the channel
   */
  constructor (client, channel, data) {
    super(client)

    /**
     * The parent channel
     * @type {GuildChannel}
     */
    this.channel = channel

    /**
     * Whether this channel has kettu data loaded
     * @type {boolean}
     */
    this.partial = true

    this.disabled = []
    this.enabled = []

    if (!data) return

    this._patch(data)
  }

  _patch (data) {
    this.partial = false

    /**
     * List of commands that are disabled in this channel
     * @type {Array<string>}
     */
    this.disabled = data.disabled || []

    /**
     * List of commands that are enabled in this channel
     * @type {Array<string>}
     */
    this.enabled = data.enabled || []
  }

  /**
   * Fetches a channels's data
   * @param {boolean} force Whether to still fetch the channel if this structure isn't partial
   * @returns {Promise<KettuGuildChannel>}
   */
  async fetch (force = false) {
    if (!this.partial && !force) return this
    const data = await this.client.kettu.api.guilds(this.channel.guild.id).channels(this.channel.id).get()
    this._patch(data)
    return this
  }

  // Not quite done yet
  /* eslint-disable no-unused-vars */

  /**
   * Edits the channel's configuration.
   * @param {Object} data The new channel configuration data
   * @param {Array<string>} [data.disabled] New disabled data
   * @param {Array<string>} [data.enabled] New enabled data
   * @param {GuildMemberResolvable} moderator Moderator responsible for the change
   * @returns {Promise<KettuGuildChannel>}
   * @example
   * // Set 'ping' to be disabled in the channel
   * msg.channel.kettu.edit({ disabled: ['ping'] }, msg.member)
   *  .then(updated => console.log(`Updated disabled commands to ${updated.disabled.join(', ')}`))
   *  .catch(console.error);
   */
  async edit (data, moderator) {
    const newdata = await this.client.kettu.api.guilds(this.channel.guild.id).channels(this.channel.id).patch({ data })
    this._patch(newdata)
    return this
  }
}

module.exports = KettuGuildChannel
