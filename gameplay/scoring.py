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
import traceback

import requests
from numpy import array
from api_util import put_json, get_json


# def get_json(url, access_token=None):
#     print("getting", url)
#     headers = {}
#     if access_token:
#         headers = {"Authorization": f"Bearer {access_token}"}
#
#     resp = requests.get(url, headers=headers)
#     if resp.ok:
#         return resp.json()


def update_score(asset_slug, score, game):
    # resp = requests.put(
    #     f"{settings.HOST}/api/v1/asset/{asset_slug}/score",
    #     json={"score": score, "game_slug": game},
    #     headers={"Authorization": f"Bearer {access_token}"},
    # )
    resp = put_json(f"asset/{asset_slug}/score", dict(score=score, game_slug=game))
    print("update score response", score, resp.status_code)


def calculate_asset_score(asset, url="scoring_url"):
    atype = asset["atype"]
    source = asset["source_slug"]
    # source_id = asset['source_identifier']
    u = get_json(f"asset/{asset['slug']}/data_url")
    if u:
        # get data from source
        data = get_data(source, u[url])
        return score_data(source, atype, data)


def get_data(source, url):
    print("------- get data", url)
    resp = requests.get(url)
    d = []
    if resp.status_code == 200:
        data = resp.json()
        if source.startswith("usgs"):
            d = extract_usgs_data(data)
        elif source.startswith("cocorahs"):
            d = extract_cocorahs_data(data)
        else:
            d = extract_nws_data(data)

    return d


def extract_cocorahs_data(data):
    reports = data["data"]["reports"]
    return [{"value": r["totalpcpn"]} for r in reports]


def extract_nws_data(data):
    features = data["features"]

    def extract(fi):
        props = fi["properties"]["precipitationLast3Hours"]
        v = props["value"] or 0
        return {"value": v / 25.4 if props["unitCode"] == "wmoUnit:mm" else v}

    return [extract(f) for f in features]


def extract_usgs_data(data):
    ret = [d for d in data["value"]["timeSeries"][0]["values"][0]["value"]]
    return ret


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
    # filter out 0 depth to water values
    vs = vs[vs > 0]

    score = vs[0] - min(vs)
    return 20 * score


def score_continuous_rain_gauge(data):
    vs = array([float(d["value"]) for d in data])

    return 10 * sum(vs)


def update_roster_score(game_slug, roster_slug, score):
    print("updating roster score", game_slug, roster_slug, score)
    # resp = requests.put(
    #     f"{settings.HOST}/api/v1/score/roster/{roster_slug}",
    #     json={"game_slug": game_slug, "score": round(float(score), 2)},
    #     headers={"Authorization": f"Bearer {access_token}"},
    # )
    resp = put_json(
        f"score/roster/{roster_slug}",
        dict(game_slug=game_slug, score=round(float(score), 2)),
    )
    if resp.status_code == 422:
        print("update roster score response", resp.status_code)
        print(resp.json())


def calculate_previous_scores():
    data = get_json("players")
    print("starting scoring")
    st = time.time()
    for player in data:
        data = get_json('roster/{player["slug"]}.main')
        for asset in data:
            try:
                score = calculate_asset_score(asset, url="prev_url")
            except Exception as e:
                print("Exception calculating score for", asset["slug"])
                traceback.print_exc()
                continue

            update_score(asset["slug"], score, "game:0")

    et = time.time() - st
    print(f"scoring complete {et:0.3f}s")


# if __name__ == "__main__":
#     if os.environ.get("CALCULATE_SCORES", "0") == "0":
#         print(
#             "**** You must set the environment variable CALCULATE_SCORES=1 to run the scorer scheduler ****"
#         )
#         exit(0)
#
#     if os.environ.get("CALCULATE_PREVIOUS_SCORES", "0") == "1":
#         calculate_previous_scores()

# print("starting scorer schelduler")
# calculate_scores()
# sched.start()

# ============= EOF =============================================
