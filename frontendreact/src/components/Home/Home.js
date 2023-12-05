import riochama from "../../img/riochama.png";
import React from "react";

function Home(){
    return (<div className={'text-center'}>
            <h2>Welcome to Fantasy Water League</h2>
            <p>
                Fantasy Water League is a fantasy sports league based on water data.
                <br/>

                It is a game where you can draft a team of rain, stream and groundwater gauges and compete against your friends.
                <br/>

                The team with the most water wins!
                <br/>
                <img width={"50%"} src={riochama} alt={'groundwater'}/>
            </p>
        </div>
    );
}

export default Home;