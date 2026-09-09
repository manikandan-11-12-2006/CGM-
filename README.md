# NayaGlyco CGM Clinical Decision Dashboard & OCR Engine

A Continuous Glucose Monitoring (CGM) report analysis dashboard. It uses a **Dual-Zone OCR Engine** to automatically extract patient details, 5-zone CGM distributions, and glucose metrics directly from uploaded PDF and image reports.

---

## 🌟 Key Features

- **100% Offline & Private**: No external API keys (Grok/Groq API removed). All document processing happens locally.
- **Dual-Zone OCR Technology**:
  1. **Text-Layer Extraction**: Reads digital text streams, headers, dates, and tabular metrics.
  2. **Image/Chart-Layer OCR**: Reads numbers embedded inside visual charts (e.g., the 5 CGM distribution zones and Mean Glucose).
- **Automated Field Auto-Population**:
  - **Patient Details**: Name, Age, Gender, Diabetes Type (T1D, T2D, etc.), HbA1c %, Visit Date.
  - **5 CGM Distribution Zones**: Very High (>250 mg/dL), High (181–250 mg/dL), Target (70–180 mg/dL), Low (54–69 mg/dL), Very Low (<54 mg/dL) — strictly totaling **100%**.
  - **Glucose Metrics**: Average Glucose (mg/dL) and GMI %.
- **Multi-Format Support**: Upload `.pdf`, `.png`, `.jpg`, `.jpeg`, and `.webp` files.

---

## 📋 Prerequisites

Before running the application, make sure you have:
- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **Python**: Python 3.10 or 3.11 (Python 3.11 recommended) ([Download Python](https://www.python.org/))

---

## 🚀 Quick Start Guide (Run in 2 Minutes)

You can run the full application directly in your browser with **zero backend setup** required:

### Step 1: Clone the Repository
```bash
git clone https://github.com/manikandan-11-12-2006/CGM-.git
cd CGM-/CGM--main
```

### Step 2: Switch to Feature Branch
```bash
git checkout feature/ui-keerthi
```

### Step 3: Install Frontend Dependencies
```bash
cd frontend
npm install
```

### Step 4: Start the Application
```bash
npm run dev
```

### Step 5: Open in Browser
Open your web browser and navigate to:
```
http://localhost:5173
```

1. Drag & drop or click **Upload CGM Report (PDF / Image)**.
2. Select your CGM report (e.g. from `sample reports/`).
3. The in-browser OCR engine will read the document and automatically fill in:
   - Patient Name, Age, Gender, Diabetes Type, Visit Date
   - Very High, High, Target, Low, Very Low zones (100% total)
   - Average Glucose and GMI %
4. Click **Calculate Analysis** to generate the clinical decision report!

---

## 🧠 PaddleOCR-VL-1.6 Model & Backend Installation Guide

Follow these step-by-step instructions to set up **PaddleOCR-VL-1.6** and its dependencies in an isolated virtual environment.

### 1. Create a Virtual Environment

This is strongly recommended so PaddleOCR doesn't conflict with existing project dependencies.

**On Windows:**
```powershell
python -m venv .venv
.venv\Scripts\activate
```

**On Linux / Ubuntu / macOS:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

You should now see something similar to:
```
(.venv) D:\your-project>
```

---

### 2. Upgrade pip

```bash
python -m pip install --upgrade pip
```

---

### 3. Install PaddlePaddle (Version 3.2.1)

The installation command depends on whether you're using CPU or an NVIDIA GPU.

> ⚠️ **Note**: Do not install both CPU and GPU PaddlePaddle packages. Install only one.

#### Option A — CPU (Standard Setup)
If you don't have an NVIDIA GPU:
```bash
python -m pip install paddlepaddle==3.2.1 -i https://www.paddlepaddle.org.cn/packages/stable/cpu/
```

#### Option B — NVIDIA GPU (CUDA 12.6)
For an NVIDIA GPU with CUDA 12.6:
```bash
python -m pip install paddlepaddle-gpu==3.2.1 -i https://www.paddlepaddle.org.cn/packages/stable/cu126/
```

*(The official PaddleOCR-VL-1.6 setup specifically uses PaddlePaddle 3.2.1).*

---

### 4. Install PaddleOCR-VL & Document Parser

For PaddleOCR-VL, install the document parser dependencies:

```bash
python -m pip install -U "paddleocr[doc-parser]>=3.6.0"
pip install fastapi uvicorn pypdfium2 pillow numpy
```

---

### 5. Verify PaddlePaddle Installation

Run:
```bash
python -c "import paddle; print(paddle.__version__)"
```

You should see:
```
3.2.1
```

If you are using an NVIDIA GPU, verify GPU detection:
```bash
python -c "import paddle; print(paddle.device.get_device())"
```
- If GPU is active, you will see: `gpu:0`
- If it says `cpu`, Paddle is running in CPU mode.

---

### 6. Verify PaddleOCR Installation

Run:
```bash
python -c "import paddleocr; print('PaddleOCR installed successfully')"
```

If you see:
```
PaddleOCR installed successfully
```
the package is installed and ready to process CGM reports.

---

### 7. Start the Python OCR Server

From the `backend` directory:
```bash
python server.py
```
*(Runs on `http://127.0.0.1:3000`)*

---

## 📊 Extracted Target Fields

| Section | Field | Description / Format |
|---|---|---|
| **Patient Details** | `Patient Name` | Name extracted from document header |
| | `Age` | Patient age (in years) |
| | `Gender` | Male / Female / Other |
| | `Diabetes Type` | Normalized to T1D / T2D / LADA / MODY / GDM / Other |
| | `HbA1c %` | HbA1c percentage |
| | `Visit Date` | Formatted as `MM/DD/YYYY` (normalized to `YYYY-MM-DD`) |
| **CGM Zones (100% Total)** | `Very High (>250 mg/dL)` | Time spent above 250 mg/dL (%) |
| | `High (181–250 mg/dL)` | Time spent between 181–250 mg/dL (%) |
| | `Target (70–180 mg/dL)` | Time in Range (TIR) between 70–180 mg/dL (%) |
| | `Low (54–69 mg/dL)` | Time spent between 54–69 mg/dL (%) |
| | `Very Low (<54 mg/dL)` | Time spent below 54 mg/dL (%) |
| | **Zone Total** | **Strictly equals 100.0%** |
| **Glucose Metrics** | `Average Glucose` | Mean glucose level in mg/dL |
| | `GMI %` | Glucose Management Indicator (%) |

---

## 📁 Project Structure

```
CGM--main/
├── backend/
│   ├── cgm_ocr_engine.py       # Local Python PaddleOCR & report parser
│   ├── server.js               # Node.js backend runner
│   ├── server.py               # Standalone FastAPI Python server
│   └── package.json            # Backend Node configuration
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── cgm/PdfUpload.jsx       # Document upload & auto-fill component
│   │   │   ├── dashboard/PatientForm.jsx # Patient details form
│   │   │   └── dashboard/CGMZonesForm.jsx # 5-zone & metric inputs
│   │   ├── services/
│   │   │   ├── api.js          # In-browser OCR extraction service
│   │   │   └── pdfService.js   # Dual-zone PDF.js + Tesseract canvas OCR
│   │   └── App.jsx             # Main dashboard application
│   ├── package.json            # Frontend dependencies & scripts
│   └── vite.config.js          # Vite build configuration
├── sample reports/             # Sample CGM reports for testing
└── README.md                   # Project documentation & setup guide
```

---

## ❓ Frequently Asked Questions (FAQ)

#### Q1: Do I need an internet connection to run the OCR?
**No.** Both the in-browser OCR engine and the Python backend run 100% locally on your machine without making any external API calls.

#### Q2: What should I do if a report image is blurry?
Ensure the uploaded document or PDF has clear resolution. The dual-zone extractor renders PDF pages at high DPI (scale 2.5x) to ensure accurate recognition.

#### Q3: How do I build the frontend for production?
Run the following inside the `frontend` directory:
```bash
npm run build
```
The production bundle will be generated in `frontend/dist/`.

---

## 📄 License

Developed for CGM clinical decision support and glycemic intelligence.
