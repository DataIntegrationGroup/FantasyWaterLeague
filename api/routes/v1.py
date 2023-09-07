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
from typing import List

from fastapi import APIRouter, Depends

from api import schemas
from api import models
from api.database import get_db
from api.scoring.score import (
    calculate_player_score,
    get_rosters,
    get_assets,
    calculate_roster_score,
    get_asset,
    calculate_asset_score,
)

router = APIRouter(prefix=f"/api/v1", tags=["API V1"])


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.get("/leaderboard", response_model=List[schemas.Player])
async def get_leaderboard(db=Depends(get_db)):
    players = get_players(db)
    for player in players:
        player.score = calculate_player_score(db, player.slug)
    return players


@router.get("/player/{player_slug}")
async def get_player(player_slug, db=Depends(get_db)):
    return {"name": player_slug, "rosters": get_rosters(db, player_slug)}


@router.get("/roster/{roster_slug}", response_model=List[schemas.Asset])
async def get_roster(roster_slug, db=Depends(get_db)):
    return get_assets(db, roster_slug)


@router.get("/roster/{roster_slug}/score")
async def get_roster_score(roster_slug, db=Depends(get_db)):
    return {
        "slug": roster_slug,
        "score": calculate_roster_score(db, roster_slug),
    }


@router.get("/asset/{asset_slug}/data_url")
async def get_asset_data(asset_slug, db=Depends(get_db)):
    asset = get_asset(db, asset_slug)
    source_id = asset.source_identifier
    request_url = f"{asset.source.base_url}{source_id}"
    return {"url": request_url}


@router.get("/asset/{asset_slug}/score")
async def get_asset_score(asset_slug, db=Depends(get_db)):
    asset = get_asset(db, asset_slug)
    return {"score": calculate_asset_score(asset)}


@router.get("/assets")
async def get_all_assets(db=Depends(get_db)):
    q = db.query(models.assets.Asset)
    return q.all()


def get_players(db):
    from api.models import players

    q = db.query(players.Player)
    return q.all()


# ============= EOF =============================================
