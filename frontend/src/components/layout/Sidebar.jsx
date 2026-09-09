import React from 'react';
import { NavLink } from 'react-router-dom';
import { useCGM } from '../../hooks/useCGM';

export default function Sidebar({ isOpen, setIsOpen }) {
  const { savedReports, clinicProfile } = useCGM();

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`} id="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🩺</div>
        <div className="logo-text">
          <div className="logo-title">NayaGlyco AI</div>
          <div className="logo-sub">CGM Analytics Suite</div>
        </div>
        <div className="logo-version">v3.0</div>
      </div>
      <div className="sidebar-nav">
        <div className="sidebar-section-label">Main</div>
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
          <span className="nav-icon">📊</span> Dashboard
        </NavLink>
        <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
          <span className="nav-icon">📋</span> Saved Reports
          <span className="nav-badge" id="report-count-badge">{savedReports.length}</span>
        </NavLink>
        <NavLink to="/metrics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
          <span className="nav-icon">📚</span> Metric Definitions
        </NavLink>
        <div className="sidebar-section-label">System</div>
        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
          <span className="nav-icon">⚙️</span> Settings
        </NavLink>
      </div>
      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">
            {clinicProfile.physicianName ? clinicProfile.physicianName.substring(0, 2).toUpperCase() : 'DR'}
          </div>
          <div className="user-info">
            <div className="user-name">{clinicProfile.physicianName || 'Dr. Ramesh Kumar'}</div>
            <div className="user-role">{clinicProfile.physicianRole || 'Endocrinologist · MBBS MD'}</div>
          </div>
          <div className="user-status"></div>
        </div>
      </div>
    </aside>
  );
}
