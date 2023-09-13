# ===============================================================================
# Copyright 2023 Jake Ross
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# ===============================================================================

from fastapi import FastAPI, Depends
from starlette.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles

from api.models.players import Player
from api.routes import v1
from api.schemas import UserRead, UserCreate, UserUpdate
from api.users import current_active_user, fastapi_users, bearer_auth_backend, cookie_auth_backend

app = FastAPI()
# app.mount("/static", StaticFiles(directory="static"), name="static")

origins = [
    "http://localhost:8080",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from demo import setup_demo

# ===============================================================================
# API Endpoints
# ===============================================================================

app.include_router(
    fastapi_users.get_auth_router(bearer_auth_backend), prefix="/auth/jwt", tags=["auth"]
)
app.include_router(
    fastapi_users.get_auth_router(cookie_auth_backend), prefix="/auth/cookie", tags=["auth"]
)

app.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_reset_password_router(),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_verify_router(UserRead),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["users"],
)


# @app.get("/authenticated-route")
# async def authenticated_route(user: Player = Depends(current_active_user)):
#     return {"message": f"Hello {user.email}!"}




app.include_router(v1.router)


@app.on_event("startup")
async def startup():
    await setup_demo()
