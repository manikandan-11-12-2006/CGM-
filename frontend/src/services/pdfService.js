import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

// Configure worker explicitly for Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export async function extractTextFromPdfWithOcr(fileOrBuffer, progressCallback) {
  let arrayBuffer;
  if (fileOrBuffer instanceof ArrayBuffer) {
    arrayBuffer = fileOrBuffer;
  } else if (fileOrBuffer instanceof File || fileOrBuffer instanceof Blob) {
    arrayBuffer = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read PDF file'));
      reader.readAsArrayBuffer(fileOrBuffer);
    });
  } else if (typeof fileOrBuffer === 'string') {
    const base64Clean = fileOrBuffer.includes(',') ? fileOrBuffer.split(',')[1] : fileOrBuffer;
    const binaryStr = atob(base64Clean);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    arrayBuffer = bytes.buffer;
  }

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const pagesText = [];

  // Render Page 1 to high-resolution Canvas for image/chart zone OCR
  const page1 = await pdfDoc.getPage(1);
  const scale = 2.5;
  const viewport = page1.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page1.render({ canvasContext: ctx, viewport }).promise;

  if (progressCallback) progressCallback(50, 'Running in-browser OCR on report image…');

  // Run Tesseract OCR on rendered canvas
  let ocrPage1Text = '';
  try {
    const ocrResult = await Tesseract.recognize(canvas, 'eng');
    ocrPage1Text = ocrResult?.data?.text || '';
  } catch (ocrErr) {
    console.warn('Tesseract recognition warning:', ocrErr);
  }

  // Also get text layers from all pages
  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    pagesText.push(pageText);
  }

  // Combine OCR Page 1 text + native text layers
  return {
    ocrPage1Text,
    pagesText
  };
}

export function normalizeDate(rawDateStr) {
  if (!rawDateStr) return null;
  rawDateStr = rawDateStr.trim();
  
  const m1 = rawDateStr.match(/^(\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{4})$/);
  if (m1) {
    const [_, p1, p2, year] = m1;
    let month = parseInt(p1, 10);
    let day = parseInt(p2, 10);
    if (month > 12 && day <= 12) {
      const tmp = month;
      month = day;
      day = tmp;
    }
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  }

  const m2 = rawDateStr.match(/^(\d{4})[/\-\.](\d{1,2})[/\-\.](\d{1,2})$/);
  if (m2) {
    const [_, year, p1, p2] = m2;
    const mm = String(parseInt(p1, 10)).padStart(2, '0');
    const dd = String(parseInt(p2, 10)).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  }

  return rawDateStr;
}

export function parseCgmDualZoneReport(extractionResult) {
  const ocrText = extractionResult?.ocrPage1Text || '';
  const pages = extractionResult?.pagesText || (Array.isArray(extractionResult) ? extractionResult : [extractionResult]);
  const combinedP1 = (ocrText + '\n' + (pages[0] || '')).trim();
  const p2 = pages[1] || '';
  const p3 = pages[2] || '';
  const p4_5 = pages.slice(3, 5).join('\n') || '';

  // 1. Basic Information
  const basic_info = {
    patient_name: null,
    diabetes_type: null,
    device_sn: null,
    sex: null,
    age: null,
    device_model: null,
    monitoring_start_date: null,
    monitoring_end_date: null,
    exporting_time: null
  };

  const nameMatch = combinedP1.match(/Name:\s*([A-Za-z\s\.\_]+?)(?=\s+(?:Type|Sex|Gender|Age|DOB|MRN|Device|Date|SN|Goal|$|\n|\r))/i) ||
                    combinedP1.match(/([A-Za-z]+(?:\s+[A-Za-z]+)+)\s+Page\s*\d+\/\d+/i);
  if (nameMatch && nameMatch[1]) {
    const val = nameMatch[1].trim();
    if (!val.startsWith('--') && !/^(glucose|agp|monitoring|report|clinical|basic)/i.test(val)) {
      basic_info.patient_name = val;
    }
  }

  const dtMatch = combinedP1.match(/(?:Type of Diabetes|Diabetes Type)\s*[:：]\s*([A-Za-z0-9\s]+?)(?=\s+(?:Device|SN|Sex|Age|Name|Goal|HbA1c|$|\n|\r))/i);
  if (dtMatch && dtMatch[1]) {
    const t = dtMatch[1].trim().toUpperCase();
    if (t.includes('1') || t.includes('T1')) basic_info.diabetes_type = 'T1D';
    else if (t.includes('2') || t.includes('T2')) basic_info.diabetes_type = 'T2D';
    else if (t.includes('LADA')) basic_info.diabetes_type = 'LADA';
    else if (t.includes('MODY')) basic_info.diabetes_type = 'MODY';
    else if (t.includes('GDM') || t.includes('GESTATIONAL')) basic_info.diabetes_type = 'GDM';
    else if (t.includes('OTHER')) basic_info.diabetes_type = 'Other';
    else basic_info.diabetes_type = dtMatch[1].trim();
  }

  const snMatch = combinedP1.match(/(?:Device\s*SN\s*Code|Device\s*SN|SN\s*Code|SN)\s*[:：]\s*([A-Za-z0-9]+)/i);
  if (snMatch) basic_info.device_sn = snMatch[1].trim();

  const modelMatch = combinedP1.match(/(?:Device\s*Model|Model)\s*[:：]\s*([A-Za-z0-9\-\_]+)/i);
  if (modelMatch) basic_info.device_model = modelMatch[1].trim();

  const sexMatch = combinedP1.match(/(?:Sex|Gender)\s*[:：]\s*(Male|Female|Other|M|F|--)/i);
  if (sexMatch && sexMatch[1]) {
    let s = sexMatch[1].trim();
    if (/^m$/i.test(s)) basic_info.sex = 'Male';
    else if (/^f$/i.test(s)) basic_info.sex = 'Female';
    else if (['Male', 'Female', 'Other'].includes(s)) basic_info.sex = s;
  }

  const ageMatch = combinedP1.match(/(?:Age|AGE)\s*[:：]\s*(\d{1,3})/i);
  if (ageMatch && ageMatch[1]) {
    basic_info.age = parseInt(ageMatch[1], 10);
  }

  const monMatch = combinedP1.match(/Monitoring\s*Time\s*[:：]\s*(\d{1,4}[/\-\.]\d{1,2}[/\-\.]\d{1,4})\s*[-~]\s*(\d{1,4}[/\-\.]\d{1,2}[/\-\.]\d{1,4})/i);
  if (monMatch) {
    basic_info.monitoring_start_date = normalizeDate(monMatch[1]);
    basic_info.monitoring_end_date = normalizeDate(monMatch[2]);
  }

  const expMatch = combinedP1.match(/Exporting\s*time\s*[:：]?\s*(\d{1,4}[/\-\.]\d{1,2}[/\-\.]\d{1,4})/i);
  if (expMatch) basic_info.exporting_time = normalizeDate(expMatch[1]);

  // 2. Glucose Overview & Core Metrics
  const overview = {
    days_monitored: null,
    percent_time_active: null,
    mean_glucose: { value: null, unit: 'mg/dL', goal: '<154 mg/dL' },
    gmi: { value: null, unit: '%', goal: '<7%' },
    cv: { value: null, unit: '%', goal: '<=36%' }
  };

  const daysMatch = combinedP1.match(/(\d+)\s*Days\s*[:：]/i);
  if (daysMatch) overview.days_monitored = parseInt(daysMatch[1], 10);

  const activeMatch = combinedP1.match(/Percentage of time used\s*[:：]?\s*(\d{1,3}(?:\.\d+)?)\s*%/i);
  if (activeMatch) overview.percent_time_active = parseFloat(activeMatch[1]);

  // Mean Glucose (Average Glucose)
  const mgMatch = combinedP1.match(/Mean\s*Glucose[^\n\d]*(\d{2,3})/i) ||
                  combinedP1.match(/Goal:\s*<154\s*mg\/dL\s*(\d{2,3})\s*mg\/dL/i) ||
                  combinedP1.match(/Goal:\s*<154\s*mg\/dL[\s\S]{1,50}?(\d{2,3})\s*mg\/dL/i);
  if (mgMatch && mgMatch[1]) {
    overview.mean_glucose.value = parseFloat(mgMatch[1]);
  }

  // GMI
  const gmiMatch = combinedP1.match(/Glucose\s*Management\s*Indicator[^\n\d]*(\d{1,2}(?:\.\d+)?)/i) ||
                   combinedP1.match(/(?:Goal:\s*<7%|GMI)\s*(\d{1,2}(?:\.\d+)?)\s*%/i);
  if (gmiMatch && gmiMatch[1]) {
    overview.gmi.value = parseFloat(gmiMatch[1]);
  }

  // CV
  const cvMatch = combinedP1.match(/Glucose\s*Variability[^\n\d]*(\d{1,2}(?:\.\d+)?)/i) ||
                  combinedP1.match(/(?:Goal:\s*[≤<=]\s*36%|CV)\s*(\d{1,2}(?:\.\d+)?)\s*%/i);
  if (cvMatch && cvMatch[1]) {
    overview.cv.value = parseFloat(cvMatch[1]);
  }

  // 3. Time in Ranges (5 Zones)
  const time_in_ranges = {
    very_high: { label: 'Very High (>250 mg/dL)', range: '>250 mg/dL', percentage: null, goal: '<5%' },
    high:      { label: 'High (181–250 mg/dL)',   range: '181–250 mg/dL', percentage: null, goal: '<25% (Combined)' },
    target:    { label: 'Target (70–180 mg/dL)',   range: '70–180 mg/dL', percentage: null, goal: '>70%' },
    low:       { label: 'Low (54–69 mg/dL)',       range: '54–69 mg/dL', percentage: null, goal: '<4% (Combined)' },
    very_low:  { label: 'Very Low (<54 mg/dL)',    range: '<54 mg/dL', percentage: null, goal: '<1%' }
  };

  const vhMatch = combinedP1.match(/Very\s*High\s*(\d{1,2}(?:\.\d+)?)\s*%/i);
  if (vhMatch) time_in_ranges.very_high.percentage = parseFloat(vhMatch[1]);

  const hMatch = combinedP1.match(/(?<!Very\s*)High\s*(\d{1,2}(?:\.\d+)?)\s*%/i);
  if (hMatch) time_in_ranges.high.percentage = parseFloat(hMatch[1]);

  const tarMatch = combinedP1.match(/Target\s*(\d{1,2}(?:\.\d+)?)\s*%/i);
  if (tarMatch) time_in_ranges.target.percentage = parseFloat(tarMatch[1]);

  const lowMatch = combinedP1.match(/(?<!Very\s*)Low\s*(\d{1,2}(?:\.\d+)?)\s*%/i);
  if (lowMatch) time_in_ranges.low.percentage = parseFloat(lowMatch[1]);

  const vlMatch = combinedP1.match(/Very\s*Low\s*(\d{1,2}(?:\.\d+)?)\s*%/i);
  if (vlMatch) time_in_ranges.very_low.percentage = parseFloat(vlMatch[1]);

  // Ensure 5 zones total strictly 100.0%
  const zVals = Object.values(time_in_ranges).map(z => z.percentage);
  if (zVals.every(v => v !== null && v !== undefined)) {
    const sum = +(zVals.reduce((a, b) => a + b, 0)).toFixed(2);
    if (sum >= 99.0 && sum <= 101.0 && sum !== 100.0) {
      const diff = +(100.0 - sum).toFixed(2);
      time_in_ranges.target.percentage = +(time_in_ranges.target.percentage + diff).toFixed(2);
    }
  }

  // Dashboard Summary
  const visit_date = basic_info.exporting_time || basic_info.monitoring_end_date;
  const summary = {
    name: basic_info.patient_name,
    age: basic_info.age,
    gender: basic_info.sex,
    diabetes_type: basic_info.diabetes_type,
    hba1c: overview.gmi.value,
    visit_date: visit_date,
    vh: time_in_ranges.very_high.percentage,
    h: time_in_ranges.high.percentage,
    tir: time_in_ranges.target.percentage,
    low: time_in_ranges.low.percentage,
    vl: time_in_ranges.very_low.percentage,
    avg: overview.mean_glucose.value,
    gmi: overview.gmi.value,
    cv: overview.cv.value
  };

  return {
    status: 'success',
    dashboard_summary: summary,
    basic_information: basic_info,
    glucose_overview: overview,
    time_in_ranges: time_in_ranges,
    ...summary
  };
}

export const parseCgmReportFull = parseCgmDualZoneReport;
export const parseCgmText = parseCgmDualZoneReport;
