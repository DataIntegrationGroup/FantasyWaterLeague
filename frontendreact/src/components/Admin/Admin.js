import {api_PatchJson, getJson} from "../../util";
import {settings} from "../../settings";
import axios from "axios";


export default function Admin() {
    const handleGameStart = () => {
        console.log('Game Start')
        toggleGameStatus('true')
    }
    const handleGameStop = () => {
        console.log('Game Stop')
        toggleGameStatus('false')

    }
    const toggleGameStatus = (state) => {
        console.log('Game active: ', state)
        api_PatchJson(settings.BASE_API_URL+'/admin/game_status',
            {'active': state},
            )
    }

    return (
        <div>
            <h1>Admin</h1>
            <button onClick={handleGameStart}>Start Game</button>
            <button onClick={handleGameStop}>Stop Game</button>
        </div>
    )
}