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
import Home from "./components/Home/Home";

import {FiefAuthProvider} from "@fief/fief/react";
import {Callback, RequireAuth} from "./fief";


function App() {
    return (
        <FiefAuthProvider
            baseURL="https://fief.newmexicowaterdata.org"
            clientId='u4Zib08CVZ15BfsmO-ytahxtJt0WchLCDYwLAkRvBAE'
        >
        <div className="wrapper">
            <AppNavbar />
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Home />}/>
                        <Route path="/callback" element={<Callback />} />
                        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>}/>
                        <Route path="/dashboard" element={<RequireAuth><Admin /></RequireAuth>}/>
                        <Route path="/documentation" element={<Documentation />}/>
                        <Route path="/analytics" element={<Analytics/>}/>
                        <Route path="/matches" element={<Matches />}/>
                    </Routes>
                </BrowserRouter>
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
        </div>
        </FiefAuthProvider>
  );
}

export default App;
