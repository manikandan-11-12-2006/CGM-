const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function callVisionVision(imageBase64) {
  const response = await fetch(`${API_BASE_URL}/api/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64 })
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error('Backend API error: ' + response.status + ' ' + errBody);
  }

  const data = await response.json();
  const safeNum = (v) => (v !== undefined && v !== null && v !== '' && !isNaN(parseFloat(v))) ? parseFloat(v) : null;

  const result = {
    found: 0,
    name:          data.name || null,
    age:           data.age  || null,
    diabetes_type: data.diabetes_type || null,
    vh:  safeNum(data.vh),
    h:   safeNum(data.h),
    tir: safeNum(data.tir),
    low: safeNum(data.low),
    vl:  safeNum(data.vl),
    avg: safeNum(data.avg),
    gmi: safeNum(data.gmi),
    hba1c: safeNum(data.hba1c)
  };

  ['vh','h','tir','low','vl','avg','gmi','hba1c'].forEach(k => {
    if (result[k] !== null) result.found++;
  });
  if (result.name) result.found++;

  return result;
}
