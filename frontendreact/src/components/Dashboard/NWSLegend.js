import React from "react";

export default function NWSLegend(props){
    const labels6_10 = props.cpc6legend.map((label, index) => {

        const src = 'data:image/png;base64, '+label.imageData
        return <div key={index} className={'legend-entry'}>
                <img className={'legend-key'} src={src}/>
            <span className={'legend-label'} >{label.label}</span>
        </div>
    })

    const labels7day = props.qpf7legend.map((label, index) => {
            const src = 'data:image/png;base64, '+label.imageData
            return <div key={index} className={'legend-entry'}>
                    <img className={'legend-key'} src={src}/>
                <span className={'legend-label'} >{label.label}</span>
            </div>
    })

    return (
        <div className={'nwslegend map-overlay top'}>
            <div className={'row'}>
                <div className={'col'}>
                    <div className="map-overlay-inner">
                        <input id="slider" type="range" min="0" max="100" step="0"
                               onChange={(e) => props.setOpacity(e.target.value)}/>
                    </div>
                    <h6>6-10 Day Precip. Forecast</h6>
                    {labels6_10}
                </div>
                <div className={'col'}>
                    <div className="map-overlay-inner">
                        <input id="slider" type="range" min="0" max="100" step="0"
                               onChange={(e) => props.setQPFOpacity(e.target.value)}/>
                    </div>
                    <h6>7 Day Quantitative Precip. Forecast</h6>
                    {labels7day}
                </div>
            </div>


        </div>

    )
}