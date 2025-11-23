# Backend Implementation Guide: AI Cron Trigger Validation Improvements

This document outlines the backend changes needed to complete the AI cron trigger validation improvements.

## Overview

The `/ai/admin/cron/trigger` endpoint currently requires both `service` and `jobId`, but validation errors don't provide helpful information when `jobId` is missing. Additionally, a new endpoint is needed to trigger all jobs in a service.

## Required Backend Changes

### 1. Improve Validation Error Messages

**Location**: `endpoints/backend/cron_management.py` (or similar)

**Current Schema**:
```python
class TriggerJobRequest(BaseModel):
    service: str = Field(..., description="Service name (document, snapshot, insight)")
    job_id: str = Field(
        ...,
        alias="jobId",
        description="Job ID to trigger",
    )
    
    class Config:
        populate_by_name = True
```

**Required Changes**:

1. **Add custom validation** to detect when `jobId` is missing and provide helpful error messages:

```python
from pydantic import BaseModel, Field, field_validator, ValidationError
from typing import Optional

class TriggerJobRequest(BaseModel):
    service: str = Field(..., description="Service name (document, snapshot, insight)")
    job_id: Optional[str] = Field(
        None,
        alias="jobId",
        description="Job ID to trigger (e.g., 'process_pending_jobs', 'snapshot_morning', 'generate_weekly_summaries')",
    )
    
    class Config:
        populate_by_name = True
    
    @field_validator('job_id')
    @classmethod
    def validate_job_id(cls, v, info):
        if v is None:
            # Get available jobs for the service
            service = info.data.get('service')
            if service:
                available_jobs = get_available_jobs_for_service(service)
                if available_jobs:
                    job_ids = [job.job_id for job in available_jobs]
                    raise ValueError(
                        f"Missing required field 'jobId'. "
                        f"Available job IDs for service '{service}': {job_ids}"
                    )
            raise ValueError("Missing required field 'jobId'")
        return v
```

2. **Alternative approach** (if using FastAPI exception handlers):

```python
from fastapi import HTTPException, status
from pydantic import ValidationError

@app.exception_handler(ValidationError)
async def validation_exception_handler(request, exc):
    errors = exc.errors()
    for error in errors:
        if error['loc'] == ('body', 'jobId') or error['loc'] == ('body', 'job_id'):
            service = request.json().get('service') if hasattr(request, 'json') else None
            if service:
                available_jobs = get_available_jobs_for_service(service)
                if available_jobs:
                    job_ids = [job.job_id for job in available_jobs]
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail={
                            "message": f"Missing required field 'jobId'. Available job IDs for service '{service}': {job_ids}",
                            "field": "jobId",
                            "service": service,
                            "availableJobIds": job_ids
                        }
                    )
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=exc.errors()
    )
```

3. **Helper function** to get available jobs:

```python
def get_available_jobs_for_service(service: str) -> List[Dict]:
    """
    Get list of available job IDs for a given service.
    This should query the same source that populates the jobs list.
    """
    # Implementation depends on your data source
    # Example:
    jobs = get_cron_jobs()  # Your existing function to get all jobs
    return [job for job in jobs if job.service == service]
```

### 2. Add New Endpoint: Trigger All Jobs in a Service

**Endpoint**: `POST /ai/admin/cron/trigger-all`

**Request Body**:
```json
{
  "service": "snapshot"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Triggered 3 job(s) in service 'snapshot'",
  "service": "snapshot",
  "timestamp": "2024-01-01T12:00:00Z",
  "results": [
    {
      "jobId": "snapshot_morning",
      "success": true,
      "message": "Job triggered successfully"
    },
    {
      "jobId": "snapshot_evening",
      "success": true,
      "message": "Job triggered successfully"
    },
    {
      "jobId": "snapshot_weekly",
      "success": false,
      "error": "Job is currently disabled"
    }
  ],
  "totalTriggered": 3,
  "successful": 2,
  "failed": 1
}
```

**Implementation Example**:

```python
from typing import List
from pydantic import BaseModel

class TriggerAllJobsRequest(BaseModel):
    service: str = Field(..., description="Service name (document, snapshot, insight)")

class TriggerAllJobsResponse(BaseModel):
    success: bool
    message: str
    service: str
    timestamp: str
    results: List[Dict[str, Any]]
    totalTriggered: int
    successful: int
    failed: int

@app.post("/ai/admin/cron/trigger-all", response_model=TriggerAllJobsResponse)
async def trigger_all_jobs(request: TriggerAllJobsRequest):
    """
    Trigger all jobs in a service.
    """
    service = request.service
    
    # Get all jobs for the service
    jobs = get_available_jobs_for_service(service)
    
    if not jobs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No jobs found for service '{service}'"
        )
    
    results = []
    successful = 0
    failed = 0
    
    for job in jobs:
        try:
            # Trigger the individual job
            result = await trigger_job(service, job.job_id)
            results.append({
                "jobId": job.job_id,
                "success": True,
                "message": result.get("message", "Job triggered successfully")
            })
            successful += 1
        except Exception as e:
            results.append({
                "jobId": job.job_id,
                "success": False,
                "error": str(e)
            })
            failed += 1
    
    return TriggerAllJobsResponse(
        success=failed == 0,
        message=f"Triggered {len(jobs)} job(s) in service '{service}': {successful} succeeded, {failed} failed",
        service=service,
        timestamp=datetime.utcnow().isoformat(),
        results=results,
        totalTriggered=len(jobs),
        successful=successful,
        failed=failed
    )
```

## Testing

1. **Test improved validation error**:
   ```bash
   curl -X POST http://localhost:8000/ai/admin/cron/trigger \
     -H "Content-Type: application/json" \
     -d '{"service": "snapshot"}'
   ```
   Expected: Error message listing available job IDs

2. **Test trigger-all endpoint**:
   ```bash
   curl -X POST http://localhost:8000/ai/admin/cron/trigger-all \
     -H "Content-Type: application/json" \
     -d '{"service": "snapshot"}'
   ```
   Expected: Response with results for all jobs in the service

## Notes

- The error message format should be consistent with other validation errors in your API
- The `get_available_jobs_for_service` function should query the same data source used by the `/ai/admin/cron/jobs` endpoint
- Consider rate limiting for the trigger-all endpoint to prevent accidental mass triggers
- The trigger-all endpoint should handle partial failures gracefully (some jobs succeed, some fail)

