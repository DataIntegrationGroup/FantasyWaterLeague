import React, {useEffect, useRef, useState, useMemo} from 'react';
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

import {forEach} from "react-bootstrap/ElementChildren";
import NWSLegend from "./NWSLegend";

const STREAM_GAUGE = 'stream_gauge'
const CONTINUOUS_GROUNDWATER = 'continuous_groundwater'
const CONTINUOUS_RAIN_GAUGE = 'continuous_rain_gauge'


function GraphButton({row, setSelectedAsset,
                         setPlotLayout,
                         setPlotData, auth}){

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

    const handleClick = () => {
        console.log('graph', row)
        api_getJson(settings.BASE_API_URL+'/asset/'+row.original.slug+'/data_url')
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
                        layout = {...layout, ...score_layout}

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

function ActiveRowButton({props, updateTable,
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

    return <button
        className={'rowbutton rowbutton_' + (props.original.active ? 'active' : 'inactive')}
        onClick={handleClick}>{props.original.active ? 'Active' : 'Inactive'}</button>
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

function toNameCase(txt){
    // replace underscores with spaces and capitalize first letter of each word
    return txt.replace(/_/g, ' ').replace(/\w\S*/g,
        function(txt){return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();});
}

export default function Dashboard({auth, setAuth}) {
    const [roster_data, setRosterData] = React.useState([])

    const [score, setScore] = useState(0);
    const [lineup, setLineup] = useState(false)
    const [gameData, setGameData] = useState({})

    const mapContainer = useRef(null);
    const map = useRef(null);
    const [lng, setLng] = useState(-106.5);
    const [lat, setLat] = useState(34.35);
    const [zoom, setZoom] = useState(6.1);

    const [plotData, setPlotData] = useState(null)
    const [plotLayout, setPlotLayout] = useState(null)
    const [selectedAsset, setSelectedAsset] = useState(null)
    const [legend, setLegend] = useState([])
    const [hover_active, setHoverActive] = useState(null)
    const [sorting, setSorting] = useState([])
    const [opacity, setOpacity] = useState(0.5)


    const wrapSetOpacity= (o)=>{
        map.current.setPaintProperty('precip', 'raster-opacity', Number(o)/100)
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
            cell: info =>(info.row.original.active&&lineup.lineup&&gameData.active) ? info.getValue().toFixed(2) : '',
        },
        {accessorKey: '',
            header: 'Action',
            enableSorting: false,
            meta: {
                width: 400
            },
            cell: ({cell}) => (<div><ActiveRowButton props={cell.row}
                                                     roster_slug={auth.slug+'.main'}
                                                     updateTable={fetchRosterData}
                                                     setLineup={setLineup}
                                                     gameData={gameData}
                                                     setScore={setScore}
                                                     updateMap={updateMap}>Active</ActiveRowButton>

                                    <GraphButton row={cell.row}
                                                    setSelectedAsset={setSelectedAsset}
                                                    setPlotLayout={setPlotLayout}
                                                    setPlotData={setPlotData}
                                                    auth={auth}>Graph</GraphButton>
                                    <MapButton map={map} row={cell.row}>Map</MapButton>
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

    const fetchRosterData = () => {
        if (auth.slug !== undefined){
            console.log('fetching roster data for', auth.slug)
            api_getJson(settings.BASE_API_URL+'/roster/'+auth.slug+'.main', auth)
                .then(data=> setRosterData(data))
        }

    }
    const setUpGame = () =>{
        api_getJson(settings.BASE_API_URL+'/game', {}).then(data =>{
            console.log('game', data)
            setGameData(data)
        })
    }
    const updateMap = () => {
        api_getJson(settings.BASE_API_URL+'/roster/'+auth.slug+'.main/geojson', auth)
            .then(data=> {
                [STREAM_GAUGE, CONTINUOUS_GROUNDWATER, CONTINUOUS_RAIN_GAUGE].forEach((tag)=>{
                    map.current.getSource(tag).setData(make_fc(data, tag))
                })

            })

    }

    const make_fc = (data, tag) => {
        return {'type': 'FeatureCollection',
                'features': data['features'].filter(d=>d.properties.atype===tag)}
    }

    const setUpMap = () => {
        if (auth.slug === undefined){
            return;
        }

        getJson('https://mapservices.weather.noaa.gov/vector/rest/services/outlooks/cpc_6_10_day_outlk/MapServer/legend?f=pjson')
            .then( data=>{
                    const precip = data.layers[1].legend
                    setLegend(precip)
                }
            )

        api_getJson(settings.BASE_API_URL+'/mapboxtoken', auth)
            .then(data=> {
                mapboxgl.accessToken = data.token
                if (map.current) return; // initialize map only once
                map.current = new mapboxgl.Map({
                    container: mapContainer.current,
                    style: 'mapbox://styles/mapbox/streets-v12',
                    center: [lng, lat],
                    zoom: zoom,
                    minZoom: 5,
                    maxZoom: 15
                });

                const paint = {
                    'circle-radius': 5,
                    'circle-color': ['match', ['get', 'active'],
                        1, '#64B976',
                        0, '#B07D6E',
                        '#d5633a'],
                    'circle-stroke-color': 'black',
                    'circle-stroke-width': 1,
                }

                let layout = {
                        'icon-size': 0.065,
                        'icon-allow-overlap': true,
                        'icon-offset': [0, -200],
                }
                map.current.on('load', function () {

                    //add precip layer
                    map.current.addLayer({
                        'id': 'precip',
                        'type': 'raster',
                        'paint': {'raster-opacity': opacity},
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



                    api_getJson(settings.BASE_API_URL+'/roster/'+auth.slug+'.main/geojson', auth)
                        .then(data=> {
                            console.log('geojson', data)
                            let items =[[STREAM_GAUGE, streamgauge_image],
                                [CONTINUOUS_GROUNDWATER,gwell_image],
                                [CONTINUOUS_RAIN_GAUGE, raingauge_image]]
                            items.forEach((item)=>{
                                            let tag = item[0]
                                            let image = item[1]

                                            let fc = make_fc(data, tag)
                                            console.log(fc)
                                            map.current.addSource(tag, {type: 'geojson',
                                                data: fc}) ;
                                            map.current.loadImage(image, function(error, image) {
                                                map.current.addImage(tag + '_image', image, {sdf: false})
                                                layout['icon-image'] = tag + '_image'
                                                map.current.addLayer({
                                                    id: tag + '_symbol',
                                                    source: tag,
                                                    type: 'symbol',
                                                    layout: layout
                                                })

                                                map.current.addLayer({
                                                    id: tag,
                                                    type: 'circle',
                                                    source: tag,
                                                    paint: paint
                                                })

                                                const popup = new mapboxgl.Popup({
                                                    closeButton: false,
                                                    closeOnClick: false
                                                })

                                                map.current.on('mouseenter', tag, function (e) {

                                                    map.current.getCanvas().style.cursor = 'pointer';
                                                    const coordinates = e.features[0].geometry.coordinates.slice();
                                                    const atype = toNameCase(e.features[0].properties.atype)

                                                    const html= `<div class="popup">
<table class="table-sm table-bordered">
<tr><td class="popup-td">Name</td><td>${e.features[0].properties.name}</td></tr>
<tr><td class="popup-td">Type</td><td>${atype}</td></tr>
<tr><td class="popup-td">Score</td><td>${e.features[0].properties.score.toFixed(2)}</td></tr>
</table></div>`
                                                    popup.setLngLat(coordinates)
                                                        .setHTML(html)
                                                        .addTo(map.current);

                                                    setHoverActive(e.features[0].properties.name)
                                                })

                                                map.current.on('mouseleave', tag, function () {
                                                    map.current.getCanvas().style.cursor = '';
                                                    popup.remove();
                                                })
                                            })
                            }) // end forEach
                        })
                })
            })
    }

    useEffect(() => {
        setUpGame()
        setUpMap()
        fetchRosterData()
        updateScore(auth.slug+'.main', setLineup, setScore)

    }, [])

    return(
        <div className='container-fluid'>
            <div className='row'>
                <div className={'col-lg-6'}>
                    <div className={'pane'}>
                        <Leaderboard />
                    </div>
                </div>
                <div className={'col-lg-6'}>
                    <div className={'pane'}>
                        <Scoreboard roster_slug={auth.slug+'.main'}
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
                                <NWSLegend legend={legend} setOpacity={wrapSetOpacity}/>

                            </div>

                        </div>
                    </div>
                </div>
                <div className='col-6 '>
                    <div className={'pane'}>
                        <div className={'card card-dashboard'}>
                            <h4>Roster</h4>
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
    );
}