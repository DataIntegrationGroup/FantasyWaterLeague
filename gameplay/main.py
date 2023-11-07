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
import os
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


def setup_demo():
    now = datetime.now()

    # the game starts the following monday at 5pm
    gamestart = now - timedelta(
        days=now.weekday() - 7,
        hours=now.hour - 17,
        minutes=now.minute,
        seconds=now.second,
        microseconds=now.microsecond,
    )

    url = f"{HOST}/api/v1/game"
    requests.post(
        url,
        json=dict(
            slug="game1", name="Game 1", start=gamestart.isoformat(), active=False
        ),
    )


def setup_rosters():
    with open("data/rosterasset.csv", "r") as rfile:
        for row in csv.reader(rfile):
            i, roster, asset, active = row
            url = f"{HOST}/api/v1/rosterasset"
            requests.post(
                url,
                json=dict(
                    roster_slug=roster,
                    asset_slug=asset,
                    active=active.lower() == "true",
                ),
            )


# run every minute
@sched.scheduled_job(
    "cron", year="*", month="*", day="*", hour="*", minute="*", second="0"
)
def game_clock():
    print("game clock")
    # run every minute
    # get the active game
    url = f"{HOST}/api/v1/game"
    resp = requests.get(url)
    if resp.ok:
        # if the game is active deactivate it
        # if the current time is greater than the game end time
        game = resp.json()
        print("current game", game)
        if game["active"]:
            end = datetime.strptime(game["end"], "%Y-%m-%dT%H:%M:%S")
            if datetime.now() > end:
                url = f"{HOST}/api/v1/game_status"
                requests.patch(url, json={"active": "false"})
                print("game over")
        else:
            # if the game is not active check if the current time is greater than the game start time
            start = datetime.strptime(game["start"], "%Y-%m-%dT%H:%M:%S")
            if datetime.now() > start:
                url = f"{HOST}/api/v1/game_status"
                requests.patch(url, json={"active": "true"})
                print("game started")


def main():
    if os.environ.get("SETUP_DEMO", "0") == "0":
        print("skipping demo setup")
    else:
        print("setup demo")
        while 1:
            try:
                requests.get(f"{HOST}/api/v1/health")
                break
            except requests.ConnectionError:
                time.sleep(1)

        setup_demo()
        # setup_rosters()

    sched.start()


if __name__ == "__main__":
    main()
