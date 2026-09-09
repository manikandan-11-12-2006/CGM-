import React from 'react';
import { useCGM } from '../../hooks/useCGM';
import { DIABETES_TYPES } from '../../data/constants';
import { validateField } from '../../utils/validation';

export default function PatientForm() {
  const { patient, setPatient } = useCGM();

  const handleChange = (field, value) => {
    setPatient(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="form-section">
      <div className="form-section-title">👤 Patient Details</div>
      <div className="form-grid">
        <div className="form-group full">
          <label>Patient Name</label>
          <input 
            className="form-control" 
            type="text" 
            placeholder="e.g. Priya Sharma" 
            value={patient.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Age</label>
          <div className="input-with-unit">
            <input 
              type="number" 
              placeholder="42" 
              min="1" max="120"
              value={patient.age}
              onChange={(e) => handleChange('age', e.target.value)}
            />
            <span className="input-unit">yrs</span>
          </div>
        </div>
        <div className="form-group">
          <label>Gender</label>
          <select 
            className="form-control"
            value={patient.gender}
            onChange={(e) => handleChange('gender', e.target.value)}
          >
            <option value="">Select</option>
            <option>Female</option><option>Male</option><option>Other</option>
          </select>
        </div>
        <div className="form-group">
          <label>Diabetes Type</label>
          <select 
            className="form-control"
            value={patient.type}
            onChange={(e) => handleChange('type', e.target.value)}
          >
            <option value="">Select</option>
            {DIABETES_TYPES.map(dt => (
              <option key={dt.value} value={dt.value}>{dt.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>HbA1c %</label>
          <div className="input-with-unit">
            <input 
              type="number" step="0.1" 
              placeholder="8.2" min="4" max="16"
              value={patient.hba1c}
              onChange={(e) => handleChange('hba1c', e.target.value)}
            />
            <span className="input-unit">%</span>
          </div>
        </div>
        <div className="form-group">
          <label>Visit Date</label>
          <input 
            className="form-control" 
            type="date"
            value={patient.visitDate}
            onChange={(e) => handleChange('visitDate', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
