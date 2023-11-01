import Plot from 'react-plotly.js';
import {useEffect, useState} from "react";
import {retrieveItems} from "../../util";

export default function Hydrograph(props) {
    const [data, setData] = useState(null)
    const [layout, setLayout] = useState({title: 'Hydrograph',
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

        if (props.selected !== undefined && props.selected !== null) {
            const url = props.selected['datastream']['@iot.selfLink']+'/Observations'
            fetchdata(url).then(data => {
                const x = data.map((item) => {
                    return item.phenomenonTime
                })
                const y = data.map((item) => {
                    return item.result
                })
                setData([{x: x, y: y, mode: 'lines+markers'}])

                layout['title'] = 'Hydrograph '+ props.selected['name']

                setLayout(layout)
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
