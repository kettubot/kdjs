# Changelog

## 1.0.8

`KettuWebSocket` now implements base`X` events

For example, `KettuClient#retrieveGuilds` -> `KettuClient#baseRetrieveGuilds`

## 1.0.7

Implemented more robust reconnection attempts

## 1.0.6

Fixed BigInt serialisation in `KettuAPIRequest`

## 1.0.5

- Fixed kAPI reconnection (increase delay from 1s to 5s)
- Added `KettuClient#slashDeploy` for slash command deployment options

## 1.0.4

Fixed a breaking change from a previous `discord.js` version

## 1.0.3

Now requires `discord.js^13.4.0`

## 1.0.2

Fixed a bug with `KettuClient#shardInstanceUpdate`

Added further documentation

## 1.0.1

Added `KettuClient#shardInstanceUpdate`

## 1.0.0

Initial release. Approximately the same functionality as `@kettubot/discord.js@13.0.0-alpha.32`