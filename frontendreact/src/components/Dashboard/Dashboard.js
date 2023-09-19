import React, {useEffect, useRef, useState, useMemo} from 'react';
import Plot from 'react-plotly.js';
import {getCoreRowModel, flexRender, useReactTable} from '@tanstack/react-table'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'mapbox-gl/dist/mapbox-gl.css';
import './Dashboard.css'
import {settings} from "../../settings";
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import Leaderboard from "./Leaderboard";
import Scoreboard from "./Scoreboard";
import {getJson, indexOfMinimumValue, indexOfMaximumValue, api_getJson} from "../../util";
import streamgauge_image from '../../img/stream_gauge.png'
import gwell_image from '../../img/gwell.png'


function GraphButton({row, setSelectedAsset,
                         setPlotLayout,
                         setPlotData, auth}){

    const getGraphs = (data, tag, linestyle) => {
        let x = [];
        let y = [];
        let extralayout = {}

        try {
            const values = data["value"]['timeSeries'][0]['values'][0]['value']
            y = values.map(v=>v['value'])
            x = values.map(v=>v['dateTime'])

        } catch (e) {

        }
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
                            prev_scorebar,prev_label, prev_layout] = getGraphs(data, 'Prev', 'sold')
                        const [score_timeseries,score_baseline,
                            score_scorebar, score_label,score_layout] = getGraphs(score_data, 'Score', 'dashdot')

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
        toggleActive(roster_slug, props.original.slug, true,
            updateTable,
            setLineup,
            setScore,
            updateMap)
    }
    return <button
        className='rowbutton'
        style={{background: '#2c974b'}}
        onClick={handleClick}>Active</button>
}
function InactiveRowButton({props, updateTable,
                               setLineup,
                               setScore, roster_slug, gameData, updateMap}){
    const handleClick = () => {
        if (gameData.active){
            alert('Game has already started. You cannot change your lineup.')
            return
        }
        toggleActive(roster_slug, props.original.slug, false,
            updateTable,
            setLineup,
            setScore,
            updateMap)
    }
    return <button
        className='rowbutton'
        style={{background: '#c24850'}}
        onClick={handleClick}>Inactive</button>
}


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

    const roster_columns = useMemo(()=>[{accessorKey: 'name',
        header: 'Name',
        cell: info => info.getValue(),
        meta: {
            width: 300
            }
        },
        {accessorKey: 'atype',
            header: 'Type',},
        {accessorKey: 'prev_score',
            header: 'Prev Score',
            cell: info => info.getValue().toFixed(2),
        },
        {accessorKey: 'score',
            header: 'Score',
            cell: info =>(info.row.original.active&&lineup.lineup&&gameData.active) ? info.getValue().toFixed(2) : '',
            // {
            //     console.log('score', info)
            //     return info.getValue()
            // }


                // (info.row.original.active) ? info.getValue() : '',
        },
        {accessorKey: '',
            header: 'Action',
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
                                    <InactiveRowButton props={cell.row}
                                                       roster_slug={auth.slug+'.main'}
                                                       updateTable={fetchRosterData}
                                                       setLineup={setLineup}
                                                       gameData={gameData}
                                                       setScore={setScore}
                                                       updateMap={updateMap}>Inactive</InactiveRowButton>
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


    const roster_table = useReactTable({ data: roster_data,
        columns: roster_columns ,
        meta: {
            getRowStyles: (row) => ({
                background: row.original.active ? "#64B976FF" : "#B07D6EFF"
            })
        },
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
                map.current.getSource('streamgauges').setData(make_fc(data, 'stream_gauge'))
                map.current.getSource('gwells').setData(make_fc(data, 'continuous_groundwater'))
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

        api_getJson(settings.BASE_API_URL+'/mapboxtoken', auth)
            .then(data=> {
                console.log('mapboxfasd token', data.token)
                mapboxgl.accessToken = data.token
                if (map.current) return; // initialize map only once
                map.current = new mapboxgl.Map({
                    container: mapContainer.current,
                    style: 'mapbox://styles/mapbox/streets-v12',
                    center: [lng, lat],
                    zoom: zoom,
                    minZoom: 5
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
                    api_getJson(settings.BASE_API_URL+'/roster/'+auth.slug+'.main/geojson', auth)
                        .then(data=> {
                            console.log('geojson', data)
                            let streamgauges = make_fc(data, 'stream_gauge')
                            let gwells = make_fc(data, 'continuous_groundwater')

                            map.current.addSource('streamgauges', {type: 'geojson',
                                data: streamgauges}) ;
                            map.current.addSource('gwells', {type: 'geojson',
                                data: gwells}) ;

                            map.current.loadImage(streamgauge_image, function(error, image) {
                                map.current.addImage('streamgauge_image', image, {sdf: false})
                                layout['icon-image'] = 'streamgauge_image'
                                map.current.addLayer({
                                    id: 'streamgauges_symbol',
                                    source: 'streamgauges',
                                    type: 'symbol',
                                    layout: layout
                                })

                                map.current.addLayer({
                                    id: 'streamgauges',
                                    type: 'circle',
                                    source: 'streamgauges',
                                    paint: paint
                                })
                            });
                            map.current.loadImage(gwell_image, function(error, image) {
                                map.current.addImage('gwell_image', image, {sdf: false})

                                layout['icon-image'] = 'gwell_image'
                                map.current.addLayer({
                                    id: 'gwells_symbol',
                                    type: 'symbol',
                                    source: 'gwells',
                                    layout: layout
                                })
                                map.current.addLayer({
                                    id: 'gwells',
                                    type: 'circle',
                                    source: 'gwells',
                                    paint: paint
                                })
                            });


                        })
                });
            })
    }


    // const refreshAccessToken = () => {
    //
    //     console.log('refreshing access token', auth)
    //
    //     loginUser({
    //         username: auth.credentials.username,
    //         password: auth.credentials.password
    //     }).then(token=> {
    //         saveAuthentication(setAuth, token,
    //             auth.credentials.username,
    //             auth.credentials.password)
    //     });
    // }
    useEffect(() => {

        setUpGame()

        setUpMap()
        fetchRosterData()
        updateScore(auth.slug+'.main', setLineup, setScore)

    }, [])

    return(
        <div className='container-fluid'>
            <div className='row'>
                <div className={'col-6'}>
                    <div className={'pane'}>
                        <Leaderboard />
                    </div>
                </div>
                <div className={'col-6'}>
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
                        <div ref={mapContainer} className="map-container" />
                    </div>
                </div>
                <div className='col-6 '>
                    <div className={'pane'}>
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
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext(),

                                                )}
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