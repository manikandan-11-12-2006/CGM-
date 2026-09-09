const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '100mb' }));

app.use(express.static(path.join(__dirname, '..')));

// Locate Python executable with PaddleOCR / pypdfium2
function getPythonPath() {
  const candidates = [
    process.env.PYTHON_PATH,
    'D:\\project\\plotchoice\\OCR\\.venv\\Scripts\\python.exe',
    path.join(__dirname, '.venv', 'Scripts', 'python.exe'),
    path.join(__dirname, '..', '.venv', 'Scripts', 'python.exe'),
    path.join(__dirname, '..', 'ocr', '.venv', 'Scripts', 'python.exe'),
    'python',
    'python3'
  ];

  for (const p of candidates) {
    if (p && (fs.existsSync(p) || p === 'python' || p === 'python3')) {
      return p;
    }
  }
  return 'python';
}

app.post('/api/extract', async (req, res) => {
  try {
    const { imageBase64, fileBase64, pdfBase64 } = req.body;
    const inputData = imageBase64 || fileBase64 || pdfBase64;
    
    if (!inputData) {
      return res.status(400).json({ error: 'imageBase64 or fileBase64 is required' });
    }

    const pythonExe = getPythonPath();
    const scriptPath = path.join(__dirname, 'cgm_ocr_engine.py');

    const pyProcess = spawn(pythonExe, [scriptPath], {
      windowsHide: true
    });

    let stdoutData = '';
    let stderrData = '';

    pyProcess.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    pyProcess.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    pyProcess.on('error', (err) => {
      console.error('Failed to spawn Python OCR process:', err);
      res.status(500).json({ error: 'Failed to start OCR engine: ' + err.message });
    });

    pyProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python OCR process exited with code ${code}. Stderr: ${stderrData}`);
        return res.status(500).json({ 
          error: `OCR engine error (code ${code}): ${stderrData || stdoutData || 'Unknown error'}` 
        });
      }

      try {
        const trimmed = stdoutData.trim();
        // Parse JSON from output
        const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No valid JSON output received from OCR engine: ' + trimmed);
        }
        const parsed = JSON.parse(jsonMatch[0]);
        res.json(parsed);
      } catch (parseErr) {
        console.error('Failed to parse OCR engine output:', parseErr, 'Raw output:', stdoutData);
        res.status(500).json({ error: 'Failed to parse extracted data: ' + parseErr.message });
      }
    });

    // Send payload to Python process stdin
    pyProcess.stdin.write(JSON.stringify({ imageBase64: inputData }));
    pyProcess.stdin.end();

  } catch (error) {
    console.error('Extraction handler error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running with PaddleOCR-VL-1.6 Engine on http://127.0.0.1:${PORT}`);
});
