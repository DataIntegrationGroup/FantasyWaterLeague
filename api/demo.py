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
import contextlib
import os
import random
from datetime import datetime, timedelta

import requests

from api.database import Base, engine, get_db
from api.models.assets import Asset, Source, AssetType
from api.models.game import Game
from api.models.players import Player, Roster, RosterAsset
from api.models.users import User, get_user_db, get_async_session
from api.rules import N_ASSETS_PER_TEAM, N_GROUNDWATER_ASSETS, N_STREAM_GAUGE_ASSETS
from api.schemas import UserCreate
from api.users import get_user_manager


def make_gw_sites(db):
    url = 'https://waterservices.usgs.gov/nwis/iv/?format=json&stateCd=nm&parameterCd=72019&siteStatus=active' \
          '&modifiedSince=P2D'
    return make_usgs_sites(db, "continuous_groundwater",
                           'usgs_nwis_depthtowater', url)


def make_usgs_discharge_sites(db):
    url = 'https://waterservices.usgs.gov/nwis/iv/?format=json&stateCd=nm&parameterCd=00060&siteStatus=active'
    return make_usgs_sites(db, 'stream_gauge',
                           'usgs_nwis_discharge',
                           url)


def make_usgs_gageheight_sites(db):
    url = 'https://waterservices.usgs.gov/nwis/iv/?format=json&stateCd=nm&parameterCd=00065&siteStatus=active'
    return make_usgs_sites(db, 'stream_gauge',
                           'usgs_nwis_gageheight',
                           url)


def make_usgs_sites(db, atype, source_slug, url):
    cpath = f'{source_slug}.csv'
    if os.path.isfile(cpath):
        print(f'using cached {cpath}')
        with open(cpath, 'r') as rfile:
            rows = []
            for i, line in enumerate(rfile):
                if not i:
                    continue

                slug, name, source_id, lon, lat = line.strip().split(',')
                rows.append((slug, name, source_id, lon, lat))
    else:
        print('fetching')
        rows = []
        resp = requests.get(url)
        data = resp.json()['value']['timeSeries']
        for tsi in data:
            sitename = tsi['sourceInfo']['siteName']
            source_id = tsi['sourceInfo']['siteCode'][0]['value']

            name = sitename.split(',')[0].strip()
            slug = name.replace(' ', '_').lower()
            geo = tsi['sourceInfo']['geoLocation']['geogLocation']
            lat, lon = (geo['latitude'], geo['longitude'])
            rows.append((slug, name, source_id, lon, lat))

        with open(cpath, 'w') as wfile:
            wfile.write('slug,name,source_identifier,lon,lat\n')
            for slug, name, source_id, lon, lat in rows:
                wfile.write(f'{slug},{name},{source_id},{lon},{lat}\n')

    for slug, name, source_id, lon, lat in rows:
        db.add(Asset(slug=slug,
                     name=name,
                     atype=atype,
                     source_slug=source_slug,
                     source_identifier=source_id,
                     location=f'POINT({lon} {lat})'))
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


async def setup_demo():
    # if os.environ.get('SETUP_DEMO', '0') == '0':
    #     return
    print("setting up db")

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    print('setting up demo')
    db = next(get_db())

    now = datetime.now()
    db.add(Game(slug='game1',
                name='Game 1',
                start=now - timedelta(days=now.weekday()),
                active=False))

    db.add(Game(slug='game0',
                name='Game 0',
                start=now - timedelta(days=now.weekday()+7),
                active=False))

    db.add(Source(slug='usgs_nwis_gageheight', name='UGSS-NWIS-GageHeight',
                  base_url='https://waterservices.usgs.gov/nwis/iv/?'
                           'parameterCd=00065'
                           '&format=json'))
    db.add(Source(slug='usgs_nwis_depthtowater', name='UGSS-NWIS-DepthToWater',
                  base_url='https://waterservices.usgs.gov/nwis/iv/?'
                           'parameterCd=72019'
                           '&format=json'))
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

    # uds = make_usgs_discharge_sites(db)
    sgs = make_usgs_gageheight_sites(db)
    gws = make_gw_sites(db)
    # uds.extend(make_weather_sites(db))
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

    get_user_manager_context = contextlib.asynccontextmanager(get_user_manager)
    get_async_session_context = contextlib.asynccontextmanager(get_async_session)
    get_user_db_context = contextlib.asynccontextmanager(get_user_db)

    for slug, name, team in (('jake', 'Jake Ross', 'Leroy Flyers'),
                             # ('ethan', 'Ethan', 'Melody Lane Packers'),
                             ('marissa', 'Marissa', 'Bevilacqua'),
            # ('nels', 'Nels', 'Shedland Builders'),
            # ('mattz', 'Mattz', 'PartyBoy Dancers'),
                             ):
        async with get_async_session_context() as session:
            async with get_user_db_context(session) as user_db:
                async with get_user_manager_context(user_db) as user_manager:
                    user = await user_manager.create(UserCreate(
                        email=f'{slug}@foo.com',
                        password='foobar1234',
                        is_superuser=False
                    ))

            db.add(Player(slug=slug, name=name, team_name=team, user_id=user.id))

    db.commit()
    db.flush()

    # players = ('jake', 'ethan', 'marissa', 'nels', 'mattz')
    players = ('jake', 'marissa')
    for player in players:
        roster = Roster(name='main', slug=f'{player}.main', player_slug=player, active=True)
        db.add(roster)
    db.commit()
    db.flush()

    for n, assets in ((5, gws),
                      (15, sgs)):
        draft = make_draft(assets)
        c = 0

        while 1:
            try:
                for player in players:
                    asset = next(draft)
                    db.add(RosterAsset(roster_slug=f'{player}.main', asset_slug=asset))
                    c += 1
            except StopIteration:
                break

            if c == n * len(players):
                break

    db.commit()

    print('demo complete')

# ============= EOF =============================================
