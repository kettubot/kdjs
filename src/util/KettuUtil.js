'use strict'

exports.retryPromise = (promise, maxAttempts, delayBetween = 1) => {
  return new Promise((resolve, reject) => {
    function attempt (num) {
      promise()
        .then(res => resolve(res))
        .catch(err => {
          if (num < maxAttempts) setTimeout(() => attempt(num + 1), delayBetween)
          else reject(err)
        })
    }

    attempt(1)
  })
}
