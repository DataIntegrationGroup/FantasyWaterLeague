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
import os
import time

import requests
from numpy import array
from apscheduler.schedulers.blocking import BlockingScheduler

HOST = "http://host.docker.internal:4040"


def get_json(url):
    print("getting", url)
    resp = requests.get(url)
    if resp.ok:
        return resp.json()


def update_score(asset_slug, score):
    requests.put(f"{HOST}/api/v1/asset/{asset_slug}/score", json={"score": score})


def calculate_asset_score(asset):
    atype = asset["atype"]
    source = asset["source_slug"]
    # source_id = asset['source_identifier']
    u = get_json(f"{HOST}/api/v1/asset/{asset['slug']}/data_url")
    if u:
        # get data from source
        data = get_data(u["scoring_url"])
        return score_data(source, atype, data)


def get_data(url):
    print("------- get data", url)
    resp = requests.get(url)
    return [d for d in resp.json()["value"]["timeSeries"][0]["values"][0]["value"]]


def score_data(source, atype, data):
    score = 0
    if data:
        if atype == "stream_gauge":
            score = score_stream_gauge(data)
        elif atype == "continuous_groundwater":
            score = score_continuous_groundwater(data)
        elif atype == "continuous_rain_gauge":
            score = score_continuous_rain_gauge(data)

    return max(0, score)


def score_timeseries(data):
    vs = array([float(d["value"]) for d in data])
    return max(vs) - vs[0]


def score_stream_gauge(data):
    return score_timeseries(data)


def score_continuous_groundwater(data):
    vs = array([float(d["value"]) for d in data])
    score = vs[0] - min(vs)
    return 20 * score


def score_continuous_rain_gauge(data):
    return 10 * score_timeseries(data)


sched = BlockingScheduler()


@sched.scheduled_job("cron", hour=15)
def calculate_scores():
    data = get_json(f"{HOST}/api/v1/players")
    print("starting scoring")
    st = time.time()
    for player in data:
        data = get_json(f'{HOST}/api/v1/roster/{player["slug"]}.main')
        for asset in data:
            try:
                score = calculate_asset_score(asset)
            except Exception as e:
                print("Exception calculating score for", asset["slug"])
                continue

            update_score(asset["slug"], score)

    et = time.time() - st
    print(f"scoring complete {et:0.3f}s")


if __name__ == "__main__":
    if os.environ.get("CALCULATE_SCORES", "0") == "0":
        print(
            "**** You must set the environment variable CALCULATE_SCORES=1 to run the scorer scheduler ****"
        )
        exit(0)

    print("starting scorer schelduler")
    calculate_scores()
    sched.start()
