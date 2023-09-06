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
from api.database import Base, engine, get_db


def setup_demo():
    from models import assets, players

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = next(get_db())
    for slug, name in (('continuous_groundwater', 'Continuous Groundwater'),
                       ('continuous_rain_gauge', 'Continuous Rain Gauge'),
                       ('stream_gauge', 'Stream Gauge')):
        db.add(assets.AssetType(slug=slug, name=name))
    db.commit()
    db.flush()

    for slug, name, atype in (('embudo', 'Embudo', 'stream_gauge'),
                              ('MG-030', 'MG-030', 'continuous_groundwater'),
                              ('KNM47Socorro', 'KNM47Socorro', 'continuous_rain_gauge')):
        db.add(assets.Asset(slug=slug, name=name, atype=atype))

    db.commit()
    db.flush()

    for slug, name in (('jake', 'Jake Ross'),
                       ('joe', 'Joe Blow')):
        db.add(players.Player(slug=slug, name=name))

    db.commit()
    db.flush()

    roster = players.Roster(name='main', slug='jake.main', player_slug='jake', active=True)
    db.add(roster)
    db.add(players.RosterAsset(roster_slug='jake.main', asset_slug='embudo'))
    db.add(players.RosterAsset(roster_slug='jake.main', asset_slug='MG-030'))

    db.commit()
    db.flush()

# ============= EOF =============================================
