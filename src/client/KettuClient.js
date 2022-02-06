'use strict'

const EventEmitter = require('events')
const KettuWebSocket = require('./KettuWebSocket')
const KettuImageManager = require('../managers/KettuImageManager')
const KettuStoreManager = require('../managers/KettuStoreManager')
const KettuRESTManager = require('../rest/KettuRESTManager')
const { KettuEvents, KettuWSEvents } = require('../util/KettuConstants')
const { Util } = require('discord.js')
const KettuOptions = require('../util/KettuOptions')

const UNRECOVERABLE_CLOSE_CODES = [4003, 4004, 4012, 4013, 4014, 4015]
const UNRESUMABLE_CLOSE_CODES = [4007, 4009, 4010]

/**
 * A custom client for interacting with the Kettu API, extending into native d.js objects.
 * @extends {EventEmitter}
 */
class KettuClient extends EventEmitter {
  /**
   * @param {Client} client Parent Discord client
   * @param {KettuClientOptions} options Options for the kettu client
   */
  constructor (client, options = {}) {
    super()

    /**
     * The client that instantiated this KettuClient
     * @type {Client}
     * @readonly
     * @name KettuClient#client
     */
    Object.defineProperty(this, 'client', { value: client })

    /**
     * The options for this kettu client
     * @type {KettuClientOptions}
     * @readonly
     */
    this.options = Util.mergeDefault(KettuOptions, options)

    /**
     * WebSocket for this kettu client
     * @type {KettuWebSocket}
     */
    this.ws = new KettuWebSocket(this)

    /**
     * Image manager for this kettu client
     * @type {KettuImageManager}
     */
    this.images = new KettuImageManager(this)

    /**
     * Data store manager for this kettu client
     * @type {KettuStoreManager}
     */
    this.store = new KettuStoreManager(this)

    /**
     * Name of this kettu client (for bot types)
     * @type {?string}
     * @name KettuClient#name
     */

    /**
     * Allowed guilds for this kettu client (for bot types)
     * @type {Array<Snowflake>}
     */
    this.allowedGuilds = []

    /**
     * Blacklisted users for this Kettu client
     * @type {Array<Snowflake>}
     */
    this.blacklist = []

    /**
     * Token
     * @type {?string}
     * @name KettuClient#token
     */

    /**
     * Discord token
     * @type {?string}
     * @name KettuClient#discordToken
     */

    /**
     * Default prefix for this client
     * @type {?string}
     * @name KettuClient#defaultPrefix
     */

    /**
     * Shard information for this kettu client
     * @type {?Object}
     * @name KettuClient#shard
     */

    /**
     * Secrets for this client
     * @type {Object}
     */
    this.secrets = {}

    /**
     * Slash commands deploy configuration for this client
     * @type {boolean|Array<Snowflake>}
     */
    this.deploy = false

    /**
     * Kettu's REST manager of the client
     * @type {KettuRESTManager}
     * @private
     */
    this.rest = new KettuRESTManager(this)

    this.attachWSListeners()
  }

  _patch (data) {
    // type === 'bot' properties
    if (data.name) this.name = data.name
    if (data.allowed_guilds) this.allowedGuilds = data.allowed_guilds

    // type === 'kettu' properties
    if (data.token) this.discordToken = data.token
    if (data.default_prefix) this.defaultPrefix = data.default_prefix
    if (data.secrets) this.secrets = data.secrets
    if (data.blacklist) this.blacklist = data.blacklist ?? []
    if ('deploy' in data) this.deploy = data.deploy

    if (data.options) {
      for (const opt of Object.keys(data.options)) {
        this.client.options[opt] = data.options[opt]
      }
    }
  }

  /**
   * The kAPI shortcut
   * @type {Object}
   * @readonly
   * @private
   */
  get api () {
    return this.rest.api
  }

  /**
   * Logs the Kettu client in, and then the Discord client
   * @param {string} token Token of the (Kettu) account to log in with
   * @param {string} shard Current shard instance identifier
   * @returns {Promise<string>} Token of the account used
   * @example
   * client.kettu.login('my kettu token')
   */
  async login (token, shard) {
    if (!token || typeof token !== 'string') throw new Error('TOKEN_INVALID')

    this.token = token.replace(/^(Bot|Bearer)\s*/i, '')
    this.shardId = shard
    this.emit(KettuEvents.DEBUG, `Provided token: ${token.split('.').map((val, i) => (i > 1 ? val.replace(/./g, '*') : val)).join('.')}\nProvided shard: ${shard}`)

    this.emit(KettuEvents.DEBUG, 'Preparing to connect to kAPI gateway...')
    await this.ws.connect()

    if (this.discordToken) {
      this.emit(KettuEvents.DEBUG, 'Connected to kAPI, starting Discord client...')

      try {
        await this.client.login(this.discordToken)
        return this.token
      } catch (error) {
        this.destroy()
        this.emit(KettuEvents.ERROR, 'Failed to login Discord client')
        throw error
      }
    } else {
      this.emit(KettuEvents.DEBUG, 'Connected to kAPI, ready to start Discord client.')
      return true
    }
  }

  /**
   * A string to identify a specific shard of kettu
   * ```
   * If we have the data 'Njk4MDM4MTQ4MDU1MzAyMTc0LjAuMS4xNjI0MDcxMDk0MjE1' we can Base64 decode it:
   *
   * 698038148055302174.  0.     1.          1624071094215
   * bot id of shard      shard  num_shards  timestamp
   * ```
   * @typedef {string} KettuShardIdentifierFull
   */

  /**
   * A string to identify a specific shard of kettu
   * Takes the format of a {@link KettuShardIdentifierFull}, but without the trailing timestamp
   * @typedef {string} KettuShardIdentifier
   */

  /**
   * A shard's result from a kettu broadcast eval
   * @typedef {Object} KettuBroadcastEvalResult
   * @property {KettuShardIdentifier} shard Shard this result belongs to
   * @property {?*} result The returned data, none may be present if `undefined`
   */

  /**
   * Options for a kettu broadcast eval of any type
   * @typedef {Object} KettuBroadcastEvalOptions
   * @property {?number} abort Time (in ms) to wait before aborting the eval client-side
   * @property {?number} timeout Time (in ms) to wait for a shard to respond server-side
   * @property {?Array<KettuShardIdentifier|KettuShardIdentifierFull>} shards Shards to send the request to (null will
   * default to all connected shards)
   */

  /**
   * Fetches a property from all other connected shards
   * @param {string} query Value to fetch
   * @param {KettuBroadcastEvalOptions} options Broadcast options
   * @returns {Promise<Array<KettuBroadcastEvalResult>>}
   * @example
   * const values = await client.kettu.broadcastProperty('client.guilds.cache.size')
   * console.log(values.reduce((total, current) => total + current.result, 0))
   */
  broadcastEvalProperty (query, options) {
    if (!this.client?.user?.id) throw new Error('Discord Client not yet connected')
    return this.api.kettu(this.client.user.id).eval.post({ data: { type: 0, query, ...options } })
  }

  /**
   * Executes a script on all connected shards
   * @param {string} query Script to execute
   * @param {KettuBroadcastEvalOptions} options Broadcast options
   * @returns {Promise<Array<KettuBroadcastEvalResult>>}
   */
  broadcastEvalScript (query, options) {
    if (!this.client?.user?.id) throw new Error('Discord Client not yet connected')
    return this.api.kettu(this.client.user.id).eval.post({ data: { type: 1, query, ...options } })
  }

  attachWSListeners () {
    this.ws.on(KettuWSEvents.READY, () => {
      /**
       * Emitted when the client's Kettu connection becomes ready.
       * @event KettuClient#ready
       */
      this.emit(KettuEvents.READY)
    })

    this.ws.on(KettuWSEvents.CLOSE, event => {
      if (event.code === 1000 ? this.destroyed : UNRECOVERABLE_CLOSE_CODES.includes(event.code)) {
        /**
         * Emitted when kettu's websocket becomes disconnected and won't reconnect.
         * This will also destroy the Discord connection.
         * @event KettuClient#disconnected
         * @param {CloseEvent} event The WebSocket close event
         */
        this.emit(KettuEvents.DISCONNECTED, event)
        this.client.destroy()
        return
      }

      if (UNRESUMABLE_CLOSE_CODES.includes(event.code)) {
        // These event codes cannot be resumed
        this.ws.sessionId = null
      }

      /**
       * Emitted when the kettu connection is attempting to reconnect or re-identify.
       * @event KettuClient#reconnecting
       */
      this.emit(KettuEvents.RECONNECTING)

      if (!this.ws.sessionId) this.ws.destroy({ reset: true, emit: false, log: false })

      setTimeout(() => this.ws.connect(), event.code === 4010 ? 5000 : 1000)
    })

    this.ws.on(KettuWSEvents.DESTROYED, () => {
      this.emit(KettuEvents.RECONNECTING)

      setTimeout(() => this.ws.connect(), 1000)
    })
  }

  /**
   * Logs out, terminates the connection to kAPI & Discord, and destroys the client.
   * @returns {void}
   */
  destroy () {
    this.client.destroy()
    this.token = null
  }

  toJSON (...props) {
    return Util.flatten(this, ...props)
  }
}

module.exports = KettuClient
