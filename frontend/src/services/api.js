import { extractTextFromPdfWithOcr, parseCgmDualZoneReport } from './pdfService';

/**
 * 100% Local In-Browser Dual-Zone OCR & Extraction Engine
 * Zero backend API dependency - processes text and chart graphics directly in the browser.
 */
export async function callOcrExtract(fileOrBase64, progressCallback) {
  let fileObj = null;
  let imageBase64 = '';

  if (fileOrBase64 instanceof File || fileOrBase64 instanceof Blob) {
    fileObj = fileOrBase64;
  } else if (typeof fileOrBase64 === 'string') {
    imageBase64 = fileOrBase64;
  }

  // Extract text and image-OCR zones directly in the browser
  const extractionResult = await extractTextFromPdfWithOcr(fileObj || imageBase64, progressCallback);
  const data = parseCgmDualZoneReport(extractionResult);

  if (!data) {
    throw new Error('Unable to extract data from document. Please verify the file.');
  }

  const safeNum = (v) => (v !== undefined && v !== null && v !== '' && !isNaN(parseFloat(v))) ? parseFloat(v) : null;

  const vh = safeNum(data.vh ?? data.dashboard_summary?.vh ?? data.time_in_ranges?.very_high?.percentage);
  const h = safeNum(data.h ?? data.dashboard_summary?.h ?? data.time_in_ranges?.high?.percentage);
  const tir = safeNum(data.tir ?? data.dashboard_summary?.tir ?? data.time_in_ranges?.target?.percentage);
  const low = safeNum(data.low ?? data.dashboard_summary?.low ?? data.time_in_ranges?.low?.percentage);
  const vl = safeNum(data.vl ?? data.dashboard_summary?.vl ?? data.time_in_ranges?.very_low?.percentage);
  const avg = safeNum(data.avg ?? data.dashboard_summary?.avg ?? data.glucose_overview?.mean_glucose?.value);
  const gmi = safeNum(data.gmi ?? data.dashboard_summary?.gmi ?? data.glucose_overview?.gmi?.value);
  const hba1c = safeNum(data.hba1c ?? data.dashboard_summary?.hba1c ?? data.glucose_overview?.gmi?.value);

  const result = {
    found: 0,
    name:          data.name ?? data.dashboard_summary?.name ?? data.basic_information?.patient_name ?? null,
    age:           safeNum(data.age ?? data.dashboard_summary?.age ?? data.basic_information?.age),
    gender:        data.gender ?? data.dashboard_summary?.gender ?? data.basic_information?.sex ?? null,
    diabetes_type: data.diabetes_type ?? data.dashboard_summary?.diabetes_type ?? data.basic_information?.diabetes_type ?? null,
    visit_date:    data.visit_date ?? data.visitDate ?? data.dashboard_summary?.visit_date ?? data.basic_information?.exporting_time ?? data.basic_information?.monitoring_end_date ?? null,
    vh,
    h,
    tir,
    low,
    vl,
    avg,
    gmi,
    hba1c,
    basic_information: data.basic_information,
    glucose_overview: data.glucose_overview,
    time_in_ranges: data.time_in_ranges
  };

  ['vh','h','tir','low','vl','avg','gmi','hba1c','age'].forEach(k => {
    if (result[k] !== null) result.found++;
  });
  if (result.name) result.found++;
  if (result.gender) result.found++;
  if (result.diabetes_type) result.found++;
  if (result.visit_date) result.found++;

  return result;
}

export const callVisionVision = callOcrExtract;
