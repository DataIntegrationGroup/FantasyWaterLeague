import React, {useEffect, useState} from "react";

export default function Scoreboard({gameData, roster_slug, score, lineup}){

// const [validLineup, setValidLineup] = useState(false)
    // const validateLineup = async () => {
    //     return await fetch(settings.BASE_API_URL+'/roster/'+ roster_slug +'/validate').then(
    //         response => response.json()
    //     ).then(data => {s
    //         return data.lineup
    //         })
    //     }
    //
    // const getScore = () => {
    //
    //     let lineup = validateLineup()
    //     lineup.then((is_valid)=>{
    //         console.log("lineup", is_valid)
    //         setValidLineup(is_valid)
    //         if (is_valid){
    //             fetch(settings.BASE_API_URL+'/roster/'+ roster_slug +'/score').then(
    //                 response => response.json()
    //             ).then(data => {
    //                 setScore(data.score)
    //             })
    //         }
    //     })
    //
    // }

    // const getGameStart = () => {
    //     getJson(settings.BASE_API_URL+'/game').then(data => {
    //             setGameData(data)
    //
    //     })
    //
    // }
    useEffect(() => {
        // getGameStart()

    }, []);

    return (
        <div>
            <div className={'card card-dashboard'}>
                <h4>Scoreboard: {roster_slug}</h4>
            </div>
            <table className={'table-bordered display-table'} style={{width: '100%'}}>
                <thead>
                    <tr><th>Game Start</th><th>Game End</th></tr>
                </thead>
                <tbody>
                    <tr><td>{gameData.start}</td><td>{gameData.end}</td></tr>
                </tbody>
            </table>

            <div className={'spacer'}></div>

            <table className={'table-bordered display-table'} style={{width: '100%'}}>
                <thead>
                    <tr><th>StreamGauge</th>
                        <th>Groundwater</th>
                        <th>RainGauge</th>
                        <th>Valid</th></tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{lineup.nstreamgauge}/{lineup.rstreamgauge}</td>
                        <td>{lineup.ngroundwater}/{lineup.rgroundwater}</td>
                        <td>{lineup.nraingauge}/{lineup.rraingauge}</td>
                        <td>{lineup.lineup ? "True" : "False"}</td>
                    </tr>
                </tbody>
            </table>
            <p>Score: {score.toFixed()}</p>
            <button  className="btn btn-primary">Calculate Score</button>
        </div>
    )
}