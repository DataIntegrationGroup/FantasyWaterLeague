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

from numpy import array
from models import players, assets
import requests


def get_asset(db, asset_slug):
    q = db.query(assets.Asset)
    q = q.filter(assets.Asset.slug == asset_slug)
    return q.one()


def get_assets(db, roster_slug):
    q = db.query(players.Roster)
    q = q.filter(players.Roster.slug == roster_slug)
    roster = q.one()
    return [a.asset for a in roster.assets]


def get_rosters(db, player_slug):
    """
    return a list of dicts with keys
    slug
    type
    """
    q = db.query(players.Roster)
    q = q.filter(players.Roster.player_slug == player_slug)
    q = q.filter(players.Roster.active.is_(True))
    return q.all()


def calculate_player_score(db, player_slug):
    return 1


def calculate_roster_score(db, roster_slug):
    q = db.query(players.Roster)
    q = q.filter(players.Roster.slug == roster_slug)
    roster = q.one()

    score = 0
    for asset in roster.assets:
        score += calculate_asset_score(asset.asset)

    return score


def calculate_asset_score(asset):
    atype = asset.atype
    source = asset.source
    source_id = asset.source_identifier

    # get data from source
    data = get_data(source, source_id)
    return score_data(source, atype, data)


def get_data(source, source_id):
    resp = requests.get(f'{source.base_url}{source_id}')

    return [d for d in resp.json()['value']['timeSeries'][0]['values'][0]['value']]
    # if atype == "stream_gauge":
    #     return
    # elif atype == "continuous_groundwater":
    #     return 100
    # elif atype == "continuous_rain_gauge":
    #     return 10


def score_data(source, atype, data):
    score = 0
    if source.slug == "usgs_nwis_discharge":
        vs = array([float(d['value']) for d in data])
        vs = vs-vs[0]
        score = max(0, sum(vs))

    return score
# ============= EOF =============================================
