import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse, Response

from app.env import (
    AUTH_SERVICE_AUTH_LOGIN,
    AUTH_SERVICE_AUTH_REGISTER,
    AUTH_SERVICE_USER_ME,
)

router = APIRouter()


async def _proxy_request(
    method: str,
    url: str,
    *,
    body: bytes | None = None,
    authorization: str | None = None,
) -> Response:
    headers: dict[str, str] = {}

    if body:
        headers["Content-Type"] = "application/json"

    if authorization:
        headers["Authorization"] = authorization

    try:
        async with httpx.AsyncClient(timeout=40) as client:
            response = await client.request(method, url, content=body, headers=headers)
            print(response.content)
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502, detail=f"Auth service unavailable: {exc}"
        ) from exc

    content_type = response.headers.get("content-type", "")

    if "application/json" in content_type:
        return JSONResponse(status_code=response.status_code, content=response.json())

    return Response(
        content=response.text,
        status_code=response.status_code,
        media_type=content_type or "text/plain",
    )


@router.post("/auth/register")
async def register(request: Request):
    print(await request.body())
    return await _proxy_request(
        "POST", AUTH_SERVICE_AUTH_REGISTER, body=await request.body()
    )


@router.post("/auth/login")
async def login(request: Request):
    return await _proxy_request(
        "POST", AUTH_SERVICE_AUTH_LOGIN, body=await request.body()
    )


@router.get("/auth/me")
async def me(request: Request):
    authorization = request.headers.get("Authorization")
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header is required")

    return await _proxy_request(
        "GET", AUTH_SERVICE_USER_ME, authorization=authorization
    )
