'use strict'

const KettuGuildConfigBoost = require('./KettuGuildConfigBoost')
const KettuGuildConfigLogs = require('./KettuGuildConfigLogs')
const KettuGuildConfigMod = require('./KettuGuildConfigMod')
const KettuGuildConfigRaidmode = require('./KettuGuildConfigRaidmode')
const KettuGuildConfigRoles = require('./KettuGuildConfigRoles')
const KettuGuildConfigSocial = require('./KettuGuildConfigSocial')

/**
 * Interfaces with Kettu's configuration for a specific guild.
 */
class KettuGuildConfig {
  /**
   * @param {Client} client The parent client
   * @param {Object} data The data for the guild config
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

    /**
     * Boost configuration for the guild
     * @type {KettuGuildConfigBoost}
     */
    this.boost = new KettuGuildConfigBoost(this.client, null, this.guild)

    /**
     * Log configuration for the guild
     * @type {KettuGuildConfigLogs}
     */
    this.logs = new KettuGuildConfigLogs(this.client, null, this.guild)

    /**
     * Moderation configuration for the guild
     * @type {KettuGuildConfigMod}
     */
    this.mod = new KettuGuildConfigMod(this.client, null, this.guild)

    /**
     * Raidmode configuration for the guild
     * @type {KettuGuildConfigRaidmode}
     */
    this.raidmode = new KettuGuildConfigRaidmode(this.client, null, this.guild)

    /**
     * Roles configuration for the guild
     * @type {KettuGuildConfigRoles}
     */
    this.roles = new KettuGuildConfigRoles(this.client, null, this.guild)

    /**
     * Automod configuration for the guild
     * @type {KettuGuildConfigAutomod}
     */
    this.social = new KettuGuildConfigSocial(this.client, null, this.guild)

    if (!data) return

    this._patch(data)
  }

  _patch (data) {
    /**
     * Prefix for the guild
     * @type {?string}
     */
    this.prefix = data.prefix

    /**
     * List of commands that are disabled for the guild
     * @type {Array<string>}
     */
    this.disabled = data.disabled || []

    /**
     * Whether to reply when a user attempts to invoke a disabled command
     * @type {boolean}
     */
    this.disableReply = data.disableReply

    this.boost._patch(data.boost || {})
    this.logs._patch(data.logs || {})
    this.mod._patch(data.mod || {})
    this.raidmode._patch(data.raidmode || {})
    this.roles._patch(data.roles || {})
    this.social._patch(data.social || {})
  }

  // These methods are stubs, so we can ignore some eslint errors.
  /* eslint-disable no-unused-vars, require-await */

  /**
   * Updates the prefix of the guild.
   * @param {string} prefix The new prefix for the guild
   * @param {GuildMemberResolvable} moderator Moderator responsible for the change
   * @returns {Promise<KettuGuildConfig>}
   * @example
   * // Edit the guild prefix
   * guild.kettu.config.setPrefix('k>')
   *  .then(updated => console.log(`Updated guild prefix to ${updated.prefix}`))
   *  .catch(console.error);
   */
  async setPrefix (prefix, moderator) {
    if (prefix.includes(' ') || prefix.length > 32) throw new Error('INVALID_PREFIX')

    const newdata = await this.client.kettu.api.guilds(this.guild.id).patch({ data: { prefix: prefix } })
    this.guild.kettu._patch(newdata)

    return this
  }

  /**
   * Edits the guild's configuration.
   * @param {Object} data The new guild configuration data
   * @param {GuildMemberResolvable} moderator Moderator responsible for the change
   * @returns {Promise<KettuGuildConfig>}
   * @example
   * // Edit the guild prefix
   * guild.kettu.config.edit({ prefix: 'k>' }, msg.member)
   *  .then(updated => console.log(`Updated guild prefix to ${updated.prefix}`))
   *  .catch(console.error);
   */
  async edit (data, moderator) {
    const newdata = await this.client.kettu.api.guilds(this.guild.id).patch({ data })
    this.guild.kettu._patch(newdata)
    return this
  }
}

module.exports = KettuGuildConfig
