import logo from './logo.svg';
import './App.css';
// import Dashboard from './components/Dashboard/Dashboard';
import Preferences from './components/Preferences/Preferences';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import React, {useState} from 'react';
import Login from './components/Login/Login';
import useToken from "./components/App/useToken";
import useSlug from "./components/App/useSlug";
import Dashboard from "./components/Dashboard/Dashboard";
import AppNavbar from "./components/Navbar/Navbar";


function App() {

    const {token, setToken} = useToken();
    const {slug, setSlug} = useSlug();

    if(!token) {
        return <Login setToken={setToken}  setSlug={setSlug}/>
    }

    return (
      <div className="wrapper">

        <AppNavbar/>

        <BrowserRouter>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />}/>
            <Route path="/preferences" element={<Preferences />}/>
          </Routes>
        </BrowserRouter>
      </div>
  );
}

export default App;
