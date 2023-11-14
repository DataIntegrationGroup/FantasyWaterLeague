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
from sqlalchemy import or_

from api.database import get_db
from api.models.game import Game, Match
from api.models.players import Roster, Player, RosterAsset, RosterScore
from api.models.assets import Asset, Score
import requests

from api.models.users import User


def retrieve_player_by_user(db, username):
    q = db.query(Player)
    q = q.join(User)
    q = q.filter(User.email == username)
    return q.one()


def retrieve_players(db):
    q = db.query(Player)
    return q.all()


def retrieve_asset(db, asset_slug):
    q = db.query(Asset)
    q = q.filter(Asset.slug == asset_slug)
    return q.one()


def retrieve_games(db, limit=2):
    q = db.query(Game)
    q = q.order_by(Game.start.desc())
    q = q.limit(limit)
    games = q.all()
    game1, game0 = None, None
    if games:
        if len(games) == 2:
            game1, game0 = games
        else:
            game0 = games[0]

    return game1, game0


def retrieve_game(db):
    q = db.query(Game)
    q = q.order_by(Game.start.desc())
    # q = q.filter(Game.active == True)
    g = q.first()
    return g


def retrieve_roster_asset(db, roster_slug, asset_slug):
    q = db.query(RosterAsset)
    q = q.filter(RosterAsset.roster_slug == roster_slug)
    q = q.filter(RosterAsset.asset_slug == asset_slug)

    return q.one()


def retrieve_roster_assets(db, roster_slug, active_game=None, prev_game=None):
    q = db.query(Roster)
    q = q.filter(Roster.slug == roster_slug)
    roster = q.one()
    ret = []
    for a in roster.assets:
        aa = a.asset
        aa.active = a.active

        aa.score = 0
        aa.prev_score = 0

        for game, attr in ((active_game, "score"), (prev_game, "prev_score")):
            if game:
                for s in sorted(aa.scores, key=lambda x: x.timestamp, reverse=True):
                    if s.game_slug == game.slug:
                        setattr(aa, attr, s.score)
                        break

        ret.append(aa)

    return sorted(ret, key=lambda x: x.slug)


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


def retrieve_match(db, roster_slug):
    q = db.query(Match)
    q = q.filter(or_(Match.roster_a == roster_slug, Match.roster_b == roster_slug))
    print('retrieve match', roster_slug, q)
    return q.one()


# update ===============================================================================
def update_roster_asset(db, roster_slug, asset_slug, payload):
    roster_asset = retrieve_roster_asset(db, roster_slug, asset_slug)
    roster_asset.active = payload.active
    db.commit()


def add_asset_score(db, asset_slug, payload):
    db.add(
        Score(asset_slug=asset_slug, score=payload.score, game_slug=payload.game_slug)
    )
    db.commit()


def add_roster_score(db, roster_slug, payload):
    print("adding roster score", payload)
    db.add(
        RosterScore(
            roster_slug=roster_slug, game_slug=payload.game_slug, score=payload.score
        )
    )
    db.commit()

# ============= EOF =============================================
