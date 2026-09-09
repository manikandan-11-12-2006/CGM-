import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CGMProvider } from './context/CGMContext';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Metrics from './pages/Metrics';
import Settings from './pages/Settings';

function App() {
  return (
    <CGMProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="reports" element={<Reports />} />
            <Route path="metrics" element={<Metrics />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CGMProvider>
  );
}

export default App;
