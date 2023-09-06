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
from models import players


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
        score += calculate_asset_score(asset)

    return score


def calculate_asset_score(asset):
    atype = asset.asset.atype

    if atype == "stream_gauge":
        return 1000
    elif atype == "continuous_groundwater":
        return 100
    elif atype == "continuous_rain_gauge":
        return 10


# ============= EOF =============================================
