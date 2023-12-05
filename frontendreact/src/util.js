import {settings} from "./settings";
import axios from "axios";

const api = axios.create();

export async function loginUser(credentials) {
    // const formData = new FormData()
    // formData.set('username', credentials.username)
    // formData.set('password', credentials.password)
    //
    // return axios.post(settings.AUTH_URL+'/login', formData, {
    //         headers: {
    //             'Content-Type': 'multipart/form-data'
    //         }
    //     }
    // )
}

async function inteceptorError(error) {
    const originalRequest = error.config;
    // console.log('interceptor error:', error.response.status === 401 && !originalRequest._retry)

    if (error.response?.status === 401 && !originalRequest._retry) {
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

export async function api_getJson(url, token = null, root=null) {
    if (root === null){
        root = settings.BASE_API_URL
    }


    // get auth from session storage
    // let token = null
    const headers = makeHeaders(token)

    // const response = await api.get(root+url, {headers: headers}).catch(e=>{
    //     console.log('api_getJson error:', e)
    // });
    // if (response!==undefined){
    //     return response.data;
    // }

    return api.get(root+url, {headers: headers})
        .then(response => {return response.data})
        .catch(e=>{console.log('api_getJson error:', e)}
        )


}

function makeHeaders(token=null) {
    // if (token===null){
    //     try {
    //         token = JSON.parse(sessionStorage.getItem('token'));
    //
    //     } catch (e) {
    //         console.log('makeHeaders error:', e)
    //     }
    // }

    let headers = {}
    if (token !== null) {
        headers['Authorization'] = `Bearer ` + token
    }
    return headers
}

export async function api_PatchJson(url, data, token = null) {
    const headers = makeHeaders(token)
    return await api.patch(url, data, {headers: headers})
        .then(response => {return response.data})
        .catch(e => {console.log('api_PatchJson error:', e)})
}

export async function getJson(url) {
    const response = await fetch(url);
    return await response.json();
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


export async function retrieveItems(url, items=[], maxitems= null){
    if (maxitems!=null && items.length>=maxitems){
        return items
    }
    console.log('fetching', url)
    const newData = await fetch(url)
    const data = await newData.json()
    console.log('fetch results', data)
    if (data['@iot.nextLink']!=null){
        return retrieveItems(data['@iot.nextLink'], items.concat(data.value), maxitems)
    }else{
        return items.concat(data.value)
    }
}

export function toNameCase(txt){
    // replace underscores with spaces and capitalize first letter of each word
    return txt.replace(/_/g, ' ').replace(/\w\S*/g,
        function(txt){return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();});
}

// export function retrieveItems(url, maxitems, callback) {
//     new Promise((resolve, reject) => {
//         getItems(url, maxitems, 0, [], resolve, reject)}).then(callback)
// }
//
//
// const getItems = (url, maxitems, i, items, resolve, reject) =>{
//     console.log('urasdf', url)
//     fetch(url).then(response=>{
//         let ritems = items.concat(response.value)
//         if (maxitems>0){
//             if (ritems.length>maxitems){
//                 ritems = ritems.slice(0,maxitems)
//                 resolve(ritems)
//                 return
//             }
//         }
//
//         if (response['@iot.nextLink']!=null){
//             getItems(response['@iot.nextLink'], maxitems, i+1, ritems, resolve, reject)
//         }else{
//             resolve(ritems)
//         }
//     })
// }