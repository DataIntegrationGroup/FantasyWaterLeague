import React, {useEffect, useRef, useState, useMemo, useReducer} from 'react';
import Plot from 'react-plotly.js';
import {getCoreRowModel, flexRender, useReactTable, getSortedRowModel} from '@tanstack/react-table'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'mapbox-gl/dist/mapbox-gl.css';
import './Dashboard.css'
import {settings} from "../../settings";
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import Leaderboard from "./Leaderboard";
import Scoreboard from "./Scoreboard";
import {getJson, indexOfMinimumValue, indexOfMaximumValue, api_getJson} from "../../util";
import streamgauge_image from '../../img/streamgauge.png'
import raingauge_image from '../../img/raingauge.png'
import gwell_image from '../../img/gwell.png'
import nws_image from '../../img/nws.png'
import usgs_image from '../../img/usgs.png'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

import NWSLegend from "./NWSLegend";
import ControlPanel from "./ControlPanel";
// import Match from "../Match/Match";
import add_roster_to_map, {make_fc} from "../../mapping";
import Login from "../Login/Login";
import {useFiefTokenInfo, useFiefUserinfo} from "@fief/fief/react";


function GraphButton({row, setSelectedAsset,
                         setPlotLayout,
                         setPlotData}){
    const tokenInfo = useFiefTokenInfo();

    const extractData = (source, data) => {
        let x = [];
        let y = [];
        try {
            if (source.startsWith('usgs')){
                [x,y] = extractUSGSData(data)
            } else{
                [x,y] = extractNWSData(data)
            }
        } catch (e) {
            console.log('error', e)
        }
        return [x,y]
    }

    const extractNWSData = (data) => {
        const values = data["features"]

        const y = values.map(v=>{
            let p = v['properties']['precipitationLast3Hours']
            let vi = p['value']
            if (p['unicode'] === 'wmoUnit:mm'){
                vi = vi * 25.4
            }
            if (vi===null){
                vi = 0
            }
            return vi
        })

        return [values.map(v=>v['properties']['timestamp']), y]
    }
    const extractUSGSData = (data) => {
        const values = data["value"]['timeSeries'][0]['values'][0]['value']
        return [values.map(v=>v['dateTime']), values.map(v=>v['value'])]
    }

    const getGraphs = (source, data, tag, linestyle) => {
        let extralayout = {}
        console.log('getting asdf', source)
        let [x,y] = extractData(source, data)

        let scalar = 1
        if (row.original.atype==='stream_gauge'){
            scalar = 1.0
        } else if (row.original.atype==='continuous_groundwater'){
            scalar = 20
            extralayout['yaxis'] ={'autorange': 'reversed'}
        } else if (row.original.atype==='rain_gauge'){
            scalar = 10
        }

        const timeseries = {
            x: x,
            y: y,
            mode: 'lines',
            name: tag+'Time Series',
            line: {color: '#0b82d9',
                    dash: linestyle,}
        };

        const baseline = {
            x: [x[0], x[x.length-1]],
            y: [y[0], y[0]],
            mode: 'lines',
            name: tag+'Baseline',
            line: {color: '#d9d90b'}
        };
        let xidx = 0;
        let score = 0;
        let yscore = 0;
        if (row.original.atype==='continuous_groundwater'){
            xidx = indexOfMinimumValue(y)
            score = (y[0] - y[xidx])

        } else{
            xidx = indexOfMaximumValue(y)
            score = (y[xidx]-y[0])
        }
        yscore = y[xidx]
        const scorebar = {
            x: [x[xidx], x[xidx]],
            y: [yscore, y[0]],
            mode: 'lines',
            name: tag+' Score',
            line: {color: '#d90b0b'}
        };

        const scorelabel = {x: [x[xidx]], y: [y[xidx]],
            mode: 'markers+text',
            name: 'Markers and Text',
            text: ['Score: '+(score*scalar).toFixed(2)],
            textposition: 'top',
            type: 'scatter'}
        return [timeseries, baseline, scorebar, scorelabel, extralayout]
    }
    const w_api_getJson = (url) => {
        return api_getJson(url, tokenInfo?.access_token)
    }
    const handleClick = () => {
        console.log('graph', row)
        w_api_getJson('/asset/'+row.original.slug+'/data_url')
        .then(asset_data=> {
            getJson(asset_data.prev_url)
            .then(data =>{
                getJson(asset_data.scoring_url)
                    .then(score_data => {
                        const [prev_timeseries, prev_baseline,
                            prev_scorebar,prev_label, prev_layout] = getGraphs(asset_data.source, data, 'Prev', 'sold')
                        const [score_timeseries,score_baseline,
                            score_scorebar, score_label,score_layout] = getGraphs(asset_data.source, score_data, 'Score', 'dashdot')

                        console.log('prev', prev_timeseries, prev_baseline, prev_scorebar)
                        setSelectedAsset(row.original.name)
                        setPlotData([prev_timeseries,prev_baseline, prev_scorebar, prev_label,
                                     score_timeseries, score_baseline, score_scorebar, score_label])

                        let layout = {width: '100%',
                                height: '100%',
                                title: {text: row.original.name + '  '+ row.original.atype},
                                showlegend: false}

                        let title = 'Depth To Groundwater (ft bgs)'
                        if (row.original.atype ==='continuous_rain_gauge'){
                            title = 'Rainfall (in)'
                        } else if (row.original.atype ==='stream_gauge'){
                            title = 'Gage Height (ft)'
                        }


                        layout = {...layout, ...score_layout}
                        if ('yaxis' in layout) {
                            layout['yaxis']['title'] = title
                        }else{
                            layout['yaxis'] = {'title': title}
                        }

                        console.log('layout', layout)
                        setPlotLayout(layout)
                        console.log('selected', row.original.name)
                        document.getElementById('graphContainer').style.display = 'block'
                })
            })
        })}

    return <button className='rowbutton'
                   style={{background: '#0b82d9'}}
                   onClick={handleClick}>Graph</button>
}
function SourceButton({row}){
    const handleClick = () => {
        console.log('source', row)
        window.open(row.original.source_landing_url, '_blank')
    }
    return <button
        className='rowbutton'
        style={{background: '#e87d43'}}
        onClick={handleClick}>Source</button>
}

function MapButton({map, row}){
    const handleClick = () => {
        console.log('map', row)
        const selected_asset = row.original
        try {
            map.current.removeLayer('selected')
            map.current.removeSource('selected')
        } catch (e) {
            console.log(e)
        }
        map.current.addSource('selected', {
            'type': 'geojson',
            'data': {
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [selected_asset.longitude, selected_asset.latitude]
                }
            }
        });
        map.current.addLayer({
            'id': 'selected',
            'type': 'circle',
            'source': 'selected',
            'paint': {
                'circle-radius': 10,
                'circle-color': 'transparent',
                'circle-stroke-color': '#e8083e',
                'circle-stroke-width': 3,
            }
        })
    }
    return <button
        className='rowbutton'
        style={{background: '#6b82d9'}}
        onClick={handleClick}>Map</button>
}

function ActiveRowButton({props,
                             enabled,
                             updateTable,
                             setLineup,
                             setScore, roster_slug, gameData, updateMap}){
    const handleClick = () => {
        if (gameData.active){
            alert('Game has already started. You cannot change your lineup.')
            return
        }
        toggleActive(roster_slug, props.original.slug, !props.original.active,
            updateTable,
            setLineup,
            setScore,
            updateMap)
    }
    if (enabled===true){
        return <button
            className={'rowbutton rowbutton_' + (props.original.active ? 'inactive' : 'active')}
            onClick={handleClick}>{props.original.active ? 'Deactivate' : 'Activate'}</button>
    }
}
// function InactiveRowButton({props, updateTable,
//                                setLineup,
//                                setScore, roster_slug, gameData, updateMap}){
//     const handleClick = () => {
//         if (gameData.active){
//             alert('Game has already started. You cannot change your lineup.')
//             return
//         }
//         toggleActive(roster_slug, props.original.slug, false,
//             updateTable,
//             setLineup,
//             setScore,
//             updateMap)
//     }
//     return <button
//         className='rowbutton'
//         style={{background: '#c24850'}}
//         onClick={handleClick}>Inactive</button>
// }


const updateScore = (roster_slug, setLineup, setScore,) => {
    fetch(settings.BASE_API_URL+'/roster/'+ roster_slug +'/validate')
        .then(response=>response.json())
        .then(data=>{
            let is_valid = data.lineup
            setLineup(data)
            if (is_valid){
                fetch(settings.BASE_API_URL+'/roster/'+ roster_slug +'/score').then(
                    response => response.json()
                ).then(data => {
                    setScore(data.score)
                })
            }
        }).catch(error => {
            console.log('error', error)
    })
}

function toggleActive(roster_slug, slug, state, updateTable, setLineup, setScore, updateMap){
    fetch(settings.BASE_API_URL+'/roster/'+roster_slug+'/'+slug,
        { method: 'PUT',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({'active': state})
        }
    ).then(
        response => response.json()
    ).then(resp=>{
            console.log('success', resp)
            updateTable()
            updateScore(roster_slug, setLineup, setScore)
            updateMap()
        }
    )
}



export default function Dashboard() {
    const tokenInfo = useFiefTokenInfo();
    const userinfo = useFiefUserinfo();
    console.log('userinfo', userinfo)
    const [active_slug, setActiveSlug] = useState(userinfo?.fields.username)

    const [roster_data, setRosterData] = React.useState([])

    const [score, setScore] = useState(0);
    const [lineup, setLineup] = useState(false)
    const [gameData, setGameData] = useState({})

    const mapContainer = useRef(null);
    const map = useRef(null);
    // const [lng, setLng] = useState(-106.5);
    // const [lat, setLat] = useState(34.35);
    const [zoom, setZoom] = useState(6.1);

    const [plotData, setPlotData] = useState(null)
    const [plotLayout, setPlotLayout] = useState(null)
    const [selectedAsset, setSelectedAsset] = useState(null)
    const [CPC6legend, setCPS6Legend] = useState([])
    const [QPF7legend, setQPF7Legend] = useState([])
    const [hover_active, setHoverActive] = useState(null)
    const [sorting, setSorting] = useState([])
    const [layersVisible, setLayersVisible] = useReducer(
        (state, newState) => ({...state, ...newState}),
        {})
    const [displayPlayer, setDisplayPlayer] = useState(null)

    const w_api_getJson = (url) => {
        return api_getJson(url, tokenInfo?.access_token)
    }

    const setDisplayPlayerManual = (slug) => {
        setDisplayPlayer(slug)
        fetchRosterData(slug)
        updateMap(slug)
    }

    const setOpacity= (o)=>{
        map.current.setPaintProperty('cpc_6_10_day_outlk', 'raster-opacity', Number(o)/100)
    }
    const setQPFOpacity= (o)=>{
        map.current.setPaintProperty('wpc_qpf', 'raster-opacity', Number(o)/100)
    }

    function handleLayerVisibility(visibilityState) {
        if (map.current===null){
            return;
        }
        console.log('state', visibilityState)

        map.current.setLayoutProperty('cpc_6_10_day_outlk',
                                        'visibility', visibilityState['cpc6']);
        map.current.setLayoutProperty('wpc_qpf',
                                        'visibility', visibilityState['qpf7']);
        setLayersVisible(visibilityState)
    }

    const roster_columns = useMemo(()=>[
            {accessorKey: 'source_slug',
                header: 'Source',
                cell: info => {
                    let src=''
                    let slug = info.getValue()
                    switch (slug){
                        case 'nws':
                            src = nws_image
                            break;
                        case 'usgs_nwis_depthtowater':
                            src = usgs_image
                            break;
                        case 'usgs_nwis_gageheight':
                            src = usgs_image
                            break;
                        case 'usgs_nwis_rain_gauge':
                            src = usgs_image
                            break;
                    }
                return <img width={'50%'} src={src}/>
                },
            },
        {accessorKey: 'name',
        header: 'Name',
        cell: info => info.getValue(),
        meta: {
            width: 350
            }
        },
        {accessorKey: 'atype',
            meta: { width: 150},
            cell: info => {
            let src = ''
                let value = info.getValue()
                switch (value){
                    case 'stream_gauge':
                        src = streamgauge_image
                        break;
                    case 'continuous_groundwater':
                        src = gwell_image
                        break;
                    case 'continuous_rain_gauge':
                        src = raingauge_image
                        break;
                }
            return <img width={'30%'} src={src}/>
            },
            header: 'Type',},
        {accessorKey: 'prev_score',
            header: 'Prev Score',
            meta: {
                width: 100,
            },
            cell: info => info.getValue().toFixed(2),
        },
        {accessorKey: 'score',
            header: 'Score',
            meta: {
                width: 100,
            },
            cell: info =>(lineup.lineup&&gameData.active) ? info.getValue().toFixed(2) : '',
        },
        {accessorKey: '',
            header: 'Action',
            enableSorting: false,
            meta: {
                width: 400
            },
            cell: ({cell}) => (<div><ActiveRowButton props={cell.row}
                                                     enabled={displayPlayer === active_slug || displayPlayer === null}
                                                     roster_slug={active_slug+'.main'}
                                                     updateTable={fetchRosterData}
                                                     setLineup={setLineup}
                                                     gameData={gameData}
                                                     setScore={setScore}
                                                     updateMap={updateMap}>Active</ActiveRowButton>

                                    <GraphButton row={cell.row}
                                                    setSelectedAsset={setSelectedAsset}
                                                    setPlotLayout={setPlotLayout}
                                                    setPlotData={setPlotData}
                                                    >Graph</GraphButton>
                                    <MapButton map={map} row={cell.row}>Map</MapButton>
                                    <SourceButton row={cell.row} >Source</SourceButton>
            </div>
            )
        },
    ]
    )

    function getRowStyles(row) {
        return {
            background: (hover_active && row.original.name ===hover_active)? '#eac15a' : (row.original.active ? "#64B976FF" : "#B07D6EFF")
        }
    }

    const roster_table = useReactTable({ data: roster_data,
        columns: roster_columns ,
        meta: {
            getRowStyles: getRowStyles
        },
        state: {sorting},
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        getCoreRowModel: getCoreRowModel()})

    const fetchRosterData = (displayPlayer=null) => {
        console.log('fetching roster data', displayPlayer)
        if (displayPlayer !== null){
            w_api_getJson('/roster/'+displayPlayer+'.main/')
                .then(data=> {
                    console.log('player data', data)
                    setRosterData(data)
                })
        }
        else if (active_slug !== undefined){
            console.log('fetching roster data for', active_slug)
            w_api_getJson('/roster/'+active_slug+'.main')
                .then(data=> setRosterData(data))
        }

    }
    const setUpGame = () =>{
        w_api_getJson('/game', {}).then(data =>{
            console.log('game', data)
            setGameData(data)
        })
    }
    const updateMap = (displayPlayer) => {
        let slug = active_slug;
        if (displayPlayer !== null){
            slug = displayPlayer
        }

        if (slug === undefined || slug === null){
            return;
        }
        console.log('updating map for', slug)
        w_api_getJson('/roster/'+slug+'.main/geojson')
            .then(data=> {
                [settings.STREAM_GAUGE,
                    settings.CONTINUOUS_GROUNDWATER, settings.CONTINUOUS_RAIN_GAUGE].forEach((tag)=>{
                    map.current.getSource(tag).setData(make_fc(data, tag))
                })

            })

    }



    const setUpMap = () => {
        if (active_slug === undefined){
            return;
        }

        getJson('https://mapservices.weather.noaa.gov/vector/rest/services/outlooks/cpc_6_10_day_outlk/MapServer/legend?f=pjson')
            .then( data=>{
                    const precip = data.layers[1].legend
                    setCPS6Legend(precip)
                }
            )
        getJson('https://mapservices.weather.noaa.gov/vector/rest/services/precip/wpc_qpf/MapServer/legend?f=pjson')
            .then( data=>{
                    setQPF7Legend(data.layers[9].legend)
                }
            )
        w_api_getJson('/mapboxtoken')
            .then(data=> {
                if (data===undefined){
                    console.log('failed getting mapbox token')
                    return
                }

                mapboxgl.accessToken = data?.token
                if (map.current) return; // initialize map only once
                map.current = new mapboxgl.Map({
                    container: mapContainer.current,
                    style: 'mapbox://styles/mapbox/streets-v12',
                    center: [-106.5, 34.35],
                    zoom: zoom,
                    minZoom: 5,
                    maxZoom: 15
                });

                map.current.addControl(new MapboxGeocoder({ accessToken: mapboxgl.accessToken ,
                                                            mapboxgl: mapboxgl,
                                                            flyTo: {zoom: 10},
                }));

                map.current.addControl(new mapboxgl.NavigationControl());

                map.current.on('load', function () {

                    map.current.addSource('mapbox-dem', {
                        'type': 'raster-dem',
                        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
                        'tileSize': 512,
                        'maxzoom': 14
                    });
                    // add the DEM source as a terrain layer with exaggerated height
                    map.current.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 3 });

                    map.current.addLayer({
                        'id': 'wpc_qpf',
                        'type': 'raster',
                        'paint': {'raster-opacity': 0.5},
                        'layout': {'visibility': 'none'},
                        'source': {
                            'type': 'raster',
                            'tileSize': 256,
                            'tiles': [
                                'https://mapservices.weather.noaa.gov/vector/rest/services/' +
                                'precip/wpc_qpf/MapServer/export?' +
                                'bbox={bbox-epsg-3857}' +
                                '&bboxSR=3857' +
                                '&layers=show:11' +
                                '&layerDefs=' +
                                '&size=' +
                                '&imageSR=3857' +
                                '&historicMoment=' +
                                '&format=png' +
                                '&transparent=false' +
                                '&dpi=' +
                                '&time=' +
                                '&timeRelation=esriTimeRelationOverlaps' +
                                '&layerTimeOptions=' +
                                '&dynamicLayers=' +
                                '&gdbVersion=' +
                                '&mapScale=' +
                                '&rotation=' +
                                '&datumTransformations=' +
                                '&layerParameterValues=' +
                                '&mapRangeValues=' +
                                '&layerRangeValues=' +
                                '&clipping=' +
                                '&spatialFilter=' +
                                '&f=image'
                                ]
                        }
                    })


                    //add precip layer
                    map.current.addLayer({
                        'id': 'cpc_6_10_day_outlk',
                        'type': 'raster',
                        'paint': {'raster-opacity': 0.5},
                        'layout': {'visibility': 'none'},
                        'source': {
                            'type': 'raster',
                            'tileSize': 256,
                            'tiles': [
                                'https://mapservices.weather.noaa.gov/vector/rest/services/outlooks/cpc_6_10_day_outlk/MapServer/export?' +
                                'bbox={bbox-epsg-3857}' +
                                '&bboxSR=3857' +
                                '&layers=show:1' +
                                '&layerDefs=' +
                                '&size=' +
                                '&imageSR=3857' +
                                '&historicMoment=' +
                                '&format=png' +
                                '&transparent=false' +
                                '&dpi=' +
                                '&time=' +
                                '&timeRelation=esriTimeRelationOverlaps' +
                                '&layerTimeOptions=' +
                                '&dynamicLayers=' +
                                '&gdbVersion=' +
                                '&mapScale=' +
                                '&rotation=' +
                                '&datumTransformations=' +
                                '&layerParameterValues=' +
                                '&mapRangeValues=' +
                                '&layerRangeValues=' +
                                '&clipping=' +
                                '&spatialFilter=' +
                                '&f=Image'
                            ]
                        }
                    })

                    add_roster_to_map(map, active_slug, setHoverActive)

                })
            })
    }

    useEffect(() => {
        setUpGame()
        setUpMap()
        fetchRosterData()
        updateScore(active_slug+'.main', setLineup, setScore)

    }, [])

    // console.log('App auth:', auth)
    // if(!auth?.token) {
    //     return <Login setAuth={setAuth}/>
    // }

    return(
        <div className='container-fluid'>
            {/*<div className='row'>*/}
            {/*    <Match />*/}
            {/*</div>*/}
            <div className='row'>
                <div className={'col-lg-6'}>
                    <div className={'pane'}>
                        <Leaderboard
                            displayPlayer={displayPlayer}
                            setDisplayPlayer={setDisplayPlayerManual}/>
                    </div>
                </div>
                <div className={'col-lg-6'}>
                    <div className={'pane'}>
                        <Scoreboard roster_slug={active_slug+'.main'}
                                    lineup={lineup}
                                    score={score}
                                    gameData={gameData}
                        />
                    </div>
                </div>
            </div>
            <div className='row'>
                <div className='col-6'>
                    <div className={'pane'}>
                        <div className={'card card-dashboard'}>
                            <h4>Map</h4>
                        </div>


                        <div>
                            <div ref={mapContainer} className="map-container">
                                <ControlPanel onChange={handleLayerVisibility} />
                                <NWSLegend cpc6legend={CPC6legend}
                                           qpf7legend={QPF7legend}
                                           layersVisible={layersVisible}
                                           setQPFOpacity={setQPFOpacity}
                                           setOpacity={setOpacity}/>

                            </div>

                        </div>
                    </div>
                </div>
                <div className='col-6 '>
                    <div className={'pane'}>
                        <div className={'card card-dashboard'}>
                            <h4>Roster: {displayPlayer===null ? active_slug: displayPlayer}</h4>
                        </div>
                        <div id={'graphContainer'}>
                                <button id={'graphbutton'} onClick={(event) =>
                                {document.getElementById('graphContainer').style.display='none'}}>
                                    Close</button>
                            <Plot
                                divId={'graph'}
                                data={plotData}
                                layout={plotLayout}
                            />
                        </div>
                        <div className={'roster-container'}>
                            <table className={'table-sm table-bordered display-table'}>
                                <thead>
                                {roster_table.getHeaderGroups().map(headerGroup => (
                                    <tr key={headerGroup.id}>
                                        {headerGroup.headers.map(header => (
                                            <th key={header.id}
                                                style={{height: '10px' ,
                                                    width: header.column.columnDef.meta?.width}}
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    :
                                                    <div {...{className:
                                                            header.column.getCanSort()?
                                                                'cursor-pointer': '',
                                                        onClick: header.column.getToggleSortingHandler()}}>
                                                        {flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext(),

                                                        )}

                                                    </div>
                                                }
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                                </thead>
                                <tbody>
                                {roster_table.getRowModel().rows.map(row => (
                                    <tr key={row.id}
                                        style={roster_table.options.meta.getRowStyles(row)}>
                                        {row.getVisibleCells().map(cell => (
                                            <td key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}