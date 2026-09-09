// Netlify serverless function proxying to backend PaddleOCR extraction service
export const handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { imageBase64, fileBase64 } = JSON.parse(event.body);
    const data = imageBase64 || fileBase64;
    if (!data) {
      return { statusCode: 400, body: JSON.stringify({ error: 'imageBase64 is required' }) };
    }

    const OCR_BACKEND_URL = process.env.OCR_BACKEND_URL || 'http://127.0.0.1:3000/api/extract';

    const response = await fetch(OCR_BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: data })
    });

    if (!response.ok) {
      const errBody = await response.text();
      return { statusCode: response.status, body: JSON.stringify({ error: errBody }) };
    }

    const result = await response.json();
    return { statusCode: 200, body: JSON.stringify(result) };

  } catch (error) {
    console.error('Extraction error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
