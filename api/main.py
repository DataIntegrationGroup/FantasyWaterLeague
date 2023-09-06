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

from pathlib import Path
from typing import List

from fastapi import FastAPI, Depends
from starlette.templating import Jinja2Templates
from starlette.requests import Request

from api import schemas
from api.database import get_db
from api.scoring.score import (
    calculate_roster_score,
    get_rosters,
    calculate_player_score,
    get_assets,
    get_asset,
    calculate_asset_score,
)

app = FastAPI()

BASE_DIR = Path(__file__).resolve().parent
templates = Jinja2Templates(directory=str(Path(BASE_DIR, "templates")))

from demo import setup_demo

setup_demo()

version = "v1"


@app.get("/")
async def root(request: Request):
    """
    return the main page

    :return:
    """

    return templates.TemplateResponse(
        "home.html", {"request": request, "version": version}
    )


@app.get("/player/{player_slug}")
async def get_player_detail(request: Request, player_slug):
    return templates.TemplateResponse(
        "player.html",
        {"request": request, "player_slug": player_slug, "version": version},
    )


@app.get("/roster/{roster_slug}")
async def get_roster_detail(request: Request, roster_slug):
    return templates.TemplateResponse(
        "roster.html",
        {"request": request, "roster_slug": roster_slug, "version": version},
    )


# ===============================================================================
# API Endpoints
# ===============================================================================


@app.get("/api/v1/health")
async def health():
    return {"status": "ok"}


@app.get("/api/v1/leaderboard", response_model=List[schemas.Player])
async def get_leaderboard(db=Depends(get_db)):
    players = get_players(db)
    for player in players:
        player.score = calculate_player_score(db, player.slug)
    return players


@app.get("/api/v1/player/{player_slug}")
async def get_player(player_slug, db=Depends(get_db)):
    return {"name": player_slug, "rosters": get_rosters(db, player_slug)}


@app.get("/api/v1/roster/{roster_slug}", response_model=List[schemas.Asset])
async def get_roster(roster_slug, db=Depends(get_db)):
    return get_assets(db, roster_slug)


@app.get("/api/v1/roster/{roster_slug}/score")
async def get_roster_score(roster_slug, db=Depends(get_db)):
    return {
        "slug": roster_slug,
        "score": calculate_roster_score(db, roster_slug),
    }


@app.get("/api/v1/asset/{asset_slug}/data_url")
async def get_asset_data(asset_slug, db=Depends(get_db)):
    asset = get_asset(db, asset_slug)
    source_id = asset.source_identifier
    request_url = f"{asset.source.base_url}{source_id}"
    return {"url": request_url}


@app.get("/api/v1/asset/{asset_slug}/score")
async def get_asset_score(asset_slug, db=Depends(get_db)):
    asset = get_asset(db, asset_slug)
    return {"score": calculate_asset_score(asset)}


def get_players(db):
    from models import players

    q = db.query(players.Player)
    return q.all()
