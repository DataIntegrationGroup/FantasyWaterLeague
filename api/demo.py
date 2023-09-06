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

import requests

from api.database import Base, engine, get_db
from models import assets, players


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
            'https://waterservices.usgs.gov/nwis/iv/?format=json&stateCd=nm&parameterCd=00060&siteStatus=all')
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
        db.add(assets.Asset(slug=slug,
                            name=name,
                            atype='stream_gauge',
                            source_slug='usgs_nwis_discharge',
                            source_identifier=source_id))
        db.commit()



def setup_demo():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = next(get_db())

    db.add(assets.Source(slug='usgs_nwis_discharge', name='UGSS-NWIS-Discharge',
                         base_url='https://waterservices.usgs.gov/nwis/iv/?'
                                  'parameterCd=00060'
                                  '&format=json'
                                  '&period=P7D'
                                  '&sites='))

    db.add(assets.Source(slug='test',
                         name='Test',
                         base_url='https://foo.test.com'))
    db.commit()
    db.flush()

    for slug, name in (('continuous_groundwater', 'Continuous Groundwater'),
                       ('continuous_rain_gauge', 'Continuous Rain Gauge'),
                       ('stream_gauge', 'Stream Gauge')):
        db.add(assets.AssetType(slug=slug, name=name))

    db.commit()
    db.flush()

    make_usgs_discharge_sites(db)

    # for slug, name, atype, source_slug, source_identifier in (
    #         ('embudo', 'Embudo', 'stream_gauge', 'usgs_nwis_discharge', '08279000'),
    #         ('costilla_creek', 'COSTILLA CREEK ABOVE COSTILLA DAM', 'stream_gauge', 'usgs_nwis_discharge', '08252500'),
    #         ('casias_creek', 'CASIAS CREEK NEAR COSTILLA', 'stream_gauge', 'usgs_nwis_discharge', '08253000'),
    #                           ('MG-030', 'MG-030', 'continuous_groundwater', 'test', 'MG-030'),
    #                           ('KNM47Socorro', 'KNM47Socorro', 'continuous_rain_gauge', 'test', 'KNM47Socorro')):
    #     db.add(assets.Asset(slug=slug,
    #                         name=name,
    #                         atype=atype,
    #                         source_slug=source_slug,
    #                         source_identifier=source_identifier))

    db.commit()
    db.flush()

    for slug, name in (('jake', 'Jake Ross'),
                       ('joe', 'Joe Blow')):
        db.add(players.Player(slug=slug, name=name))

    db.commit()
    db.flush()

    roster = players.Roster(name='main', slug='jake.main', player_slug='jake', active=True)
    db.add(roster)
    db.add(players.RosterAsset(roster_slug='jake.main', asset_slug='embudo_creek_at_dixon'))
    db.add(players.RosterAsset(roster_slug='jake.main', asset_slug='rio_grande_del_rancho_near_talpa'))

    db.commit()
    db.flush()

# ============= EOF =============================================
