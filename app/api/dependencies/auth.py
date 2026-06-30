import httpx

from fastapi import Depends
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer
from app.env import AUTH_SERVICE_USER_ME, AUTH_SERVICE_AUTH_REGISTER, AUTH_SERVICE_AUTH_LOGIN


class AuthClient:
    async def verify(self, token: str) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.get(AUTH_SERVICE_USER_ME, headers={"Authorization": f"Bearer {token}"}, timeout=40)

        if response.status_code != 200:
            raise HTTPException(401, "Unauthorized")

        return response.json()


auth_client = AuthClient()
bearer = HTTPBearer()

async def get_current_user(credentials=Security(bearer)):
    user = await auth_client.verify(credentials.credentials)

    if user is None:
        raise HTTPException(401, "Unauthorized")

    return user