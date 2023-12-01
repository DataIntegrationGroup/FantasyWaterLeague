import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import axios from "axios";
import './Login.css';
import {settings} from "../../settings";
import {api_getJson, loginUser} from "../../util";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";



export function saveAuthentication(setAuth, token, username, password) {

    api_getJson('/users/me', token.data, settings.BASE_URL)
        .then(user => {
            console.log('auth data', user)
            api_getJson('/player/'+username)
                .then(data => {
                    console.log('saveAuthentication:', data, token, username, password)
                    setAuth(data, token.data, username, password, user);
                })
        })

}


export default function Login({ setAuth }) {
    const [loggedIn, setLoggedIn] = useState(false);
    const [username, setUserName] = useState();
    const [password, setPassword] = useState();

    const [confirmPassword, setConfirmPassword] = useState();
    const [name, setName] = useState();
    const [affiliation, setAffiliation] = useState();
    const [showsignup, setshowsignup] = useState(false);

    const dologin = async () => {
        const token = await loginUser({
            username,
            password
        });
        saveAuthentication(setAuth, token, username, password);
        setLoggedIn(true);
    }

    const handleLogin = async e => {
        e.preventDefault();
        dologin(username, password)

    }

    const handleSignup = async e => {
        // e.preventDefault();
        fetch(settings.BASE_URL+'/register', {method: 'POST',
            body: JSON.stringify({email: username, password: password}
            )}).then(res =>
            {
                if (res.status === 200) {
                    console.log('success')
                    dologin()
                }
            }
        )
    }

    const handleShowSignup = async e => {
        document.getElementById('login').style.display='none'
        document.getElementById('signup').style.display='flex'
    }

    const handleShowLogin = async e => {
        document.getElementById('login').style.display='flex'
        document.getElementById('signup').style.display='none'
    }

    if (loggedIn) {
        return <Navigate to="/" />;
    }

    return(
        <div className="login-wrapper">
            <h1>Please Log In or Sign Up</h1>

            <hr width={"50%"} color={"black"}/>

            <div className={"buttons"}>
                <Button onClick={handleShowLogin}>Login</Button>
                <Button onClick={handleShowSignup}>Signup</Button>
            </div>

            <hr width={"50%"} color={"black"}/>

            <div id="login" className={"login"}>
                <Form>
                    <Form.Label>Email</Form.Label>
                    <Form.Control type="text" onChange={e=>setUserName(e.target.value)}/>
                    <Form.Label>Password</Form.Label>
                    <Form.Control type="password" onChange={e =>setPassword(e.target.value)}/>
                    <Button variant="primary" type="submit" onClick={handleLogin}>
                        Submit
                    </Button>
                </Form>
            </div>
            <div id="signup" className={"signup"}>
                <Form>
                    <Form.Label>Name</Form.Label>
                    <Form.Control type="text" onChange={e=>setName(e.target.value)}/>
                    <Form.Label>Email</Form.Label>
                    <Form.Control type="text" onChange={e=>setUserName(e.target.value)}/>
                    <Form.Label>Affiliation</Form.Label>
                    <Form.Control type="text" onChange={e=>setAffiliation(e.target.value)}/>
                    <Form.Label>Password</Form.Label>
                    <Form.Control type="password" onChange={e =>setPassword(e.target.value)}/>
                    <Form.Label>Confirm Password</Form.Label>
                    <Form.Control type="password" onChange={e =>setConfirmPassword(e.target.value)}/>
                    <Button variant="primary" type="submit" onClick={handleSignup}>
                        Sign Up
                    </Button>
                </Form>

            </div>
        </div>
    )
}
// Login.propTypes = {
//     setToken: PropTypes.func.isRequired
// }