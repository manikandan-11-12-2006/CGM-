import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCGM } from '../../hooks/useCGM';
import { Menu, Moon, Sun, Save, Download } from 'lucide-react';

export default function Navbar({ toggleSidebar, exportPDF }) {
  const { isDarkMode, toggleDarkMode, analysis, saveReport, clinicProfile } = useCGM();
  const location = useLocation();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getPageName = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/reports': return 'Saved Reports';
      case '/metrics': return 'Metric Definitions';
      case '/settings': return 'Settings';
      default: return '';
    }
  };

  const handleSave = () => {
    if (!analysis) {
      alert('No assessment data to save. Please calculate metrics first.');
      return;
    }
    saveReport(analysis);
    // In a real app we might use a toast library here
    alert('✅ Assessment saved');
  };

  return (
    <nav className="navbar">
      <button className="nav-btn menu-toggle" onClick={toggleSidebar}>
        <Menu size={18} />
      </button>
      <div className="navbar-breadcrumb">
        <span>NayaGlyco AI</span>
        <span className="breadcrumb-sep">›</span>
        <span>{getPageName()}</span>
      </div>
      <div className="navbar-right">
        <div className="navbar-datetime">
          <div className="date">{now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
          <div>{now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
        <div className="nav-btn" title="Toggle Dark Mode" onClick={toggleDarkMode}>
          {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
        </div>
        <div className="nav-btn" title="Save Assessment" onClick={handleSave}>
          <Save size={16} />
        </div>
        <div className="nav-btn" title="Export PDF Report" onClick={exportPDF}>
          <Download size={16} />
        </div>
        <div className="doctor-pill">
          <div className="doctor-pill-avatar">
            {clinicProfile.physicianName ? clinicProfile.physicianName.substring(0, 2).toUpperCase() : 'DR'}
          </div>
          <div className="doctor-pill-name">
            {clinicProfile.physicianName ? clinicProfile.physicianName.split(',')[0] : 'Dr. Ramesh'}
          </div>
        </div>
      </div>
    </nav>
  );
}
