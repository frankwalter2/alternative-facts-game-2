import React from 'react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import Game from './Game';  // Ensure this path is correct
import ArticleSubmission from './components/ArticleSubmission';  // Ensure this path is correct

import { DndProvider, MultiBackend } from 'react-dnd-multi-backend';
import { HTML5toTouch } from 'rdndmb-html5-to-touch';

function App() {
  return (
    <DndProvider backend={MultiBackend} options={HTML5toTouch}>
      <Router>
        <Routes>
          <Route path="/" element={<Game />} />
          <Route path="/submit-article" element={<ArticleSubmission />} />
        </Routes>
      </Router>
    </DndProvider>
  );
}

export default App;