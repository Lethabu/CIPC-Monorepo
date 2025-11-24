"""
Database operations for CIPC Runner
Using SQLite for simplicity in containerized environment
"""

import sqlite3
import json
from datetime import datetime
from typing import Optional, Dict, Any
from contextlib import contextmanager
import os
from models import FilingStatus, FilingRecord


class Database:
    """SQLite database wrapper for filing operations"""

    def __init__(self, db_path: str = "cipc_runner.db"):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        """Initialize database tables"""
        with self._get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS filings (
                    id TEXT PRIMARY KEY,
                    company_number TEXT NOT NULL,
                    company_name TEXT NOT NULL,
                    financial_year_end TEXT NOT NULL,
                    contact_email TEXT NOT NULL,
                    contact_phone TEXT NOT NULL,
                    payment_reference TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'pending',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    result TEXT,
                    error_message TEXT
                )
            """)
            conn.commit()

    @contextmanager
    def _get_connection(self):
        """Get database connection with proper cleanup"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()

    async def create_filing_record(
        self,
        company_number: str,
        company_name: str,
        financial_year_end: str,
        contact_email: str,
        contact_phone: str,
        payment_reference: str
    ) -> str:
        """Create a new filing record and return the ID"""

        filing_id = f"filing_{int(datetime.now().timestamp())}_{company_number.replace('/', '_')}"

        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO filings (
                    id, company_number, company_name, financial_year_end,
                    contact_email, contact_phone, payment_reference,
                    status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                filing_id, company_number, company_name, financial_year_end,
                contact_email, contact_phone, payment_reference,
                FilingStatus.PENDING.value,
                datetime.now().isoformat(),
                datetime.now().isoformat()
            ))
            conn.commit()

        return filing_id

    async def update_filing_status(
        self,
        filing_id: str,
        status: FilingStatus,
        result: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None
    ):
        """Update filing status and result"""

        with self._get_connection() as conn:
            conn.execute("""
                UPDATE filings
                SET status = ?, updated_at = ?, result = ?, error_message = ?
                WHERE id = ?
            """, (
                status.value,
                datetime.now().isoformat(),
                json.dumps(result) if result else None,
                error_message,
                filing_id
            ))
            conn.commit()

    async def get_filing_status(self, filing_id: str) -> Optional[Dict[str, Any]]:
        """Get filing status by ID"""

        with self._get_connection() as conn:
            row = conn.execute("""
                SELECT * FROM filings WHERE id = ?
            """, (filing_id,)).fetchone()

            if not row:
                return None

            # Parse result JSON
            result = None
            if row['result']:
                try:
                    result = json.loads(row['result'])
                except json.JSONDecodeError:
                    result = {"raw_result": row['result']}

            return {
                "id": row['id'],
                "company_number": row['company_number'],
                "company_name": row['company_name'],
                "status": row['status'],
                "created_at": row['created_at'],
                "updated_at": row['updated_at'],
                "result": result,
                "error_message": row['error_message']
            }

    async def get_pending_filings(self) -> list[Dict[str, Any]]:
        """Get all pending filings"""

        with self._get_connection() as conn:
            rows = conn.execute("""
                SELECT * FROM filings
                WHERE status = ?
                ORDER BY created_at ASC
            """, (FilingStatus.PENDING.value,)).fetchall()

            return [{
                "id": row['id'],
                "company_number": row['company_number'],
                "company_name": row['company_name'],
                "status": row['status'],
                "created_at": row['created_at'],
                "updated_at": row['updated_at']
            } for row in rows]

    async def cleanup_old_records(self, days: int = 30):
        """Clean up old completed/failed records"""

        from datetime import timedelta
        cutoff_date = datetime.now() - timedelta(days=days)

        with self._get_connection() as conn:
            conn.execute("""
                DELETE FROM filings
                WHERE status IN (?, ?)
                AND datetime(created_at) < datetime(?)
            """, (
                FilingStatus.COMPLETED.value,
                FilingStatus.FAILED.value,
                cutoff_date.isoformat()
            ))
            conn.commit()
