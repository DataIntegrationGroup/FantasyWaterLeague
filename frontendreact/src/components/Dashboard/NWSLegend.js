import React from "react";

export default function NWSLegend(props){
    const labels = props.legend.map((label, index) => {

        const src = 'data:image/png;base64, '+label.imageData
        return <div key={index}>
            <span className={'legend-key'}>
                <img src={src}
                     style={{width: '15px', height: '15px'}}
                />

            </span>
            <span className={'legend-label'} >{label.label}</span>
        </div>
    })

    return (
        <div className={'nwslegend map-overlay top'}>
            <div className="map-overlay-inner">
                <label>Layer opacity: <span id="slider-value">100%</span></label>
                <input id="slider" type="range" min="0" max="100" step="0" value={props.opacity}
                       onChange={(e) => props.setOpacity(e.target.value)}/>
            </div>
            <h5>6-10 Day Precip. Forecast</h5>
            {labels}
        </div>

    )
}