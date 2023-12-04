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
import csv
import itertools
import os
import random
import time
import traceback
from datetime import datetime, timedelta

import requests
from numpy import array

from api_util import patch_json, get_json
from game_play import new_game, setup_demo, setup_matches
from scoring import calculate_asset_score, update_score, update_roster_score, calculate_previous_scores
from scheduler import scheduler

# run every hour
@scheduler.scheduled_job("cron", minute=0)
def calculate_scores():
    # access_token = get_access_token()
    game = get_json("game")
    if not game:
        print('no active game')
        return

    data = get_json(f"players")
    print("starting scoring")
    st = time.time()
    for player in data:
        data = get_json(f'roster/{player["slug"]}.main')
        player_score = 0
        for asset in data:
            try:
                score = calculate_asset_score(asset)
            except Exception as e:
                print("Exception calculating score for", asset["slug"])
                continue

            update_score(asset["slug"], score, "game:1")
            if asset["active"]:
                player_score += score or 0

        update_roster_score(
            game['slug'], f"{player['slug']}.main", player_score
        )

    et = time.time() - st
    print(f"scoring complete {et:0.3f}s")


# run every minute
@scheduler.scheduled_job(
    "cron", second="0"
)
def game_clock():
    print("game clock")
    # run every minute
    # get the active game
    game = get_json("game")
    if not game:
        print('no active game')
        return

    # if the game is active deactivate it
    # if the current time is greater than the game end time
    print("current game", game)
    if game["active"]:
        end = datetime.strptime(game["end"], "%Y-%m-%dT%H:%M:%S")
        now = datetime.now()

        for count in [30, 20, 10, 5, 2, 1]:
            if now > end - timedelta(minutes=count):
                print(f"game ending in {count} minutes")
                break

        if now > end:
            patch_json("admin/game_status", dict(active=False))
            print("game over")

            # create a new game
            idx = int(game["slug"].split(":")[1]) + 1
            slug = f"game:{idx}"
            name = f"Game {idx}"
            new_game(slug, name)
    else:
        # if the game is not active check if the current time is greater than the game start time
        start = datetime.strptime(game["start"], "%Y-%m-%dT%H:%M:%S")
        if datetime.now() > start:
            patch_json("admin/game_status", dict(active=True))
            print("game started")


def main():
    if os.environ.get("SETUP_GAMEPLAY_DEMO", "0") == "0":
        print("skipping demo setup")
    else:
        print("setup demo")
        while 1:
            try:
                get_json("health")
                break
            except requests.ConnectionError:
                time.sleep(1)

        setup_demo()
        setup_matches()
        # setup_rosters()

    if os.environ.get("CALCULATE_SCORES", "0") == "0":
        print(
            "**** You must set the environment variable CALCULATE_SCORES=1 to run the scorer scheduler ****"
        )

    if os.environ.get("CALCULATE_PREVIOUS_SCORES", "0") == "1":
        calculate_previous_scores()

    scheduler.start()


if __name__ == "__main__":
    main()

# ============= EOF =============================================
# def setup_rosters():
#     with open("data/rosterasset.csv", "r") as rfile:
#         for row in csv.reader(rfile):
#             i, roster, asset, active = row
#             url = f"{HOST}/api/v1/rosterasset"
#             requests.post(
#                 url,
#                 json=dict(
#                     roster_slug=roster,
#                     asset_slug=asset,
#                     active=active.lower() == "true",
#                 ),
#             )
