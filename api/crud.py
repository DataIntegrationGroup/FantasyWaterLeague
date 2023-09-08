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

from api.database import get_db
from api.models.players import Roster, Player, RosterAsset
from api.models.assets import Asset
import requests


def retrieve_players(db):
    q = db.query(Player)
    return q.all()


def retrieve_asset(db, asset_slug):
    q = db.query(Asset)
    q = q.filter(Asset.slug == asset_slug)
    return q.one()


def retrieve_roster_asset(db, roster_slug, asset_slug):
    q = db.query(RosterAsset)
    q = q.filter(RosterAsset.roster_slug == roster_slug)
    q = q.filter(RosterAsset.asset_slug == asset_slug)

    return q.one()


def retrieve_roster_assets(db, roster_slug):
    q = db.query(Roster)
    q = q.filter(Roster.slug == roster_slug)
    roster = q.one()
    ret = []
    for a in roster.assets:
        aa = a.asset
        aa.active = a.active
        ret.append(aa)

    return ret


def retrieve_rosters(db, player_slug):
    """
    return a list of dicts with keys
    slug
    type
    """
    q = db.query(Roster)
    q = q.filter(Roster.player_slug == player_slug)
    q = q.filter(Roster.active.is_(True))
    return q.all()


# update ===============================================================================
def update_roster_asset(db, roster_slug, asset_slug, payload):
    roster_asset = retrieve_roster_asset(db, roster_slug, asset_slug)
    roster_asset.active = payload.active
    db.commit()


def update_asset(db, asset_slug, payload):
    asset = retrieve_asset(db, asset_slug)
    asset.score = payload.score
    db.commit()


# ============= EOF =============================================
