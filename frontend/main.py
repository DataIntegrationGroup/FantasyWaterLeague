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
# from fastapi import FastAPI
# from starlette.staticfiles import StaticFiles

# app = FastAPI()
# app.mount("/static", StaticFiles(directory="static"), name="static")

# from frontend.routes import views
# app.include_router(views.router)
from flask import Flask, render_template

app = Flask(__name__)

VERSION = "v1"
BASE_URL = "http://localhost:4040"


@app.get("/")
def index():
    return render_template("home.html",
                           version="v1",
                           base_url="http://localhost:4040")


@app.get("/player/<player_slug>")
def get_player_detail(player_slug):
    return render_template(
        "player.html",
        player_slug=player_slug,
        version=VERSION, base_url=BASE_URL,
    )


@app.get("/roster/<roster_slug>")
def get_roster_detail(roster_slug):
    return render_template(
        "roster.html",
        roster_slug=roster_slug, version=VERSION, base_url=BASE_URL
    )


@app.get("/assets")
def get_assets():
    return render_template(
        "assets.html",
        version=VERSION, base_url=BASE_URL,
    )


@app.get("/asset/<asset_slug>")
def get_asset_detail(asset_slug):
    return render_template(
        "asset.html",
        asset_slug=asset_slug, version=VERSION, base_url=BASE_URL,
    )

# ============= EOF =============================================
