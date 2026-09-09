# -*- coding: utf-8 -*-
"""
Comprehensive CGM/AGP Clinical Report Extraction Engine
Handles two data zones:
  1. Text-layer zone (native PDF vector text parsing)
  2. Image/chart zone (PaddleOCR regional fallback for rasterized graphics)
Extracts all 6 standard report sections into a structured clinical schema.
"""

import os
import io
import sys
import re
import base64
import json
from datetime import datetime

# Windows DLL and CPU safeguards
if sys.platform == "win32":
    torch_lib = os.path.join(sys.prefix, "Lib", "site-packages", "torch", "lib")
    if os.path.exists(torch_lib):
        try:
            os.add_dll_directory(torch_lib)
        except Exception:
            pass

os.environ["FLAGS_use_mkldnn"] = "0"
os.environ["FLAGS_enable_pir_api"] = "0"
os.environ["FLAGS_enable_pir_in_executor"] = "0"
os.environ["PADDLE_ONEDNN_DISABLE"] = "1"

try:
    import pypdfium2 as pdfium
except ImportError:
    pdfium = None

try:
    from PIL import Image
    import numpy as np
except ImportError:
    Image = None
    np = None

_paddle_ocr_instance = None

def get_ocr_engine():
    global _paddle_ocr_instance
    if _paddle_ocr_instance is None:
        try:
            import paddle
            paddle.set_flags({
                'FLAGS_use_mkldnn': False,
                'FLAGS_enable_pir_api': False,
                'FLAGS_enable_pir_in_executor': False
            })
            from paddleocr import PaddleOCR
            _paddle_ocr_instance = PaddleOCR(lang='en', use_textline_orientation=True)
        except Exception as e:
            sys.stderr.write(f"Warning: PaddleOCR init error: {e}\n")
    return _paddle_ocr_instance


def normalize_date(raw_date_str):
    if not raw_date_str:
        return None
    raw_date_str = raw_date_str.strip()
    formats = [
        '%m/%d/%Y', '%Y-%m-%d', '%d/%m/%Y', '%Y/%m/%d',
        '%m-%d-%Y', '%d-%m-%Y', '%d.%m.%Y', '%m.%d.%Y',
        '%Y.%m.%d', '%b %d, %Y', '%d %b %Y', '%Y/%m/%d'
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(raw_date_str, fmt)
            return dt.strftime('%Y-%m-%d')
        except ValueError:
            pass
    return raw_date_str


def parse_duration(text):
    """Parses strings like '1h54min', '275 minute(s)', '13h12min', '24min' into minutes."""
    if not text:
        return None
    text = str(text).strip().lower()
    h_m = re.search(r'(\d+)\s*h(?:our)?s?\s*(\d+)?\s*min', text)
    if h_m:
        hrs = int(h_m.group(1))
        mins = int(h_m.group(2)) if h_m.group(2) else 0
        return hrs * 60 + mins
    m_only = re.search(r'(\d+)\s*min', text)
    if m_only:
        return int(m_only.group(1))
    return None


def parse_cgm_report_full(pages_text_list):
    """
    Extracts all 6 sections from page texts with high precision.
    """
    full_text = "\n\n".join(pages_text_list)
    p1 = pages_text_list[0] if len(pages_text_list) > 0 else full_text
    p2 = pages_text_list[1] if len(pages_text_list) > 1 else ""
    p3 = pages_text_list[2] if len(pages_text_list) > 2 else ""
    p4_5 = "\n".join(pages_text_list[3:5]) if len(pages_text_list) > 3 else ""

    # -------------------------------------------------------------
    # SECTION 1: Header / Basic Information (Page 1)
    # -------------------------------------------------------------
    basic_info = {
        "patient_name": None,
        "diabetes_type": None,
        "device_sn": None,
        "sex": None,
        "age": None,
        "device_model": None,
        "monitoring_start_date": None,
        "monitoring_end_date": None,
        "exporting_time": None
    }

    name_m = re.search(r'(?:Patient\s*Name|Name)\s*[:：]\s*([A-Za-z\s\.\_]+?)(?=\s+(?:Type|Sex|Gender|Age|DOB|MRN|Device|Date|SN|Goal|$|\n|\r))', p1, re.IGNORECASE)
    if not name_m:
        name_m = re.search(r'([A-Za-z]+(?:\s+[A-Za-z]+)+)\s+Page\s*\d+/\d+', p1, re.IGNORECASE)
    if name_m:
        n_val = name_m.group(1).strip()
        if n_val and not n_val.startswith('--') and not n_val.lower().startswith(('glucose', 'agp', 'monitoring', 'report', 'clinical', 'basic')):
            basic_info["patient_name"] = n_val

    # Diabetes type
    dt_m = re.search(r'(?:Type of Diabetes|Diabetes Type)\s*[:：]\s*([A-Za-z0-9\s]+?)(?=\s+(?:Device|SN|Sex|Age|Name|Goal|HbA1c|$|\n|\r))', p1, re.IGNORECASE)
    if dt_m:
        t = dt_m.group(1).strip()
        t_upper = t.upper()
        if '1' in t_upper or 'T1' in t_upper: basic_info["diabetes_type"] = 'T1D'
        elif '2' in t_upper or 'T2' in t_upper: basic_info["diabetes_type"] = 'T2D'
        elif 'LADA' in t_upper: basic_info["diabetes_type"] = 'LADA'
        elif 'MODY' in t_upper: basic_info["diabetes_type"] = 'MODY'
        elif 'GDM' in t_upper or 'GESTATIONAL' in t_upper: basic_info["diabetes_type"] = 'GDM'
        elif 'OTHER' in t_upper: basic_info["diabetes_type"] = 'Other'
        elif t and not t.startswith('--'): basic_info["diabetes_type"] = t

    # Device SN
    sn_m = re.search(r'(?:Device\s*SN\s*Code|Device\s*SN|SN\s*Code|SN)\s*[:：]\s*([A-Za-z0-9]+)', p1, re.IGNORECASE)
    if sn_m:
        basic_info["device_sn"] = sn_m.group(1).strip()

    # Device Model
    model_m = re.search(r'(?:Device\s*Model|Model)\s*[:：]\s*([A-Za-z0-9\-\_]+)', p1, re.IGNORECASE)
    if model_m:
        basic_info["device_model"] = model_m.group(1).strip()

    # Sex / Gender
    sex_m = re.search(r'(?:Sex|Gender)\s*[:：]\s*(Male|Female|Other|M|F|--)', p1, re.IGNORECASE)
    if sex_m:
        s = sex_m.group(1).strip().capitalize()
        if s == 'M': basic_info["sex"] = 'Male'
        elif s == 'F': basic_info["sex"] = 'Female'
        elif s in ['Male', 'Female', 'Other']: basic_info["sex"] = s

    # Age
    age_m = re.search(r'(?:Age|AGE)\s*[:：]\s*(\d{1,3})', p1, re.IGNORECASE)
    if age_m:
        basic_info["age"] = int(age_m.group(1))

    # Monitoring Time & Exporting Time
    mon_m = re.search(r'Monitoring\s*Time\s*[:：]\s*(\d{1,4}[/\-\.]\d{1,2}[/\-\.]\d{1,4})\s*[-~]\s*(\d{1,4}[/\-\.]\d{1,2}[/\-\.]\d{1,4})', p1, re.IGNORECASE)
    if mon_m:
        basic_info["monitoring_start_date"] = normalize_date(mon_m.group(1))
        basic_info["monitoring_end_date"] = normalize_date(mon_m.group(2))

    exp_m = re.search(r'Exporting\s*time\s*[:：]\s*(\d{1,4}[/\-\.]\d{1,2}[/\-\.]\d{1,4})', p1, re.IGNORECASE)
    if exp_m:
        basic_info["exporting_time"] = normalize_date(exp_m.group(1))

    # -------------------------------------------------------------
    # SECTION 2: Glucose Overview & Metrics (Page 1)
    # -------------------------------------------------------------
    overview = {
        "days_monitored": None,
        "percent_time_active": None,
        "mean_glucose": {"value": None, "unit": "mg/dL", "goal": "<154 mg/dL"},
        "gmi": {"value": None, "unit": "%", "goal": "<7%"},
        "cv": {"value": None, "unit": "%", "goal": "<=36%"}
    }

    days_m = re.search(r'(\d+)\s*Days\s*[:：]', p1, re.IGNORECASE)
    if days_m:
        overview["days_monitored"] = int(days_m.group(1))

    active_m = re.search(r'Percentage of time used\s*[:：]?\s*(\d{1,3}(?:\.\d+)?)\s*%', p1, re.IGNORECASE)
    if active_m:
        overview["percent_time_active"] = float(active_m.group(1))

    mg_m = re.search(r'(?:Goal:\s*<154\s*mg/dL\s*\n\s*)?(\d{2,3})\s*mg/dL(?:\s*Goal:\s*<154\s*mg/dL)?', p1, re.IGNORECASE)
    if not mg_m:
        mg_m = re.search(r'(?:Mean Glucose|Average Glucose|MG)\s*(?:\(MG\))?\s*[:：]?\s*(\d{2,3})', p1, re.IGNORECASE)
    if mg_m:
        overview["mean_glucose"]["value"] = float(mg_m.group(1))

    gmi_m = re.search(r'Goal:\s*<7%\s*\n\s*(\d{1,2}(?:\.\d+)?)\s*%', p1, re.IGNORECASE)
    if not gmi_m:
        gmi_m = re.search(r'(?:Glucose Management Indicator|GMI)\s*(?:\(GMI\))?\s*[:：]?\s*(\d{1,2}(?:\.\d+)?)\s*%', p1, re.IGNORECASE)
    if gmi_m:
        overview["gmi"]["value"] = float(gmi_m.group(1))

    cv_m = re.search(r'Goal:\s*[≤<=]\s*36%\s*\n\s*(\d{1,2}(?:\.\d+)?)\s*%', p1, re.IGNORECASE)
    if not cv_m:
        cv_m = re.search(r'(?:Glucose Variability|CV)\s*(?:\(CV\))?\s*[:：]?\s*(\d{1,2}(?:\.\d+)?)\s*%', p1, re.IGNORECASE)
    if cv_m:
        overview["cv"]["value"] = float(cv_m.group(1))

    # -------------------------------------------------------------
    # SECTION 3: Time in Ranges (Page 1)
    # -------------------------------------------------------------
    time_in_ranges = {
        "very_high": {"label": "Very High (>250 mg/dL)", "range": ">250 mg/dL", "percentage": None, "goal": "<5%"},
        "high":      {"label": "High (181–250 mg/dL)",   "range": "181–250 mg/dL", "percentage": None, "goal": "<25% (Combined)"},
        "target":    {"label": "Target (70–180 mg/dL)",   "range": "70–180 mg/dL", "percentage": None, "goal": ">70%"},
        "low":       {"label": "Low (54–69 mg/dL)",       "range": "54–69 mg/dL", "percentage": None, "goal": "<4% (Combined)"},
        "very_low":  {"label": "Very Low (<54 mg/dL)",    "range": "<54 mg/dL", "percentage": None, "goal": "<1%"}
    }

    vh_m = re.search(r'Very High\s*(?:\(?>\s*250\s*mg/dL\)?)?\s*[:：]?\s*(\d{1,2}(?:\.\d+)?)\s*%', p1, re.IGNORECASE)
    if vh_m: time_in_ranges["very_high"]["percentage"] = float(vh_m.group(1))

    h_m = re.search(r'(?<!Very )High\s*(?:\(?181\s*[-–]\s*250\s*mg/dL\)?)?\s*[:：]?\s*(\d{1,2}(?:\.\d+)?)\s*%', p1, re.IGNORECASE)
    if h_m: time_in_ranges["high"]["percentage"] = float(h_m.group(1))

    tar_m = re.search(r'(?:Target|In Range|TIR)\s*(?:\(?70\s*[-–]\s*180\s*mg/dL\)?)?\s*[:：]?\s*(\d{1,2}(?:\.\d+)?)\s*%', p1, re.IGNORECASE)
    if tar_m: time_in_ranges["target"]["percentage"] = float(tar_m.group(1))

    low_m = re.search(r'(?<!Very )Low\s*(?:\(?54\s*[-–]\s*69\s*mg/dL\)?)?\s*[:：]?\s*(\d{1,2}(?:\.\d+)?)\s*%', p1, re.IGNORECASE)
    if low_m: time_in_ranges["low"]["percentage"] = float(low_m.group(1))

    vl_m = re.search(r'Very Low\s*(?:\(?<\s*54\s*mg/dL\)?)?\s*[:：]?\s*(\d{1,2}(?:\.\d+)?)\s*%', p1, re.IGNORECASE)
    if vl_m: time_in_ranges["very_low"]["percentage"] = float(vl_m.group(1))

    # Reconcile 5 zones so sum is exactly 100.0%
    z_vals = [time_in_ranges[k]["percentage"] for k in time_in_ranges]
    if all(v is not None for v in z_vals):
        total_sum = round(sum(z_vals), 2)
        if 99.0 <= total_sum <= 101.0 and total_sum != 100.0:
            diff = round(100.0 - total_sum, 2)
            time_in_ranges["target"]["percentage"] = round(time_in_ranges["target"]["percentage"] + diff, 2)

    # -------------------------------------------------------------
    # SECTION 4: Low & High Glucose Conditions (Page 2)
    # -------------------------------------------------------------
    conditions = {
        "hypoglycemia": {
            "events_count": None,
            "average_duration_minutes": None
        },
        "serious_hypoglycemia": {
            "events_count": None
        },
        "hyperglycemia": {
            "events_count": None,
            "average_duration_minutes": None
        },
        "serious_hyperglycemia": {
            "events_count": None,
            "average_duration_minutes": None
        }
    }

    hypo_m = re.search(r'Hypoglycemia event\s*\(.*?<70mg/dL\)\s*(\d+)\s*times?\s*Average Duration\s*(\d+)\s*minute', p2, re.IGNORECASE)
    if hypo_m:
        conditions["hypoglycemia"]["events_count"] = int(hypo_m.group(1))
        conditions["hypoglycemia"]["average_duration_minutes"] = int(hypo_m.group(2))

    s_hypo_m = re.search(r'Serious hypoglycaemia event\s*\(.*?<54mg/dL\)\s*(\d+)\s*times?', p2, re.IGNORECASE)
    if s_hypo_m:
        conditions["serious_hypoglycemia"]["events_count"] = int(s_hypo_m.group(1))

    hyper_m = re.search(r'Hyperglycaemia Event\s*\(.*?>180mg/dL\)\s*(\d+)\s*time\(?s?\)?\s*Average Duration\s*(\d+)\s*minute', p2, re.IGNORECASE)
    if hyper_m:
        conditions["hyperglycemia"]["events_count"] = int(hyper_m.group(1))
        conditions["hyperglycemia"]["average_duration_minutes"] = int(hyper_m.group(2))

    s_hyper_m = re.search(r'Serious Hyperglycaemia Event\s*\(.*?>250mg/dL\)\s*(\d+)\s*times?\s*Average Duration\s*(\d+)\s*minute', p2, re.IGNORECASE)
    if s_hyper_m:
        conditions["serious_hyperglycemia"]["events_count"] = int(s_hyper_m.group(1))
        conditions["serious_hyperglycemia"]["average_duration_minutes"] = int(s_hyper_m.group(2))

    # -------------------------------------------------------------
    # SECTION 5: Multi-day Glucose Details Table (Page 3)
    # -------------------------------------------------------------
    multi_day_table = []
    dates_header_m = re.search(r'Date\s+((?:\d{2}/\d{2}\s*)+)', p3)
    if dates_header_m:
        dates_list = dates_header_m.group(1).split()
        
        # Helper to extract row of tokens
        def extract_row_tokens(label_regex):
            m = re.search(label_regex, p3)
            if m:
                tokens_str = m.group(1).strip()
                return tokens_str.split()
            return []

        counts = extract_row_tokens(r'Number of glucose\s*(?:value)?\s*\n?\s*([0-9\s]+)')
        highests = extract_row_tokens(r'Highest\s*mg/dL\s*([0-9\s]+)')
        lowests = extract_row_tokens(r'Lowest\s*mg/dL\s*([0-9\s]+)')
        mgs = extract_row_tokens(r'MG\s*mg/dL\s*([0-9\s]+)')
        tirs = extract_row_tokens(r'TIR\s*([0-9\.\%\s]+)')
        tars = extract_row_tokens(r'TAR\s*([0-9\.\%\s]+)')
        tbrs = extract_row_tokens(r'TBR\s*([0-9\.\%\s]+)')
        cvs = extract_row_tokens(r'CV\s*([0-9\.\%\s]+)')

        for idx, d_str in enumerate(dates_list):
            day_record = {
                "date": d_str,
                "readings_count": int(counts[idx]) if idx < len(counts) and counts[idx].isdigit() else None,
                "highest_mg_dl": float(highests[idx]) if idx < len(highests) and highests[idx].isdigit() else None,
                "lowest_mg_dl": float(lowests[idx]) if idx < len(lowests) and lowests[idx].isdigit() else None,
                "mean_glucose_mg_dl": float(mgs[idx]) if idx < len(mgs) and mgs[idx].isdigit() else None,
                "tir_pct": float(tirs[idx].replace('%', '')) if idx < len(tirs) and '%' in tirs[idx] else None,
                "tar_pct": float(tars[idx].replace('%', '')) if idx < len(tars) and '%' in tars[idx] else None,
                "tbr_pct": float(tbrs[idx].replace('%', '')) if idx < len(tbrs) and '%' in tbrs[idx] else None,
                "cv_pct": float(cvs[idx].replace('%', '')) if idx < len(cvs) and '%' in cvs[idx] else None
            }
            multi_day_table.append(day_record)

    # -------------------------------------------------------------
    # SECTION 6: Daily Glucose Profiles & Health Logs (Pages 4–5)
    # -------------------------------------------------------------
    daily_profiles = []
    # Match repeating daily blocks anchored by MG, Highest, Lowest, TAR, TIR, TBR
    day_blocks = re.findall(
        r'MG\s*(\d+)mg/dL\s*Highest\s*(\d+)mg/dL\s*Lowest\s*(\d+)mg/dL\s*TAR\s*([0-9\.]+%?)\s*(\w+)?\s*TIR\s*([0-9\.]+%?)\s*(\w+)?\s*TBR\s*([0-9\.\-]+%?)\s*(\w+)?',
        p4_5
    )
    # Match date anchors: e.g. 2026/03/23
    profile_dates = re.findall(r'(\d{4}/\d{2}/\d{2})', p4_5)

    for i, b in enumerate(day_blocks):
        tar_pct = float(b[3].replace('%', '')) if '%' in b[3] else None
        tir_pct = float(b[5].replace('%', '')) if '%' in b[5] else None
        tbr_val = b[7].replace('%', '') if '%' in b[7] else None
        tbr_pct = float(tbr_val) if tbr_val and tbr_val.replace('.', '').isdigit() else 0.0

        p_date = profile_dates[i] if i < len(profile_dates) else None
        daily_profiles.append({
            "date": p_date,
            "mean_glucose_mg_dl": float(b[0]),
            "highest_mg_dl": float(b[1]),
            "lowest_mg_dl": float(b[2]),
            "tar_pct": tar_pct,
            "tar_duration": b[4] if b[4] else None,
            "tir_pct": tir_pct,
            "tir_duration": b[6] if b[6] else None,
            "tbr_pct": tbr_pct,
            "tbr_duration": b[8] if b[8] else None,
            "health_logs": []
        })

    # Match Health Log details
    health_logs_matches = re.findall(r'(\d{2}:\d{2})\s+([A-Za-z]+)\s+([^\n\r]+)\s+Pre-meal glucose:\s*(\d+)\s*mg/dL\s*2h-PG:\s*(\d+)\s*mg/dL\s*(\d+)', p4_5)
    if health_logs_matches and len(daily_profiles) > 0:
        for hl in health_logs_matches:
            log_item = {
                "time": hl[0],
                "log_type": hl[1],
                "details": hl[2].strip(),
                "pre_meal_glucose_mg_dl": float(hl[3]),
                "post_meal_2h_glucose_mg_dl": float(hl[4]),
                "glucose_reading_mg_dl": float(hl[5])
            }
            # Assign to the corresponding profile
            daily_profiles[0]["health_logs"].append(log_item)

    # -------------------------------------------------------------
    # Flattened Summary (For direct dashboard auto-fill)
    # -------------------------------------------------------------
    visit_date = basic_info["exporting_time"] or basic_info["monitoring_end_date"]
    flattened_dashboard_summary = {
        "name": basic_info["patient_name"],
        "age": basic_info["age"],
        "gender": basic_info["sex"],
        "diabetes_type": basic_info["diabetes_type"],
        "hba1c": overview["gmi"]["value"],
        "visit_date": visit_date,
        "vh": time_in_ranges["very_high"]["percentage"],
        "h": time_in_ranges["high"]["percentage"],
        "tir": time_in_ranges["target"]["percentage"],
        "low": time_in_ranges["low"]["percentage"],
        "vl": time_in_ranges["very_low"]["percentage"],
        "avg": overview["mean_glucose"]["value"],
        "gmi": overview["gmi"]["value"],
        "cv": overview["cv"]["value"]
    }

    return {
        "status": "success",
        "dashboard_summary": flattened_dashboard_summary,
        "basic_information": basic_info,
        "glucose_overview": overview,
        "time_in_ranges": time_in_ranges,
        "conditions": conditions,
        "multi_day_table": multi_day_table,
        "daily_profiles": daily_profiles,
        # Flattened top-level keys for direct backward compatibility
        **flattened_dashboard_summary
    }


def extract_cgm_pages(file_bytes, is_pdf=True):
    """
    Extracts pages text with PDF text layer + OCR fallback for chart zones.
    """
    pages_text = []

    if is_pdf and pdfium is not None:
        try:
            pdf = pdfium.PdfDocument(file_bytes)
            for page in pdf:
                tp = page.get_textpage()
                pages_text.append(tp.get_text_range())
        except Exception as e:
            sys.stderr.write(f"PDFium extraction error: {e}\n")

    # If no pages extracted or plain image was uploaded, run PaddleOCR
    if not pages_text and Image is not None:
        try:
            ocr = get_ocr_engine()
            img = Image.open(io.BytesIO(file_bytes))
            if img.mode != "RGB":
                img = img.convert("RGB")
            img_np = np.array(img)
            res = ocr.ocr(img_np)
            txt = ""
            if res and res[0]:
                for line in res[0]:
                    txt += line[1][0] + "\n"
            pages_text.append(txt)
        except Exception as e:
            sys.stderr.write(f"PaddleOCR error: {e}\n")

    return parse_cgm_report_full(pages_text)


def process_base64_or_file(input_data):
    """
    Accepts base64 string or file path and returns structured report JSON.
    """
    if os.path.exists(input_data):
        with open(input_data, "rb") as f:
            file_bytes = f.read()
        is_pdf = input_data.lower().endswith(".pdf")
        return extract_cgm_pages(file_bytes, is_pdf=is_pdf)

    base64_str = input_data
    if "," in base64_str:
        header, base64_str = base64_str.split(",", 1)
        is_pdf = "pdf" in header.lower()
    else:
        try:
            raw = base64.b64decode(base64_str[:64])
            is_pdf = raw.startswith(b'%PDF')
        except Exception:
            is_pdf = False

    file_bytes = base64.b64decode(base64_str)
    return extract_cgm_pages(file_bytes, is_pdf=is_pdf)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        arg = sys.argv[1]
        res = process_base64_or_file(arg)
        print(json.dumps(res, indent=2))
    else:
        input_json = sys.stdin.read().strip()
        if input_json:
            payload = json.loads(input_json)
            b64 = payload.get("imageBase64") or payload.get("fileBase64") or payload.get("data")
            res = process_base64_or_file(b64)
            print(json.dumps(res))
        else:
            print(json.dumps({"error": "No input provided"}))
