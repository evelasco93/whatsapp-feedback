from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from starlette import status


def _error_payload(
    *,
    status_code: int,
    message: str,
    error: str,
    path: str,
) -> dict[str, object]:
    return {
        "statusCode": status_code,
        "message": message,
        "error": error,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "path": path,
    }


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        detail = exc.detail if isinstance(exc.detail, str) else "Request error"
        payload = _error_payload(
            status_code=exc.status_code,
            message=detail,
            error="HTTPException",
            path=request.url.path,
        )
        return JSONResponse(status_code=exc.status_code, content=payload)

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        payload = _error_payload(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            message="Internal server error",
            error=type(exc).__name__,
            path=request.url.path,
        )
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=payload)
