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

from google.cloud.sql.connector import Connector
from sqlalchemy import create_engine, Column, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, declared_attr
from settings import settings

print("settings.IS_LOCAL", settings.IS_LOCAL, type(settings.IS_LOCAL))
if int(settings.IS_LOCAL):
    print("SQLALCHEMY_DATABASE_URL", settings.SQLALCHEMY_DATABASE_URL)
    engine = create_engine(settings.SQLALCHEMY_DATABASE_URL)
else:
    print("INSTANCE_CONNECTION_NAME", os.environ["INSTANCE_CONNECTION_NAME"])
    connector = Connector()

    def getconn():
        conn = connector.connect(
            os.environ["INSTANCE_CONNECTION_NAME"],
            "pg8000",
            user=os.environ["DB_USER"],
            password=os.environ["DB_PASS"],
            db=os.environ["DB_NAME"],
        )
        return conn

    engine = create_engine("postgresql+pg8000://", creator=getconn)
session_factory = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


class Slugged:
    @declared_attr
    def __tablename__(cls):
        return cls.__name__.lower()

    @declared_attr
    def slug(cls):
        return Column(
            String(128), primary_key=True, unique=True, nullable=False, index=True
        )

    @declared_attr
    def name(cls):
        return Column(String(128), nullable=False, index=True)


def get_db():
    db = session_factory()
    try:
        yield db
    finally:
        db.close()


# ============= EOF =============================================
