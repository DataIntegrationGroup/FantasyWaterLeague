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
from apscheduler.schedulers.blocking import BlockingScheduler

host = os.environ.get("API_HOST", "api")
port = os.environ.get("API_PORT", "8080")

HOST = f"http://{host}:{port}"

sched = BlockingScheduler()


def new_game(slug, name):
    start = calc_game_start()
    post_json(
        "admin/game", dict(slug=slug, name=name, start=start.isoformat(), active=False)
    )


def calc_game_start():
    now = datetime.now()

    # the game starts the following monday at 5pm
    gamestart = now - timedelta(
        days=now.weekday() - 7,
        hours=now.hour - 17,
        minutes=now.minute,
        seconds=now.second,
        microseconds=now.microsecond,
    )
    return gamestart


def setup_demo():
    # create a game
    new_game("game:1", "Game 1")
    # gamestart = calc_game_start()
    # post_json('admin/game', dict(
    #     slug="game:1", name="Game 1", start=gamestart.isoformat(), active=False))


def setup_matches():
    # get random pairings
    players = get_json("players")
    pairs = list(itertools.combinations_with_replacement(players, 2))
    random.shuffle(pairs)

    playing = []
    for i, (a, b) in enumerate(pairs):
        if a["name"] == b["name"]:
            continue
        if a["name"] in playing or b["name"] in playing:
            continue

        playing.append(a["name"])
        playing.append(b["name"])
        print("setup match", a["name"], b["name"])
        post_json(
            "admin/match",
            dict(
                roster_a=f"{a['slug']}.main",
                roster_b=f"{b['slug']}.main",
                game_slug="game1",
            ),
        )


ACCESS_TOKEN = None


def get_access_token():
    global ACCESS_TOKEN
    user = os.environ.get("API_USER", "admin")
    pwd = os.environ.get("API_PASSWORD", "admin")
    if ACCESS_TOKEN is None:
        resp = requests.post(
            f"{HOST}/auth/jwt/login",
            data={"username": user, "password": pwd},
        )

        ACCESS_TOKEN = resp.json()["access_token"]
    return ACCESS_TOKEN


def post_json(path, data):
    return auth_request(path, data, "post")


def get_json(path):
    return auth_request(path)


def patch_json(path, data):
    return auth_request(path, data, "patch")


def auth_request(path, data=None, method="get"):
    func = getattr(requests, method)
    resp = func(
        make_url(path),
        json=data,
        headers={"Authorization": f"Bearer {get_access_token()}"},
    )
    if resp.ok:
        return resp.json()


def make_url(path):
    return f"{HOST}/api/v1/{path}"


# run every minute
@sched.scheduled_job(
    "cron", year="*", month="*", day="*", hour="*", minute="*", second="0"
)
def game_clock():
    print("game clock")
    # run every minute
    # get the active game

    game = get_json("game")
    if game:
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

    sched.start()


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
