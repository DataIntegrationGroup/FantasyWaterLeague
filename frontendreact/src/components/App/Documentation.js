import depth_to_water_example from '../../img/docs/depth_to_water_example.png'
import './Documentation.css'


export default function () {
    return (
        <div className={'card card-dashboard documentation'}>
            <h1>Documentation</h1>


            <h2>Introduction</h2>
            <p>
                FantasyWaterLeague is a fantasy sports game that allows users to draft a team of stream gauges, rain gauges, and groundwater wells. The game is played over a set period of time, and the team with the highest score at the end of the game wins. The score is calculated based on the performance of the team's gauges and wells.

                FantasyWaterLeague is hosted and developed by the New Mexico Water Data Initiative (NMWDI). The NMWDI is a collaborative effort between the New Mexico Bureau of Geology and Mineral Resources, the New Mexico Office of the State Engineer, New Mexico Energy and Minerals Division, New Mexico Environment Department and the New Mexico Interstate Stream Commission</p>
            <p>
                The game is currently in beta testing, and is not open to the public.
            </p>

            <h2>How to Play</h2>
            <p>
                The game is played over a set period of time, and the team with the highest score at the end of the game wins. The score is calculated based on the performance of the team's gauges and wells.
            </p>

            <h2>Scoring Rules</h2>

            <h3>Stream Gauges</h3>
            <pre>
                score = (max_discharge - start_discharge)
            </pre>
            <h3>Rain Gauges</h3>
            <pre>
                score = 10 * sum(rainfall)
            </pre>

            <h3>Groundwater Depth to Water</h3>
            <pre>
                score = 20 * (min_depth - start_depth)
            </pre>

            <img  style={{width: '50%'}} src={depth_to_water_example}/>


            <h2>Sources</h2>
            <p>
                FantasyWaterLeague uses data from the following sources:
                <ul>
                    <li><a href='https://waterdata.usgs.gov/nm/nwis/rt'>USGS NWIS</a></li>
                    <li><a href='https://www.weather.gov/documentation/services-web-api'>National Weather Service</a></li>
                </ul>

                Additional forecasting data comes from NOAA
                <ul>
                    <li><a href='https://mapservices.weather.noaa.gov/vector/rest/services/precip/wpc_qpf/MapServer'>Quantitative Precipitation Forecasts (QPFs) for up to 7 days.
                        </a>
                        <br/>
                        <a href='https://www.wpc.ncep.noaa.gov/'>Weather Prediction Center</a>
                    </li>
                    <li>
                        <a href='https://mapservices.weather.noaa.gov/vector/rest/services/outlooks/cpc_6_10_day_outlk/MapServer>'>
                            6-10 Day Outlook
                        </a>
                        <br/>
                        <a href='https://www.cpc.ncep.noaa.gov/'>Climate Prediction Center </a>
                    </li>

                </ul>
            </p>
        </div>
    )
}