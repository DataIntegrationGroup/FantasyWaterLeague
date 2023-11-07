import Plot from 'react-plotly.js';
import {useEffect, useState} from "react";
import {retrieveItems} from "../../util";

export default function Hydrograph(props) {
    const [data, setData] = useState(null)
    const [layout, setLayout] = useState({title: 'Hydrograph',
            width: 600,
            xaxis: {title: 'Date'},
            yaxis: {title: 'Depth to Water (ft bgs)',
                    autorange: 'reversed'}
        }
    )

    useEffect( () => {
        console.log('get data for selected', props)

        const fetchdata = async (url) => {
            return await retrieveItems(url, [])
        }

        const get_datastream_url = (ds_name) => {
            if (props.selected !== undefined && props.selected !== null) {

                // for (const ui of [ds_name, 'Groundwater Levels']){
                for (const ds of props.selected['datastreams']){
                    if (ds.name === ds_name){
                        return ds['@iot.selfLink']+'/Observations?$orderby=phenomenonTime asc'
                    }
                }

            }
        }

        const get_ds_data = async (name, url) => {
            const data = await fetchdata(url)
            const x = data.map((item) => {
                return item.phenomenonTime
            })
            const y = data.map((item) => {
                return item.result
            })
            return {x: x, y: y, mode: 'lines+markers', 'name': name}
        }
        if (props.selected != null) {
            let series = []
            let ds_name = props.selected['ds_name']
            get_ds_data('Continuous',  get_datastream_url(ds_name)).then(data => {
                series.push(data)
                ds_name = 'Groundwater Levels'
                get_ds_data('Manual', get_datastream_url(ds_name)).then(data => {
                    series.push(data)
                    setData(series)
                })
            })
        }

    }, [props])

    return (
        <Plot
        divId={'hydrograph'}
        data={data}
        layout={layout}
        />

    )
}
