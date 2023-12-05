# ===============================================================================
# Copyright 2023 ross
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
import itertools
import random
from datetime import datetime, timedelta

from api_util import post_json, get_json


# def new_game(slug, name):
#     start = calc_game_start()
#     post_json(
#         "admin/game", dict(slug=slug, name=name, start=start.isoformat(), active=False)
#     )
#
#
# def calc_game_start():
#     now = datetime.now()
#
#     # the game starts the following monday at 5pm
#     gamestart = now - timedelta(
#         days=now.weekday() - 7,
#         hours=now.hour - 17,
#         minutes=now.minute,
#         seconds=now.second,
#         microseconds=now.microsecond,
#     )
#     return gamestart


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
                game_slug="game:1",
            ),
        )


# ============= EOF =============================================
