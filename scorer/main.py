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
import time

import requests
from numpy import array
from apscheduler.schedulers.blocking import BlockingScheduler

HOST = 'http://host.docker.internal:4040'


def get_json(url):
    print('getting', url)
    resp = requests.get(url)
    if resp.ok:
        return resp.json()


def update_score(asset_slug, score):
    requests.put(f'{HOST}/api/v1/asset/{asset_slug}/score', json={'score': score})


def calculate_asset_score(asset):
    atype = asset['atype']
    source = asset['source_slug']
    # source_id = asset['source_identifier']

    # get data from source
    data = get_data(asset['source_url'])
    return score_data(source, atype, data)


def get_data(url):
    resp = requests.get(url)
    return [d for d in resp.json()["value"]["timeSeries"][0]["values"][0]["value"]]


def score_data(source, atype, data):
    score = 0
    if source == "usgs_nwis_discharge":
        if data:
            vs = array([float(d["value"]) for d in data])
            vs = (vs - vs[0]) / vs[0]
            score = max(0, sum(vs))

    return score


sched = BlockingScheduler()


@sched.scheduled_job('cron', hour=15)
def calculate_scores():
    data = get_json(f'{HOST}/api/v1/players')
    print('starting scoring')
    st = time.time()
    for player in data:
        data = get_json(f'{HOST}/api/v1/roster/{player["slug"]}.main')
        for asset in data:
            try:
                score = calculate_asset_score(asset)
            except Exception as e:
                print('Exception calculating score for', asset['slug'])
                continue

            update_score(asset['slug'], score)

    et = time.time() - st
    print(f'scoring complete {et:0.3f}s')


if __name__ == '__main__':
    print('starting scorer schelduler')
    calculate_scores()
    sched.start()
