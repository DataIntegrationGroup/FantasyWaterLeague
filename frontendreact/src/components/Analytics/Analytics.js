import React, {useEffect, useRef, useState} from "react";
import {api_getJson, retrieveItems} from "../../util";
import {settings} from "../../settings";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import {Hourglass, Oval} from "react-loader-spinner";
import Hydrograph from "./Hydrograph";
import add_roster_to_map, {add_county_layer, add_rgis_geojson, add_rgis_wms} from "../../mapping";
import ControlPanel from "../Dashboard/ControlPanel";
import './Analytics.css'
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import {ButtonGroup, ButtonToolbar} from "react-bootstrap";

function LayerControl({name, label, color, handleVisibilityChange, checked}) {
    return (
        <div>
            <label>
                <input type="checkbox" id={name} name={name}
                       checked={checked}
                onChange={(e) => {
                    console.log('change', e.target.checked)
                    handleVisibilityChange(name, e.target.checked)
                }}
                style={{'marginRight': '5px'}}
                />
                <div className="layer-key" style={{'backgroundColor': color}}></div>{label}
            </label>
        </div>
    )
}

function LayerControlPanel({handleVisibilityChange, checked}) {
    return (
        <div className="control-panel">
            <h3>Layers</h3>
            <LayerControl name="huc-6"
                          label={"HUC-6"}
                          color="black"
                          handleVisibilityChange={handleVisibilityChange}
                          checked={checked['huc-6']}/>
            <LayerControl name="huc-8"
                          label={"HUC-8"}
                          color="black"
                          handleVisibilityChange={handleVisibilityChange}
                          checked={checked['huc-8']}/>
            <LayerControl name="counties"
                          label={"Counties"}
                          color="black"
                          handleVisibilityChange={handleVisibilityChange}
                          checked={checked['counties']}/>
            <LayerControl name="acequias"
                          label={"Acequias"}
                          color="black"
                          handleVisibilityChange={handleVisibilityChange}
                          checked={checked['acequias']}/>
            <LayerControl name="st2_manual"
                          label={"Groundwater Levels (Manual)"}
                          color="#ecd24b"
                          handleVisibilityChange={handleVisibilityChange}
                          checked={checked['st2_manual']}/>
            <LayerControl name="st2_pressure"
                            label={"Groundwater Levels (Pressure)"}
                          color="#224bb4"
                          checked={checked['st2_pressure']}
                          handleVisibilityChange={handleVisibilityChange}/>
            <LayerControl name="st2_acoustic"
                          label={"Groundwater Levels (Acoustic)"}
                          color="#d5633a"
                          checked={checked['st2_acoustic']}
                          handleVisibilityChange={handleVisibilityChange}/>
            <LayerControl name="search"
                          label={"Filtered Results"}
                          color="#e36d9e"
                          checked={checked['search']}
                          handleVisibilityChange={handleVisibilityChange}/>
        </div>
    )
}

function SearchPanel({onClick}) {
    return (
        <div className="search-panel">
            <h3>Search</h3>
                <Form.Control id='search' type="text" placeholder="Enter search text" />
                <Button variant="primary"
                            type="submit"
                            onClick={() => onClick(document.getElementById('search').value)}>
                        Submit
                </Button>

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

    const [checked, setChecked] = useState({
        'huc-6': true,
        'huc-8': true,
        'counties': true,
        'acequias': true,
        'st2_manual': true,
        'st2_pressure': true,
        'st2_acoustic': true, 'search': false})

    function add_popup(tag, ds_name=null){
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

    }

    function add_ds_layer(map, tag, color, ds_name) {
        const filter_str = '&$filter=Things/Datastreams/name eq \''+ds_name+'\''
        const url = settings.ST2_API_URL+'/Locations?$expand=Things/Datastreams'+filter_str
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
        add_popup(tag, ds_name)
        map.current.on('click', tag, (e) => {
            // const coordinates = e.features[0].geometry.coordinates.slice();
            const properties = e.features[0].properties
            const name = properties.name;
            const things = JSON.parse(properties.Things)
            setSelected({name: name, datastreams: things[0].Datastreams, ds_name: ds_name})
            })
        })
    }

    const handleSearch = (search_txt) => {
        console.log('search text', search_txt)

        map.current.setLayoutProperty('st2_manual','visibility', 'none')
        map.current.setLayoutProperty('st2_pressure','visibility', 'none')
        map.current.setLayoutProperty('st2_acoustic','visibility', 'none')

        const url = settings.ST2_API_URL+'/Locations?'
        const expand = '$expand=Things/Datastreams'
        const filter = '$filter=substringof(\''+search_txt+'\',name)'

        // setManualChecked(false)
        // setPressureChecked(false)
        // setAcousticChecked(false)


        retrieveItems(url+expand+'&'+filter,[], 10000)
            .then(locations => {
                console.log('locations', locations)

                const data = {'type': 'FeatureCollection',
                    'features': locations.map((location) => {
                    return {'geometry': location['location'],
                        'properties': {'name': location['name'],
                            'Things': location['Things'],
                        }}
                    })
                }
                map.current.getSource('search').setData(data)
                setChecked({'st2_manual': false,
                    'st2_pressure': false,
                    'st2_acoustic': false,
                    'search': true})
                // const popup = new mapboxgl.Popup({
                //     closeButton: false,
                //     closeOnClick: false
                // })
                //
                // map.current.on('mouseenter', 'search', (e) => {
                //     map.current.getCanvas().style.cursor = 'pointer';
                //     const coordinates = e.features[0].geometry.coordinates.slice();
                //     const description = e.features[0].properties.name;
                //     popup.setLngLat(coordinates).setHTML(description).addTo(map.current);
                // })
                // map.current.on('mouseleave', 'search', () => {
                //     map.current.getCanvas().style.cursor = '';
                //     popup.remove();
                // })

            })
    }
    const handleLayerVisibility = (name, state) => {
        map.current.setLayoutProperty(name,'visibility', state?'visible':'none')
        if (name ==='counties'){
            map.current.setLayoutProperty('counties_borders','visibility', state?'visible':'none')
        }

        setChecked({...checked, [name]: state})
        // if (name === 'st2_manual'){
        //     setManualChecked(checked)
        // } else if (name ==='st2_pressure'){
        //     setPressureChecked(checked)
        // } else if (name === 'st2_acoustic'){
        //     setAcousticChecked(checked)
        // }
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
                    // add acequias layer
                    const dataset = '07c4688e-21a2-4211-9f07-f4940af5188b'
                    const layers='Acequias'
                    add_rgis_wms(map, dataset, layers, 'acequias')

                    add_rgis_geojson(map, '932e5ab8-09d7-4624-913b-7630e0973a22', 'wbdhu6_a_nm', 'huc-6')

                    add_rgis_geojson(map, 'cae16e7f-c3d1-4264-b14b-f1c6db755a88', 'wbdhu8_a_nm', 'huc-8')


                    // add county layer
                    add_county_layer(map)
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

                    // add a search layer
                    map.current.addSource('search', {
                        'type': 'geojson',
                    })

                    add_popup('search')
                    map.current.on('click', 'search', (e) => {
                        // const coordinates = e.features[0].geometry.coordinates.slice();
                        const properties = e.features[0].properties
                        const name = properties.name;
                        const things = JSON.parse(properties.Things)
                        setSelected({name: name,
                            datastreams: things[0].Datastreams,
                        })
                        // for (const ds of things
                    })
                    map.current.addLayer(
                        {
                            id: 'search',
                            type: 'circle',
                            paint: {
                                'circle-radius': 4,
                                'circle-color': '#e36d9e',
                                'circle-stroke-color': 'black',
                                'circle-stroke-width': 1,
                            },
                            source: 'search'
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
            <div className={'row'}>
                <div className={'col-12'}>
                    <div className={'pane'}>
                        <SearchPanel onClick={handleSearch}/>
                    </div>
                </div>
            </div>
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
                            <LayerControlPanel handleVisibilityChange={handleLayerVisibility}
                                                checked = {checked}
                            />
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