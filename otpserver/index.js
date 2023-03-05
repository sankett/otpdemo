require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const OTP_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

const otpCodes = new Map(); // Map of phone numbers to OTP codes and timestamps

app.use(cors({
  origin: '*'
}));

app.post('/api/login', async (req, res) => {
  const { phoneNumber } = req.body;

  try {
    const code = Math.floor(100000 + Math.random() * 900000);
    const message = `Your OTP code is ${code}.`;

    console.log(message)
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    const timestamp = Date.now();
    otpCodes.set(phoneNumber, { code, timestamp });

    res.status(200).json({ message: 'OTP code sent!', timestamp });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to send OTP code.' });
  }
});

app.post('/api/verify-otp', async (req, res) => {
  const { phoneNumber, code, timestamp } = req.body;
  const storedOtp = otpCodes.get(phoneNumber);

  if (!storedOtp) {
    return res.status(400).json({ message: 'OTP code not found.' });
  }

  if (storedOtp.code.toString() !== code.toString()) {
    console.log(storedOtp.code, code)
    return res.status(400).json({ message: 'Invalid OTP code.' });
  }

  if (Date.now() - storedOtp.timestamp > OTP_TIMEOUT_MS) {
    return res.status(400).json({ message: 'OTP code has expired.' });
  }

  // OTP code is valid
  otpCodes.delete(phoneNumber);
  res.status(200).json({ message: 'OTP code verified!' });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
