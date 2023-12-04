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
import json
import os
import random
from datetime import datetime, timedelta

import requests

from sources import USGSGageHeight, USGSDepthToWater, USGSRainGauge, NWS, COCORAHS
from database import Base, get_db, reset_database, session_factory
from models.assets import Asset, Source, AssetType
from models.game import Game
from models.players import Player, Roster, RosterAsset
from models.users import User, get_user_db, get_async_session
from rules import N_ASSETS_PER_TEAM, N_GROUNDWATER_ASSETS, N_STREAM_GAUGE_ASSETS
from schemas import UserCreate
from users import get_user_manager


def make_gw_sites(db):
    return make_usgs_sites(db,
                           USGSDepthToWater.atype,
                           USGSDepthToWater.slug,
                           USGSDepthToWater.sites_url)


def make_usgs_gageheight_sites(db):
    return make_usgs_sites(db,
                           USGSGageHeight.atype,
                           USGSGageHeight.slug,
                           USGSGageHeight.sites_url)


def make_usgs_rain_gauge_sites(db):
    return make_usgs_sites(db,
                           USGSRainGauge.atype,
                           USGSRainGauge.slug,
                           USGSRainGauge.sites_url)


def rget_features(url):
    print('getting', url)
    resp = requests.get(url)
    doc = resp.json()
    features = doc["features"]
    if features and "pagination" in doc:
        features.extend(rget_features(doc['pagination']["next"]))

    return features


def make_synoptic_mesonet_sites(db):
    def asset_gen():
        token = os.environ.get('SYNPOTIC_MESONET_TOKEN', '5491e5a6573d498ba74db68969aa0260')
        url = (f'https://api.synopticdata.com/v2/stations/metadata?'
               f'state=NM&'
               f'token={token}')
        resp = requests.get(url)
        doc = resp.json()

        for st in doc['STATION']:
            print('adding synoptic mesonet', st['STID'])
            yield dict(slug=st['STID'],
                       name=st['NAME'],
                       atype='continuous_rain_gauge',
                       source_slug='synoptic_mesonet',
                       source_identifier=st['STID'],
                       longitude=st["LONGITUDE"],
                       latitude=st["LATITUDE"])

    return make_assets(db, asset_gen)


def make_assets(db, asset_gen):
    assets = []
    for ai in asset_gen():
        a = Asset()
        a.slug = ai['slug']
        a.name = ai['name']
        a.atype = ai['atype']
        a.source_slug = ai['source_slug']
        a.source_identifier = ai['source_identifier']
        a.location = f'POINT({ai["longitude"]} {ai["latitude"]})'
        if db:
            db.add(a)
            db.commit()

        assets.append((a.slug, a.name, a.source_identifier,
                       ai['longitude'], ai['latitude']))
    return assets


def make_cocorahs_sites(db):
    def asset_gen():
        # url = ('https://data.cocorahs.org/export/exportreports.aspx?'
        #        'ReportType=Daily'
        #        '&Format=json'
        #        '&State=NM'
        #        '&ReportDateType=reportdate'
        #        '&Date=11/28/2023'
        #        '&ResponseFields=all')
        # resp = requests.get(url)
        # doc = resp.json()
        # print(doc)
        url = ('https://data.cocorahs.org/export/exportreports.aspx?'
               '&Format=json'
               '&State=NM'
               '&ReportType=Daily'
               '&ResponseFields=all')
        # url = ('https://data.cocorahs.org/export/exportreports.aspx?'
        #        # 'ReportType=Daily'
        #        '&Format=json'
        #        '&station=NM-SC-64'
        #        # '&ReportDateType=reportdate'
        #        '&StartDate=11/20/2023'
        #        '&EndDate=11/28/2023'
        #        '&ResponseFields=all')
        resp = requests.get(url)
        doc = resp.json()
        for st in doc['data']['reports']:
            yield dict(slug=st['st_num'],
                       name=st['st_name'],
                       atype='continuous_rain_gauge',
                       source_slug='cocorahs',
                       source_identifier=st['st_num'],
                       longitude=st["lng"],
                       latitude=st["lat"])

    return make_assets(db, asset_gen)


def make_nws_sites(db):
    def asset_gen():
        url = 'https://api.weather.gov/stations?limit=500&state=NM'
        features = rget_features(url)
        n = len(features)
        for i, feature in enumerate(features[:10]):
            props = feature['properties']
            # print(props['name'], props['stationIdentifier'])
            # print(feature['geometry']['coordinates'])
            source_id = props['stationIdentifier']
            if source_id.startswith('COOP'):
                continue

            if source_id in ('45171', '45179', '45211', 'A1039', 'A1041', 'A1042', 'A1045', 'A1047', 'A1048',
                             'A1049', 'A1051', 'A1052', 'A1053', 'A1054', 'A1055', 'A1059', 'A1060', 'A1062', 'A1064',
                             'A1065', 'A1067', 'A1068', 'A1069', 'A1070', 'A1072', 'A1073', 'A1076', 'A1077', 'A1080',
                             'A1082', 'A1083', 'A1084', 'A1085', 'A1086', 'A3616', 'A3633', 'A3668', 'A4018', 'A4019',
                             'A4020', 'A4021', 'A4022', 'AN317', 'AN319', 'AN814', 'AP132', 'AV695', 'Av250', 'C2125',
                             'C2615', 'C9703', 'CRNM4', 'CROM4', 'CRRM4', 'CSPM4', 'CYGM4', 'DEAM4', 'E5817', 'F7967',
                             'F9940', 'G2782', 'GDRM4', 'HUMM4', 'IONM4', 'LGOM4', 'MC110', 'MEEM4', 'MI010', 'MI016',
                             'MI110', 'MI145', 'MI200', 'MI210', 'MI220', 'MI230', 'MI240', 'MI250', 'MI257', 'MSQM4',
                             'NJNM4', 'PAUM4', 'PLGM4', 'PORM4', 'PRIM4', 'RKLM4', 'SBLM4', 'SLVM4', 'SNWM4', 'SPTM4',
                             'STRM4', 'SZCM4', 'TAPM4', 'TAWM4', 'TRRM4', 'TT199', 'WFPM4', 'WINM4'):
                continue
            # make observations api returns data for this station
            resp = requests.get(f'https://api.weather.gov/stations/{source_id}/observations/latest')
            if resp.status_code != 200:
                print(f'{i}/{n} skipping = {source_id}')
                continue
            else:
                print(f'{i}/{n} using = {source_id}')
            name = props['name']
            slug = f"{name.replace(' ', '_').lower()}-{source_id}"

            lon = feature['geometry']['coordinates'][0]
            lat = feature['geometry']['coordinates'][1]

            yield dict(slug=slug,
                       name=name,
                       atype='continuous_rain_gauge',
                       source_slug='nws',
                       source_identifier=source_id,
                       longitude=lon,
                       latitude=lat)

    return make_assets(db, asset_gen)


def make_usgs_sites(db, atype, source_slug, url):
    # cpath = f'{source_slug}.csv'
    # if os.path.isfile(cpath):
    #     print(f'using cached {cpath}')
    #     with open(cpath, 'r') as rfile:
    #         rows = []
    #         for i, line in enumerate(rfile):
    #             if not i:
    #                 continue
    #
    #             slug, name, source_id, lon, lat = line.strip().split(',')
    #             rows.append((slug, name, source_id, lon, lat))
    # else:
    def asset_gen():
        print('fetching')
        resp = requests.get(url)
        data = resp.json()['value']['timeSeries']
        for tsi in data:
            sitename = tsi['sourceInfo']['siteName']
            source_id = tsi['sourceInfo']['siteCode'][0]['value']

            name = sitename.split(',')[0].strip()
            slug = name.replace(' ', '_').lower()
            slug = f'{slug}.{atype}'
            geo = tsi['sourceInfo']['geoLocation']['geogLocation']
            lat, lon = (geo['latitude'], geo['longitude'])
            yield dict(slug=slug,
                       name=name,
                       atype=atype,
                       source_slug=source_slug,
                       source_identifier=source_id,
                       longitude=lon,
                       latitude=lat)
            # rows.append((slug, name, source_id, lon, lat))

    # with open(cpath, 'w') as wfile:
    #     wfile.write('slug,name,source_identifier,lon,lat\n')
    #     for slug, name, source_id, lon, lat in rows:
    #         wfile.write(f'{slug},{name},{source_id},{lon},{lat}\n')

    # for slug, name, source_id, lon, lat in rows:
    #     print('adding', slug, name)
    #     db.add(Asset(slug=slug,
    #                  name=name,
    #                  atype=atype,
    #                  source_slug=source_slug,
    #                  source_identifier=source_id,
    #                  location=f'POINT({lon} {lat})'))
    #     db.commit()

    # return rows
    return make_assets(db, asset_gen)


def make_draft(assets):
    assets = [a[0] for a in assets]
    random.shuffle(assets)
    while 1:
        try:
            yield assets.pop()
        except IndexError:
            break


def make_source(db, definition):
    s = Source()
    s.slug = definition.slug
    s.name = definition.name
    s.landing_url = definition.landing_url
    s.base_url = definition.base_url

    db.add(s)
    db.commit()


async def setup_demo():
    # if os.environ.get('SETUP_DEMO', '0') == '0':
    #     return
    print("setting up db")
    reset_database()

    print('setting up demo')
    db = session_factory()

    now = datetime.now()

    db.add(Game(slug='game:0',
                name='Game 0',
                start=now - timedelta(days=now.weekday() + 7),
                active=False))

    make_source(db, USGSGageHeight)
    make_source(db, USGSDepthToWater)
    make_source(db, USGSRainGauge)
    make_source(db, NWS)
    make_source(db, COCORAHS)

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
    rgs = make_usgs_rain_gauge_sites(db)
    nws = make_nws_sites(db)
    cs = make_cocorahs_sites(db)
    # mesonet = make_synoptic_mesonet_sites(db)

    db.commit()
    db.flush()

    get_user_manager_context = contextlib.asynccontextmanager(get_user_manager)
    get_async_session_context = contextlib.asynccontextmanager(get_async_session)
    get_user_db_context = contextlib.asynccontextmanager(get_user_db)

    players = (('jake', 'Jake Ross', 'Leroy Flyers'),
               ('ethan', 'Ethan', 'Melody Station Packers'),
               ('marissa', 'Marissa', 'Bevilacqua'),
               ('nels', 'Nels', 'Shedland Builders'),
               ('mattz', 'Mattz', 'PartyBoy Dancers'),
               ('rachel', 'Rachel', 'Socorro Managers'),
               ('chriscox', 'Chris Cox', 'Sandia Sonics'),
               ('crismorton', 'Cris Morton', 'South Valley Mechanics'),
               ('danlavery', 'Dan Lavery', '3D Modelers'),
               )
    for slug, name, team in players:
        async with get_async_session_context() as session:
            async with get_user_db_context(session) as user_db:
                async with get_user_manager_context(user_db) as user_manager:
                    user = await user_manager.create(UserCreate(
                        email=f'{slug}@foo.com',
                        password='foobar1234',
                        is_superuser=slug == 'jake'
                    ))

            db.add(Player(slug=slug, name=name, team_name=team, user_id=user.id))

    db.commit()
    db.flush()

    for playerargs in players:
        roster = Roster(name='main', slug=f'{playerargs[0]}.main', player_slug=playerargs[0], active=True)
        db.add(roster)
    db.commit()
    db.flush()

    nplayers = len(players)

    for n, assets, nactive in ((5, gws, 3),
                               (5, rgs, 3),
                               (10, sgs, 6),
                               (10, nws, 0),
                               (10, cs, 0)
                               ):
        draft = make_draft(assets)
        c = 0

        while 1:
            try:
                for player in players:
                    asset = next(draft)

                    db.add(RosterAsset(roster_slug=f'{player[0]}.main',
                                       active=c < nactive * nplayers,
                                       asset_slug=asset))
                    c += 1
            except StopIteration:
                break

            if c == n * nplayers:
                break

    db.commit()

    print('demo complete')


if __name__ == '__main__':
    # make_synoptic_mesonet_sites(None)
    make_cocorahs_sites(None)
# ============= EOF =============================================
