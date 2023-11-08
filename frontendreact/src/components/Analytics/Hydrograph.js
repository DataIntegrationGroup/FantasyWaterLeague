import Plot from 'react-plotly.js';
import React, {useEffect, useState} from "react";
import {retrieveItems} from "../../util";
import {Hourglass} from "react-loader-spinner";

export default function Hydrograph({selected}) {
    const [data, setData] = useState(null)
    const [layout, setLayout] = useState({title: 'Hydrograph',
            width: 600,
            xaxis: {title: 'Date'},
            yaxis: {title: 'Depth to Water (ft bgs)',
                    autorange: 'reversed'}
        }
    )
    const [loading, setLoading] = useState(false)

    useEffect( () => {
        console.log('get data for selected', selected)
        if (selected != null) {
            setLayout({...layout, title: selected['name']})
        }
        const fetchdata = async (url) => {
            return await retrieveItems(url, [])
        }

        const get_datastream_url = (ds_name) => {
            if (selected !== undefined && selected !== null) {

                // for (const ui of [ds_name, 'Groundwater Levels']){
                for (const ds of selected['datastreams']){
                    if (ds.name === ds_name){
                        return ds['@iot.selfLink']+'/Observations?$orderby=phenomenonTime asc'
                    }
                }

            }
        }

        const get_ds_data = async (name, url) => {
            if (url === undefined || url === null){
                return {x: [], y: [], mode: 'lines+markers', 'name': name}
            }

            const data = await fetchdata(url)
            const x = data.map((item) => {
                return item.phenomenonTime
            })
            const y = data.map((item) => {
                return item.result
            })
            return {x: x, y: y, mode: 'lines+markers', 'name': name}
        }
        if (selected != null) {
            let series = []
            let ds_name = selected['ds_name']

            setLoading(true)
            if (ds_name === null || ds_name === undefined) {
                ds_name = ''
                for (const ds of selected['datastreams']){
                    if (ds.name === 'Groundwater Levels(Pressure)' || (ds.name === 'Groundwater Levels(Acoustic)')){
                        ds_name = ds.name
                        console.log('found', ds_name)
                        break
                    }
                }
            }

            get_ds_data('Continuous',  get_datastream_url(ds_name)).then(data => {
                series.push(data)
                ds_name = 'Groundwater Levels'
                get_ds_data('Manual', get_datastream_url(ds_name)).then(data => {
                    series.push(data)
                    setData(series)
                    setLoading(false)
                })
            })
        }

    }, [selected])

    return (
        <div>
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
            <Plot
                divId={'hydrograph'}
                data={data}
                layout={layout}
            />
        </div>


    )
}
