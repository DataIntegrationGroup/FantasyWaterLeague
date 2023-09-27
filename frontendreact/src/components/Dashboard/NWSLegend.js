export default function NWSLegend(legend){
    const labels = legend.legend.map((label, index) => {

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
        <div className={'nwslegend map-overlay'}>

            <h5>6-10 Day Precip. Forecast</h5>
            {labels}
        </div>

    )
}