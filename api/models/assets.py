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
from datetime import datetime

from sqlalchemy import Column, String, ForeignKey, Float, TIMESTAMP, text, DateTime, func
from sqlalchemy.orm import declared_attr, relationship
from geoalchemy2.shape import to_shape
from geoalchemy2 import Geometry

from api.database import Base, Slugged


class Asset(Base, Slugged):
    atype = Column(String(32), ForeignKey("assettype.slug"), nullable=False)
    source_slug = Column(String(32), ForeignKey("source.slug"), nullable=False)
    source_identifier = Column(String(32), nullable=False)

    location = Column(Geometry("POINT", srid=4326), nullable=True)

    source = relationship("Source", backref="assets")

    score = Column(Float, default=0)
    score_timestamp = Column(TIMESTAMP, server_default=func.now(), onupdate=func.current_timestamp())

    @property
    def source_url(self):
        return f"{self.source.base_url}{self.source_identifier}"

    @property
    def geometry(self):
        point = to_shape(self.location)
        return {"coordinates": [float(point.x), float(point.y)], "type": "Point"}

    @property
    def latitude(self):
        return to_shape(self.location).y

    @property
    def longitude(self):
        return to_shape(self.location).x


class Source(Base, Slugged):
    base_url = Column(String(128), nullable=False)


class AssetType(Base, Slugged):
    pass


# ============= EOF =============================================
