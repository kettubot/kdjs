'use strict'

/**
 * Stores configuration for the roles aspect of Kettu
 */
class KettuGuildConfigRoles {
  /**
   * @param {Client} client The parent client
   * @param {Object} data The 'roles' data for the guild config
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
     * Available selfroles for this guild
     * @type {Array<Role>}
     */
    this.selfroles = data.selfroles.map(r => this.guild.roles.cache.get(r))

    /**
     * A reaction role's specific emoji
     * @typedef {Object} KettuGuildConfigRolesReactroleEmoji
     * @property {?Snowflake} id Emoji ID, if a custom emoji
     * @property {?string} name Custom Emoji name, or ASCII emoji value
     * @property {?animated} boolean Animated, if a custom emoji
     */

    /**
     * Configuration for a single reaction role
     * @typedef {Object} KettuGuildConfigRolesReactrole
     * @property {Snowflake} channelId channel ID
     * @property {Snowflake} messageId message ID
     * @property {Role} role The role to add/remove
     * @property {KettuGuildConfigRolesReactroleEmoji} emoji The reaction emoji for this role
     */

    for (const roleconfig of data.reactroles) {
      roleconfig.role = this.guild.roles.cache.get(roleconfig.roleId)
    }

    /**
     * Available reactroles for this guild
     * @type {Array<KettuGuildConfigRolesReactrole>}
     * @name KettuGuildConfigRoles#reactroles
     */
    this.reactroles = data.reactroles
  }
}

module.exports = KettuGuildConfigRoles
