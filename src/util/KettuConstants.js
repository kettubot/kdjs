'use strict'

exports.KettuUserAgent = `Kettu Node.js/${process.version}`

exports.KettuStatus = {
  READY: 0,
  CONNECTING: 1,
  RECONNECTING: 2,
  IDLE: 3,
  NEARLY: 4,
  DISCONNECTED: 5,
  IDENTIFYING: 7,
  RESUMING: 8
}

exports.KettuWSEvents = {
  CLOSE: 'close',
  DESTROYED: 'destroyed',
  READY: 'ready',
  RESUMED: 'resumed',
  ALL_READY: 'allReady'
}

exports.KettuOpcodes = {
  DISPATCH: 0,
  HEARTBEAT: 1,
  HELLO: 3,
  IDENTIFY: 4,
  RESUME: 5
}

exports.KettuEvents = {
  READY: 'ready',
  ERROR: 'error',
  WARN: 'warn',
  DEBUG: 'debug',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting',
  RAW: 'raw'
}

exports.KettuDispatchEvents = [
  'GITHUB_HOOK',
  'GUILD_CASE_CREATE',
  'GUILD_CASE_DELETE',
  'GUILD_CASE_EXPIRE',
  'GUILD_CASE_UPDATE',
  'GUILD_MEMBER_BOOST',
  'GUILD_PING',
  'GUILD_UPDATE',
  'IMAGE_CREATE',
  'IMAGE_DELETE',
  'IMAGE_FEEDBACK_UPDATE',
  'IMAGE_UPDATE',
  'KAPI_ERROR_CREATE',
  'READY',
  'RESUMED',
  'RETRIEVE_GUILDS',
  'SHARD_EVAL',
  'USER_UPDATE'
].reduce((t, c) => ({ ...t, [c]: c }), {})
