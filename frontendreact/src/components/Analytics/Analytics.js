import {useEffect, useRef, useState} from "react";
import {api_getJson, retrieveItems} from "../../util";
import {settings} from "../../settings";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import {Hourglass, Oval} from "react-loader-spinner";

export default function Analytics(){
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [lng, setLng] = useState(-106.5);
    const [lat, setLat] = useState(34.35);
    const [zoom, setZoom] = useState(6.1);

    const [loading, setLoading] = useState(true)

    const setupMap = () => {
        api_getJson(settings.BASE_API_URL+'/mapboxtoken')
            .then(data=> {
                mapboxgl.accessToken = data.token
                if (map.current) return; // initialize map only once
                map.current = new mapboxgl.Map({
                    container: mapContainer.current,
                    style: 'mapbox://styles/mapbox/streets-v12',
                    center: [lng, lat],
                    zoom: zoom,
                    // minZoom: 5,
                    // maxZoom: 15
                });

                map.current.addControl(new MapboxGeocoder({
                    accessToken: mapboxgl.accessToken,
                    mapboxgl: mapboxgl,
                    flyTo: {zoom: 10},
                }));

                map.current.addControl(new mapboxgl.NavigationControl());

                map.current.on('load', async () => {

                    map.current.addSource('mapbox-dem', {
                        'type': 'raster-dem',
                        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
                        'tileSize': 512,
                        'maxzoom': 14
                    });
                    // add the DEM source as a terrain layer with exaggerated height
                    map.current.setTerrain({'source': 'mapbox-dem', 'exaggeration': 3});



                    const locations = await retrieveItems('https://st2.newmexicowaterdata.org/FROST-Server/v1.1/Locations')

                    const paint = {
                        'circle-radius': 2,
                        'circle-color': ['match', ['get', 'active'],
                            1, '#64B976',
                            0, '#B07D6E',
                            '#d5633a'],
                        'circle-stroke-color': 'black',
                        'circle-stroke-width': 1,
                    }
                    map.current.addSource('st2', {
                        'type': 'geojson',
                        'data': {'type': 'FeatureCollection',
                        'features': locations.map((location) => {
                            return {'geometry': location['location']}
                        })}})

                    map.current.addLayer(
                        {
                            id: 'st2',
                            type: 'circle',
                            paint: paint,
                            source: 'st2'
                        }
                    )
                    setLoading(false)

                });
            });
    }

    useEffect(() => {
        setupMap();

    }, []);
    return (
        <div>
            <h1>Analytics</h1>
            <Hourglass
                height={80}
                width={80}
                color="#4fa94d"
                wrapperStyle={{}}
                wrapperClass="map-loading"
                visible={loading}
                ariaLabel='oval-loading'
                secondaryColor="#4fa94d"
                strokeWidth={2}
                strokeWidthSecondary={2}
            />
            <div ref={mapContainer} className="map-container">
            </div>

        </div>
    )
}