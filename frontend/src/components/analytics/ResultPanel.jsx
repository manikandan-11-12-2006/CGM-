import React from 'react';
import { useCGM } from '../../hooks/useCGM';
import DonutChart from './DonutChart';

export default function ResultPanel() {
  const { analysis, approveReport } = useCGM();

  if (!analysis) {
    return (
      <div className="results-placeholder">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <h3>No Analysis Yet</h3>
        <p>Upload a CGM report or enter values manually, then click Calculate Analysis to view clinical insights.</p>
      </div>
    );
  }

  const r = analysis;

  const getGBIColor = (badge) => {
    const map = { 'badge-green': '#22c55e', 'badge-yellow': '#d97706', 'badge-orange': '#ea580c', 'badge-red': '#dc2626' };
    return map[badge] || 'var(--text)';
  };

  return (
    <div>
      {/* Patient Summary Card */}
      <div className="patient-summary-card">
        <div className="patient-summary-header">
          <div className="patient-avatar-lg">🩺</div>
          <div className="patient-header-info">
            <div className="patient-header-name">{r.name}</div>
            <div className="patient-header-meta">
              {[r.age ? `${r.age} yrs` : null, r.gender, r.dtype ? `Diabetes: ${r.dtype}` : null].filter(Boolean).join(' · ')}
            </div>
            {r.visitDate && (
              <div className="patient-visit-tag">
                Visit: {new Date(r.visitDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
            )}
          </div>
        </div>
        <div className="patient-summary-stats">
          <div className="ps-stat">
            <div className="ps-stat-val">{r.hba1c ? `${r.hba1c}%` : '—'}</div>
            <div className="ps-stat-label">HbA1c</div>
          </div>
          <div className="ps-stat">
            <div className="ps-stat-val">{r.gmi ? `${r.gmi}%` : '—'}</div>
            <div className="ps-stat-label">GMI</div>
          </div>
          <div className="ps-stat">
            <div className="ps-stat-val" style={{ color: r.tir >= 70 ? 'var(--green)' : r.tir >= 50 ? 'var(--yellow)' : 'var(--red)' }}>
              {r.tir}%
            </div>
            <div className="ps-stat-label">Time in Range</div>
          </div>
        </div>
      </div>

      {/* Clinical Cards */}
      <div className="clinical-cards-grid">
        <div className="clinical-card cc-phenotype clinical-card-anim">
          <div className="cc-label"><span className="cc-label-icon">🧬</span> Glycemic Phenotype</div>
          <div className="cc-value">{r.gpf}</div>
          <div className="cc-meaning">{r.gpfMeaning}</div>
          <div className="cc-badge"><span className={`metric-badge ${r.gpfBadge}`}>{r.gpf}</span></div>
        </div>

        <div className="clinical-card cc-gbi clinical-card-anim">
          <div className="cc-label"><span className="cc-label-icon">⚖️</span> Glycemic Burden Index</div>
          <div className="cc-gbi-score" style={{ color: getGBIColor(r.gbiBadge) }}>{r.gbi.toFixed(2)}</div>
          <div className="cc-meaning">{r.gbiMeaning}</div>
          <div className="cc-badge"><span className={`metric-badge ${r.gbiBadge}`}>{r.gbiLabel}</span></div>
        </div>

        <div className="clinical-card cc-gpm clinical-card-anim">
          <div className="cc-label"><span className="cc-label-icon">🧭</span> Glycemic Polarity Map</div>
          <div className="cc-gpm-grid">
            {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
              <div key={q} className={`cc-gpm-q cc-gpm-${q.toLowerCase()} ${r.gpmQ === q ? 'active' : ''}`}>{q}</div>
            ))}
          </div>
          <div className="cc-badge"><span className={`metric-badge ${r.gpmBadge}`}>{r.gpmLabel}</span></div>
        </div>

        <div className="clinical-card cc-rec clinical-card-anim">
          <div className="cc-label"><span className="cc-label-icon">💊</span> Consideration</div>
          <div className="cc-value">{r.rec.title}</div>
          <div className="cc-meaning">{r.rec.text}</div>
        </div>
      </div>

      {/* Triage Banner */}
      <div className={`triage-banner ${r.triage.cls} triage-anim`}>
        <div className="triage-icon">{r.triage.icon}</div>
        <div className="triage-content">
          <div className="triage-label">Final AI Triage Decision · GBI + GPM Engine · Powered by Vision AI</div>
          <div className="triage-decision">{r.triage.decision}</div>
          <div className="triage-explain">{r.triage.explanation}</div>
        </div>
      </div>

      {/* Longitudinal Card */}
      {r.prevReport && (
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-header">
            <div>
              <div className="card-title">📈 Longitudinal Comparison</div>
              <div className="card-subtitle">AI analysis against previous assessment</div>
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
              <div><strong>Previous Visit:</strong> {new Date(r.prevReport.timestamp).toLocaleDateString('en-IN')}</div>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Metric</th><th>Previous</th><th>Current</th><th>Change</th></tr></thead>
                <tbody>
                  <tr>
                    <td>TIR</td>
                    <td>{r.prevReport.tir}%</td>
                    <td>{r.tir}%</td>
                    <td>
                      {(r.tir - r.prevReport.tir) > 0 ? <span style={{color: 'var(--green)'}}>↑ +{(r.tir - r.prevReport.tir).toFixed(1)} pp</span> :
                       (r.tir - r.prevReport.tir) < 0 ? <span style={{color: 'var(--red)'}}>↓ {Math.abs(r.tir - r.prevReport.tir).toFixed(1)} pp</span> : 'Stable'}
                    </td>
                  </tr>
                  <tr>
                    <td>GBI</td>
                    <td>{r.prevReport.gbi.toFixed(2)}</td>
                    <td>{r.gbi.toFixed(2)}</td>
                    <td>
                      {(r.gbi - r.prevReport.gbi) > 0 ? <span style={{color: 'var(--red)'}}>↑ +{(r.gbi - r.prevReport.gbi).toFixed(2)}</span> :
                       (r.gbi - r.prevReport.gbi) < 0 ? <span style={{color: 'var(--green)'}}>↓ {Math.abs(r.gbi - r.prevReport.gbi).toFixed(2)}</span> : 'Stable'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <strong>AI Insight:</strong> Compared with the previous assessment, time in range {(r.tir - r.prevReport.tir) > 0 ? 'increased' : 'decreased'} while estimated glycemic burden {(r.gbi - r.prevReport.gbi) > 0 ? 'increased' : 'decreased'}.
            </div>
          </div>
        </div>
      )}

      {/* Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div className="reasoning-panel" style={{ margin: 0 }}>
          <div className="reasoning-title">🧠 Clinical Reasoning</div>
          <div className="reasoning-list">
            {r.reasoning.map((item, idx) => (
              <div key={idx} className="reasoning-item">
                <div className={`reasoning-dot ${item.dot}`}></div>
                <div>{item.text}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title">CGM Zone Distribution</div>
          <div className="chart-subtitle">Time spent in glycemic ranges</div>
          <DonutChart data={{ vh: r.vh, h: r.h, tir: r.tir, low: r.low, vl: r.vl }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          className="btn btn-teal btn-lg" 
          style={{ flex: 1 }} 
          onClick={() => approveReport(r)}
          disabled={r.status === 'Reviewed'}
        >
          {r.status === 'Reviewed' ? '✓ Approved' : '✓ Approve & Finalize'}
        </button>
      </div>
    </div>
  );
}
