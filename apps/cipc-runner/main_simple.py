#!/usr/bin/env python3
"""
Minimal CIPC Runner for Railway deployment
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(
    title="CIPC Runner API",
    description="Automated CIPC Annual Returns filing service",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "CIPC Runner",
        "version": "1.0.0"
    }

@app.get("/")
async def root():
    return {
        "message": "CIPC Runner API",
        "status": "running",
        "endpoints": ["/health", "/docs", "/api/filing/start"]
    }

@app.get("/api/filing/health")
async def filing_health():
    return {
        "status": "ready",
        "service": "Filing API"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main_simple:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=False,
        log_level="info"
    )