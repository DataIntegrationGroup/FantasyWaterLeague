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
from sqlalchemy import Column, String, ForeignKey, Integer, Boolean, UUID, TIMESTAMP, func, Float
from sqlalchemy.orm import relationship

from api.database import Base, Slugged


class Player(Base, Slugged):
    team_name = Column(String(128), nullable=False)

    user_id = Column(UUID, ForeignKey("user.id"), nullable=False)

    user = relationship("User", backref="player", uselist=False)
    rosters = relationship("Roster", backref="player")


class Roster(Base, Slugged):
    player_slug = Column(String(128), ForeignKey("player.slug"), nullable=False)
    active = Column(Boolean, default=True)

    assets = relationship("RosterAsset", backref="rosters")


class RosterAsset(Base):
    __tablename__ = "rosterasset"
    id = Column(Integer, primary_key=True)
    roster_slug = Column(String(128), ForeignKey("roster.slug"))
    asset_slug = Column(String(128), ForeignKey("asset.slug"))

    active = Column(Boolean, default=False)

    # roster = relationship('Roster', backref='assets')
    asset = relationship("Asset", backref="rosters")


class RosterScore(Base):
    __tablename__ = "rosterscore"
    id = Column(Integer, primary_key=True)
    roster_slug = Column(String(128), ForeignKey("roster.slug"))
    game_slug = Column(String(128), ForeignKey("game.slug"))

    score = Column(Float, default=0)
    timestamp = Column(TIMESTAMP, nullable=False, default=func.now())

    roster = relationship("Roster", backref="scores")
# ============= EOF =============================================
