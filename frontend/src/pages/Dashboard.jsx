import React, { useState } from 'react';
import { useCGM } from '../hooks/useCGM';
import PdfUpload from '../components/cgm/PdfUpload';
import PatientForm from '../components/dashboard/PatientForm';
import CGMZonesForm from '../components/dashboard/CGMZonesForm';
import ResultPanel from '../components/analytics/ResultPanel';
import { computeMetrics } from '../utils/calculations';
import { SAMPLES } from '../data/constants';

export default function Dashboard() {
  const { patient, cgmData, setPatient, setCgmData, setAnalysis, savedReports, saveReport } = useCGM();
  const [isCalculating, setIsCalculating] = useState(false);
  const [sampleMenuOpen, setSampleMenuOpen] = useState(false);

  const handleCalculate = () => {
    const total = Number(cgmData.vh) + Number(cgmData.h) + Number(cgmData.tir) + Number(cgmData.low) + Number(cgmData.vl);
    // Relaxed the 100% total block to allow calculation even with partial data
    if (total === 0) {
      alert('Please enter CGM zone values before calculating.');
      return;
    }

    setIsCalculating(true);
    setTimeout(() => {
      const result = computeMetrics({
        name: patient.name || 'Anonymous Patient',
        age: patient.age,
        gender: patient.gender,
        dtype: patient.type,
        hba1c: parseFloat(patient.hba1c),
        vh: parseFloat(cgmData.vh) || 0,
        h: parseFloat(cgmData.h) || 0,
        tir: parseFloat(cgmData.tir) || 0,
        low: parseFloat(cgmData.low) || 0,
        vl: parseFloat(cgmData.vl) || 0,
        avg: parseFloat(cgmData.avg),
        gmi: parseFloat(cgmData.gmi),
        visitDate: patient.visitDate,
        savedReports
      });
      setAnalysis(result);
      
      // Auto-save logic (if enabled in settings, currently just manually save if preferred, 
      // but original had a setting for it. Let's assume we want to let user save manually unless setting says so)
      setIsCalculating(false);
    }, 600);
  };

  const loadSample = (n) => {
    const s = SAMPLES[n];
    setPatient({ name: s.name, age: s.age, gender: s.gender, type: s.type, hba1c: s.hba1c, visitDate: '' });
    setCgmData({ vh: s.vh, h: s.h, tir: s.tir, low: s.low, vl: s.vl, avg: s.avg, gmi: s.gmi });
    setSampleMenuOpen(false);
  };

  return (
    <div className="page active">
      <div className="page-inner">
        <div className="page-header">
          <div>
            <div className="page-title">CGM Assessment Dashboard</div>
            <div className="page-subtitle">NayaGlyco AI v3.0 · Vision AI-Powered PDF Auto-Read</div>
          </div>
        </div>

        <div className="dashboard-layout">
          {/* LEFT: INPUT FORM */}
          <div className="left-panel">
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Patient Assessment Form</div>
                  <div className="card-subtitle">Vision AI auto-reads CGM PDF instantly</div>
                </div>
              </div>
              <div className="card-body">
                <PdfUpload />
                <PatientForm />
                <CGMZonesForm />
              </div>
              <div className="card-footer" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button className="btn btn-primary btn-lg" onClick={handleCalculate} style={{ width: '100%', justifyContent: 'center' }}>
                  ⚡ Calculate Analysis
                </button>
                <div className="sample-dropdown-wrap" style={{ width: '100%' }}>
                  <button className="btn btn-secondary" onClick={() => setSampleMenuOpen(!sampleMenuOpen)} style={{ width: '100%', justifyContent: 'center' }}>
                    🧪 Load Sample ▼
                  </button>
                  {sampleMenuOpen && (
                    <div className="sample-dropdown-menu open" style={{ width: '100%', top: 'auto', bottom: 'calc(100% + 6px)' }}>
                      <div className="sample-dropdown-item" onClick={() => loadSample(1)}>
                        Arjun Mehta <span className="item-badge badge-blue">T2D</span>
                      </div>
                      <div className="sample-dropdown-item" onClick={() => loadSample(2)}>
                        Savitha Rao <span className="item-badge badge-red">High Risk</span>
                      </div>
                      <div className="sample-dropdown-item" onClick={() => loadSample(3)}>
                        Vikram Singh <span className="item-badge badge-purple">T1D</span>
                      </div>
                      <div className="sample-dropdown-item" onClick={() => loadSample(4)}>
                        Meena Patel <span className="item-badge badge-orange">LADA</span>
                      </div>
                      <div className="sample-dropdown-item" onClick={() => loadSample(5)}>
                        Priya Sharma <span className="item-badge badge-green">Target</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: RESULTS PANEL */}
          <div>
            <ResultPanel />
          </div>
        </div>
      </div>

      {isCalculating && (
        <div className="calculating-overlay show">
          <div className="calc-card">
            <div className="calc-spinner"></div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', fontFamily: '"Sora", sans-serif' }}>
              Computing Glycemic Metrics
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '5px' }}>
              Applying clinical algorithms…
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
