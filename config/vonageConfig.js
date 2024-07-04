const { Vonage } = require('@vonage/server-sdk')

const vonage = new Vonage({
  apiKey: "c8cf9113",
  apiSecret: "aCCSd7UugfY9HdLK"
})

module.exports = vonage;