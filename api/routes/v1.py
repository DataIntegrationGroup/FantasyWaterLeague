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
from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from api import schemas
from api.models import RosterAsset
from api.models.assets import Asset
from api.database import get_db
from api.crud import (
    retrieve_rosters,
    retrieve_asset,
    retrieve_players,
    retrieve_roster_assets,
    retrieve_roster_asset,
    update_roster_asset,
    add_asset_score,
    retrieve_game,
    retrieve_player_by_user,
    add_roster_score,
    retrieve_games,
    retrieve_match,
)
from api.models.game import Game
from api.rules import (
    validate_team,
    validate_lineup,
    validate_groundwater,
    validate_stream_gauge,
    validate_rain_gauge,
)
from api.users import current_active_user, current_super_user

router = APIRouter(prefix=f"/api/v1", tags=["API V1"])
auth_router = APIRouter(
    prefix=f"/api/v1", tags=["API V1"], dependencies=[Depends(current_active_user)]
)
admin_router = APIRouter(
    prefix="/api/v1/admin",
    tags=["API V1 Admin"],
    dependencies=[Depends(current_super_user)],
)


# GET ===============================================================================
@auth_router.get("/mapboxtoken")
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

    for player in players:
        for roster in player.rosters:
            if roster.active and roster.name == "main":
                player.score = roster.scores[-1].score if roster.scores else 0
                break

    splayers = sorted(players, key=lambda x: x.score, reverse=True)
    for i, p in enumerate(splayers[:3]):
        p.rank = 3 - i

    return sorted(players, key=lambda x: x.score, reverse=True)


@router.get("/player/{username}")
async def get_player(username, db=Depends(get_db)):
    user = retrieve_player_by_user(db, username)
    return user


# validation
@router.get("/roster/{roster_slug}/validate")
async def get_validate_team(roster_slug, db=Depends(get_db)):
    assets = retrieve_roster_assets(db, roster_slug)
    vteam, nteam = validate_team(assets)

    assets = [a for a in assets if a.active]
    vlineup, nlineup, rlineup = validate_lineup(assets)

    vgroundwater, ngw, rgw = validate_groundwater(assets)
    vstreamgauge, nsg, rsg = validate_stream_gauge(assets)
    vrain, nr, rrg = validate_rain_gauge(assets)

    return {
        "team": vteam,
        "nteam": nteam,
        "lineup": vlineup and vgroundwater and vstreamgauge and vrain,
        "nlineup": nlineup,
        "rlineup": rlineup,
        "groundwater": vgroundwater,
        "ngroundwater": ngw,
        "rgroundwater": rgw,
        "streamgauge": vstreamgauge,
        "nstreamgauge": nsg,
        "rstreamgauge": rsg,
        "raingauge": vrain,
        "nraingauge": nr,
        "rraingauge": rrg,
    }


@router.get("/players", response_model=List[schemas.Player])
async def get_players(db=Depends(get_db)):
    players = retrieve_players(db)
    return players


@auth_router.get("/player/{player_slug}")
async def get_player(player_slug, db=Depends(get_db)):
    return {"name": player_slug, "rosters": retrieve_rosters(db, player_slug)}


@auth_router.get("/roster/{roster_slug}", response_model=List[schemas.ActiveAsset])
async def get_roster(roster_slug, db=Depends(get_db)):
    game1, game0 = retrieve_games(db, limit=2)

    return retrieve_roster_assets(db, roster_slug, game1, game0)


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
                    "source": a.source.name,
                    "source_slug": a.source.slug,
                    "active": int(a.active),
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

    game1, game0 = retrieve_games(db, limit=2)

    for a in retrieve_roster_assets(db, roster_slug, game1, game0):
        if a.active:
            score += a.score

    return {
        "slug": roster_slug,
        "score": score,
    }


@router.get("/game")
async def get_game(db=Depends(get_db)):
    game = retrieve_game(db)
    return {
        "start": game.start.isoformat(),
        "end": (game.start + timedelta(days=5)).isoformat(),
        "active": game.active,
    }


@router.get("/asset/{asset_slug}/data_url")
async def get_asset_data(asset_slug, db=Depends(get_db)):
    game = retrieve_game(db)
    asset = retrieve_asset(db, asset_slug)
    source_id = asset.source_identifier

    def totimestr(dt):
        sdt = dt.astimezone(timezone.utc)
        return sdt.strftime("%Y-%m-%dT%H:%M:%SZ")

    # convert to UTC
    # utcstart = game.start
    # sutc.strftime('%Y-%m-%dT%H:%M:%SZ')
    # prev_start_dt = (utcstart - timedelta(days=7)).isoformat(timespec="seconds") + "Z"
    # start_dt = utcstart.isoformat(timespec="seconds") + "Z"
    start = game.start
    prev_start = start - timedelta(days=7)
    prev_start_dt = totimestr(prev_start)
    start_dt = totimestr(start)

    if asset.source.slug.startswith("usgs"):
        request_url = f"{asset.source.base_url}&site={source_id}&period=P7D"
        prev_url = (
            f"{asset.source.base_url}"
            f"&site={source_id}"
            f"&startDT={prev_start_dt}"
            f"&endDT={start_dt}"
        )
        scoring_url = (
            f"{asset.source.base_url}" f"&site={source_id}" f"&startDT={start_dt}"
        )
    else:
        base_url = asset.source.base_url
        if "{" in base_url and "}" in base_url:
            if '?' in base_url:
                now = datetime.now()
                # base_url = base_url.format(source_id=source_id, start=prev_start_dt, end=start_dt)
                prev_url = base_url.format(source_id=source_id, start=prev_start, end=start)
                scoring_url = base_url.format(source_id=source_id, start=start, end=now)
            else:
                base_url = base_url.format(source_id=source_id)
                prev_url = f"{base_url}?start={prev_start_dt}&end={start_dt}"
                scoring_url = f"{base_url}?start={start_dt}"

        request_url = base_url
        # scoring_url = (
        #     f"{asset.source.base_url}"
        #     f"&sites={source_id}"
        #     f"&startDT={game.start.isoformat()}"
        # )

    return {
        "url": request_url,
        "prev_url": prev_url,
        "scoring_url": scoring_url,
        "source": asset.source.slug,
        "atype": asset.atype,
    }


@router.get("/asset/{asset_slug}/score")
async def get_asset_score(asset_slug, db=Depends(get_db)):
    asset = retrieve_asset(db, asset_slug)
    return {"score": asset.score}


@router.get("/assets", response_model=List[schemas.Asset])
async def get_all_assets(db=Depends(get_db)):
    q = db.query(Asset)
    return q.all()


# POST ===============================================================================


# @router.post("/game")
# def post_game(payload: NewGamePayload, db=Depends(get_db)):
#     # game = retrieve_game(db)
#     # game.active = payload.active.lower() == "true"
#     # db.commit()
#
#     game = Game(**payload.model_dump())
#     db.add(game)
#     db.commit()
#     return {"status": "ok"}


class NewRosterAssetPayload(BaseModel):
    roster_slug: str
    asset_slug: str
    active: bool


@router.post("/rosterasset")
def post_rosterasset(payload: NewRosterAssetPayload, db=Depends(get_db)):
    rasset = RosterAsset(**payload.model_dump())
    db.add(rasset)
    db.commit()

    return {"status": "ok"}


# PUT ===============================================================================
class AssetPayload(BaseModel):
    active: bool


class ScorePayload(BaseModel):
    score: float
    game_slug: str


@router.put("/roster/{roster_slug}/{asset_slug}")
async def put_roster_asset(
    roster_slug, asset_slug, payload: AssetPayload, db=Depends(get_db)
):
    update_roster_asset(db, roster_slug, asset_slug, payload)
    return {"slug": asset_slug, "active": payload.active}


@auth_router.put("/asset/{asset_slug}/score")
async def put_asset_score(asset_slug: str, payload: ScorePayload, db=Depends(get_db)):
    add_asset_score(db, asset_slug, payload)
    return {"slug": asset_slug, "score": payload.score, "game_slug": payload.game_slug}


@auth_router.put("/score/roster/{roster_slug}")
async def put_player_score(roster_slug: str, payload: ScorePayload, db=Depends(get_db)):
    add_roster_score(db, roster_slug, payload)

    # update match score
    match = retrieve_match(db, roster_slug)
    print(
        "fffffff",
        roster_slug == match.roster_a,
        match,
        roster_slug,
        payload.score,
        match.roster_a,
        match.roster_b,
    )
    if roster_slug == match.roster_a:
        match.score_a = payload.score
    else:
        match.score_b = payload.score

    db.add(match)
    db.commit()

    return {"slug": roster_slug, "score": payload.score, "game_slug": payload.game_slug}


# ============= EOF =============================================
