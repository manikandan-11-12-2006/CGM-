const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use(express.static(path.join(__dirname, '..')));

const VISION_API_KEY = process.env.VISION_API_KEY;
const VISION_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const VISION_VISION_MODEL = 'qwen/qwen3.6-27b';

app.post('/api/extract', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const systemPrompt = `You are a medical data extraction AI specializing in CGM (Continuous Glucose Monitor) reports.
Your task is to extract specific glycemic metrics from a CGM report image (rendered from a PDF).

Extract EXACTLY these values and return ONLY valid JSON with no markdown, no explanation, no code fences:
{"name":null,"age":null,"diabetes_type":null,"vh":null,"h":null,"tir":null,"low":null,"vl":null,"avg":null,"gmi":null}

ZONE DEFINITIONS used in most CGM reports:
- Very High (VH): glucose > 250 mg/dL
- High (H): glucose 181-250 mg/dL
- Target/TIR: glucose 70-180 mg/dL (Time In Range)
- Low: glucose 54-69 mg/dL
- Very Low (VL): glucose < 54 mg/dL

Return ONLY the JSON object. No markdown fences. No extra text.`;

    const response = await fetch(VISION_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VISION_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: VISION_VISION_MODEL,
        max_tokens: 4096,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + imageBase64 } },
              { type: 'text', text: 'Extract all CGM glycemic metrics from this CGM report image and return them as a JSON object only. No extra text.' }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      return res.status(response.status).json({ error: errBody });
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || '';
    
    let jsonText = rawText.trim();
    
    // Remove <think> blocks even if unclosed
    jsonText = jsonText.replace(/<think>[\s\S]*?(<\/think>|$)/gi, '').trim();
    
    // Extract JSON block
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }
    
    // Strip markdown formatting if any
    jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    
    try {
      const parsed = JSON.parse(jsonText);
      res.json(parsed);
    } catch (e) {
      // If parsing still fails, return the cleaned string so we can debug
      throw new Error("Failed to parse JSON: " + jsonText.slice(0, 200));
    }

  } catch (error) {
    console.error('Extraction error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
