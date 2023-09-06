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
from sqlalchemy import Column, String, ForeignKey, Integer, Boolean
from sqlalchemy.orm import relationship

from api.database import Base, Slugged


class Player(Base, Slugged):
    pass


class Roster(Base, Slugged):
    player_slug = Column(String(32), ForeignKey('player.slug'), nullable=False)
    active = Column(Boolean, default=True)

    assets = relationship('RosterAsset', backref='rosters')


class RosterAsset(Base):
    __tablename__ = 'rosterasset'
    id = Column(Integer, primary_key=True)
    roster_slug = Column(String(32), ForeignKey('roster.slug'))
    asset_slug = Column(String(32), ForeignKey('asset.slug'))

    # roster = relationship('Roster', backref='assets')
    asset = relationship('Asset', backref='rosters')

# ============= EOF =============================================