export function generatePDFTemplate(r, today, clinicProfile = {}) {
  const getStroke = (val, totalOffset, color) => {
    const dash = (val / 100) * 100;
    const gap = 100 - dash;
    const offset = 25 - (totalOffset / 100) * 100;
    return `<circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="${color}" stroke-width="6" stroke-dasharray="${dash} ${gap}" stroke-dashoffset="${offset}"></circle>`;
  };

  let donutSvg = '<svg width="120" height="120" viewBox="0 0 42 42" class="donut">';
  let offset = 0;
  // Order: Very Low (red), Low (yellow), Target (green), High (orange), Very High (red)
  const segments = [
    { v: r.vl, c: '#dc2626' },
    { v: r.low, c: '#eab308' },
    { v: r.tir, c: '#22c55e' },
    { v: r.h, c: '#f97316' },
    { v: r.vh, c: '#ef4444' }
  ];
  segments.forEach(s => {
    if (s.v > 0) {
      donutSvg += getStroke(s.v, offset, s.c);
      offset += s.v;
    }
  });
  donutSvg += `
    <circle cx="21" cy="21" r="11" fill="#fff"></circle>
    <text x="21" y="19" font-family="Arial" font-size="3.5" font-weight="bold" fill="#64748b" text-anchor="middle">TIR</text>
    <text x="21" y="24" font-family="Arial" font-size="5" font-weight="900" fill="#0f172a" text-anchor="middle">${r.tir}%</text>
    <text x="21" y="27" font-family="Arial" font-size="2.5" fill="#64748b" text-anchor="middle">Target Range</text>
  </svg>`;

  const speedAngle = (r.gbi / 3.0) * 180; // max 3.0
  const needleRot = -90 + (speedAngle > 180 ? 180 : speedAngle);

  return `
    <div style="font-family:'Segoe UI', Arial, sans-serif; color:#1e293b; background:#fff; width:740px; height:1040px; padding:20px; box-sizing:border-box; display:flex; flex-direction:column; overflow:hidden;">
      
      <!-- HEADER -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-shrink:0;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="background:#1a6fc4; width:44px; height:44px; border-radius:10px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:22px;">🩺</div>
          <div>
            <div style="font-size:20px; font-weight:800; color:#0b2545; letter-spacing:-0.5px;">NayaGlyco AI v3.0</div>
            <div style="font-size:11px; color:#475569; margin-top:2px;">CGM Clinical Decision Report</div>
            <div style="font-size:10px; color:#2563eb; font-weight:700; margin-top:2px;">Powered by Vision AI</div>
          </div>
        </div>
        <div style="font-size:10px; color:#334155;">
          <div style="display:grid; grid-template-columns:85px 120px; gap:4px; margin-bottom:2px;">
            <div style="color:#64748b; font-weight:600;"><span style="color:#3b82f6;">📅</span> Report Date</div>
            <div style="font-weight:600;">${today}</div>
          </div>
          <div style="display:grid; grid-template-columns:85px 120px; gap:4px; margin-bottom:2px;">
            <div style="color:#64748b; font-weight:600;"><span style="color:#3b82f6;">⏱️</span> Report ID</div>
            <div style="font-weight:600;">NGAI-${Date.now().toString().slice(-6)}</div>
          </div>
          <div style="display:grid; grid-template-columns:85px 120px; gap:4px;">
            <div style="color:#64748b; font-weight:600;"><span style="color:#3b82f6;">🔗</span> Data Source</div>
            <div style="font-weight:600;">CGM Analysis</div>
          </div>
        </div>
      </div>

      <!-- PATIENT INFO -->
      <div style="border:1px solid #cbd5e1; border-radius:10px; padding:12px; margin-bottom:12px; display:flex; gap:12px; flex-shrink:0;">
        <div style="background:#bfdbfe; width:56px; height:56px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#2563eb; font-size:28px;">👤</div>
        <div style="flex:1;">
          <div style="font-size:18px; font-weight:800; color:#0f172a; margin-bottom:6px;">${r.name || 'Anonymous Patient'}</div>
          <div style="display:grid; grid-template-columns:110px 1fr; gap:3px 12px; font-size:10px;">
            <div style="color:#64748b;"><span style="color:#3b82f6;">⚥</span> Age / Gender</div>
            <div style="font-weight:700; color:#0f172a;">${r.age||'—'} / ${r.gender||'—'}</div>
            
            <div style="color:#64748b;"><span style="color:#3b82f6;">🩸</span> Diabetes Type</div>
            <div style="font-weight:700; color:#0f172a;">${r.dtype||'—'}</div>
            
            <div style="color:#64748b;"><span style="color:#3b82f6;">📅</span> CGM Data Range</div>
            <div style="font-weight:700; color:#0f172a;">14 Days</div>
            
            <div style="color:#64748b;"><span style="color:#3b82f6;">🖥️</span> Device</div>
            <div style="font-weight:700; color:#0f172a;">CGM</div>
          </div>
        </div>
        <div style="display:flex; border-left:1px solid #e2eaf3; padding-left:12px; gap:20px; text-align:center; align-items:center;">
          <div>
            <div style="font-size:10px; font-weight:700; color:#0f172a;">HbA1c</div>
            <div style="font-size:22px; font-weight:800; color:#2563eb; margin:1px 0;">${r.hba1c ? r.hba1c+'%' : '—'}</div>
            <div style="font-size:9px; color:#64748b;">${(r.hba1c>7)?'Above Target':'In Target'}</div>
          </div>
          <div>
            <div style="font-size:10px; font-weight:700; color:#0f172a;">GMI</div>
            <div style="font-size:22px; font-weight:800; color:#2563eb; margin:1px 0;">${r.gmi ? r.gmi+'%' : '—'}</div>
            <div style="font-size:9px; color:#64748b;">Estimated</div>
          </div>
          <div>
            <div style="font-size:10px; font-weight:700; color:#0f172a;">TIR</div>
            <div style="font-size:22px; font-weight:800; color:#16a34a; margin:1px 0;">${r.tir}%</div>
            <div style="font-size:9px; color:#64748b;">Target: > 70%</div>
          </div>
        </div>
      </div>

      <!-- 3 CARDS -->
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:12px; flex-shrink:0;">
        <div style="border:1px solid #fca5a5; background:#fff5f5; border-radius:10px; padding:10px; position:relative; overflow:hidden;">
          <div style="font-size:8px; font-weight:800; color:#dc2626; text-transform:uppercase; margin-bottom:6px; display:flex; align-items:center; gap:4px;">
            📈 GLYCEMIC PHENOTYPE
          </div>
          <div style="font-size:14px; font-weight:800; color:#b91c1c; line-height:1.2; margin-bottom:6px;">${r.gpf}</div>
          <div style="font-size:9px; color:#475569; line-height:1.3;">${r.gpfMeaning}</div>
          <div style="position:absolute; right:-20px; bottom:-20px; width:60px; height:60px; background:#fecaca; border-radius:50%; opacity:0.3;"></div>
        </div>

        <div style="border:1px solid #fdba74; background:#fffcf2; border-radius:10px; padding:10px;">
          <div style="font-size:8px; font-weight:800; color:#d97706; text-transform:uppercase; margin-bottom:6px; display:flex; align-items:center; gap:4px;">
            🛡️ GLYCEMIC BURDEN INDEX (GBI)
          </div>
          <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:6px;">
            <div>
              <div style="font-size:22px; font-weight:800; color:#d97706; line-height:1;">${r.gbi.toFixed(2)}</div>
              <div style="background:#fed7aa; color:#9a3412; font-size:9px; font-weight:700; padding:2px 4px; border-radius:3px; display:inline-block; margin-top:3px;">${r.gbiLabel}</div>
            </div>
            <svg width="44" height="22" viewBox="0 0 100 50">
              <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e2e8f0" stroke-width="12" />
              <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#f59e0b" stroke-width="12" stroke-dasharray="125" stroke-dashoffset="${125 - (125 * (speedAngle/180))}" />
              <circle cx="50" cy="50" r="6" fill="#475569" />
              <g transform="rotate(${needleRot} 50 50)"><path d="M 48 50 L 50 15 L 52 50 Z" fill="#475569" /></g>
            </svg>
          </div>
          <div style="font-size:9px; color:#475569; line-height:1.3;">${r.gbiMeaning}</div>
        </div>

        <div style="border:1px solid #86efac; background:#f0fdf4; border-radius:10px; padding:10px;">
          <div style="font-size:8px; font-weight:800; color:#16a34a; text-transform:uppercase; margin-bottom:6px; display:flex; align-items:center; gap:4px;">
            🤖 FINAL AI TRIAGE DECISION
          </div>
          <div style="font-size:13px; font-weight:800; color:#15803d; line-height:1.2; margin-bottom:6px; text-transform:uppercase;">${r.triage.decision}</div>
          <div style="font-size:9px; color:#475569; line-height:1.3;">${r.triage.explanation}</div>
        </div>
      </div>

      <!-- TIR DISTRIBUTION -->
      <div style="border:1px solid #cbd5e1; border-radius:10px; padding:12px; margin-bottom:12px; flex-shrink:0;">
        <div style="font-size:9px; font-weight:800; color:#0f172a; text-transform:uppercase; margin-bottom:10px; display:flex; align-items:center; gap:6px;">
          📊 CGM TIME-IN-RANGE (TIR) DISTRIBUTION
        </div>
        <div style="display:flex; gap:16px; align-items:center;">
          <div>${donutSvg}</div>
          <div style="flex:1;">
            ${[['Very High','> 250 mg/dL',r.vh,'#dc2626'],['High','180 - 250 mg/dL',r.h,'#f97316'],['Target','70 - 180 mg/dL',r.tir,'#22c55e'],['Low','54 - 70 mg/dL',r.low,'#eab308'],['Very Low','< 54 mg/dL',r.vl,'#b91c1c']].map(x => `
              <div style="display:flex; align-items:center; font-size:10px; margin-bottom:4px;">
                <div style="width:8px; height:8px; border-radius:50%; background:${x[3]}; margin-right:6px;"></div>
                <div style="width:60px; color:#334155;">${x[0]}</div>
                <div style="width:90px; color:#64748b;">${x[1]}</div>
                <div style="font-weight:800; color:${x[3]}; font-size:12px;">${x[2]}%</div>
              </div>
            `).join('')}
          </div>
          <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:10px; width:180px;">
            <div style="font-size:8px; font-weight:800; color:#1e40af; margin-bottom:4px;">KEY TAKEAWAY</div>
            <div style="font-size:9px; color:#334155; line-height:1.4;">
              Only ${r.tir}% of time in target range.<br>
              High + Very High time is ${(r.h+r.vh).toFixed(1)}% (significantly elevated).
            </div>
            <svg width="100%" height="24" style="margin-top:6px;">
              <path d="M0 20 Q 10 10 20 15 T 40 10 T 60 5 T 80 10 T 100 0 L 100 24 L 0 24 Z" fill="#bfdbfe" opacity="0.5"/>
              <path d="M0 20 Q 10 10 20 15 T 40 10 T 60 5 T 80 10 T 100 0" fill="none" stroke="#2563eb" stroke-width="2"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- CLINICAL METRICS -->
      <div style="border:1px solid #cbd5e1; border-radius:10px; padding:10px 12px; margin-bottom:12px; flex-shrink:0;">
        <div style="font-size:9px; font-weight:800; color:#0f172a; text-transform:uppercase; margin-bottom:8px;">IMPORTANT CLINICAL METRICS</div>
        <div style="display:grid; grid-template-columns:repeat(5, 1fr); text-align:center;">
          <div style="border-right:1px solid #e2eaf3;">
            <div style="font-size:9px; color:#64748b; margin-bottom:2px;">💧 Average Glucose</div>
            <div style="font-size:18px; font-weight:800; color:#1e40af;">${r.avg || '—'} <span style="font-size:8px; color:#64748b; font-weight:600;">mg/dL</span></div>
          </div>
          <div style="border-right:1px solid #e2eaf3;">
            <div style="font-size:9px; color:#64748b; margin-bottom:2px;">📈 Standard Deviation</div>
            <div style="font-size:18px; font-weight:800; color:#6b21a8;">42 <span style="font-size:8px; color:#64748b; font-weight:600;">mg/dL</span></div>
          </div>
          <div style="border-right:1px solid #e2eaf3;">
            <div style="font-size:9px; color:#64748b; margin-bottom:2px;">⚖️ Coefficient of Variation</div>
            <div style="font-size:18px; font-weight:800; color:#0369a1;">21.3%</div>
          </div>
          <div style="border-right:1px solid #e2eaf3;">
            <div style="font-size:9px; color:#64748b; margin-bottom:2px;">☀️ Glycemic Variability</div>
            <div style="font-size:18px; font-weight:800; color:#be123c;">High</div>
          </div>
          <div>
            <div style="font-size:9px; color:#64748b; margin-bottom:2px;">🛡️ Sensor Usage</div>
            <div style="font-size:18px; font-weight:800; color:#15803d;">98%</div>
          </div>
        </div>
      </div>

      <!-- REASONING & REC -->
      <div style="display:grid; grid-template-columns:1fr 220px; gap:16px; flex:1;">
        <div>
          <div style="font-size:9px; font-weight:800; color:#0f172a; text-transform:uppercase; margin-bottom:8px;">CLINICAL REASONING</div>
          <div style="display:flex; flex-direction:column; gap:4px;">
            ${r.reasoning.map(item => `
              <div style="display:flex; gap:6px;">
                <div style="color:#16a34a; font-size:11px; margin-top:-2px;">✅</div>
                <div style="font-size:10px; color:#0f172a; line-height:1.3;">${item.text}</div>
              </div>
            `).join('')}
          </div>
        </div>
        <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:10px;">
          <div style="font-size:8px; font-weight:800; color:#1e40af; text-transform:uppercase; margin-bottom:6px; display:flex; align-items:center; gap:4px;">
            🗓️ CONSIDERATION OF RECOMMENDATION
          </div>
          <div style="font-size:14px; font-weight:800; color:#1e3a8a; margin-bottom:6px; line-height:1.1;">${r.rec.title}</div>
          <div style="font-size:10px; color:#334155; line-height:1.4;">${r.rec.text}</div>
        </div>
      </div>

      <!-- FOOTER -->
      <div style="display:grid; grid-template-columns:1fr 150px 160px; gap:12px; align-items:end; margin-top:12px; padding-top:8px; border-top:1px solid #cbd5e1; flex-shrink:0;">
        <div>
          <div style="font-size:9px; font-weight:800; color:#0f172a; text-transform:uppercase; margin-bottom:4px;">PHYSICIAN NOTES</div>
          <div style="border-bottom:1px solid #cbd5e1; height:18px;"></div>
          <div style="border-bottom:1px solid #cbd5e1; height:18px;"></div>
          <div style="border-bottom:1px solid #cbd5e1; height:18px;"></div>
        </div>
        <div style="text-align:center;">
          <div style="border-bottom:1px solid #cbd5e1; height:20px; margin-bottom:4px;"></div>
          <div style="font-size:9px; font-weight:700; color:#334155;">${clinicProfile.physicianName || "Doctor's Signature"}</div>
          <div style="font-size:9px; color:#64748b; margin-top:2px;">Date: ____ / ____ / _____</div>
        </div>
        <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:8px; display:flex; gap:6px; align-items:center;">
          <div style="font-size:18px; color:#3b82f6;">🩺</div>
          <div style="font-size:8px; color:#334155; line-height:1.3;">For clinical decisions, correlate with patient history and clinical judgment.</div>
        </div>
      </div>

      <div style="background:#0b2545; color:#fff; border-radius:6px; padding:8px 12px; display:flex; justify-content:space-between; align-items:center; margin-top:10px; flex-shrink:0;">
        <div>
          <div style="font-size:9px; font-weight:700; display:flex; align-items:center; gap:4px;">
            <span style="background:#fff; color:#0b2545; padding:2px; border-radius:3px; font-size:8px;">✔</span> AI-Powered Insights. Clinician-Led Decisions.
          </div>
          <div style="font-size:7.5px; color:#94a3b8; margin-top:2px;">This report is generated by NayaGlyco AI v3.0 and is intended to support, not replace, clinical judgment.</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:8px; font-weight:700;">© Vision AI 2026</div>
          <div style="font-size:7.5px; color:#94a3b8;">www.visionai.health</div>
        </div>
      </div>

    </div>
  `;
}
