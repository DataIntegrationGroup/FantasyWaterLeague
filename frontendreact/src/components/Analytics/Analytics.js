import React, {useEffect, useRef, useState} from "react";
import {api_getJson, retrieveItems} from "../../util";
import {settings} from "../../settings";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import {Hourglass, Oval} from "react-loader-spinner";
import Hydrograph from "./Hydrograph";
import add_roster_to_map from "../../mapping";
import ControlPanel from "../Dashboard/ControlPanel";

function LayerControl({name, handleVisibilityChange}) {
    return (
        <div>
            <label>
                <input type="checkbox" id={name} name={name} defaultChecked={true}
                onChange={(e) => {
                    console.log('change', e.target.checked)
                    handleVisibilityChange(name, e.target.checked)
                }}

                />
                <span style={{'margin-left': '10px'}}>{name}</span>
            </label>
        </div>
    )
}

function LayerControlPanel({handleVisibilityChange}) {
    return (
        <div className="control-panel">
            <h3>Layers</h3>
            <LayerControl name="st2_manual" handleVisibilityChange={handleVisibilityChange}/>
            <LayerControl name="st2_pressure" handleVisibilityChange={handleVisibilityChange}/>
            <LayerControl name="st2_acoustic" handleVisibilityChange={handleVisibilityChange}/>
        </div>
    )
}

export default function Analytics({auth}){
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [lng, setLng] = useState(-106.5);
    const [lat, setLat] = useState(34.35);
    const [zoom, setZoom] = useState(6.1);

    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState(null)

    function add_ds_layer(map, tag, color, ds_name) {
        const base_url = 'https://st2.newmexicowaterdata.org/FROST-Server/v1.1'

        const filter_str = '&$filter=Things/Datastreams/name eq \''+ds_name+'\''
        const url = base_url+'/Locations?$expand=Things/Datastreams'+filter_str
        retrieveItems(url,
            [], 1000
        ).then(locations => {

        const paint = {
            'circle-radius': 4,
            'circle-color': color,
            'circle-stroke-color': 'black',
            'circle-stroke-width': 1,
        }
        map.current.addSource(tag, {
            'type': 'geojson',
            'data': {'type': 'FeatureCollection',
                'features': locations.map((location) => {
                    return {'geometry': location['location'],
                        'properties': {'name': location['name'],
                            'Things': location['Things'],
                        }}
                })}})

        map.current.addLayer(
            {
                id: tag,
                type: 'circle',
                paint: paint,
                source: tag
            }
        )
        const popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false
        })

        map.current.on('mouseenter', tag, (e) => {
            map.current.getCanvas().style.cursor = 'pointer';
            const coordinates = e.features[0].geometry.coordinates.slice();
            const description = e.features[0].properties.name;
            popup.setLngLat(coordinates).setHTML(description).addTo(map.current);
        })
        map.current.on('mouseleave', tag, () => {
            map.current.getCanvas().style.cursor = '';
            popup.remove();
        })
        map.current.on('click', tag, (e) => {
            // const coordinates = e.features[0].geometry.coordinates.slice();
            const properties = e.features[0].properties
            const name = properties.name;
            const things = JSON.parse(properties.Things)
            setSelected({name: name, datastreams: things[0].Datastreams, ds_name: ds_name})
            // for (const ds of things[0].Datastreams){
            //     if (ds.name === ds_name){
            //         setSelected({'name': name, 'datastream': ds})
            //     }
            // }
            // const datastream = things[0].Datastreams[0]
            // if (datastream !== undefined){
            //     setSelected({'name': name, 'datastream': datastream})
            // } else{
            //     console.log('fffffffffrrrfrafsasfdasdf')
            //     setSelected(null)
            // }

            // popup.setLngLat(coordinates).setHTML(name).addTo(map.current);
            })
        })
    }
    const handleLayerVisibility = (name, checked) => {
        map.current.setLayoutProperty(name,'visibility', checked?'visible':'none')
    }
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

                    // add the roster assets
                    add_roster_to_map(map, auth)

                    map.current.addSource('mapbox-dem', {
                        'type': 'raster-dem',
                        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
                        'tileSize': 512,
                        'maxzoom': 14
                    });
                    // add the DEM source as a terrain layer with exaggerated height
                    map.current.setTerrain({'source': 'mapbox-dem', 'exaggeration': 3});

                    add_ds_layer(map, 'st2_manual', '#ecd24b',
                        'Groundwater Levels')
                    add_ds_layer(map, 'st2_pressure', '#224bb4',
                              'Groundwater Levels(Pressure)')
                    add_ds_layer(map, 'st2_acoustic', '#d5633a',
                              'Groundwater Levels(Acoustic)')

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
            <div className="row">
                <div className={"col-7"}>
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
                    <div className={'pane'}>
                        <div ref={mapContainer} className="map-container">
                            <LayerControlPanel handleVisibilityChange={handleLayerVisibility} />
                    </div>
                    </div>
                </div>
                <div className={"col-5"}>
                    <div className={"pane"}>
                        <Hydrograph  selected={selected} />
                    </div>
                </div>
            </div>

        </div>
    )
}