import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import Settings from './pages/Settings';
import ComingSoon from './components/ComingSoon';
import Login from './pages/Login';
import Videos from './pages/Videos';
import Gallery from './pages/Gallery';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
        
        <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="programs" element={<ComingSoon title="Programs Management" />} />
          <Route path="events" element={<Events />} />
          <Route path="videos" element={<Videos />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="users" element={<ComingSoon title="User Management" />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
