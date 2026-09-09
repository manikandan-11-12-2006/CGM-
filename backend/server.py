# -*- coding: utf-8 -*-
"""
FastAPI Backend Server for CGM Dashboard with PaddleOCR Engine.
Can run directly with: python server.py or uvicorn server:app --port 3000
"""

import os
import io
import sys
import json
from fastapi import FastAPI, HTTPException, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from cgm_ocr_engine import process_base64_or_file

app = FastAPI(title="CGM PaddleOCR-VL-1.6 Extraction Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "engine": "PaddleOCR-VL-1.6", "mode": "local_offline"}

@app.post("/api/extract")
async def extract_cgm(payload: dict = Body(...)):
    try:
        input_data = payload.get("imageBase64") or payload.get("fileBase64") or payload.get("pdfBase64")
        if not input_data:
            raise HTTPException(status_code=400, detail="imageBase64 is required")
        
        result = process_base64_or_file(input_data)
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    print(f"Starting CGM PaddleOCR FastAPI server on http://127.0.0.1:{port}...")
    uvicorn.run("server:app", host="127.0.0.1", port=port, reload=False)
