import React, { useState } from 'react';
import { useCGM } from '../hooks/useCGM';

const Card = ({ title, icon, children }) => (
  <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2eaf3' }}>
    <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span>{icon}</span> {title}
    </div>
    {children}
  </div>
);

const ToggleRow = ({ title, subtitle, checked, onChange }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #f1f5f9' }}>
    <div>
      <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{title}</div>
      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{subtitle}</div>
    </div>
    <div 
      onClick={onChange}
      style={{
        width: '36px', height: '20px', borderRadius: '10px', background: checked ? '#3b82f6' : '#cbd5e1', 
        position: 'relative', cursor: 'pointer', transition: 'background 0.3s'
      }}>
      <div style={{
        position: 'absolute', top: '2px', left: checked ? '18px' : '2px', width: '16px', height: '16px', 
        background: '#fff', borderRadius: '50%', transition: 'left 0.3s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
      }}></div>
    </div>
  </div>
);

const InfoRow = ({ label, value, isLast }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: isLast ? 'none' : '1px solid #f1f5f9' }}>
    <div style={{ fontSize: '12px', color: '#64748b' }}>{label}</div>
    <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>{value}</div>
  </div>
);

const InputGroup = ({ label, value, placeholder, onChange }) => (
  <div style={{ marginBottom: '16px' }}>
    <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>{label}</div>
    <input 
      type="text" 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', color: '#1e293b', boxSizing: 'border-box' }}
    />
  </div>
);

export default function Settings() {
  const { isDarkMode, toggleDarkMode, clearReports, clinicProfile, setClinicProfile } = useCGM();
  const [autoSave, setAutoSave] = useState(false);

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all saved reports? This cannot be undone.')) {
      clearReports();
    }
  };

  const updateProfile = (field, value) => {
    setClinicProfile(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="page active" style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#0b2545', letterSpacing: '-0.5px' }}>Settings</div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Customize NayaGlyco AI preferences</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Card title="Display Settings" icon="⚙️">
              <ToggleRow 
                title="Dark Mode" 
                subtitle="Switch to dark clinical theme" 
                checked={isDarkMode} 
                onChange={toggleDarkMode} 
              />
              <ToggleRow 
                title="Auto-Save Reports" 
                subtitle="Save each calculation automatically" 
                checked={autoSave} 
                onChange={() => setAutoSave(!autoSave)} 
              />
            </Card>

            <Card title="About NayaGlyco AI" icon="ℹ️">
              <InfoRow label="Version" value="3.0.0" />
              <InfoRow label="AI Engine" value="llama-4-scout-17b" />
              <InfoRow label="Clinical Protocol" value="ADA/ATTD 2023" />
              <InfoRow label="Triage Engine" value="GBI + GPM Combined" />
              <InfoRow label="PDF Auto-Read" value="PDF.js → Vision AI" isLast />
            </Card>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Card title="Clinic Profile" icon="🏥">
              <InputGroup 
                label="Clinic Name" 
                value={clinicProfile.clinicName} 
                onChange={v => updateProfile('clinicName', v)}
              />
              <InputGroup 
                label="Attending Physician" 
                value={clinicProfile.physicianName} 
                onChange={v => updateProfile('physicianName', v)}
              />
              <InputGroup 
                label="Reg. Number" 
                value={clinicProfile.regNumber}
                placeholder="Enter registration number" 
                onChange={v => updateProfile('regNumber', v)}
              />
            </Card>

            <Card title="Data Management" icon="🗄️">
              <button 
                onClick={handleClear}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#fef2f2', 
                  border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', fontSize: '12px', 
                  fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s'
                }}>
                🗑️ Clear All Saved Reports
              </button>
            </Card>
          </div>

        </div>

      </div>
    </div>
  );
}
