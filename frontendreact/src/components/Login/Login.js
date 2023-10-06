import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from "axios";
import './Login.css';
import {settings} from "../../settings";
import {api_getJson, loginUser} from "../../util";



export function saveAuthentication(setAuth, token, username, password) {

    api_getJson(settings.BASE_URL+'/users/me', token.data)
        .then(user => {
            console.log('auth data', user)
            api_getJson(settings.BASE_API_URL+'/player/'+username)
                .then(data => {
                    console.log('saveAuthentication:', data, token, username, password)
                    setAuth(data, token.data, username, password, user);
                })
        })

}


export default function Login({ setAuth }) {
    const [username, setUserName] = useState();
    const [password, setPassword] = useState();

    const handleSubmit = async e => {
        e.preventDefault();
        const token = await loginUser({
            username,
            password
        });
        saveAuthentication(setAuth, token, username, password);
    }

    return(
        <div className="login-wrapper">
            <h1>Please Log In</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    <p>Username</p>
                    <input type="text" onChange={e=>setUserName(e.target.value)}/>
                </label>
                <label>
                    <p>Password</p>
                    <input type="password" onChange={e =>setPassword(e.target.value)}/>
                </label>
                <div>
                    <button type="submit">Submit</button>
                </div>
            </form>
        </div>
    )
}
// Login.propTypes = {
//     setToken: PropTypes.func.isRequired
// }