// src/components/Word.js

import React from 'react';
import { useDrag } from 'react-dnd';

const Word = ({ word, status = 'unused' }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'WORD',
    item: { word },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  // Determine background color based on status
  const backgroundColor = isDragging
    ? '#0056b3' // Darker blue while dragging
    : status === 'correct'
    ? '#28a745' // Green
    : status === 'wrong place'
    ? '#fd7e14' // Orange
    : status === 'incorrect'
    ? '#dc3545' // Red
    : '#007bff'; // Default blue

  return (
    <span
      ref={drag}
      className="word"
      style={{
        opacity: isDragging ? 0 : 1,
        backgroundColor: backgroundColor, // Dynamic background color
        cursor: 'grab',
        transform: isDragging ? 'scale(1.1)' : 'scale(1)',
        transition: 'all 0.2s ease-in-out',
        padding: '8px 12px',
        borderRadius: '12px',
        color: 'white',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
        userSelect: 'none',
        margin: '5px',
      }}
    >
      {word}
    </span>
  );
};

export default Word;
