export function getJson(url) {
    return fetch(url).then(response => response.json())
}