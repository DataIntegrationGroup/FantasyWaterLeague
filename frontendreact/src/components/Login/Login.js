import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from "axios";
import './Login.css';

async function loginUser(credentials) {
    const formData = new FormData()
    formData.set('username', credentials.username)
    formData.set('password', credentials.password)

    return axios.post('http://localhost:4040/auth/jwt/login', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'

        }
    })
    // return fetch('http://localhost:4040/auth/jwt/login', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'multipart/form-data'
    //     },
    //     body: formData
    // })
    //     .then(data => data.json())
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

        fetch('http://localhost:4040/api/v1/user/'+username, )
            .then(data => data.json())
            .then(data => {

                setAuth(data, token);

            })
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
Login.propTypes = {
    setToken: PropTypes.func.isRequired
}