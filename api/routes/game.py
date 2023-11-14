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
from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from api.crud import retrieve_game
from api.database import get_db
from api.models import Game
from api.users import current_super_user

admin_router = APIRouter(
    prefix="/api/v1/admin",
    tags=["API V1 Admin"],
    dependencies=[Depends(current_super_user)],
)


class GameStatusPayload(BaseModel):
    active: bool


class NewGamePayload(BaseModel):
    start: datetime
    active: bool
    name: str
    slug: str


# admin
@admin_router.patch("/game_status")
async def patch_game_status(payload: GameStatusPayload, db=Depends(get_db)):
    game = retrieve_game(db)
    game.active = payload.active
    db.commit()
    return {"status": "ok"}


@admin_router.post("/game")
async def post_game(payload: NewGamePayload, db=Depends(get_db)):
    game = retrieve_game(db)
    if game:
        game.active = False
        db.commit()

    new_game = Game(**payload.model_dump())
    db.add(new_game)
    db.commit()
    return {"status": "ok"}

# ============= EOF =============================================
