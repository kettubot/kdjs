'use strict'

const KettuGuildConfigModActions = require('../util/KettuGuildConfigModActions')

const MOD_ROLES = ['mute', 'trusted', 'bypass', 'helper', 'mod', 'admin']

/**
 * Stores configuration for the moderation aspect of Kettu
 */
class KettuGuildConfigMod {
  /**
   * @param {Client} client The parent client
   * @param {Object} data The 'mod' data for the guild config
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
     * Various moderation-related roles in Kettu's configuration
     * @typedef {Object} KettuGuildConfigModRoles
     * @property {?Role} mute Role assigned to muted users
     * @property {?Role} trusted Users with a lower automod strength
     * @property {?Role} bypass Users with no automod, step up from trusted
     * @property {?Role} helper Role for helpers
     * @property {?Role} mod Role for moderators, step up from helpers
     * @property {?Role} admin Role for admins, step up from moderators
     */

    /**
     * Kettu mod roles configuration
     * @type {KettuGuildConfigModRoles}
     * @name KettuGuildConfigMod#role
     */
    data.role = data.role || {}
    this.role = {}
    const roletypes = MOD_ROLES.filter(type => data.role[type])
    for (const type of roletypes) this.role[type] = data.role[type]

    /**
     * Kettu mod actions configuration
     * @type {KettuGuildConfigModActions}
     */
    this.actionCases = new KettuGuildConfigModActions(data.actionCases)

    /**
     * Configuration for mod-related automated dms
     * @typedef {Object} KettuGuildConfigModDM
     * @property {boolean} dm Whether dms are enabled, false should be assumed if the object doesn't exist
     * @property {?boolean} showMod Whether the specific responsible mod is shown
     * @property {?string} appeals Link to an appeals page
     */

    /**
     * Kettu mod dm configuration
     * @type {?KettuGuildConfigModDM}
     * @name KettuGuildConfigMod#dm
     */
    this.dm = data.dm

    /**
     * The message style type for moderation
     * @type {ResponseStyle}
     */
    this.type = data.type

    /**
     * Whether to delete mod commands
     * @type {boolean}
     */
    this.deleteCmd = data.deleteCmd

    /**
     * Whether to automatically delete mod errors? idk what this is actually for haha
     * @type {boolean}
     */
    this.deleteErr = data.deleteErr

    /**
     * Moderation confirmation level
     * * 'none' - never confirm moderator actions
     * * 'mass' - confirm only mass moderator actions
     * * 'all' - confirm all moderator actions
     * @typedef {string} KettuGuildConfigModConfirmLevel
     */

    /**
     * At which level to confirm mod actions
     * @type {KettuGuildConfigModConfirmLevel}
     */
    this.confirm = data.confirm
  }
}

module.exports = KettuGuildConfigMod
