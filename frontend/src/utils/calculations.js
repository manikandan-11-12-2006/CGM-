export function computeMetrics({ name, age, gender, dtype, hba1c, vh, h, tir, low, vl, avg, gmi, visitDate, savedReports = [] }) {
  const hyper = vh + h;
  const hypo  = low + vl;

  const gbi = ((vh * 3) + (h * 1) + (low * 2) + (vl * 4)) / 100;
  let gbiLabel, gbiBadge, gbiMeaning;
  if      (gbi < 0.5) { gbiLabel='Low Risk';  gbiBadge='badge-green';  gbiMeaning='Glycemic burden is well controlled. Continue current management.'; }
  else if (gbi < 1.0) { gbiLabel='Moderate';  gbiBadge='badge-yellow'; gbiMeaning='Moderate glycemic burden. Monitor closely and consider adjustments.'; }
  else if (gbi < 2.0) { gbiLabel='High Risk'; gbiBadge='badge-orange'; gbiMeaning='High glycemic burden. Therapy review and intensification likely needed.'; }
  else                { gbiLabel='Critical';  gbiBadge='badge-red';    gbiMeaning='Critical burden. Immediate endocrinology review required.'; }

  let gpf, gpfBadge, gpfMeaning;
  if      (tir >= 70 && hypo < 4)  { gpf='Well Controlled';        gpfBadge='badge-green';  gpfMeaning='TIR at goal ≥70% with minimal hypoglycemia. Excellent control.'; }
  else if (hyper > 50)             { gpf='Hyperglycemia Dominant'; gpfBadge='badge-orange'; gpfMeaning='Majority of time spent above range. Therapy intensification needed.'; }
  else if (vh > 20)                { gpf='Severe Spike';           gpfBadge='badge-red';    gpfMeaning='Frequent severe spikes above 250 mg/dL. High complication risk.'; }
  else if (hypo > 10)              { gpf='Hypoglycemia Prone';     gpfBadge='badge-yellow'; gpfMeaning='Significant time below 70 mg/dL. De-intensification and safety review required.'; }
  else if (tir >= 50 && hyper < 40){ gpf='Near-Target';            gpfBadge='badge-blue';   gpfMeaning='Approaching glycemic targets. Continue optimization and lifestyle support.'; }
  else                             { gpf='Labile Mixed';           gpfBadge='badge-gray';   gpfMeaning='Mixed pattern with both hyper and hypoglycemia. Unstable glycemic control.'; }

  const gpmX = (vh * 2) + h;
  const gpmY = (vl * 3) + low;
  let gpmQ, gpmBadge, gpmLabel;
  if      (gpmX > 40 && gpmY <= 4) { gpmQ='Q1'; gpmBadge='badge-red';    gpmLabel='Q1 — Intensify Therapy'; }
  else if (gpmX > 40 && gpmY >  4) { gpmQ='Q2'; gpmBadge='badge-orange'; gpmLabel='Q2 — Restructure Regimen'; }
  else if (gpmX <= 40 && gpmY > 4) { gpmQ='Q3'; gpmBadge='badge-yellow'; gpmLabel='Q3 — De-Intensify'; }
  else                             { gpmQ='Q4'; gpmBadge='badge-green';  gpmLabel='Q4 — Maintain Plan'; }

  const triage    = computeTriage(gbi, gpmQ);
  const rec       = computeRecommendation(gbi, gpmQ);
  const reasoning = buildReasoning({ vh, h, tir, low, vl, hyper, hypo, hba1c, gmi, gbi, gpmQ });

  let prevReport = null;
  if (savedReports && savedReports.length > 0) {
    const patientReports = savedReports.filter(r => r.name.toLowerCase() === name.toLowerCase());
    if (patientReports.length > 0) {
      prevReport = patientReports[0];
    }
  }

  return {
    name, age, gender, dtype, hba1c, avg, gmi, visitDate,
    vh, h, tir, low, vl, hyper, hypo,
    gbi, gbiLabel, gbiBadge, gbiMeaning,
    gpf, gpfBadge, gpfMeaning,
    gpmQ, gpmBadge, gpmLabel,
    triage, rec, reasoning,
    prevReport,
    timestamp: new Date().toISOString(),
    status: 'AI Draft'
  };
}

export function computeTriage(gbi, gpmQ) {
  if (gbi > 2 && gpmQ === 'Q1') return { decision:'URGENT INTENSIFY THERAPY',      cls:'triage-urgent',      icon:'🚨', explanation:'Critically elevated glycemic burden (GBI > 2) with pure hyperglycemia. Immediate endocrinology review required. Intensify insulin or add GLP-1 RA / SGLT-2i urgently.' };
  if (gbi > 2 && gpmQ === 'Q2') return { decision:'CRITICAL REGIMEN RESTRUCTURE',  cls:'triage-critical',    icon:'⚡', explanation:'Critical burden with concurrent hyperglycemia and hypoglycemia. Urgent full medication review. Restructure regimen — review insulin type, meal timing, and CGM alert thresholds.' };
  if (gbi >= 1 && gbi <= 2 && gpmQ === 'Q1') return { decision:'MODERATE INTENSIFICATION', cls:'triage-moderate', icon:'⚠️', explanation:'Moderate-high glycemic burden with hyperglycemia predominance. Increase basal insulin or add second-line agent. Review carbohydrate intake and lifestyle factors.' };
  if (gpmQ === 'Q2') return { decision:'RESTRUCTURE REGIMEN',             cls:'triage-restructure', icon:'🔄', explanation:'Concurrent hyperglycemia and hypoglycemia detected. Restructure medication schedule, review prandial insulin timing, and consider CGM-guided dose titration.' };
  if (gpmQ === 'Q3') return { decision:'DE-INTENSIFY / REDUCE HYPO RISK', cls:'triage-deintensify', icon:'📉', explanation:'Significant hypoglycemia burden with controlled hyperglycemia. Reduce sulfonylurea or prandial insulin. Educate on nocturnal hypoglycemia, snack timing, and sick-day rules.' };
  if (gpmQ === 'Q4' && gbi < 1) return { decision:'MAINTAIN CURRENT PLAN',    cls:'triage-maintain',    icon:'✅', explanation:'Glycemic profile is well-balanced with low burden. Continue current regimen. Reinforce dietary adherence, physical activity. Schedule follow-up in 12–16 weeks.' };
  return { decision:'INTENSIFY THERAPY', cls:'triage-urgent', icon:'🔴', explanation:'Glycemic pattern indicates need for therapy intensification. Review medication plan, adherence, lifestyle, and CGM trends. Physician-guided escalation recommended.' };
}

export function computeRecommendation(gbi, gpmQ) {
  if (gbi > 2.0) return {
    title: 'Immediate Action Required',
    text: 'Immediate action required with recommendation. GBI is critically elevated — urgent physician-guided escalation is needed without delay.'
  };
  if (gbi >= 1 && gbi <= 2) return {
    title: 'Act Within 10 Days',
    text: 'Closely monitor and consider recommendation immediately within 10 days. Glycemic burden is high — timely intervention is essential to prevent complications.'
  };
  if (gbi > 0.5 && gbi < 1) return {
    title: 'Consider Recommendation in 4 Weeks',
    text: 'Consider recommendation if target is still not achieved in 4 weeks. Monitor CGM trends closely and reassess at the next scheduled visit.'
  };
  if (gpmQ === 'Q4' && gbi < 0.5) return {
    title: 'Maintain Current Plan',
    text: 'Glycemic profile is well balanced. Continue present regimen. Reinforce lifestyle and dietary adherence. Follow-up in 12–16 weeks.'
  };
  return {
    title: 'Consider Recommendation in 4 Weeks',
    text: 'Consider recommendation if target is still not achieved in 4 weeks. Monitor closely and reassess at next visit.'
  };
}

export function buildReasoning({ vh, h, tir, low, vl, hyper, hypo, hba1c, gmi, gbi, gpmQ }) {
  const items = [];
  if (hyper > 50)       items.push({ dot:'red',    text:`Severe hyperglycemia: ${hyper.toFixed(1)}% time above 180 mg/dL (VH: ${vh}%, H: ${h}%)` });
  else if (hyper > 25)  items.push({ dot:'orange', text:`Moderate hyperglycemia: ${hyper.toFixed(1)}% above range` });
  else                  items.push({ dot:'green',  text:`Hyperglycemia controlled: ${hyper.toFixed(1)}% above range` });

  if (tir >= 70)        items.push({ dot:'green',  text:`TIR at ADA goal: ${tir}% (target ≥70%)` });
  else if (tir >= 50)   items.push({ dot:'yellow', text:`TIR near target but below ADA goal: ${tir}% (goal ≥70%)` });
  else                  items.push({ dot:'red',    text:`TIR critically below target: ${tir}% — significant gap from ≥70% goal` });

  if (hypo > 10)        items.push({ dot:'red',    text:`Severe hypoglycemia risk: ${hypo.toFixed(1)}% below 70 mg/dL (VL: ${vl}%, L: ${low}%)` });
  else if (hypo > 4)    items.push({ dot:'yellow', text:`Borderline hypoglycemia: ${hypo.toFixed(1)}% — monitor closely` });
  else                  items.push({ dot:'green',  text:`Hypoglycemia safe: ${hypo.toFixed(1)}% below range` });

  if (gbi > 2)          items.push({ dot:'red',    text:`Critical GBI: ${gbi.toFixed(3)} — immediate action required` });
  else if (gbi > 1)     items.push({ dot:'orange', text:`High GBI: ${gbi.toFixed(3)} — therapy review needed` });
  else if (gbi > 0.5)   items.push({ dot:'yellow', text:`Moderate GBI: ${gbi.toFixed(3)} — monitor closely` });
  else                  items.push({ dot:'green',  text:`Low GBI: ${gbi.toFixed(3)} — excellent glycemic burden control` });

  if (!isNaN(hba1c) && !isNaN(gmi)) {
    const di = hba1c - gmi;
    if (Math.abs(di) > 1.5) items.push({ dot:'orange', text:`HbA1c–GMI discordance (DI ${di>=0?'+':''}${di.toFixed(2)}): ${di>0?'HbA1c may overestimate glycemia':'possible hidden hyperglycemia'}` });
    else                    items.push({ dot:'blue',   text:`HbA1c and GMI concordant (DI ${di>=0?'+':''}${di.toFixed(2)}) — lab values align with CGM` });
  }

  const qText = { Q1:'High hyper, low hypo → intensification needed', Q2:'Both hyper and hypo elevated → regimen restructure', Q3:'Controlled hyper, elevated hypo → de-intensification', Q4:'Both ranges controlled → stable management' };
  items.push({ dot:'blue', text:`GPM ${gpmQ}: ${qText[gpmQ]}` });
  return items;
}
