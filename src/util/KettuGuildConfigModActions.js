'use strict'

const { BitField } = require('discord.js')

/**
 * Data structure that makes it easy to interact with a {@link KettuGuildConfigMod#actionCases} bitfield.
 * @extends {BitField}
 */
class KettuGuildConfigModActions extends BitField {}

/**
 * @name KettuGuildConfigModActions
 * @kind constructor
 * @memberof KettuGuildConfigModActions
 * @param {BitFieldResolvable} [bits=0] Bit(s) to read from
 */

/**
 * Numeric case types. All available properties:
 * * `strike`
 * * `ban`
 * * `kick`
 * * `mute`
 * * `purge`
 * * `raidmode`
 * * `slowmode`
 * * `lockserver`
 * * `lockcategory`
 * * `lockchannel`
 * * `editcase`
 * * `deletecase`
 * @type {Object}
 */
KettuGuildConfigModActions.FLAGS = {
  strike: 1 << 0,
  ban: 1 << 1,
  kick: 1 << 2,
  mute: 1 << 3,
  purge: 1 << 4,
  raidmode: 1 << 5,
  slowmode: 1 << 6,
  lockserver: 1 << 7,
  lockcategory: 1 << 8,
  lockchannel: 1 << 9,
  editcase: 1 << 10,
  deletecase: 1 << 11
}

module.exports = KettuGuildConfigModActions
