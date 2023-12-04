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
class USGSBase:
    location_base =  'https://waterdata.usgs.gov/monitoring-location/{source_id:}/#'
    parameter_code = None
    def __init__(self, slug, name, parameter_code, atype):
        self.slug = slug
        self.name = name
        self.atype = atype

        self.landing_url = f'{self.location_base}parameterCode={parameter_code}&period=P7D&showMedian=true'
        self.base_url = f'https://waterservices.usgs.gov/nwis/iv/?parameterCd={parameter_code}&format=json'
        self.sites_url = (f'https://waterservices.usgs.gov/nwis/iv/?'
                         f'format=json'
                         f'&stateCd=nm'
                         f'&parameterCd={parameter_code}'
                         f'&modifiedSince=P2D')


USGSGageHeight = USGSBase('usgs_nwis_gageheight', 'USGS NWIS Gage Height', '00065', 'stream_gauge')
USGSDepthToWater = USGSBase('usgs_nwis_depthtowater', 'USGS NWIS Depth to Water', '72019', 'continuous_groundwater')
USGSRainGauge = USGSBase('usgs_nwis_rain_gauge', 'USGS NWIS Rain Gauge', '00045', 'continuous_rain_gauge')

class _NWS:
    slug = 'nws'
    name = 'National Weather Service'
    base_url = 'https://api.weather.gov/stations/{source_id:}/observations'
    landing_url = 'https://api.weather.gov/stations/{source_id:}/observations'


class _COCORAHS:
    slug = 'cocorahs'
    name = 'COCORAHS'

    landing_url = 'https://dex.cocorahs.org'
    base_url = 'https://data.cocorahs.org/export/exportreports.aspx?'
    'Format=json'
    '&ResponseFields=all'
    '&station={source_id:}'
    '&ReportType=Daily'
    '&StartDate={start:%m/%d/%Y}'
    '&EndDate={end:%m/%d/%Y}'

NWS = _NWS()
COCORAHS = _COCORAHS()
# ============= EOF =============================================
