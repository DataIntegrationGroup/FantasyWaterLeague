import React, {useEffect, useState} from "react";

export default function Scoreboard({gameData, roster_slug, score, lineup}){

    return (
        <div>
            <div className={'card card-dashboard'}>
                <h4>Scoreboard: {roster_slug}</h4>
            </div>
            <table className={'table-bordered display-table'} style={{width: '100%'}}>
                <thead>
                    <tr><th>Game Start</th><th>Game End</th><th>Active</th></tr>
                </thead>
                <tbody>
                    <tr className={gameData.active?'active_row':'inactive_row'}><td>{gameData.start}</td><td>{gameData.end}</td><td>{gameData.active? 'Yes': 'No'}</td></tr>
                </tbody>
            </table>


            <table className={'table-bordered display-table'} style={{width: '100%',marginTop:'19px'}}>
                <thead>
                    <tr><th>StreamGauge</th>
                        <th>Groundwater</th>
                        <th>RainGauge</th>
                        <th>Valid</th></tr>
                </thead>
                <tbody>
                    <tr className={gameData.active?'active_row':'inactive_row'}>
                        <td>{lineup.nstreamgauge}/{lineup.rstreamgauge}</td>
                        <td>{lineup.ngroundwater}/{lineup.rgroundwater}</td>
                        <td>{lineup.nraingauge}/{lineup.rraingauge}</td>
                        <td>{lineup.lineup ? "Yes" : "No"}</td>
                    </tr>
                </tbody>
            </table>
            <p>Score: {score.toFixed(2)}</p>
            {/*<button  className="btn btn-primary">Calculate Score</button>*/}
        </div>
    )
}