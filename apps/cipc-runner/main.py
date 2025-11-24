#!/usr/bin/env python3
"""
CIPC Runner - Automated Annual Returns Filing Service
Main application entry point with FastAPI server and Temporal worker
"""

import asyncio
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, BackgroundTasks, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from loguru import logger
import time
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST

from cipc_automation.cipc_filer import CIPCFiler
from temporal_worker import start_temporal_worker
from models import FilingRequest, FilingStatus
from database import Database

# Configure logging
logger.add("logs/cipc_runner.log", rotation="10 MB", retention="1 week", level="INFO")

# Global database instance
db = Database()

# Prometheus metrics
REQUEST_COUNT = Counter('cipc_requests_total', 'Total requests', ['method', 'endpoint', 'status'])
REQUEST_LATENCY = Histogram('cipc_request_duration_seconds', 'Request duration', ['method', 'endpoint'])
FILINGS_ACTIVE = Gauge('cipc_filings_active', 'Number of active filings')
FILINGS_TOTAL = Counter('cipc_filings_total', 'Total filings', ['status'])

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting CIPC Runner service...")

    # Start Temporal worker in background
    worker_task = asyncio.create_task(start_temporal_worker())

    yield

    # Shutdown
    logger.info("Shutting down CIPC Runner service...")
    worker_task.cancel()
    try:
        await worker_task
    except asyncio.CancelledError:
        pass

# Create FastAPI app
app = FastAPI(
    title="CIPC Runner API",
    description="Automated CIPC Annual Returns filing service",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FilingRequestModel(BaseModel):
    """API model for filing requests"""
    company_registration_number: str
    company_name: str
    financial_year_end: str
    contact_email: str
    contact_phone: str
    payment_reference: str

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "CIPC Runner",
        "version": "1.0.0"
    }

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.post("/api/filing/start")
async def start_filing(request: FilingRequestModel, background_tasks: BackgroundTasks):
    """Start a new annual returns filing process"""

    try:
        # Create filing record
        filing_id = await db.create_filing_record(
            company_number=request.company_registration_number,
            company_name=request.company_name,
            financial_year_end=request.financial_year_end,
            contact_email=request.contact_email,
            contact_phone=request.contact_phone,
            payment_reference=request.payment_reference
        )

        # Start background filing process
        background_tasks.add_task(process_filing, filing_id, request.dict())

        return {
            "filing_id": filing_id,
            "status": "processing",
            "message": "Filing process started successfully"
        }

    except Exception as e:
        logger.error(f"Failed to start filing: {e}")
        raise HTTPException(status_code=500, detail="Failed to start filing process")

@app.get("/api/filing/{filing_id}/status")
async def get_filing_status(filing_id: str):
    """Get the status of a filing"""

    try:
        status = await db.get_filing_status(filing_id)
        if not status:
            raise HTTPException(status_code=404, detail="Filing not found")

        return status

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get filing status: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve filing status")

async def process_filing(filing_id: str, request_data: dict):
    """Background task to process the filing"""

    try:
        logger.info(f"Starting filing process for ID: {filing_id}")

        # Update status to processing
        await db.update_filing_status(filing_id, FilingStatus.PROCESSING)

        # Initialize CIPC filer
        filer = CIPCFiler()

        # Execute filing process
        result = await filer.file_annual_returns(
            company_number=request_data["company_registration_number"],
            company_name=request_data["company_name"],
            financial_year_end=request_data["financial_year_end"],
            contact_email=request_data["contact_email"],
            contact_phone=request_data["contact_phone"]
        )

        if result.success:
            await db.update_filing_status(filing_id, FilingStatus.COMPLETED, result.dict())
            logger.info(f"Filing completed successfully for ID: {filing_id}")
        else:
            await db.update_filing_status(filing_id, FilingStatus.FAILED, result.dict())
            logger.error(f"Filing failed for ID: {filing_id}: {result.error_message or 'Unknown error'}")

    except Exception as e:
        logger.error(f"Filing process failed for ID {filing_id}: {e}")
        await db.update_filing_status(filing_id, FilingStatus.FAILED, {"error": str(e)})

if __name__ == "__main__":
    # Create logs directory
    os.makedirs("logs", exist_ok=True)

    # Start server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=False,
        log_level="info"
    )
