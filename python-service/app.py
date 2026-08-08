"""
crossyarn-import — FastAPI recognition service (scaffold).

Binds to 127.0.0.1 only. Next.js calls /process; this service runs the pipeline
and PATCHes the result back to Next's internal callback. Authenticated purely by
the shared INTERNAL_API_KEY header in both directions — never a user session.
"""
import os
import asyncio
import httpx
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

from pipeline import recognize

app = FastAPI(title="crossyarn-import")

INTERNAL_API_KEY = os.environ.get("INTERNAL_API_KEY", "")
NEXT_CALLBACK_URL = os.environ.get("NEXT_CALLBACK_URL", "http://127.0.0.1:3000").rstrip("/")
UPLOAD_DIR = os.environ.get("IMPORT_UPLOAD_DIR", "./import-uploads")


class ProcessRequest(BaseModel):
    jobId: str
    imageRef: str            # bare filename inside UPLOAD_DIR
    width: int | None = None
    height: int | None = None


def _require_key(x_internal_key: str | None):
    if not INTERNAL_API_KEY or x_internal_key != INTERNAL_API_KEY:
        raise HTTPException(status_code=401, detail="unauthorized")


async def _callback(job_id: str, payload: dict):
    async with httpx.AsyncClient(timeout=15) as client:
        await client.patch(
            f"{NEXT_CALLBACK_URL}/api/internal/imports/{job_id}",
            headers={"X-Internal-Key": INTERNAL_API_KEY},
            json=payload,
        )


async def _run_and_report(req: ProcessRequest):
    try:
        result = recognize(
            image_path=os.path.join(UPLOAD_DIR, req.imageRef),
            width=req.width,
            height=req.height,
        )
        await _callback(req.jobId, {"status": "READY", "result": result})
    except FileNotFoundError:
        await _callback(req.jobId, {"status": "FAILED", "errorType": "invalid-image"})
    except Exception as e:  # noqa: BLE001 — any pipeline failure → FAILED, don't crash the worker
        et = "grid-detection-failed" if e.__class__.__name__ == "GridDetectionError" else "internal-error"
        await _callback(req.jobId, {"status": "FAILED", "errorType": et})


@app.post("/process")
async def process(req: ProcessRequest, x_internal_key: str | None = Header(default=None)):
    _require_key(x_internal_key)
    # Fire-and-forget: Next already returned PENDING to the browser and is polling.
    asyncio.create_task(_run_and_report(req))
    return {"accepted": True, "jobId": req.jobId}


@app.get("/health")
def health():
    return {"ok": True}
