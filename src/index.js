// src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css'; // If you have global styles
import App from './App'; // Import the App component
import ReactGA from 'react-ga4';

ReactGA.initialize('G-1N2JBW3KRZ');

ReactDOM.render(<App />, document.getElementById('root'));
