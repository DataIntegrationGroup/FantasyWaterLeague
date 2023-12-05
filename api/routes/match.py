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
from fastapi import Depends, APIRouter
from pydantic import BaseModel
from sqlalchemy import insert, select

from database import get_db
from models.game import Match
from users import auth

admin_router = APIRouter(
    prefix=f"/api/v1/admin",
    tags=["API V1"],
    dependencies=[Depends(auth.authenticated(permissions=["superuser"]))],
)
router = APIRouter(prefix=f"/api/v1", tags=["API V1"])


# post ===============================================================================
class NewMatchPayload(BaseModel):
    roster_a: str
    roster_b: str
    game_slug: str


@admin_router.post("/match")
async def post_match(payload: NewMatchPayload, db=Depends(get_db)):
    # match = Match(
    #     roster_a=payload.roster_a,
    #     roster_b=payload.roster_b,
    #     game=payload.game_slug,
    #     name=f"{payload.roster_a} vs {payload.roster_b}",
    #     slug=f"{payload.roster_a}-{payload.roster_b}-{payload.game_slug}",
    # )
    # db.add(match)
    # db.commit()
    stmt = insert(Match).values(
        roster_a=payload.roster_a,
        roster_b=payload.roster_b,
        game=payload.game_slug,
        name=f"{payload.roster_a} vs {payload.roster_b}",
        slug=f"{payload.roster_a}-{payload.roster_b}-{payload.game_slug}",
    )
    db.execute(stmt)
    db.commit()

    return {"status": "ok"}


# get ===============================================================================
@router.get("/matches")
async def get_match(db=Depends(get_db)):
    stmt = select(Match)
    return db.execute(stmt).all()


# ============= EOF =============================================
