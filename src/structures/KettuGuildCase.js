'use strict'

/**
 * Represents a case for a kettu guild
 */
class KettuGuildCase {
  constructor (client, data, guild) {
    /**
     * The client that instantiated this case
     * @name KettuGuildCase#client
     * @type {Client}
     * @readonly
     */
    Object.defineProperty(this, 'client', { value: client })

    /**
     * The guild that this case is part of
     * @type {Guild}
     */
    this.guild = guild

    this._patch(data)
  }

  _patch (data) {
    /**
     * The case's id (only unique to the guild)
     * @type {number}
     */
    this.id = data.id

    /**
     * The time the case was created
     * @type {number}
     */
    this.createdAt = data.created_at

    /**
     * A type of case, representing a specific action. This can be:
     * * `lockchannel`
     * * `lockserver`
     * * `lockcategory`
     * * `ban`
     * * `kick`
     * * `mute`
     * * `raidmode`
     * * `purge`
     * * `editcase`
     * * `deletecase`
     * * `slowmode`
     * @typedef {string} KettuGuildCaseType
     */

    /**
     * The type of case
     * @type {KettuGuildCaseType}
     */
    this.type = data.type

    /**
     * The reason attached to this case
     * @type {?string}
     */
    this.reason = data.reason

    /**
     * The case log message information, if sent
     * @type {?MessageReference}
     */
    this.log = data.log
      ? {
          channelId: data.log.channel_id,
          guildId: this.guild.id,
          messageId: data.log.message_id
        }
      : null

    /**
     * The context for the action, if triggered manually
     * @type {?MessageReference}
     */
    this.context = data.context
      ? {
          channelId: data.context.channel_id,
          guildId: this.guild.id,
          messageId: data.context.message_id
        }
      : null

    /**
     * The moderator responsible for this action, if triggered manually
     * @type {?Snowflake}
     */
    this.moderatorId = data.moderator_id

    /**
     * Target user (for ban, kick and mute)
     * @type {?Snowflake}
     */
    this.userId = data.user_id

    /**
     * Target channel (for lockchannel, lockcategory, purge and slowmode)
     * @type {?Channel}
     * @name KettuGuildCase#channel
     */
    this.channel = data.channel_id && this.guild.channels.cache.get(data.channel_id)

    /**
     * Information on the user dm (if there is a user_id). Either `true`, or a reason why the dm failed to send
     * @type {?boolean|string}
     */
    this.userDM = data.user_dm

    /**
     * The number of strikes this case is worth (for kick and mute)
     * @type {?number}
     */
    this.strikes = data.strikes

    /**
     * The duration of the case (for lock*, ban, mute, raidmode and slowmode)
     * @type {?number}
     */
    this.time = data.time

    /**
     * Various metadata for a kettu case
     * @typedef {Object} KettuGuildCaseMetadata
     * @property {boolean} [state] For raidmode, whether it was enabled (or otherwise disabled)
     * @property {Object} [options] For a purge, the purge options
     * @property {number} [purged] For a purge, the number of purged messages
     * @property {Array<Snowflake>} [messages] For a purge, the snowflakes of all purged messages
     * @property {number} [case] For editcase or deletecase, the corresponding case id
     * @property {number} [original] For slowmode, the original duration
     * @property {number} [new] For slowmode, the new duration
     */

    /**
     * Metadata for the case (for raidmode, purge, editcase, deletecase and slowmode)
     * @type {?KettuGuildCaseMetadata}
     */
    this.meta = data.meta
  }

  /**
   * Fetches this case's log message
   * @param {BaseFetchOptions} [options] The options for fetching the message
   * @returns {Promise<Message>}
   */
  fetchLogMessage (options) {
    if (!this.log) throw new Error('NO_LOG_MESSAGE')
    const channel = this.guild.channels.cache.get(this.log.channelId)
    return channel.messages.fetch(this.log.messageId, options?.cache, options?.force)
  }

  /**
   * Fetches this case's context message
   * @param {BaseFetchOptions} [options] The options for fetching the message
   * @returns {Promise<Message>}
   */
  fetchContextMessage (options) {
    if (!this.context) throw new Error('NO_CONTEXT_MESSAGE')
    const channel = this.guild.channels.cache.get(this.context.channelId)
    return channel.messages.fetch(this.context.messageId, options?.cache, options?.force)
  }

  /**
   * Fetches this case's responsible moderator
   * @param {BaseFetchOptions} [options] The options for fetching the member
   * @returns {Promise<GuildMember>}
   */
  fetchModerator (options) {
    if (!this.moderatorId) throw new Error('NO_MODERATOR')
    return this.guild.members.fetch({ ...options, user: this.moderatorId })
  }

  /**
   * Fetches this case's target user
   * @param {BaseFetchOptions} [options] The options for fetching the member
   * @returns {Promise<GuildMember>}
   */
  fetchUser (options) {
    if (!this.userId) throw new Error('NO_USER')
    return this.guild.members.fetch({ ...options, user: this.userId })
  }

  /**
   * Data for editing a case
   * @typedef {Object} KettuGuildCaseEditData
   * @property {string} [reason] The case's reason
   * @property {Message} [log] The log message
   */

  /**
   * Edits the case
   * @param {KettuGuildCaseEditData} data The new data for the case
   * @returns {Promise<KettuGuildCase>}
   */
  async edit (data) {
    if (data.log) data.log = { message_id: data.log.id, channel_id: data.log.channel.id }
    const newcase = await this.client.kettu.api.guilds(this.guild.id).cases(this.id).patch({ data })
    this._patch(newcase)
    return this
  }

  /**
   * Deletes the case
   * @returns {Promise}
   */
  delete () {
    return this.client.kettu.api.guilds(this.guild.id).cases(this.id).delete()
  }
}

module.exports = KettuGuildCase
