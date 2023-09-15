import {settings} from "./settings";
import axios from "axios";

export function getJson(url, auth=null, method='GET', body=null) {

    console.log('getJson url:', auth)
    let headers={}
    if (auth !==null) {
        headers['Authorization'] = `Bearer ` + auth['token']?.access_token
    }
    console.log('getJson url:', headers)
    return fetch(url, {method: method,
                           headers: headers,
                           body: body}).then(response => response.json())
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