import React from 'react';
import Gap from './Gap';

const Analogy = ({ analogies, answers, onDrop, onRemove, onSwap, answerMap, colors }) => (
  <div className="analogies">
    {analogies.map((analogy, idx) => {
      const parts = analogy.split(/(\{\d+\})/g); // Split analogy text where gaps are defined

      return (
        <div key={idx} className="analogy-box">
          {parts.map((part, index) => {
            const match = part.match(/\{(\d+)\}/);
            if (match) {
              const gapId = parseInt(match[1], 10);
              return (
                <Gap
                key={`${idx}-${index}`}
                  id={gapId}
                  word={answers[gapId]} // Pass the current word in this gap
                  onDrop={onDrop} // Handle word drop
                  onRemove={onRemove} // Handle word removal
                  onSwap={onSwap} // Handle word swapping between gaps
                  status={colors[gapId] || 'empty'} // Pass status prop (default to 'empty')
                />
              );
            }
            return <span key={`${idx}-${index}`}>{part}</span>; // Render normal text parts
          })}
        </div>
      );
    })}
  </div>
);


export default Analogy;

