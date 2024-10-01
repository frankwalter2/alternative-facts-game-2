// src/components/Timer.js
import React, { useState, useEffect } from 'react';

// Ensure that onTimeUpdate is not called during render
const Timer = ({ isActive, showTime, onTimeUpdate }) => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (!isActive) return;
  
    const timer = setInterval(() => {
      setTime((t) => t + 1);
    }, 1000);
  
    return () => clearInterval(timer);
  }, [isActive]); // Only depend on isActive
  
  useEffect(() => {
    if (onTimeUpdate) {
      onTimeUpdate(time);
    }
  }, [time, onTimeUpdate]); // Depend on time and onTimeUpdate

  return showTime ? <div className="timer">Time: {time}s</div> : null;
};

export default Timer;
