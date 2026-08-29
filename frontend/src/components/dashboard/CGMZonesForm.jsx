import React from 'react';
import { useCGM } from '../../hooks/useCGM';
import { validateZonesTotal } from '../../utils/validation';

export default function CGMZonesForm() {
  const { cgmData, setCgmData } = useCGM();

  const handleChange = (field, value) => {
    setCgmData(prev => ({ ...prev, [field]: value }));
  };

  const { total, isValid } = validateZonesTotal(cgmData);
  const totalDisplay = Math.round(total * 10) / 10;

  return (
    <div className="form-section">
      <div className="form-section-title">📊 CGM Zone Distribution</div>
      <div className="alert alert-info" style={{ padding: '8px 11px', fontSize: '11.5px' }}>
        <span className="alert-icon">ℹ️</span>
        <span>All five zones must total exactly <strong>100%</strong></span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
        <ZoneInput label="Very High (>250 mg/dL)" color="#ef4444" field="vh" value={cgmData.vh} onChange={handleChange} />
        <ZoneInput label="High (181–250 mg/dL)" color="#f97316" field="h" value={cgmData.h} onChange={handleChange} />
        <ZoneInput label="Target (70–180 mg/dL)" color="#22c55e" field="tir" value={cgmData.tir} onChange={handleChange} />
        <ZoneInput label="Low (54–69 mg/dL)" color="#eab308" field="low" value={cgmData.low} onChange={handleChange} />
        <ZoneInput label="Very Low (<54 mg/dL)" color="#dc2626" field="vl" value={cgmData.vl} onChange={handleChange} />
      </div>
      <div className={`total-validator ${isValid ? 'valid' : 'valid'}`}>
        <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>Zone Total</span>
        <span className={`total-count ${isValid ? 'valid' : 'valid'}`}>{totalDisplay} / 100%</span>
      </div>
      
      <div className="form-section-title" style={{ marginTop: '20px' }}>🧪 Glucose Metrics</div>
      <div className="form-grid">
        <div className="form-group">
          <label>Average Glucose</label>
          <div className="input-with-unit">
            <input 
              type="number" placeholder="178" min="50" max="400"
              value={cgmData.avg}
              onChange={(e) => handleChange('avg', e.target.value)}
            />
            <span className="input-unit">mg/dL</span>
          </div>
        </div>
        <div className="form-group">
          <label>GMI %</label>
          <div className="input-with-unit">
            <input 
              type="number" step="0.1" placeholder="7.5" min="4" max="16"
              value={cgmData.gmi}
              onChange={(e) => handleChange('gmi', e.target.value)}
            />
            <span className="input-unit">%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ZoneInput({ label, color, field, value, onChange }) {
  return (
    <div className="form-group">
      <div className="zone-label"><span className="zone-dot" style={{ background: color }}></span>{label}</div>
      <div className="input-with-unit">
        <input 
          type="number" placeholder="0" min="0" max="100" step="0.1" 
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
        />
        <span className="input-unit">%</span>
      </div>
    </div>
  );
}
