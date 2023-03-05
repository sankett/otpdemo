import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [phoneNumber, setPhoneNumber] = useState('+15005550006');
  const [otpCode, setOTPCode] = useState('');
  const [status, setStatus] = useState('Enter your phone number and click Send OTP.');
  const [timestamp, setTimestamp] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  let [timer, setTimer] = useState(null);
  const OTP_TIMEOUT_MS = new Date(new Date().getTime() + 0.5*60000) ;//5 * 60 * 1000;
  //let timer;

  const handleSendOTP = async () => {
    try {
      setStatus('Waiting to send OTP...');
      const response = await axios.post('http://localhost:5000/api/login', { phoneNumber });
      setStatus(response.data.message);
      setTimestamp(response.data.timestamp);
      setTimeLeft(OTP_TIMEOUT_MS);
      startTimer();
      
    } catch (error) {
      console.error(error);
      setStatus('Failed to send OTP code.');
    }
  };

  const handleVerifyOTP = async () => {
    try {
      
      const response = await axios.post('http://localhost:5000/api/verify-otp', {
        phoneNumber,
        code: otpCode,
        timestamp,
      });
      setStatus(response.data.message);
      setOTPCode('');
      setTimestamp(0);
      setTimeLeft(0);
      stopTimer();
    } catch (error) {
      console.error(error);
      setStatus('Invalid OTP code.');
    }
  };

  const startTimer = () => {
    timer = setInterval(() => {
      const elapsedTime = Date.now() - timestamp;
      const timeLeft = Math.max(0, OTP_TIMEOUT_MS - elapsedTime);
      
      setTimeLeft(timeLeft);
      if(timeLeft === 0) {
        setStatus("Time elapsed. Send again.");
        setOTPCode('');
        setTimestamp(0);
        setTimeLeft(0);
        stopTimer();
      }
    }, 1000);
    setTimer(timer);
  };

  const stopTimer = () => {
    
    clearInterval(timer);
    setTimer(null);
  };

  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 1000 / 60);
    const seconds = Math.floor((timeLeft / 1000) % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      <div>{status}</div>
      <hr></hr>
      <label>
        Phone Number:
        <input
          type="text"
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(event.target.value)}
        />
      </label>
      <br />
      <button onClick={handleSendOTP}>Send OTP</button>
      <br />
      
      {timestamp > 0 && (
        <div>
          <label>
            OTP Code:
            <input
              type="text"
              value={otpCode}
              onChange={(event) => setOTPCode(event.target.value)}
            />
          </label>
          <br />
          <button onClick={handleVerifyOTP}>Verify OTP</button>
          <br />
          <div>{`Time left: ${formatTimeLeft()}`}</div>
        </div>
      )}
      
    </div>
  );
}

export default App;
