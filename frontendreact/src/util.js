import {settings} from "./settings";
import axios from "axios";

const api = axios.create();

export async function loginUser(credentials) {
    const formData = new FormData()
    formData.set('username', credentials.username)
    formData.set('password', credentials.password)

    return axios.post(settings.AUTH_URL+'/login', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }
    )
}

async function inteceptorError(error) {
    const originalRequest = error.config;
    console.log('interceptor error:', error.response.status === 401 && !originalRequest._retry)

    if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        const credentials = JSON.parse(sessionStorage.getItem('credentials'));
        const access_token = await loginUser(credentials);

        sessionStorage.setItem('token', JSON.stringify(access_token.data));
        axios.defaults.headers.common['Authorization']= `Bearer ${access_token.data.access_token}`
        // console.log('intercepto', access_token.data)
        originalRequest.headers['Authorization'] = `Bearer ${access_token.data.access_token}`;
        return api(originalRequest);
    }
    return Promise.reject(error);
}

api.interceptors.response.use((response)=>{
    return response;
}, inteceptorError);

export function api_getJson(url) {
    // get auth from session storage
    let token = null
    try {
        token = JSON.parse(sessionStorage.getItem('token'));
    } catch (e) {
        console.log('api_getJson error:', e)
    }

    let headers = {}
    if (token !== null) {
        headers['Authorization'] = `Bearer ` + token.access_token
    }

    console.log('api_getJson url:', headers)
    return api.get(url, {headers: headers}).then(response => response.data)
}

export function getJson(url) {
    return fetch(url).then(response => response.json())
}


export function indexOfMinimumValue(my_array) {
    if (my_array.length === 0) {
        return -1;
    }
    else{
        var minimumValue = my_array[0];
        var minIndex = 0;

        for (var i = 1; i < my_array.length; i++) {
            if (my_array[i] < minimumValue) {
                minIndex = i;
                minimumValue = my_array[i];
            }
        }
        return minIndex;
    }
}
export function indexOfMaximumValue(my_array) {
    if (my_array.length === 0) {
        return -1;
    }
    else{
        var maximumValue = my_array[0];
        var maxIndex = 0;

        for (var i = 1; i < my_array.length; i++) {
            if (my_array[i] > maximumValue) {
                maxIndex = i;
                maximumValue = my_array[i];
            }
        }
        return maxIndex;
    }
}





export function auth_getJson(url){
    // get auth from session storage
    return api.get(url)
}