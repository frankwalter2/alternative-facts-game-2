// src/components/Timer.js
import React, { useState, useEffect } from 'react';

const Timer = ({ isActive, showTime, onTimeUpdate }) => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setTime((t) => {
        const newTime = t + 1;
        if (onTimeUpdate) onTimeUpdate(newTime);
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, onTimeUpdate]);

  return showTime ? <div className="timer">Time: {time}s</div> : null;
};

export default Timer;
