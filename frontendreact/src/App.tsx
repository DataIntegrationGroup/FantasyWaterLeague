import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import React, {useState} from 'react';
import Login from './components/Login/Login';
import 'bootstrap/dist/css/bootstrap.min.css'

import Dashboard from "./components/Dashboard/Dashboard";
import AppNavbar from "./components/Navbar/Navbar";
// import useAuth from "./components/App/useAuth";
import Admin from "./components/Admin/Admin";
import Documentation from "./components/App/Documentation.js";
import Analytics from "./components/Analytics/Analytics.js";
import Matches from "./components/Match/Matches";
import riochama from "./img/riochama.png"
import {FiefAuthProvider} from "@fief/fief/react";
import {Callback, RequireAuth} from "./fief.tsx";


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

function Footer(){
    return (
        <section>
            <footer className={'text-center'} style={{'backgroundColor': '#a4c8ec'}}>
                <div className={'text-center p-3'}>
                    <p>Uses data collected by <a href={'https://waterdata.usgs.gov/nm/nwis/current/'}>USGS NWIS</a>
                        and <a href={'https://www.weather.gov/documentation/services-web-api'}>NWS</a>
                    </p>
                </div>

                <div className={'text-center p-3'}>
                    <p>© 2023 Fantasy Water League</p>
                </div>

            </footer>

        </section>

    )
}

function App() {

    // const {auth, setAuth} = useAuth();
    // console.log('App auth:', auth)
    // if(!auth?.token) {
    //     return <Login setAuth={setAuth}/>
    // }

    return (
        <FiefAuthProvider
            baseURL="https://fief.newmexicowaterdata.org"
            // clientId="Ox90B_hPV-TQar4jEocovtc7Q1Gp1S6uqXjaUFyQBW4"
            // clientId="F1KM8eJ_gqC9Jr-bGY1J6eDZBx47lSk-_IQ1TKaHRcM"
            clientId='u4Zib08CVZ15BfsmO-ytahxtJt0WchLCDYwLAkRvBAE'
        >
        <div className="wrapper">
            <AppNavbar />
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Home />}/>
                        <Route path="/callback" element={<Callback />} />
                        {/*<Route path="/" element={<Home />}/>*/}
                        {/*<Route path="/login" element={<Login setAuth={setAuth} />}/>*/}
                        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>}/>
                        {/*<Route path="/admin" element={<Admin auth={auth}/>}/>*/}
                        {/*<Route path="/documentation" element={<Documentation />}/>*/}
                        {/*<Route path="/analytics" element={<Analytics auth={auth}/>}/>*/}
                        {/*<Route path="/matches" element={<Matches />}/>*/}
                    </Routes>
                </BrowserRouter>
            <Footer />
        </div>
        </FiefAuthProvider>
  );
}

export default App;
