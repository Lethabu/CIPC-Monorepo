"""
Data models for CIPC Runner
"""

from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime


class FilingStatus(str, Enum):
    """Filing status enumeration"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class FilingRequest(BaseModel):
    """Request model for filing operations"""
    company_registration_number: str
    company_name: str
    financial_year_end: str
    contact_email: str
    contact_phone: str
    payment_reference: str


class FilingRecord(BaseModel):
    """Database record for filing operations"""
    id: str
    company_number: str
    company_name: str
    financial_year_end: str
    contact_email: str
    contact_phone: str
    payment_reference: str
    status: FilingStatus
    created_at: datetime
    updated_at: datetime
    result: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None


class FilingResult(BaseModel):
    """Result model for filing operations"""
    success: bool
    filing_reference: Optional[str] = None
    confirmation_number: Optional[str] = None
    submission_date: Optional[str] = None
    error_message: Optional[str] = None
    screenshots: Optional[list[str]] = None
    company_number: Optional[str] = None
    company_name: Optional[str] = None


class CompanyInfo(BaseModel):
    """Company information model"""
    registration_number: str
    name: str
    status: str
    incorporation_date: Optional[str] = None
    financial_year_end: Optional[str] = None
    director_details: Optional[list] = None


class PaymentInfo(BaseModel):
    """Payment information model"""
    reference: str
    amount: float
    currency: str = "ZAR"
    status: str
    paid_at: Optional[datetime] = None
    gateway_reference: Optional[str] = None
