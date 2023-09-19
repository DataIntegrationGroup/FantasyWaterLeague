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


N_ASSETS_PER_TEAM = 20
N_ASSETS_PER_LINEUP = 12

N_GROUNDWATER_ASSETS = 3
N_STREAM_GAUGE_ASSETS = 6
N_RAIN_GAUGE_ASSETS = 3


def validate_team(assets):
    n = len(assets)
    return n == N_ASSETS_PER_TEAM, n


def validate_lineup(lineup):
    n = len(lineup)
    return n == N_ASSETS_PER_LINEUP, n, N_ASSETS_PER_LINEUP


def validate_groundwater(assets):
    gws = [a for a in assets if a.atype == "continuous_groundwater"]
    n = len(gws)
    return n == N_GROUNDWATER_ASSETS, n, N_GROUNDWATER_ASSETS


def validate_stream_gauge(assets):
    sgs = [a for a in assets if a.atype == "stream_gauge"]
    n = len(sgs)
    return n == N_STREAM_GAUGE_ASSETS, n, N_STREAM_GAUGE_ASSETS


def validate_rain_gauge(assets):
    rgs = [a for a in assets if a.atype == "continuous_rain_gauge"]
    n = len(rgs)
    return n == N_RAIN_GAUGE_ASSETS, n, N_RAIN_GAUGE_ASSETS


# ============= EOF =============================================
