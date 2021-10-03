'use strict'

const Discord = require('discord.js')
const extend = require('./extender')

extend(Discord.Client, require('./client/KettuClient'))
extend(Discord.Guild, require('./structures/KettuGuild'), 'id')
extend(Discord.GuildChannel, require('./structures/KettuGuildChannel'), 'id')
extend(Discord.User, require('./structures/KettuUser'), 'id')

module.exports = {
  ...Discord,

  // Client
  KettuClient: require('./client/KettuClient'),
  KettuWebSocket: require('./client/KettuWebSocket'),

  // Managers
  KettuGuildCaseManager: require('./managers/KettuGuildCaseManager'),
  KettuImageManager: require('./managers/KettuImageManager'),
  KettuStoreManager: require('./managers/KettuStoreManager'),

  // Structures
  KettuGuild: require('./structures/KettuGuild'),
  KettuGuildCase: require('./structures/KettuGuildCase'),
  KettuGuildChannel: require('./structures/KettuGuildChannel'),
  KettuGuildConfig: require('./structures/KettuGuildConfig'),
  KettuGuildConfigBoost: require('./structures/KettuGuildConfigBoost'),
  KettuGuildConfigMod: require('./structures/KettuGuildConfigMod'),
  KettuGuildConfigRaidmode: require('./structures/KettuGuildConfigRaidmode'),
  KettuGuildConfigRoles: require('./structures/KettuGuildConfigRoles'),
  KettuGuildConfigSocial: require('./structures/KettuGuildConfigSocial'),
  KettuImage: require('./structures/KettuImage'),
  KettuUser: require('./structures/KettuUser'),

  // Utilities
  KettuConstants: require('./util/KettuConstants'),
  KettuGuildConfigModActions: require('./util/KettuGuildConfigModActions'),
  KettuIntents: require('./util/KettuIntents'),
  KettuOptions: require('./util/KettuOptions'),
  KettuUserAnimalPrefs: require('./util/KettuUserAnimalPrefs'),
  KettuUserFlags: require('./util/KettuUserFlags'),
  KettuUserPerms: require('./util/KettuUserPerms'),
  KettuUserSocialPrefs: require('./util/KettuUserSocialPrefs'),
  kettuVersion: require('../package.json').version
}
