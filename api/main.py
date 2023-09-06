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
from api.scoring.score import calculate_roster_score, get_rosters, calculate_player_score

app = FastAPI()

BASE_DIR = Path(__file__).resolve().parent
templates = Jinja2Templates(directory=str(Path(BASE_DIR, "templates")))

from demo import setup_demo

setup_demo()


@app.get("/")
async def root(request: Request):
    """
    return the main page

    :return:
    """

    return templates.TemplateResponse('home.html',
                                      {'request': request,
                                       'version': 'v1'})


@app.get("/api/v1/health")
async def health():
    return {'status': 'ok'}


@app.get("/api/v1/leaderboard", response_model=List[schemas.Player])
async def get_leaderboard(db=Depends(get_db)):
    players = get_players(db)
    for player in players:
        player.score = calculate_player_score(player.slug)
    return players


def get_players(db):
    from models import players
    q = db.query(players.Player)
    return q.all()


@app.get("/api/v1/player/{player_slug}")
async def get_player(player_slug, db=Depends(get_db)):
    return {'name': player_slug,
            'score': 1000,
            'rosters': get_rosters(db, player_slug)
            }


@app.get("/api/v1/roster/{roster_slug}/score")
async def get_roster_score(roster_slug, db=Depends(get_db)):
    return {'slug': roster_slug,
            'score': calculate_roster_score(db, roster_slug),
            }
