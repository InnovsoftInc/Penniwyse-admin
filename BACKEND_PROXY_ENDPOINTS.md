# Backend Proxy Endpoints for AI Service

## Overview

The frontend has been updated to route all AI service requests through the backend proxy. This keeps the `X-Service-Token` secure on the server-side and avoids CORS issues.

## Required Backend Endpoints

The backend needs to implement the following proxy endpoints that forward requests to the AI service while adding the required service authentication headers.

### Base Pattern

All endpoints should:
1. Accept requests from the frontend with JWT token only
2. Validate the JWT token
3. Forward the request to the AI service with:
   - `Authorization: Bearer <jwt-token>` (from frontend)
   - `X-Service-Token: <ai-microservice-api-key>` (from backend env)
   - `X-Service: taxable-backend` (from backend env)
4. Return the AI service response to the frontend

### Required Endpoints

#### 1. Files and Jobs

**GET** `/api/ai/jobs/files-and-jobs`
- Query params: `userId?`, `page?`, `limit?`
- Forwards to: `GET /ai/jobs/files-and-jobs` on AI service

**POST** `/api/ai/jobs/:jobId/retrigger`
- Forwards to: `POST /ai/jobs/{jobId}/retrigger` on AI service

#### 2. AI Cron Management

**GET** `/api/ai/admin/cron/jobs`
- Forwards to: `GET /ai/admin/cron/jobs` on AI service

**GET** `/api/ai/admin/cron/status`
- Forwards to: `GET /ai/admin/cron/status` on AI service

**POST** `/api/ai/admin/cron/trigger`
- Body: `{ service: string, jobId: string }`
- Forwards to: `POST /ai/admin/cron/trigger` on AI service

**POST** `/api/ai/admin/cron/trigger-all`
- Body: `{ service: string }`
- Forwards to: `POST /ai/admin/cron/trigger-all` on AI service

**POST** `/api/ai/admin/cron/pause/:serviceName`
- Forwards to: `POST /ai/admin/cron/pause/{serviceName}` on AI service

**POST** `/api/ai/admin/cron/resume/:serviceName`
- Forwards to: `POST /ai/admin/cron/resume/{serviceName}` on AI service

**GET** `/api/ai/admin/cron/history`
- Query params: `service_name?`, `job_id?`, `status?`, `limit?`, `offset?`, `start_date?`, `end_date?`
- Forwards to: `GET /ai/admin/cron/history` on AI service

#### 3. Admin Insights

**POST** `/api/ai/admin/insights/all`
- Body: `{ user_id?, profile_type?, insight_type?, start_date?, end_date?, source?, limit?, offset? }`
- Forwards to: `POST /ai/admin/insights/all` on AI service

## Implementation Example (Node.js/Express)

```javascript
const express = require('express');
const axios = require('axios');
const router = express.Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'https://ai.penniwyse.com';
const AI_SERVICE_TOKEN = process.env.AI_SERVICE_TOKEN;
const SERVICE_NAME = process.env.SERVICE_NAME || 'taxable-backend';

// Middleware to proxy requests to AI service
async function proxyToAiService(req, res, next) {
  try {
    const jwtToken = req.headers.authorization; // Bearer token from frontend
    
    const aiServiceUrl = `${AI_SERVICE_URL}${req.path.replace('/api/ai', '')}`;
    
    const response = await axios({
      method: req.method,
      url: aiServiceUrl,
      headers: {
        'Authorization': jwtToken,
        'X-Service-Token': AI_SERVICE_TOKEN,
        'X-Service': SERVICE_NAME,
        'Content-Type': 'application/json',
      },
      params: req.query,
      data: req.body,
    });
    
    res.json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ message: 'Failed to proxy request to AI service' });
    }
  }
}

// Apply to all AI service routes
router.use('/ai', proxyToAiService);

module.exports = router;
```

## Implementation Example (Python/FastAPI)

```python
from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
import os

router = APIRouter(prefix="/api/ai", tags=["ai-proxy"])
security = HTTPBearer()

AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "https://ai.penniwyse.com")
AI_SERVICE_TOKEN = os.getenv("AI_SERVICE_TOKEN")
SERVICE_NAME = os.getenv("SERVICE_NAME", "taxable-backend")

async def proxy_to_ai_service(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Proxy request to AI service with service token"""
    jwt_token = credentials.credentials
    
    # Extract path after /api/ai
    ai_path = request.url.path.replace("/api/ai", "")
    ai_url = f"{AI_SERVICE_URL}{ai_path}"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.request(
                method=request.method,
                url=ai_url,
                headers={
                    "Authorization": f"Bearer {jwt_token}",
                    "X-Service-Token": AI_SERVICE_TOKEN,
                    "X-Service": SERVICE_NAME,
                    "Content-Type": "application/json",
                },
                params=request.query_params,
                content=await request.body(),
            )
            return response.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=e.response.json() if e.response.headers.get("content-type") == "application/json" else e.response.text
            )

# Apply to all routes
@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def ai_proxy(request: Request, path: str):
    return await proxy_to_ai_service(request)
```

## Environment Variables

The backend needs these environment variables:

- `AI_SERVICE_URL`: Base URL of the AI service (e.g., `https://ai.penniwyse.com`)
- `AI_SERVICE_TOKEN`: API key for authenticating with the AI service
- `SERVICE_NAME`: Service name identifier (default: `taxable-backend`)

## Security Notes

1. **Never expose `AI_SERVICE_TOKEN` to the frontend** - it should only exist in backend environment variables
2. **Validate JWT tokens** - Ensure the frontend JWT token is valid before proxying
3. **Rate limiting** - Consider adding rate limiting to prevent abuse
4. **Error handling** - Properly handle and forward errors from the AI service
5. **Logging** - Log proxy requests for debugging and monitoring

## Testing

After implementing the proxy endpoints, test with:

```bash
# Test files and jobs endpoint
curl -X GET "https://your-backend.com/api/ai/jobs/files-and-jobs?userId=1" \
  -H "Authorization: Bearer <jwt-token>"

# Test cron trigger endpoint
curl -X POST "https://your-backend.com/api/ai/admin/cron/trigger" \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"service": "snapshot", "jobId": "snapshot_morning"}'
```

## Migration Notes

- The frontend has been updated to use `/api/ai/*` endpoints instead of calling the AI service directly
- The old `aiApiClient` is still available but should not be used for authenticated endpoints
- The `/health` endpoint can still be called directly since it doesn't require service authentication

