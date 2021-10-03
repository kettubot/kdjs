'use strict'

const { KettuDispatchEvents } = require('../../util/KettuConstants')

const handlers = {}

for (const name of Object.keys(KettuDispatchEvents)) {
  try {
    handlers[name] = require(`./${name}.js`)
  } catch {} // eslint-disable-line no-empty
}

module.exports = handlers
