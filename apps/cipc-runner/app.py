#!/usr/bin/env python3

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import os

app = FastAPI(title="CIPC Runner API", version="1.0.0")

class FilingRequest(BaseModel):
    company_registration_number: str
    company_name: str
    financial_year_end: str
    contact_email: str
    contact_phone: str
    payment_reference: str

@app.get("/")
def root():
    return {"message": "CIPC Runner API", "status": "running"}

@app.get("/health")
def health():
    return {"status": "healthy", "service": "CIPC Runner"}

@app.post("/api/filing/start")
def start_filing(request: FilingRequest):
    return {
        "filing_id": f"filing_{request.payment_reference}",
        "status": "processing",
        "message": "Filing process started successfully"
    }

@app.get("/api/filing/{filing_id}/status")
def get_filing_status(filing_id: str):
    return {
        "filing_id": filing_id,
        "status": "completed",
        "message": "Filing completed successfully"
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)