import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ResonanceApp from './components/ResonanceApp';
import './App.css';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ResonanceApp />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;