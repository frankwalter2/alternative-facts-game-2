// src/components/Gap.js

import React from 'react';
import { useDrag, useDrop } from 'react-dnd';

const Gap = ({ id, word, onDrop, onRemove, onSwap, status }) => {
  const [{ isOver }, drop] = useDrop({
    accept: ['WORD', 'WORD_IN_GAP'],
    drop: (item) => {
      if (item.fromGapId !== undefined && item.fromGapId !== id) {
        onSwap(item.fromGapId, id);
      } else {
        onDrop(id, item.word);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'WORD_IN_GAP',
    item: { word, fromGapId: id },
    canDrag: () => !!word && status !== 'correct',
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const handleClick = () => {
    if (word && status !== 'correct') {
      onRemove(word, id);
    }
  };

  // Determine background color based on status
  const backgroundColor = isOver
    ? '#e0e0e0' // Light gray when hovered
    : status === 'empty'
    ? '#a9a9a9' // Grey for empty gaps
    : status === 'filled'
    ? '#007bff' // Blue when filled
    : status === 'correct'
    ? '#28a745' // Green
    : status === 'wrong place'
    ? '#fd7e14' // Orange
    : status === 'incorrect'
    ? '#dc3545' // Red
    : '#dee1e4'; // Fallback color

    return (
      <span
        ref={(node) => drag(drop(node))}
        className="gap"
        onClick={handleClick}
        style={{
          /* Adjusted styles */
          minWidth: '60px',
          padding: '3px 8px',
          borderRadius: '4px',
          color: 'white',
          display: 'inline-block',
          textAlign: 'center',
          margin: '0 3px',
          backgroundColor: backgroundColor,
          cursor: status !== 'correct' ? 'pointer' : 'default',
          transition: 'background-color 0.3s ease, transform 0.2s ease',
          opacity: isDragging ? 0 : 1,
          fontSize: '14px',
          lineHeight: 'normal',
          verticalAlign: 'middle',
        }}
      >
        {word || '_____' /* Show blank if no word is placed */}
      </span>
    );
  };

export default Gap;
