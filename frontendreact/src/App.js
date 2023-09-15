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
import useAuth from "./components/App/useAuth";


function App() {

    const {auth, setAuth} = useAuth({});

    if(!auth?.token) {
        return <Login setAuth={setAuth}/>
    }

    return (
      <div className="wrapper">

        <AppNavbar setToken={setAuth}/>

        <BrowserRouter>
          <Routes>
            <Route path="/dashboard" element={<Dashboard auth={auth}/>}/>
            <Route path="/preferences" element={<Preferences />}/>
          </Routes>
        </BrowserRouter>
      </div>
  );
}

export default App;
