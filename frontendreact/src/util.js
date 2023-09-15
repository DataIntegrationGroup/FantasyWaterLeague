export function getJson(url, auth) {

    console.log('getJson url:', auth)
    let headers={}
    if (auth) {
        headers['Authorization'] = `Bearer ` + auth['token']?.access_token
    }
    console.log('getJson url:', headers)
    return fetch(url, {headers: headers}).then(response => response.json())
}