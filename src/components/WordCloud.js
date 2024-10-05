// src/components/WordCloud.js

import React from 'react';
import Word from './Word';
import { useDrop } from 'react-dnd';

const WordCloud = ({ words, getWordStatus, onWordReturn }) => {
  const [, drop] = useDrop(() => ({
    accept: 'WORD_IN_GAP',
    drop: (item) => {
      if (onWordReturn) {
        onWordReturn(item.word, item.fromGapId);
      }
    },
  }));

  return (
    <div ref={drop} className="word-cloud">
      {words.map((word) => (
        <Word
          key={word} // Assuming all words are unique
          word={word}
          status={getWordStatus(word)} // Pass status prop
        />
      ))}
    </div>
  );
};

export default WordCloud;