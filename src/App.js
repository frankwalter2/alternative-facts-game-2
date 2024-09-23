import React from 'react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import Game from './Game';  // Ensure this path is correct
import ArticleSubmission from './components/ArticleSubmission';  // Ensure this path is correct

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Game />} />
        <Route path="/submit-article" element={<ArticleSubmission />} />
      </Routes>
    </Router>
  );
}

export default App;
