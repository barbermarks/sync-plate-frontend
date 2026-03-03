import React from 'react';
import Dashboard from './components/Dashboard';
import RebalanceModalDemo from './components/RebalanceModalDemo';
import './App.css';

function App() {
  // Toggle between Demo and Dashboard
  const showDemo = false; // Set to false to see full Dashboard

  return showDemo ? <RebalanceModalDemo /> : <Dashboard />;
}

export default App;