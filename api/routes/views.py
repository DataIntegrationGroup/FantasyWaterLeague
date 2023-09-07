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

from fastapi import APIRouter
from starlette.requests import Request
from starlette.templating import Jinja2Templates

router = APIRouter(prefix="")

BASE_DIR = Path(__file__).resolve().parent.parent
templates = Jinja2Templates(directory=str(Path(BASE_DIR, "templates")))

version = "v1"


@router.get("/")
async def root(request: Request):
    """
    return the main page

    :return:
    """
    return templates.TemplateResponse(
        "home.html", {"request": request, "version": version}
    )


@router.get("/player/{player_slug}")
async def get_player_detail(request: Request, player_slug):
    return templates.TemplateResponse(
        "player.html",
        {"request": request, "player_slug": player_slug, "version": version},
    )


@router.get("/roster/{roster_slug}")
async def get_roster_detail(request: Request, roster_slug):
    return templates.TemplateResponse(
        "roster.html",
        {"request": request, "roster_slug": roster_slug, "version": version},
    )


@router.get("/assets")
async def get_assets(request: Request):
    return templates.TemplateResponse(
        "assets.html",
        {"request": request, "version": version},
    )


@router.get("/asset/{asset_slug}")
async def get_asset_detail(request: Request, asset_slug):
    return templates.TemplateResponse(
        "asset.html",
        {"request": request, "asset_slug": asset_slug, "version": version},
    )


# ============= EOF =============================================
