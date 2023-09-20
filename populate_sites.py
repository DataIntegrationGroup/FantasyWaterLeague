from pprint import pprint

import requests


def rget_features(url):
    print("getting", url)
    resp = requests.get(url)
    doc = resp.json()
    features = doc["features"]
    if features and "pagination" in doc:
        features.extend(rget_features(doc["pagination"]["next"]))

    return features


def nws():
    url = "https://api.weather.gov/stations?limit=500&state=NM"
    features = rget_features(url)
    for feature in features:
        props = feature["properties"]
        print(props["name"], props["stationIdentifier"])
        print(feature["geometry"]["coordinates"])


def streamgauges():
    resp = requests.get(
        "https://waterservices.usgs.gov/nwis/iv/?format=json&stateCd=nm&parameterCd=00060&siteStatus=active"
    )
    data = resp.json()["value"]["timeSeries"]
    for tsi in data:
        sitename = tsi["sourceInfo"]["siteName"]
        print(sitename, tsi["sourceInfo"]["siteCode"][0]["value"])
        print(tsi["sourceInfo"]["geoLocation"]["geogLocation"]["latitude"])


def gw():
    # resp = requests.get(
    #     'https://waterdata.usgs.gov/nm/nwis/current?PARAmeter_cd=STATION_NM,DATETIME,72019'
    # )
    # print(resp.json())
    # return

    # resp = requests.get(
    #     "https://waterservices.usgs.gov/nwis/iv/?format=json&stateCd=nm&siteStatus=all&siteType=gw&parameterCd=72019"
    # )
    base = "https://waterservices.usgs.gov/nwis/iv/?format=json&stateCd=nm"
    url = f"{base}&siteTypeCd=GW&parameterCd=72019&period=P7D&modifiedSince=P1D"
    resp = requests.get(url)
    data = resp.json()["value"]["timeSeries"]
    sites = []
    print(len(data))
    return

    for tsi in data:
        # print(tsi)
        sitename = tsi["sourceInfo"]["siteName"]
        siteid = tsi["sourceInfo"]["siteCode"][0]["value"]
        print(sitename, siteid)
        # break
        resp = requests.get(
            f"https://waterservices.usgs.gov/nwis/iv/?format=json&site={siteid}&period=P7D&parameterCd=72019"
        )

        data = resp.json()["value"]["timeSeries"][0]["values"][0]["value"]
        if data:
            print(len(data), data)
            sites.append((sitename, siteid))
    print(len(sites))


if __name__ == "__main__":
    # streamgauges()
    # gw()
    nws()
