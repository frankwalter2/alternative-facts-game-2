// src/components/StartScreen.js

import React from 'react';

const StartScreen = ({ onStart }) => (
  <div className="start-screen">
    <h2>Welcome to Alternative Facts!</h2>
    <p>
      Can you sort fact from fiction? Fill in the blanks to complete today's satirical puzzle.
      Drag and drop the correct words into the gaps in the analogies.
      You have 6 tries to get them all right. Good luck!
    </p>
    <button onClick={onStart}>Start Game</button>
  </div>
);

export default StartScreen;
