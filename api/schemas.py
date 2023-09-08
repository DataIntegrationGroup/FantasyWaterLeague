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

from typing import Optional

from pydantic import BaseModel, Field
from pydantic import BaseModel, create_model


class myBaseModel(BaseModel):
    @classmethod
    def with_fields(cls, **field_definitions):
        return create_model("ModelWithFields", __base__=cls, **field_definitions)


class ORMBaseModel(myBaseModel):
    class Config:
        # orm_mode = True
        from_attributes = True
        populate_by_name = True


class NamedModel(ORMBaseModel):
    name: str


class Player(NamedModel):
    slug: str
    score: float = Field(default=0)


class Asset(ORMBaseModel):
    slug: str
    atype: str
    source_slug: str
    source_identifier: str
    source_url: str
    active: bool


# ============= EOF =============================================
