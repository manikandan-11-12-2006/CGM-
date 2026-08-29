export const handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { imageBase64 } = JSON.parse(event.body);
    if (!imageBase64) {
      return { statusCode: 400, body: JSON.stringify({ error: 'imageBase64 is required' }) };
    }

    const VISION_API_KEY = process.env.VISION_API_KEY;
    const VISION_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
    const VISION_VISION_MODEL = 'qwen/qwen3.6-27b';

    const systemPrompt = `You are a medical data extraction AI specializing in CGM (Continuous Glucose Monitor) reports.
Your task is to extract specific glycemic metrics from a CGM report image (rendered from a PDF).

Extract EXACTLY these values and return ONLY valid JSON with no markdown, no explanation, no code fences:
{"name":null,"age":null,"diabetes_type":null,"vh":null,"h":null,"tir":null,"low":null,"vl":null,"avg":null,"gmi":null,"hba1c":null}

ZONE DEFINITIONS used in most CGM reports:
- Very High (VH): glucose > 250 mg/dL
- High (H): glucose 181-250 mg/dL
- Target/TIR: glucose 70-180 mg/dL (Time In Range)
- Low: glucose 54-69 mg/dL
- Very Low (VL): glucose < 54 mg/dL
- HbA1c: Look for "HbA1c" or "A1c" or "Hemoglobin A1c" (often not present on AGP reports, return null if not explicitly found).

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
      return { statusCode: response.status, body: JSON.stringify({ error: errBody }) };
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
      return { statusCode: 200, body: JSON.stringify(parsed) };
    } catch (e) {
      throw new Error("Failed to parse JSON: " + jsonText.slice(0, 200));
    }

  } catch (error) {
    console.error('Extraction error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
