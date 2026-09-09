import React, { useState, useRef } from 'react';
import { useCGM } from '../../hooks/useCGM';
import { callOcrExtract } from '../../services/api';

export default function PdfUpload() {
  const { setPatient, setCgmData } = useCGM();
  const [isAiReading, setIsAiReading] = useState(false);
  const [aiStatus, setAiStatus] = useState(null); // { type, title, body, chips }
  const [progress, setProgress] = useState(0);
  const [stepText, setStepText] = useState('');
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp)$/i.test(file.name);

    if (!isPDF && !isImage) {
      alert('⚠️ Only PDF and image files are allowed.\n\nPlease upload a CGM report document.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsAiReading(true);
    setAiStatus({ 
      type: 'reading', 
      title: 'Processing Report', 
      body: 'Reading CGM report and extracting clinical metrics…', 
      chips: [] 
    });
    setProgress(20);
    setStepText('Rendering report canvas for optical character recognition…');

    try {
      const extractedData = await callOcrExtract(file, (prog, txt) => {
        setProgress(prog);
        setStepText(txt);
      });

      setProgress(90);
      setStepText('Parsing clinical metrics & zone distributions…');

      if (extractedData && extractedData.found > 0) {
        autoFill(extractedData);
        setProgress(100);
        setStepText('Done! All clinical values extracted successfully.');

        const chips = [];
        if (extractedData.name) chips.push('👤 ' + extractedData.name);
        if (extractedData.age !== null && extractedData.age !== undefined) chips.push('🎂 Age: ' + extractedData.age + ' yrs');
        if (extractedData.gender) chips.push('⚧ ' + extractedData.gender);
        if (extractedData.diabetes_type) chips.push('🩺 ' + extractedData.diabetes_type);
        if (extractedData.visit_date) chips.push('📅 ' + extractedData.visit_date);
        if (extractedData.vh !== null && extractedData.vh !== undefined) chips.push('VH: ' + extractedData.vh + '%');
        if (extractedData.h !== null && extractedData.h !== undefined) chips.push('H: ' + extractedData.h + '%');
        if (extractedData.tir !== null && extractedData.tir !== undefined) chips.push('TIR: ' + extractedData.tir + '%');
        if (extractedData.low !== null && extractedData.low !== undefined) chips.push('Low: ' + extractedData.low + '%');
        if (extractedData.vl !== null && extractedData.vl !== undefined) chips.push('VL: ' + extractedData.vl + '%');
        if (extractedData.avg !== null && extractedData.avg !== undefined) chips.push('MG: ' + extractedData.avg + ' mg/dL');
        if (extractedData.gmi !== null && extractedData.gmi !== undefined) chips.push('GMI: ' + extractedData.gmi + '%');
        if (extractedData.hba1c !== null && extractedData.hba1c !== undefined) chips.push('HbA1c: ' + extractedData.hba1c + '%');

        setAiStatus({
          type: 'success',
          title: `✨ Extracted ${extractedData.found} Values`,
          body: 'Document analysis complete. Verify values in the form below, modify if needed, then click Calculate Analysis.',
          chips
        });
        setTimeout(() => setIsAiReading(false), 800);
      } else {
        throw new Error('No CGM values could be extracted from the document. Please enter values manually.');
      }
    } catch (err) {
      console.error('Document read error:', err);
      setIsAiReading(false);
      setAiStatus({
        type: 'error',
        title: 'Document Extraction Failed',
        body: `Could not extract values: ${err.message || 'Unknown error'}. Please enter values manually below.`,
        chips: []
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const autoFill = (ex) => {
    setPatient(prev => ({
      ...prev,
      name: (ex.name != null && ex.name !== '') ? ex.name : prev.name,
      age: (ex.age != null && ex.age !== '') ? ex.age : prev.age,
      gender: (ex.gender != null && ex.gender !== '') ? ex.gender : prev.gender,
      type: (ex.diabetes_type != null && ex.diabetes_type !== '') ? mapDiabetesType(ex.diabetes_type) : prev.type,
      hba1c: (ex.hba1c != null && ex.hba1c !== '') ? ex.hba1c : ((ex.gmi != null && ex.gmi !== '') ? ex.gmi : prev.hba1c),
      visitDate: (ex.visit_date != null && ex.visit_date !== '') ? ex.visit_date : (ex.visitDate != null ? ex.visitDate : prev.visitDate)
    }));
    
    setCgmData(prev => ({
      ...prev,
      vh: (ex.vh != null && ex.vh !== '') ? ex.vh : prev.vh,
      h: (ex.h != null && ex.h !== '') ? ex.h : prev.h,
      tir: (ex.tir != null && ex.tir !== '') ? ex.tir : prev.tir,
      low: (ex.low != null && ex.low !== '') ? ex.low : prev.low,
      vl: (ex.vl != null && ex.vl !== '') ? ex.vl : prev.vl,
      avg: (ex.avg != null && ex.avg !== '') ? ex.avg : prev.avg,
      gmi: (ex.gmi != null && ex.gmi !== '') ? ex.gmi : prev.gmi,
    }));
  };

  const mapDiabetesType = (type) => {
    if (!type) return '';
    const typeMap = {
      'type 1':'T1D','type1':'T1D','t1d':'T1D','t1':'T1D',
      'type 2':'T2D','type2':'T2D','t2d':'T2D','t2':'T2D',
      'lada':'LADA','mody':'MODY','gdm':'GDM',
      'other':'Other','gestational':'GDM'
    };
    return typeMap[type.toLowerCase()] || type;
  };

  return (
    <div className="form-section">
      <div className="form-section-title">
        📄 Auto-Read CGM Report
        <span className="ai-badge-inline">✨ AI Extractor</span>
      </div>

      <div 
        className={`pdf-upload-zone ${isAiReading ? 'ai-reading' : ''}`}
        onClick={() => !isAiReading && fileInputRef.current?.click()}
      >
        {isAiReading && <div className="ai-reading-pulse"></div>}
        <div className="pdf-upload-icon">{isAiReading ? '🧠' : (aiStatus?.type === 'success' ? '✅' : '📂')}</div>
        <div className="pdf-upload-title">
          {isAiReading ? 'Reading CGM Report…' : (aiStatus?.type === 'success' ? 'Report Successfully Read' : 'Upload CGM Report (PDF / Image)')}
        </div>
        <div className="pdf-upload-sub">
          {isAiReading ? 'Extracting patient details, 5-zone CGM distribution, and glycemic metrics…' : (aiStatus?.type === 'success' ? 'Click to upload a different report' : 'Click or drag & drop · Auto-extracts patient details & glucose metrics')}
        </div>
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        accept=".pdf, .png, .jpg, .jpeg, .webp" 
        style={{ display: 'none' }} 
        onChange={handleFileUpload} 
      />

      {aiStatus && (
        <div className={`ai-status-card show ${aiStatus.type}`}>
          <div className="ai-status-header">
            <span className="ai-status-icon">{aiStatus.type === 'success' ? '✨' : (aiStatus.type === 'error' ? '❌' : '🧠')}</span>
            <span>{aiStatus.title}</span>
          </div>
          <div className="ai-status-body">{aiStatus.body}</div>
          {aiStatus.chips.length > 0 && (
            <div className="ai-extracted-chips">
              {aiStatus.chips.map((chip, idx) => (
                <span key={idx} className="ai-chip">{chip}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Overlay Modal */}
      {isAiReading && (
        <div className="ai-overlay show">
          <div className="ai-card">
            <div className="ai-brain">🧠</div>
            <div className="ai-card-title">Reading CGM Report</div>
            <div className="ai-card-sub">Extracting patient details, 5-zone CGM distribution, and glycemic metrics</div>
            <div className="ai-progress-track">
              <div className="ai-progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="ai-step-text">{stepText}</div>
          </div>
        </div>
      )}
    </div>
  );
}
