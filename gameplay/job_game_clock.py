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
from api_util import get_json, patch_json, post_json
from datetime import datetime, timedelta


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


def main():
    print("game clock")
    # run every minute
    # get the active game
    game = get_json("game")
    if not game:
        print("no active game")
        return

    # if the game is active deactivate it
    # if the current time is greater than the game end time
    print("current game", game)
    if game["active"]:
        end = datetime.strptime(game["end"], "%Y-%m-%dT%H:%M:%S.%f")
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
        start = datetime.strptime(game["start"], "%Y-%m-%dT%H:%M:%S.%f")
        if datetime.now() > start:
            patch_json("admin/game_status", dict(active=True))
            print("game started")


if __name__ == "__main__":
    main()
# ============= EOF =============================================
