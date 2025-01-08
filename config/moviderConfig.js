const querystring = require('querystring');
const axios = require('axios');
require('dotenv').config();

const moviderConfig = {
  apiKey: '2jxZEbJPQbTUAk8VJAN1oynqUhj',
  apiSecret: 'QXY9UVsDHz7x6XFM7TKYGpNU1pY5VTY8bebeqFjm',
  apiUrl: 'https://api.movider.co/v1/sms',
  from: 'MOVIDER'
};

const sendSms = async (to, message) => {
  const data = {
    to,
    text: message,
    api_key: moviderConfig.apiKey,
    api_secret: moviderConfig.apiSecret,
    from: moviderConfig.from
  };

  const options = {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    data: querystring.stringify(data),
    url: moviderConfig.apiUrl,
  };

  try {
    const response = await axios(options);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Error response from Movider:', error.response.data);
    } else {
      console.error('Error sending SMS with Movider:', error.message);
    }
    throw error;
  }
};

module.exports = { sendSms };
