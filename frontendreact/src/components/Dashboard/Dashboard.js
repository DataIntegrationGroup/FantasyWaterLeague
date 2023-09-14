import React, {useEffect, useRef, useState} from 'react';
import Plot from 'react-plotly.js';
import {getCoreRowModel, flexRender, useReactTable} from '@tanstack/react-table'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'mapbox-gl/dist/mapbox-gl.css';
import './Dashboard.css'
// import { Table as Table } from 'react-bootstrap'
import {settings} from "../../settings";
import styled from "styled-components";
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import Leaderboard from "./Leaderboard";
import Scoreboard from "./Scoreboard";

function indexOfMaximumValue(my_array) {
    if (my_array.length === 0) {
        return -1;
    }
    else{
        var maximumValue = my_array[0];
        var maxIndex = 0;

        for (var i = 1; i < my_array.length; i++) {
            if (my_array[i] > maximumValue) {
                maxIndex = i;
                maximumValue = my_array[i];
            }
        }
        return maxIndex;
    }
}
function GraphButton({row, setSelectedAsset, setPlotData}){
    const handleClick = () => {
        console.log('graph', row)
        fetch(settings.BASE_API_URL+'/asset/'+row.original.slug+'/data_url')
            .then(response => response.json())
            .then(data=> {
                fetch(data.prev_url).then(
                    response => response.json()
                ).then(data =>{

                    var values = data["value"]['timeSeries'][0]['values'][0]['value']

                    var y = values.map(v=>v['value'])
                    var x = values.map(v=>v['dateTime'])

                    var trace1 = {
                        x: x,
                        y: y,
                        mode: 'lines',
                        name: 'timeseries'
                    };

                    var trace2 = {
                        x: [x[0], x[x.length-1]],
                        y: [y[0], y[0]],
                        mode: 'lines',
                        name: 'baseline'
                    };

                    var xmax = indexOfMaximumValue(y)
                    console.log(xmax, x[xmax], Math.max(...y))
                    var trace3 = {
                        x: [x[xmax], x[xmax]],
                        y: [Math.max(...y), y[0]],
                        mode: 'lines',
                        name: 'max'
                    };

                    setPlotData([trace1,trace2,trace3])
                    setSelectedAsset(row.original.name)
                    console.log('selected', row.original.name)
                    document.getElementById('graphContainer').style.display = 'block'
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
                             setValidLineup,
                             setScore, roster_slug}){
    const handleClick = () => {
        toggleActive(roster_slug, props.original.slug, true,
            updateTable,
            setValidLineup,
            setScore)
    }
    return <button
        className='rowbutton'
        style={{background: '#2c974b'}}
        onClick={handleClick}>Active</button>
}
function InactiveRowButton({props, updateTable,
                               setValidLineup,
                               setScore, roster_slug}){
    const handleClick = () => {
        toggleActive(roster_slug, props.original.slug, false,
            updateTable,
            setValidLineup,
            setScore)
    }
    return <button
        className='rowbutton'
        style={{background: '#c24850'}}
        onClick={handleClick}>Inactive</button>
}


const updateScore = (roster_slug, setValidLineup, setScore,) => {
    fetch(settings.BASE_API_URL+'/roster/'+ roster_slug +'/validate')
        .then(response=>response.json())
        .then(data=>{
            let is_valid = data.lineup
            setValidLineup(is_valid)
            if (is_valid){
                fetch(settings.BASE_API_URL+'/roster/'+ roster_slug +'/score').then(
                    response => response.json()
                ).then(data => {
                    setScore(data.score)
                })
            }
        })
}

function toggleActive(roster_slug, slug, state, updateTable, setValidLineup, setScore){

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
            updateScore(roster_slug, setValidLineup, setScore)
        }
    )
}


export default function Dashboard({playername}) {
    const [roster_data, setRosterData] = React.useState([])

    const [score, setScore] = useState(0);
    const [validLineup, setValidLineup] = useState(false)

    const mapContainer = useRef(null);
    const map = useRef(null);
    const [lng, setLng] = useState(-106.5);
    const [lat, setLat] = useState(34.35);
    const [zoom, setZoom] = useState(6.1);

    const [plotData, setPlotData] = useState(null)
    const [selectedAsset, setSelectedAsset] = useState(null)



    const roster_columns = [{accessorKey: 'name',
        header: 'Name',
        cell: info => info.getValue(),
        meta: {
            width: 500
            }
        },
        {accessorKey: 'atype',
            header: 'Type',},
        // {accessorKey: 'active',
        //     header: 'Active',
        //     cell: info => info.getValue() ? 'True':'False',
        //     disableSortBy: true
        // },
        {accessorKey: '',
            header: 'Action',
            meta: {
                width: 400
            },
            cell: ({cell}) => (<div><ActiveRowButton props={cell.row}
                                                     roster_slug={playername+'.main'}
                                                     updateTable={fetchRosterData}
                                                     setValidLineup={setValidLineup}
                                                     setScore={setScore}>Active</ActiveRowButton>
                                    <InactiveRowButton props={cell.row}
                                                       roster_slug={playername+'.main'}
                                                       updateTable={fetchRosterData}
                                                       setValidLineup={setValidLineup}
                                                       setScore={setScore}>Inactive</InactiveRowButton>
                                    <GraphButton row={cell.row}
                                                 setSelectedAsset={setSelectedAsset}
                                                 setPlotData={setPlotData}>Graph</GraphButton>
                                    <MapButton map={map} row={cell.row}>Map</MapButton>
            </div>
            )
        },
    ]


    const roster_table = useReactTable({ data: roster_data,
        columns: roster_columns ,
        meta: {
            getRowStyles: (row) => ({
                background: row.original.active ? "#64B976FF" : "#B07D6EFF"
            })
        },
        getCoreRowModel: getCoreRowModel()})

    const fetchRosterData = () => {
        fetch(settings.BASE_API_URL+'/roster/jake.main')
            .then(response => response.json())
            .then(data=> setRosterData(data))
    }
    const setUpMap = () => {
        fetch(settings.BASE_API_URL+'/mapboxtoken')
            .then(response => response.json())
            .then(data=> {
                console.log('mapboxfasd token', data)
                mapboxgl.accessToken = data.token
                if (map.current) return; // initialize map only once
                map.current = new mapboxgl.Map({
                    container: mapContainer.current,
                    style: 'mapbox://styles/mapbox/streets-v12',
                    center: [lng, lat],
                    zoom: zoom
                });


                // fetch(settings.BASE_API_URL+'/roster/jake.main/geojson')
                //     .then(response => response.json())
                //     .then(data=> {
                //         console.log('geojson', data)
                map.current.on('load', function () {
                    fetch(settings.BASE_API_URL+'/roster/jake.main/geojson')
                        .then(response => response.json())
                        .then(data=> {
                            console.log('geojson', data)
                            let streamgauges = {'type': 'FeatureCollection',
                                            'features': data['features'].filter(d=>d.properties.atype==='stream_gauge')}
                            let gwells = {'type': 'FeatureCollection',
                                        'features': data['features'].filter(d=>d.properties.atype==='continuous_groundwater')}

                            map.current.addSource('streamgauges', {type: 'geojson',
                                data: streamgauges}) ;
                            map.current.addSource('gwells', {type: 'geojson',
                                data: gwells}) ;

                            map.current.addLayer({
                                id: 'streamgauges',
                                type: 'circle',
                                source: 'streamgauges',
                                paint: {
                                    'circle-radius': 5,
                                    'circle-color': '#5ce315',
                                    'circle-stroke-color': 'rgba(0,0,0,1)',
                                    'circle-stroke-width': 1,
                                }
                            })
                            map.current.addLayer({
                                id: 'gwells',
                                type: 'circle',
                                source: 'gwells',
                                paint: {
                                    'circle-radius': 5,
                                    'circle-color': '#d5633a',
                                    'circle-stroke-color': 'rgba(0,0,0,1)',
                                    'circle-stroke-width': 1,
                                }
                            })

                        })

                });


            })
    }
    useEffect(() => {
        setUpMap()
        fetchRosterData()

    }, [])


    return(
        <div className='container-fluid'>
            <div className='row'>
                <div className={'col-lg-6'} style={{'padding': '10px'}}>
                    <div className={'pane'}>
                        <Leaderboard />
                    </div>
                </div>
                <div className={'col-lg-6'} style={{'padding': '10px'}}>
                    <div className={'pane'}>
                        <Scoreboard roster_slug={playername+'.main'}
                                    validLineup={validLineup}
                                    score={score}/>
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
                                layout={{width: '100%', height: '100%', title: {text: selectedAsset} }}
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