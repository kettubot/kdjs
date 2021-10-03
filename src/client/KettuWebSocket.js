'use strict'

const EventEmitter = require('events')
const PacketHandlers = require('./handlers')
const { KettuStatus, KettuEvents, KettuOpcodes, KettuDispatchEvents, KettuWSEvents } = require('../util/KettuConstants')
const KettuIntents = require('../util/KettuIntents')
const { WebSocket } = require('discord.js')

const CONNECTION_STATE = Object.keys(WebSocket.WebSocket)

/**
 * Represents a Kettu Client's WebSocket connection
 */
class KettuWebSocket extends EventEmitter {
  constructor (client) {
    super()

    /**
     * The client that instantiated this KettuWebSocket
     * @type {KettuClient}
     */
    this.client = client

    /**
     * The gateway this client uses
     * @type {?string}
     */
    this.gateway = null

    /**
     * The current status of the websocket
     * @type {Status}
     */
    this.status = KettuStatus.IDLE

    /**
     * The current sequence of the websocket
     * @type {number}
     * @private
     */
    this.sequence = -1

    /**
     * The sequence of the websocket after close
     * @type {number}
     * @private
     */
    this.closeSequence = 0

    /**
     * The current session ID of the websocket
     * @type {?string}
     * @private
     */
    this.sessionId = null

    /**
     * The previous heartbeat ping of the websocket
     * @type {number}
     */
    this.ping = -1

    /**
     * The last time a ping was sent (a timestamp)
     * @type {number}
     * @private
     */
    this.lastPingTimestamp = -1

    /**
     * If we received a heartbeat ack back. Used to identify zombie connections
     * @type {boolean}
     * @private
     */
    this.lastHeartbeatAcked = true

    /**
     * If this manager is currently reconnecting one or multiple shards
     * @type {boolean}
     * @private
     */
    this.reconnecting = false

    /**
     * The data sending queue
     * @type {array}
     */
    this.queue = []

    /**
     * The WebSocket connection
     * @name KettuWebSocket#connection
     * @type {?WebSocket}
     * @private
     */
    Object.defineProperty(this, 'connection', { value: null, writable: true })

    /**
     * The HELLO timeout
     * @name KettuWebSocket#helloTimeout
     * @type {?NodeJS.Timeout}
     * @private
     */
    Object.defineProperty(this, 'helloTimeout', { value: null, writable: true })

    /**
     * If the manager attached its event handlers on the shard
     * @name KettuWebSocket#eventsAttached
     * @type {boolean}
     * @private
     */
    Object.defineProperty(this, 'eventsAttached', { value: false, writable: true })

    /**
     * The ready timeout
     * @name KettuWebSocket#readyTimeout
     * @type {?NodeJS.Timeout}
     * @private
     */
    Object.defineProperty(this, 'readyTimeout', { value: null, writable: true })

    /**
     * Time when the WebSocket connection was opened
     * @name KettuWebSocket#connectedAt
     * @type {number}
     * @private
     */
    Object.defineProperty(this, 'connectedAt', { value: 0, writable: true })
  }

  /**
   * Emits a debug message.
   * @param {string} message The debug message
   * @private
   */
  debug (message) {
    this.client.emit(KettuEvents.DEBUG, `[WS => KETTU] ${message}`)
  }

  /**
   * Connects the websocket to the gateway.
   * @private
   * @returns {Promise<void>} A promise that will resolve if the shard turns ready successfully,
   * or reject if we couldn't connect
   */
  async connect () {
    const invalidToken = new Error('TOKEN_INVALID')
    const { url: gatewayURL } = await this.client.api.gateway.get().catch(e => {
      throw e.httpStatus === 401 ? invalidToken : e
    })

    this.debug(`Fetched Kettu Gateway Information. URL: ${gatewayURL}`)

    this.gateway = `${gatewayURL}/`

    if (this.connection && this.connection.readyState === WebSocket.OPEN && this.status === KettuStatus.READY) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      const cleanup = () => {
        this.removeListener(KettuWSEvents.CLOSE, onClose)
        this.removeListener(KettuWSEvents.READY, onReady)
        this.removeListener(KettuWSEvents.RESUMED, onResumed)
        this.removeListener(KettuWSEvents.DESTROYED, onDestroyed)
      }

      const onReady = () => {
        cleanup()
        resolve()
      }

      const onResumed = () => {
        cleanup()
        resolve()
      }

      const onClose = event => {
        cleanup()
        reject(event)
      }

      const onDestroyed = () => {
        cleanup()
        reject() // eslint-disable-line prefer-promise-reject-errors
      }

      this.once(KettuWSEvents.READY, onReady)
      this.once(KettuWSEvents.RESUMED, onResumed)
      this.once(KettuWSEvents.CLOSE, onClose)
      this.once(KettuWSEvents.DESTROYED, onDestroyed)

      if (this.connection && this.connection.readyState === WebSocket.OPEN) {
        this.debug('An open connection was found, attempting an immediate identify.')
        this.identify()
        return
      }

      if (this.connection) {
        this.debug(`A connection object was found. Cleaning up before continuing. State: ${CONNECTION_STATE[this.connection.readyState]}`)
        this.destroy({ emit: false })
      }

      const wsQuery = { v: this.client.options.version }

      this.debug(
        `[CONNECT KETTU]
    Gateway    : ${gatewayURL}
    Version    : ${wsQuery.v}`
      )

      this.status = this.status === KettuStatus.DISCONNECTED ? KettuStatus.RECONNECTING : KettuStatus.CONNECTING
      this.setHelloTimeout()

      this.connectedAt = Date.now()

      const ws = (this.connection = WebSocket.create(gatewayURL, wsQuery))
      ws.onopen = this.onOpen.bind(this)
      ws.onmessage = this.onMessage.bind(this)
      ws.onerror = this.onError.bind(this)
      ws.onclose = this.onClose.bind(this)
    })
  }

  /**
   * Called whenever a connection is opened to the gateway.
   * @private
   */
  onOpen () {
    this.debug(`[CONNECTED] ${this.connection.url} in ${Date.now() - this.connectedAt}ms`)
    this.status = KettuStatus.NEARLY
  }

  /**
   * Called whenever a message is received.
   * @param {MessageEvent} event Event received
   * @private
   */
  onMessage ({ data }) {
    let packet
    try {
      packet = WebSocket.unpack(data)
      this.client.emit(KettuEvents.RAW, packet, this.id)
      if (packet.op === KettuOpcodes.DISPATCH) this.emit(packet.t, packet.d, this.id)
    } catch (err) {
      this.client.emit(KettuEvents.ERROR, err, this.id)
      return
    }
    this.onPacket(packet)
  }

  /**
   * Called whenever an error occurs with the WebSocket.
   * @param {ErrorEvent} event The error that occurred
   * @private
   */
  onError (event) {
    const error = event && event.error ? event.error : event
    if (!error) return

    /**
     * Emitted whenever kettu's WebSocket encounters a connection error.
     * @event KettuClient#shardError
     * @param {Error} error The encountered error
     */
    this.client.emit(KettuEvents.ERROR, error)
  }

  /**
   * @external CloseEvent
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent}
   */

  /**
   * @external ErrorEvent
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/ErrorEvent}
   */

  /**
   * @external MessageEvent
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent}
   */

  /**
   * Called whenever a connection to the gateway is closed.
   * @param {CloseEvent} event Close event that was received
   * @private
   */
  onClose (event) {
    if (this.sequence !== -1) this.closeSequence = this.sequence
    this.sequence = -1

    this.debug(`[CLOSE]
    Event Code: ${event.code}
    Clean     : ${event.wasClean}
    Reason    : ${event.reason || 'No reason received'}`)

    this.setHeartbeatTimer(-1)
    this.setHelloTimeout(-1)
    // If we still have a connection object, clean up its listeners
    if (this.connection) this._cleanupConnection()

    this.status = KettuStatus.DISCONNECTED

    /**
     * Emitted when a shard's WebSocket closes.
     * @private
     * @event KettuWebSocket#close
     * @param {CloseEvent} event The received event
     */
    this.emit(KettuWSEvents.CLOSE, event)
  }

  /**
   * Called whenever a packet is received.
   * @param {Object} packet The received packet
   * @private
   */
  onPacket (packet) {
    if (!packet) {
      this.debug(`Received broken packet: '${packet}'.`)
      return
    }

    switch (packet.t) {
      case KettuDispatchEvents.READY:
        // Load data into Kettu's client
        this.client._patch(packet.d.user)
        if (packet.d.shard) this.client.shard = packet.d.shard

        /**
         * Emitted when the shard receives the READY payload and is fully ready
         * @event KettuWebSocket#ready
         */
        this.emit(KettuWSEvents.READY)

        this.sessionId = packet.d.session_id
        this.status = KettuStatus.READY
        this.debug(`[READY] Session ${this.sessionId}.`)
        this.lastHeartbeatAcked = true
        this.sendHeartbeat('ReadyHeartbeat')
        break
      case KettuDispatchEvents.RESUMED: {
        /**
         * Emitted when the shard resumes successfully
         * @event KettuWebSocket#resumed
         */
        this.emit(KettuWSEvents.RESUMED)

        this.status = KettuStatus.READY
        const replayed = packet.s - this.closeSequence
        this.debug(`[RESUMED] Session ${this.sessionId} | Replayed ${replayed} events.`)
        this.lastHeartbeatAcked = true
        this.sendHeartbeat('ResumeHeartbeat')
        break
      }
    }

    if (packet.s > this.sequence) this.sequence = packet.s

    switch (packet.op) {
      case KettuOpcodes.HELLO:
        this.setHelloTimeout(-1)
        this.setHeartbeatTimer(packet.d.heartbeat_interval)
        this.identify()
        break
      case KettuOpcodes.HEARTBEAT:
        if (packet.a) this.ackHeartbeat()
        else this.sendHeartbeat('HeartbeatRequest', true)
        break
      default:
        if (PacketHandlers[packet.t]) PacketHandlers[packet.t](this.client, packet)
        else this.debug(`[MISSING HANDLER] No handler for event type: ${packet.t}`)
    }
  }

  /**
   * Sets the HELLO packet timeout.
   * @param {number} [time] If set to -1, it will clear the hello timeout timeout
   * @private
   */
  setHelloTimeout (time) {
    if (time === -1) {
      if (this.helloTimeout) {
        this.debug('Clearing the HELLO timeout.')
        clearTimeout(this.helloTimeout)
        this.helloTimeout = null
      }
      return
    }
    this.debug('Setting a HELLO timeout for 20s.')
    this.helloTimeout = setTimeout(() => {
      this.debug('Did not receive HELLO in time. Destroying and connecting again.')
      this.destroy({ reset: true, closeCode: 4009 })
    }, 20000).unref()
  }

  /**
   * Sets the heartbeat timer for this shard.
   * @param {number} time If -1, clears the interval, any other number sets an interval
   * @private
   */
  setHeartbeatTimer (time) {
    if (time === -1) {
      if (this.heartbeatInterval) {
        this.debug('Clearing the heartbeat interval.')
        clearInterval(this.heartbeatInterval)
        this.heartbeatInterval = null
      }
      return
    }
    this.debug(`Setting a heartbeat interval for ${time}ms.`)
    // Sanity checks
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval)
    this.heartbeatInterval = setInterval(() => this.sendHeartbeat(), time).unref()
  }

  /**
   * Sends a heartbeat to the WebSocket.
   * If this shard didn't receive a heartbeat last time, it will destroy it and reconnect
   * @param {string} [tag='HeartbeatTimer'] What caused this heartbeat to be sent
   * @param {boolean} [ignoreHeartbeatAck] If we should send the heartbeat forcefully.
   * @private
   */
  sendHeartbeat (
    tag = 'HeartbeatTimer',
    ignoreHeartbeatAck = [KettuStatus.IDENTIFYING, KettuStatus.RESUMING].includes(this.status)
  ) {
    if (ignoreHeartbeatAck && !this.lastHeartbeatAcked) {
      this.debug(`[${tag}] Didn't process heartbeat ack yet but we are still connected. Sending one now.`)
    } else if (!this.lastHeartbeatAcked) {
      this.debug(
        `[${tag}] Didn't receive a heartbeat ack last time, assuming zombie connection. Destroying and reconnecting.
    Status          : ${Object.keys(KettuStatus)[Object.values(KettuStatus).indexOf(this.status)]}
    Sequence        : ${this.sequence}
    Connection State: ${this.connection ? CONNECTION_STATE[this.connection.readyState] : 'No Connection??'}`
      )

      this.destroy({ closeCode: 4009, reset: true })
      return
    }

    this.debug(`[${tag}] Sending a heartbeat.`)
    this.lastHeartbeatAcked = false
    this.lastPingTimestamp = Date.now()
    this.send({ op: KettuOpcodes.HEARTBEAT, d: this.sequence }, true)
  }

  /**
   * Acknowledges a heartbeat.
   * @private
   */
  ackHeartbeat () {
    this.lastHeartbeatAcked = true
    const latency = Date.now() - this.lastPingTimestamp
    this.debug(`Heartbeat acknowledged, latency of ${latency}ms.`)
    this.ping = latency
  }

  /**
   * Identifies the client on the connection.
   * @private
   * @returns {void}
   */
  identify () {
    return this.sessionId ? this.identifyResume() : this.identifyNew()
  }

  /**
   * Identifies as a new connection on the gateway.
   * @private
   */
  identifyNew () {
    const client = this.client
    if (!client.token) {
      this.debug('[IDENTIFY] No token available to identify a new session.')
      return
    }

    this.status = KettuStatus.IDENTIFYING

    // Clone the identify payload and assign the token and shard info
    const d = {
      ...client.options.ws,
      intents: KettuIntents.resolve(client.options.intents),
      token: client.token,
      shard: client.shardId,
      properties: ''
    }

    this.debug('[KETTU IDENTIFYING...]')
    this.send({ op: KettuOpcodes.IDENTIFY, d }, true)
  }

  /**
   * Resumes a session on the gateway.
   * @private
   */
  identifyResume () {
    if (!this.sessionId) {
      this.debug('[RESUME] No session ID was present; identifying as a new session.')
      this.identifyNew()
      return
    }

    this.status = KettuStatus.RESUMING

    this.debug(`[RESUME] Session ${this.sessionId}, sequence ${this.closeSequence}`)

    const d = {
      token: this.client.token,
      session_id: this.sessionId,
      seq: this.closeSequence
    }

    this.send({ op: KettuOpcodes.RESUME, d }, true)
  }

  /**
   * Processes the current WebSocket queue.
   * @returns {void}
   * @private
   */
  processQueue () {
    if (this.queue.length > 0) {
      const n = this.queue.shift()
      if (!n) return
      this._send(n)

      if (this.queue.length > 0) setTimeout(this.processQueue, 10)
    }
  }

  /**
   * Adds a packet to the queue to be sent to the gateway.
   * <warn>If you use this method, make sure you understand that you need to provide
   * a full [Payload](https://discord.com/developers/docs/topics/gateway#commands-and-events-gateway-commands).
   * Do not use this method if you don't know what you're doing.</warn>
   * @param {Object} data The full packet to send
   * @param {boolean} [important=false] If this packet should be added first in queue
   */
  send (data, important = false) {
    this.queue[important ? 'unshift' : 'push'](data)
    if (this.queue.length === 1) this.processQueue()
  }

  /**
   * Sends data, bypassing the queue.
   * @param {Object} data Packet to send
   * @returns {void}
   * @private
   */
  _send (data) {
    if (!this.connection || this.connection.readyState !== WebSocket.OPEN) {
      this.debug(`Tried to send packet '${JSON.stringify(data)}' but no WebSocket is available!`)
      this.destroy({ closeCode: 4000 })
      return
    }

    this.connection.send(WebSocket.pack(data), err => {
      if (err) this.client.emit(KettuEvents.ERROR, err, this.id)
    })
  }

  /**
   * Destroys this shard and closes its WebSocket connection.
   * @param {Object} [options={ closeCode: 1000, reset: false, emit: true, log: true }] Options for destroying the shard
   * @private
   */
  destroy ({ closeCode = 1000, reset = false, emit = true, log = true } = {}) {
    if (log) {
      this.debug(`[DESTROY]
    Close Code    : ${closeCode}
    Reset         : ${reset}
    Emit DESTROYED: ${emit}`)
    }

    // Step 0: Remove all timers
    this.setHeartbeatTimer(-1)
    this.setHelloTimeout(-1)

    // Step 1: Close the WebSocket connection, if any, otherwise, emit DESTROYED
    if (this.connection) {
      // If the connection is currently opened, we will (hopefully) receive close
      if (this.connection.readyState === WebSocket.OPEN) {
        this.connection.close(closeCode)
      } else {
        // Connection is not OPEN
        this.debug(`WS State: ${CONNECTION_STATE[this.connection.readyState]}`)
        // Remove listeners from the connection
        this._cleanupConnection()
        // Attempt to close the connection just in case
        try {
          this.connection.close(closeCode)
        } catch {
          // No-op
        }
        // Emit the destroyed event if needed
        if (emit) this._emitDestroyed()
      }
    } else if (emit) {
      // We requested a destroy, but we had no connection. Emit destroyed
      this._emitDestroyed()
    }

    // Step 2: Null the connection object
    this.connection = null

    // Step 3: Set the shard status to DISCONNECTED
    this.status = KettuStatus.DISCONNECTED

    // Step 4: Cache the old sequence (use to attempt a resume)
    if (this.sequence !== -1) this.closeSequence = this.sequence

    // Step 5: Reset the sequence and session ID if requested
    if (reset) {
      this.sequence = -1
      this.sessionId = null
    }
  }

  /**
   * Cleans up the WebSocket connection listeners.
   * @private
   */
  _cleanupConnection () {
    this.connection.onopen = this.connection.onclose = this.connection.onerror = this.connection.onmessage = null
  }

  /**
   * Emits the DESTROYED event on the shard
   * @private
   */
  _emitDestroyed () {
    /**
     * Emitted when a shard is destroyed, but no WebSocket connection was present.
     * @private
     * @event KettuWebSocket#destroyed
     */
    this.emit(KettuWSEvents.DESTROYED)
  }
}

module.exports = KettuWebSocket
