export function validateZonesTotal({ vh, h, tir, low, vl }) {
  const total = (Number(vh) || 0) + (Number(h) || 0) + (Number(tir) || 0) + (Number(low) || 0) + (Number(vl) || 0);
  return {
    total,
    isValid: Math.abs(total - 100) <= 0.51
  };
}

export function validateField(value, min, max) {
  const num = Number(value);
  if (isNaN(num)) return false;
  return num >= Number(min) && num <= Number(max);
}
