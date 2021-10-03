'use strict'

/**
 * Data representing an image's updated feedback.
 * @typedef {Object} KettuImageFeedbackUpdateData
 * @property {KettuImage} image Image the new feedback was added to / removed from
 * @property {Object} added Added feedback
 * @property {Array<Snowflake>} added.likes Users who added likes
 * @property {Array<Snowflake>} added.dislikes Users who added dislikes
 * @property {Array<Snowflake>} added.flags Users who added flags
 * @property {Object} removed Removed feedback
 * @property {Array<Snowflake>} removed.likes Users who removed likes
 * @property {Array<Snowflake>} removed.dislikes Users who removed dislikes
 * @property {Array<Snowflake>} removed.flags Users who removed flags
 */

/**
 * Emitted whenever a kettu image's feedback is updated.
 * @event KettuClient#imageFeedbackUpdate
 * @param {KettuImageFeedbackUpdateData} data The change in feedback
 */

module.exports = async (kettu, packet) => {
  const data = { added: packet.d.added, removed: packet.d.removed }
  data.image = await kettu.images.fetch(packet.d.category, packet.d.id)
  kettu.emit('imageFeedbackUpdate', data)
}
