import './App.css';
// import Dashboard from './components/Dashboard/Dashboard';
import Preferences from './components/Preferences/Preferences';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import React, {useState} from 'react';
import Login from './components/Login/Login';

import Dashboard from "./components/Dashboard/Dashboard";
import AppNavbar from "./components/Navbar/Navbar";
import useAuth from "./components/App/useAuth";
import Admin from "./components/Admin/Admin";
import Documentation from "./components/App/Documentation.js";


function Home(){
    return <h2>Welcome to Fantasy Water League</h2>;
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
                    <p>© 2021 Fantasy Water League</p>
                </div>

            </footer>

        </section>

    )
}

function App() {

    const {auth, setAuth} = useAuth();
    console.log('App auth:', auth)
    if(!auth?.token) {
        return <Login setAuth={setAuth}/>
    }

    return (
      <div className="wrapper">

        <AppNavbar setToken={setAuth}/>

        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />}/>
            <Route path="/dashboard" element={<Dashboard auth={auth} setAuth={setAuth}/>}/>
            {/*<Route path="/preferences" element={<Preferences />}/>*/}
            <Route path="/admin" element={<Admin auth={auth}/>}/>
            <Route path="/documentation" element={<Documentation />}/>
          </Routes>
        </BrowserRouter>
          <Footer />
      </div>
  );
}

export default App;
