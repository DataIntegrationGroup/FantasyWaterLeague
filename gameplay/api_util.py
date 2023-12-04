# ===============================================================================
# Copyright 2023 ross
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
import settings

ACCESS_TOKEN = None


def get_access_token():
    # use api_key to get access token
    global ACCESS_TOKEN
    url = "http://fief.newmexicowaterdata.org/admin/api"
    token = get_json(url)
    if ACCESS_TOKEN is None:
        ACCESS_TOKEN = token["access_token"]

    return ACCESS_TOKEN


def post_json(path, data):
    return auth_request(path, data, "post")


def get_json(path):
    return auth_request(path)


def patch_json(path, data):
    return auth_request(path, data, "patch")


def put_json(path, data):
    return auth_request(path, data, "put")


def auth_request(path, data=None, method="get"):
    func = getattr(requests, method)
    if path.startswith("http"):
        url = path
    else:
        url = make_url(path)

    resp = func(
        url,
        json=data,
        headers={"Authorization": f"Bearer {get_access_token()}"},
    )
    if resp.ok:
        return resp.json()
    elif resp.status_code == 401:
        global ACCESS_TOKEN
        ACCESS_TOKEN = None

        return auth_request(path, data, method)


def make_url(path):
    return f"{settings.HOST}/api/v1/{path}"


# ============= EOF =============================================
