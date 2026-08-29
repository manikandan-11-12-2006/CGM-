import React from 'react';
import { useCGM } from '../hooks/useCGM';

export default function Reports() {
  const { savedReports, clearReports } = useCGM();

  return (
    <div className="page active">
      <div className="page-inner">
        <div className="page-header">
          <div>
            <div className="page-title">Saved Clinical Reports</div>
            <div className="page-subtitle">History of all analyzed patient CGM profiles</div>
          </div>
          <div className="page-actions">
            {savedReports.length > 0 && (
              <button className="btn btn-danger btn-sm" onClick={() => {
                if(window.confirm('Clear all saved reports? This cannot be undone.')) {
                  clearReports();
                }
              }}>
                🗑️ Clear All
              </button>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            {!savedReports.length ? (
              <div className="empty-state">
                <div className="empty-icon">📂</div>
                <div className="empty-title">No Reports Saved</div>
                <div className="empty-text">Calculate and save assessments from the Dashboard.</div>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Date</th>
                      <th>Type</th>
                      <th>TIR</th>
                      <th>GBI</th>
                      <th>Phenotype</th>
                      <th>GPM</th>
                      <th>Triage Decision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedReports.map(r => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600 }}>{r.name}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>
                          {new Date(r.timestamp).toLocaleDateString('en-IN')}
                        </td>
                        <td><span className="table-chip badge-blue metric-badge">{r.dtype || '—'}</span></td>
                        <td style={{ fontWeight: 700, color: 'var(--green)', fontFamily: '"DM Mono", monospace' }}>
                          {r.tir}%
                        </td>
                        <td style={{ fontFamily: '"DM Mono", monospace', fontWeight: 700 }}>
                          {r.gbi.toFixed(2)}
                        </td>
                        <td><span className={`table-chip metric-badge ${r.gpfBadge}`}>{r.gpf}</span></td>
                        <td><span className={`table-chip metric-badge ${r.gpmBadge}`}>{r.gpmQ}</span></td>
                        <td style={{ fontSize: '11.5px' }}>{r.triage ? r.triage.decision : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
