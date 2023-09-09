from pprint import pprint

import requests


def main():
    resp = requests.get(
        "https://waterservices.usgs.gov/nwis/iv/?format=json&stateCd=nm&parameterCd=00060&siteStatus=active"
    )
    data = resp.json()["value"]["timeSeries"]
    for tsi in data:
        sitename = tsi["sourceInfo"]["siteName"]
        print(sitename, tsi["sourceInfo"]["siteCode"][0]["value"])
        print(tsi["sourceInfo"]["geoLocation"]["geogLocation"]["latitude"])


if __name__ == "__main__":
    main()
