import logo from './logo.svg';
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


function Home(){
    return <h2>Welcome to Fantasy Water League</h2>;
}
function App() {

    const {auth, setAuth} = useAuth({});
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
            <Route path="/preferences" element={<Preferences />}/>
            <Route path="/admin" element={<Admin auth={auth}/>}/>
          </Routes>
        </BrowserRouter>
      </div>
  );
}

export default App;
