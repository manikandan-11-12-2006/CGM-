import React from 'react';

const Badge = ({ children, type }) => {
  let bg = '#f8fafc', fg = '#475569', bd = '#e2eaf3';
  if (type === 'red') { bg = '#fef2f2'; fg = '#dc2626'; bd = '#fecaca'; }
  else if (type === 'orange') { bg = '#fff7ed'; fg = '#ea580c'; bd = '#fed7aa'; }
  else if (type === 'yellow') { bg = '#fefce8'; fg = '#ca8a04'; bd = '#fef08a'; }
  else if (type === 'green') { bg = '#f0fdf4'; fg = '#16a34a'; bd = '#bbf7d0'; }
  else if (type === 'blue') { bg = '#eff6ff'; fg = '#2563eb'; bd = '#bfdbfe'; }
  else if (type === 'cyan') { bg = '#ecfeff'; fg = '#0891b2'; bd = '#a5f3fc'; }

  return (
    <div style={{ backgroundColor: bg, color: fg, border: `1px solid ${bd}`, padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }}>
      {children}
    </div>
  );
};

const Row = ({ label, badgeText, badgeType, isLast }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: isLast ? 'none' : '1px solid #f1f5f9' }}>
    <div style={{ fontSize: '13px', color: '#475569' }}>{label}</div>
    <Badge type={badgeType}>{badgeText}</Badge>
  </div>
);

export default function Metrics() {
  return (
    <div className="page active" style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#0b2545', letterSpacing: '-0.5px' }}>Metric Definitions</div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Clinical reference for NayaGlyco AI Indices</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2eaf3' }}>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ⚖️ Glycemic Burden Index (GBI)
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', lineHeight: 1.5 }}>
                Weighted score reflecting severity of dangerous glucose time.
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2eaf3', borderRadius: '8px', padding: '12px', fontSize: '13px', fontFamily: 'monospace', color: '#334155', marginBottom: '16px' }}>
                GBI = ((VH×3) + (H×1) + (Low×2) + (VL×4)) / 100
              </div>
              <div>
                <Row label="< 0.5" badgeText="Low Risk" badgeType="green" />
                <Row label="0.5 - 1.0" badgeText="Moderate" badgeType="yellow" />
                <Row label="1.0 - 2.0" badgeText="High Risk" badgeType="orange" />
                <Row label="> 2.0" badgeText="Critical" badgeType="red" isLast />
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2eaf3' }}>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🗺️ Glycemic Polarity Map (GPM)
              </div>
              <div>
                <Row label="Q1: High Hyper, Low Hypo" badgeText="Intensify Therapy" badgeType="red" />
                <Row label="Q2: High Hyper + High Hypo" badgeText="Restructure Regimen" badgeType="orange" />
                <Row label="Q3: Low Hyper, High Hypo" badgeText="De-Intensify" badgeType="yellow" />
                <Row label="Q4: Low Hyper, Low Hypo" badgeText="Maintain Plan" badgeType="green" isLast />
              </div>
            </div>
          </div>

          <div>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2eaf3', height: '100%', boxSizing: 'border-box' }}>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🧬 Glycemic Phenotype (GPF)
              </div>
              <div>
                <Row label="TIR ≥70%, Hypo <1%" badgeText="Well Controlled" badgeType="green" />
                <Row label="Hyper >50%" badgeText="Hyperglycemia Dominant" badgeType="orange" />
                <Row label="VH >20%" badgeText="Severe Spike" badgeType="red" />
                <Row label="Hypo >10%" badgeText="Hypoglycemia Prone" badgeType="yellow" />
                <Row label="TIR 50-69%, Hyper <40%" badgeText="Near-Target" badgeType="blue" />
                <Row label="Otherwise" badgeText="Labile Mixed" badgeType="gray" isLast />
              </div>
            </div>
          </div>

        </div>

        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2eaf3' }}>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🧠 AI Triage Decision Engine — GBI + GPM Logic
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #e2eaf3', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>GBI RANGE</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #e2eaf3', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>GPM QUADRANT</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #e2eaf3', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI DECISION</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #e2eaf3', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>PRIORITY</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { r: '> 2', q: 'Q1', d: 'Urgent Intensity Therapy', b: 'Urgent', c: 'red' },
                  { r: '> 2', q: 'Q2', d: 'Critical Regimen Restructure', b: 'Critical', c: 'orange' },
                  { r: '1 - 2', q: 'Q1', d: 'Moderate Intensity', b: 'Moderate', c: 'yellow' },
                  { r: 'Any', q: 'Q2', d: 'Restructure Regimen', b: 'Restructure', c: 'blue' },
                  { r: 'Any', q: 'Q3', d: 'De-Intensify / Reduce Hypo Risk', b: 'De-Intensify', c: 'cyan' },
                  { r: '< 1', q: 'Q4', d: 'Maintain Current Plan', b: 'Maintain', c: 'green' },
                  { r: '—', q: '—', d: 'Intensify Therapy', b: 'Intensify', c: 'red' },
                ].map((row, i) => (
                  <tr key={i}>
                    <td style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', fontSize: '13px', color: '#475569', fontWeight: '600' }}>{row.r}</td>
                    <td style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', fontSize: '13px', color: '#475569', fontWeight: '600' }}>{row.q}</td>
                    <td style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', fontSize: '13px', color: '#475569' }}>{row.d}</td>
                    <td style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                      <Badge type={row.c}>{row.b}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
