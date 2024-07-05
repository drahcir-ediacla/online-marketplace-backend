const { Vonage } = require('@vonage/server-sdk')

const vonage = new Vonage({
  apiKey: "d2abf16f",
  apiSecret: "Qj0HIMc3cxgv3uKM"
})

module.exports = vonage;