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
import random

import requests

from api.database import Base, engine, get_db
from api.models.assets import Asset, Source, AssetType
from api.models.players import Player, Roster, RosterAsset


def make_usgs_discharge_sites(db):
    if os.path.isfile('usgs_discharge_sites.csv'):
        print('usinga asdfasdf')
        with open('usgs_discharge_sites.csv', 'r') as rfile:
            rows = []
            for line in rfile:
                slug, name, source_id = line.strip().split(',')
                rows.append((slug, name, source_id))
    else:
        print('fetching')
        rows = []
        resp = requests.get(
            'https://waterservices.usgs.gov/nwis/iv/?format=json&stateCd=nm&parameterCd=00060&siteStatus=active')
        data = resp.json()['value']['timeSeries']
        for tsi in data:
            sitename = tsi['sourceInfo']['siteName']
            source_id = tsi['sourceInfo']['siteCode'][0]['value']

            name = sitename.split(',')[0].strip()
            slug = name.replace(' ', '_').lower()
            rows.append((slug, name, source_id))

        with open('usgs_discharge_sites.csv', 'w') as wfile:
            wfile.write('slug,name,source_identifier\n')
            for slug, name, source_id in rows:
                wfile.write(f'{slug},{name},{source_id}\n')

    for slug, name, source_id in rows:
        db.add(Asset(slug=slug,
                     name=name,
                     atype='stream_gauge',
                     source_slug='usgs_nwis_discharge',
                     source_identifier=source_id))
        db.commit()

    return rows


def make_draft(assets):
    assets = [a[0] for a in assets]
    random.shuffle(assets)
    while 1:
        try:
            yield assets.pop()
        except IndexError:
            break


def setup_demo():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = next(get_db())

    db.add(Source(slug='usgs_nwis_discharge', name='UGSS-NWIS-Discharge',
                  base_url='https://waterservices.usgs.gov/nwis/iv/?'
                           'parameterCd=00060'
                           '&format=json'
                           '&period=P7D'
                           '&sites='))

    db.add(Source(slug='test',
                  name='Test',
                  base_url='https://foo.test.com'))
    db.commit()
    db.flush()

    for slug, name in (('continuous_groundwater', 'Continuous Groundwater'),
                       ('continuous_rain_gauge', 'Continuous Rain Gauge'),
                       ('stream_gauge', 'Stream Gauge')):
        db.add(AssetType(slug=slug, name=name))

    db.commit()
    db.flush()

    uds = make_usgs_discharge_sites(db)

    # for slug, name, atype, source_slug, source_identifier in (
    #         ('embudo', 'Embudo', 'stream_gauge', 'usgs_nwis_discharge', '08279000'),
    #         ('costilla_creek', 'COSTILLA CREEK ABOVE COSTILLA DAM', 'stream_gauge', 'usgs_nwis_discharge', '08252500'),
    #         ('casias_creek', 'CASIAS CREEK NEAR COSTILLA', 'stream_gauge', 'usgs_nwis_discharge', '08253000'),
    #                           ('MG-030', 'MG-030', 'continuous_groundwater', 'test', 'MG-030'),
    #                           ('KNM47Socorro', 'KNM47Socorro', 'continuous_rain_gauge', 'test', 'KNM47Socorro')):
    #     db.add(Asset(slug=slug,
    #                         name=name,
    #                         atype=atype,
    #                         source_slug=source_slug,
    #                         source_identifier=source_identifier))

    db.commit()
    db.flush()

    for slug, name in (('jake', 'Jake Ross'),
                       ('ethan', 'Ethan'),
                       ('marissa', 'Marissa'),
                       ('nels', 'Nels'),
                       ('mattz', 'Mattz'),
                       ):
        db.add(Player(slug=slug, name=name))

    db.commit()
    db.flush()

    players = ('jake', 'ethan', 'marissa', 'nels', 'mattz')
    for player in players:
        roster = Roster(name='main', slug=f'{player}.main', player_slug=player, active=True)
        db.add(roster)
    db.commit()
    db.flush()

    draft = make_draft(uds)
    c = 0
    n_per_team = 20
    while 1:
        try:
            for player in players:
                asset = next(draft)
                db.add(RosterAsset(roster_slug=f'{player}.main', asset_slug=asset))
                c += 1
        except StopIteration:
            break

        if c == n_per_team * len(players):
            break

    db.commit()

# ============= EOF =============================================
