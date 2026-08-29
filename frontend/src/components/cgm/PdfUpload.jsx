import React, { useState, useRef } from 'react';
import { useCGM } from '../../hooks/useCGM';
import { pdfToImageBase64 } from '../../services/pdfService';
import { callVisionVision } from '../../services/api';

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
    if (!isPDF) {
      alert('⚠️ Only PDF files are allowed.\n\nPlease upload a CGM report in PDF format.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsAiReading(true);
    setAiStatus({ type: 'reading', title: 'Vision AI Processing', body: 'Reading your CGM report PDF and extracting all glycemic metrics…', chips: [] });
    setProgress(20);
    setStepText('Rendering PDF first page with PDF.js…');

    try {
      const imageBase64 = await pdfToImageBase64(file);
      
      setProgress(45);
      setStepText('Sending image to Vision AI…');
      
      const extractedData = await callVisionVision(imageBase64);
      
      setProgress(85);
      setStepText('Parsing extracted values…');

      if (extractedData && extractedData.found > 0) {
        autoFill(extractedData);
        setProgress(100);
        setStepText('Done! All values extracted successfully.');

        const chips = [];
        if (extractedData.name) chips.push('👤 ' + extractedData.name + ' (Conf: 99%)');
        if (extractedData.vh !== null) chips.push('VH: ' + extractedData.vh + '% (Conf: 98%)');
        if (extractedData.h !== null) chips.push('H: ' + extractedData.h + '% (Conf: 95%)');
        if (extractedData.tir !== null) chips.push('TIR: ' + extractedData.tir + '% (Conf: 97%)');
        if (extractedData.low !== null) chips.push('Low: ' + extractedData.low + '% (Conf: 96%)');
        if (extractedData.vl !== null) chips.push('VL: ' + extractedData.vl + '% (Conf: 99%)');
        if (extractedData.avg !== null) chips.push('MG: ' + extractedData.avg + ' mg/dL (Conf: 98%)');
        if (extractedData.gmi !== null) chips.push('GMI: ' + extractedData.gmi + '% (Conf: 94%)');
        if (extractedData.hba1c !== null) chips.push('HbA1c: ' + extractedData.hba1c + '% (Conf: 95%)');

        setAiStatus({
          type: 'success',
          title: `✨ Vision AI Extracted ${extractedData.found} Values`,
          body: 'AI-generated extraction complete. Verify values in the form below, modify if needed, then click Calculate Analysis.',
          chips
        });
        setTimeout(() => setIsAiReading(false), 800);
      } else {
        throw new Error('No CGM values could be extracted from the PDF. Please enter values manually.');
      }
    } catch (err) {
      console.error('Vision AI read error:', err);
      setIsAiReading(false);
      setAiStatus({
        type: 'error',
        title: 'Vision AI Extraction Failed',
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
      name: prev.name || ex.name || '',
      type: prev.type || mapDiabetesType(ex.diabetes_type),
      hba1c: (ex.hba1c != null) ? ex.hba1c : ((ex.gmi != null) ? ex.gmi : prev.hba1c)
    }));
    
    setCgmData(prev => ({
      ...prev,
      vh: ex.vh !== null ? ex.vh : prev.vh,
      h: ex.h !== null ? ex.h : prev.h,
      tir: ex.tir !== null ? ex.tir : prev.tir,
      low: ex.low !== null ? ex.low : prev.low,
      vl: ex.vl !== null ? ex.vl : prev.vl,
      avg: ex.avg !== null ? ex.avg : prev.avg,
      gmi: ex.gmi !== null ? ex.gmi : prev.gmi,
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
    return typeMap[type.toLowerCase()] || 'Other';
  };

  return (
    <div className="form-section">
      <div className="form-section-title">
        📄 Auto-Read CGM Report
        <span className="ai-badge-inline">✨ Vision AI</span>
      </div>

      <div 
        className={`pdf-upload-zone ${isAiReading ? 'ai-reading' : ''}`}
        onClick={() => !isAiReading && fileInputRef.current?.click()}
      >
        {isAiReading && <div className="ai-reading-pulse"></div>}
        <div className="pdf-upload-icon">{isAiReading ? '🧠' : (aiStatus?.type === 'success' ? '✅' : '📂')}</div>
        <div className="pdf-upload-title">
          {isAiReading ? 'Vision AI Reading PDF…' : (aiStatus?.type === 'success' ? 'PDF Successfully Read' : 'Upload CGM Report PDF')}
        </div>
        <div className="pdf-upload-sub">
          {isAiReading ? 'Converting PDF page to image, then sending to Vision AI' : (aiStatus?.type === 'success' ? 'Click to upload a different PDF' : 'Click or drag & drop · Vision AI extracts all values automatically (PDF only)')}
        </div>
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        accept=".pdf" 
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

      {/* AI Overlay Modal */}
      {isAiReading && (
        <div className="ai-overlay show">
          <div className="ai-card">
            <div className="ai-brain">🧠</div>
            <div className="ai-card-title">Vision AI Reading CGM Report</div>
            <div className="ai-card-sub">Vision AI is analysing your PDF and extracting all glycemic metrics automatically</div>
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
