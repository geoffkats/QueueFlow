import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import QueueStatus from './components/QueueStatus';
import Admin from './components/Admin';
import Operator from './components/Operator';
import OperatorHistory from './components/OperatorHistory';
import TVDisplay from './components/TVDisplay';
import WatchingTV from './components/WatchingTV';
import DemoMode from './components/DemoMode';
import DevNavigation from './components/shared/DevNavigation';
import InstallPrompt from './components/shared/InstallPrompt';

function App() {
  return (
    <Router>
      <div className="App">
        {/* Development Navigation - Remove in production */}
        <DevNavigation />
        
        {/* PWA Install Prompt */}
        <InstallPrompt />
        
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/queue-status" element={<QueueStatus />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/operator" element={<Operator />} />
          <Route path="/operator-history" element={<OperatorHistory />} />
          <Route path="/display" element={<WatchingTV />} />
          <Route path="/tv-display" element={<TVDisplay />} />
          <Route path="/watching-tv" element={<WatchingTV />} />
          <Route path="/demo" element={<DemoMode />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;