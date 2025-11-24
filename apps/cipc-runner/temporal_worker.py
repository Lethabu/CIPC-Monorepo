"""
Temporal Worker for CIPC Filing Workflows
"""

import asyncio
import os
from temporalio import activity, workflow
from temporalio.client import Client
from temporalio.worker import Worker

from cipc_automation.cipc_filer import CIPCFiler
from database import Database
from models import FilingStatus


@activity.defn
async def file_annual_returns_activity(filing_data: dict) -> dict:
    """Activity to file annual returns"""

    filer = CIPCFiler()
    db = Database()

    try:
        result = await filer.file_annual_returns(
            company_number=filing_data["company_number"],
            company_name=filing_data["company_name"],
            financial_year_end=filing_data["financial_year_end"],
            contact_email=filing_data["contact_email"],
            contact_phone=filing_data["contact_phone"]
        )

        # Update database
        if result.success:
            await db.update_filing_status(
                filing_data["filing_id"],
                FilingStatus.COMPLETED,
                result.dict()
            )
        else:
            await db.update_filing_status(
                filing_data["filing_id"],
                FilingStatus.FAILED,
                result.dict()
            )

        return result.dict()

    except Exception as e:
        await db.update_filing_status(
            filing_data["filing_id"],
            FilingStatus.FAILED,
            {"error": str(e)}
        )
        raise


@workflow.defn
class AnnualReturnsWorkflow:
    """Workflow for annual returns filing"""

    @workflow.run
    async def run(self, filing_data: dict) -> dict:
        """Execute the annual returns filing workflow"""

        # Wait for payment confirmation (this would be signaled)
        payment_confirmed = await workflow.wait_condition(
            lambda: workflow.memo.get("payment_confirmed", False),
            timeout=3600  # 1 hour timeout
        )

        if not payment_confirmed:
            return {"success": False, "error": "Payment not confirmed within timeout"}

        # Execute filing
        result = await workflow.execute_activity(
            file_annual_returns_activity,
            filing_data,
            start_to_close_timeout=1800  # 30 minutes
        )

        return result


async def start_temporal_worker():
    """Start the Temporal worker"""

    # Connect to Temporal server
    temporal_address = os.getenv("TEMPORAL_ADDRESS", "localhost:7233")
    temporal_namespace = os.getenv("TEMPORAL_NAMESPACE", "default")

    client = await Client.connect(temporal_address)

    # Create worker
    worker = Worker(
        client,
        task_queue="cipc-filing-queue",
        workflows=[AnnualReturnsWorkflow],
        activities=[file_annual_returns_activity],
    )

    print(f"Starting Temporal worker on {temporal_address}...")
    await worker.run()
