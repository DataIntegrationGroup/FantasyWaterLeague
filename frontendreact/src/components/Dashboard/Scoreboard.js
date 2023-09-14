import {useEffect, useState} from "react";
import {settings} from "../../settings";

export default function Scoreboard({roster_slug, score, validLineup}){
// const [validLineup, setValidLineup] = useState(false)
    // const validateLineup = async () => {
    //     return await fetch(settings.BASE_API_URL+'/roster/'+ roster_slug +'/validate').then(
    //         response => response.json()
    //     ).then(data => {
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
    useEffect(() => {
        // getScore()

    }, []);

    return (
        <div>
            <h4>Scoreboard: {roster_slug}</h4>
            <p>Valid Lineup: {validLineup ? "True" : "False"}</p>
            <p>Score: {score}</p>
            <button  className="btn btn-primary">Calculate Score</button>
        </div>
    )
}