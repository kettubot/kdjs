'use strict'

/**
 * Manager for interfacing with Kettu's data store
 */
class KettuStoreManager {
  constructor (client) {
    /**
     * The kettu client that instantiated this manager
     * @type {KettuClient}
     * @readonly
     */
    this.client = client
  }

  /**
   * Retrieves data from the data store
   * @param {string} key Key to retrieve data from
   * @returns {Promise<*>}
   */
  fetch (key) {
    return this.client.api.users('@me').store(key).get()
  }

  /**
   * Writes data to the data store (like an overwrite)
   * @param {string} key Key to write data to
   * @param {*} data JSON data to write
   * @returns {Promise<*>}
   */
  async set (key, data) {
    const row = await this.client.api.users('@me').store(key).post({ data: { data } })
    return row.data
  }

  /**
   * Updates data in the data store (like a patch), must be on an object
   * @param {string} key Key to patch data to
   * @param {object} data JSON data to patch
   * @returns {Promise<*>}
   */
  async patch (key, data) {
    const row = await this.client.api.users('@me').store(key).patch({ data: { data } })
    return row.data
  }

  /**
   * Removes data from the data store
   * @param {string} key Key to delete data from
   * @returns {Promise}
   */
  destroy (key) {
    return this.client.api.users('@me').store(key).delete()
  }
}

module.exports = KettuStoreManager
