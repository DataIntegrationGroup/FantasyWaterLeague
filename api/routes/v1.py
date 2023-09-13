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
from datetime import datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from api import schemas
from api.models.assets import Asset
from api.database import get_db
from api.crud import (
    retrieve_rosters,
    retrieve_asset,
    retrieve_players,
    retrieve_roster_assets,
    retrieve_roster_asset,
    update_roster_asset,
    update_asset,
    retrieve_game_start, retrieve_player_by_user,
)
from api.rules import (
    validate_team,
    validate_lineup,
    validate_groundwater,
    validate_stream_gauge,
    validate_rain_gauge,
)

router = APIRouter(prefix=f"/api/v1", tags=["API V1"])


# GET ===============================================================================
@router.get("/mapboxtoken")
def mapboxtoken():
    return {
        "token": "pk.eyJ1IjoiamFrZXJvc3N3ZGkiLCJhIjoiY2s3M3ZneGl4MGhkMDNrcjlocmNuNWg4bCJ9.4r1DRDQ_ja0fV2nnmlVT0A"
    }


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.get("/leaderboard", response_model=List[schemas.Player])
async def get_leaderboard(db=Depends(get_db)):
    players = retrieve_players(db)

    # for player in players:
    #     if player.slug not in SCORES:
    #         SCORES[player.slug] = calculate_player_score(db, player.slug)
    #
    #     player.score = SCORES[player.slug]

    for player in players:
        player.score = 0
        # player.score = retrieve_player_score(db, player.slug)

    return players

@router.get('/user/{username}')
async def get_user(username, db=Depends(get_db)):
    user = retrieve_player_by_user(db, username)
    return user



# validation
@router.get("/roster/{roster_slug}/validate")
async def get_validate_team(roster_slug, db=Depends(get_db)):
    assets = retrieve_roster_assets(db, roster_slug)
    vteam, nteam = validate_team(assets)
    vlineup, nlineup, rlineup = validate_lineup(assets)

    vgroundwater, ngw, rgw = validate_groundwater(assets)
    vstreamgauge, nsg, rsg = validate_stream_gauge(assets)
    vrain, nr, rrg = validate_rain_gauge(assets)

    return {
        "team": vteam,
        "nteam": nteam,
        "lineup": vlineup,
        "nlineup": nlineup,
        "rlineup": rlineup,
        "groundwater": vgroundwater,
        "ngroundwater": ngw,
        "rgroundwater": rgw,
        "streamgauge": vstreamgauge,
        "nstreamgauge": nsg,
        "rstreamgauge": rsg,
        "rain": vrain,
        "nrain": nr,
        "rrain": rrg,
    }


@router.get("/players", response_model=List[schemas.Player])
async def get_players(db=Depends(get_db)):
    players = retrieve_players(db)
    return players


@router.get("/player/{player_slug}")
async def get_player(player_slug, db=Depends(get_db)):
    return {"name": player_slug, "rosters": retrieve_rosters(db, player_slug)}


@router.get("/roster/{roster_slug}", response_model=List[schemas.ActiveAsset])
async def get_roster(roster_slug, db=Depends(get_db)):
    return retrieve_roster_assets(db, roster_slug)


@router.get("/roster/{roster_slug}/geojson")
async def get_roster_geojson(roster_slug, db=Depends(get_db)):
    assets = retrieve_roster_assets(db, roster_slug)
    features = []
    for a in assets:
        features.append(
            {
                "type": "Feature",
                "properties": {
                    "name": a.name,
                    "score": a.score,
                    "atype": a.atype,
                },
                "geometry": a.geometry,
            }
        )
    return {
        "type": "FeatureCollection",
        "features": features,
    }


@router.get("/roster/{roster_slug}/score")
async def get_roster_score(roster_slug, db=Depends(get_db)):
    score = 0
    for a in retrieve_roster_assets(db, roster_slug):
        if a.active:
            score += a.score

    return {
        "slug": roster_slug,
        "score": score,
    }


@router.get("/asset/{asset_slug}/data_url")
async def get_asset_data(asset_slug, db=Depends(get_db)):
    game_start = retrieve_game_start(db)
    asset = retrieve_asset(db, asset_slug)
    source_id = asset.source_identifier
    request_url = f"{asset.source.base_url}&site={source_id}&period=P7D"
    prev_url = (
        f"{asset.source.base_url}"
        f"&site={source_id}"
        f"&startDT={(game_start-timedelta(days=7)).isoformat()}"
        f"&endDT={game_start.isoformat()}"
    )
    scoring_url = (
        f"{asset.source.base_url}"
        f"&site={source_id}"
        f"&startDT={game_start.isoformat()}"
    )
    return {"url": request_url, "prev_url": prev_url, "scoring_url": scoring_url}


@router.get("/asset/{asset_slug}/score")
async def get_asset_score(asset_slug, db=Depends(get_db)):
    asset = retrieve_asset(db, asset_slug)
    return {"score": asset.score}


@router.get("/assets", response_model=List[schemas.Asset])
async def get_all_assets(db=Depends(get_db)):
    q = db.query(Asset)
    return q.all()


# PUT ===============================================================================
class AssetPayload(BaseModel):
    active: bool


class ScorePayload(BaseModel):
    score: float


@router.put("/roster/{roster_slug}/{asset_slug}")
async def put_roster_asset(
    roster_slug, asset_slug, payload: AssetPayload, db=Depends(get_db)
):
    update_roster_asset(db, roster_slug, asset_slug, payload)
    return {"slug": asset_slug, "active": payload.active}


@router.put("/asset/{asset_slug}/score")
async def put_asset_score(asset_slug, payload: ScorePayload, db=Depends(get_db)):
    update_asset(db, asset_slug, payload)
    return {"slug": asset_slug, "score": payload.score}


# ============= EOF =============================================
