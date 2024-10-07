// src/components/StartScreen.js
import React from 'react';
import ReactGA from 'react-ga4'; // Import GA

const StartScreen = ({ onStart, isLoading, disabled }) => (
  <div className="start-screen">
    <h2>Welcome to Alternative Facts</h2>
    <p>
      Can you sort fact from fiction? Fill in the blanks to complete today's satirical puzzle.
      Drag and drop the correct words into the gaps in the analogies.
      You have 6 tries to get them all right. Good luck!
    </p>
    <button
      onClick={() => {
        if (!isLoading && !disabled) {
          // Track the game start event
          ReactGA.event({
            action: 'game_started',
            params: {
              category: 'User',
              label: 'Game Start',
            },
          });

          // Call the original onStart function
          onStart();
        }
      }}
      disabled={isLoading || disabled}
    >
      {isLoading ? 'Loading...' : disabled ? 'Game Completed' : 'Start Game'}
    </button>
  </div>
);


export default StartScreen;
