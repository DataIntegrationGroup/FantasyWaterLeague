import {api_getJson, toNameCase} from "./util";
import {settings} from "./settings";
import streamgauge_image from "./img/streamgauge.png";
import gwell_image from "./img/gwell.png";
import raingauge_image from "./img/raingauge.png";
import mapboxgl from "mapbox-gl";



export const make_fc = (data, tag) => {
    return {'type': 'FeatureCollection',
        'features': data['features'].filter(d=>d.properties.atype===tag)}
}

export default function add_roster_to_map(map, auth, setHoverActive=null){

    const paint = {
        'circle-radius': 5,
        'circle-color': ['match', ['get', 'active'],
            1, '#64B976',
            0, '#B07D6E',
            '#d5633a'],
        'circle-stroke-color': 'black',
        'circle-stroke-width': 1,
    }

    let layout = {
        'icon-size': 0.065,
        'icon-allow-overlap': true,
        'icon-offset': [0, -200],
    }

    api_getJson(settings.BASE_API_URL+'/roster/'+auth.slug+'.main/geojson')
        .then(data=> {
            console.log('geojson', data)
            let items =[[settings.STREAM_GAUGE, streamgauge_image],
                [settings.CONTINUOUS_GROUNDWATER,gwell_image],
                [settings.CONTINUOUS_RAIN_GAUGE, raingauge_image]]
            items.forEach((item)=>{
                let tag = item[0]
                let image = item[1]

                let fc = make_fc(data, tag)
                console.log(fc)
                map.current.addSource(tag, {type: 'geojson',
                    data: fc}) ;
                map.current.loadImage(image, function(error, image) {
                    map.current.addImage(tag + '_image', image, {sdf: false})
                    layout['icon-image'] = tag + '_image'
                    map.current.addLayer({
                        id: tag + '_symbol',
                        source: tag,
                        type: 'symbol',
                        layout: layout
                    })

                    const lay = map.current.addLayer({
                        id: tag,
                        type: 'circle',
                        source: tag,
                        paint: paint
                    })

                    const popup = new mapboxgl.Popup({
                        closeButton: false,
                        closeOnClick: false
                    })

                    lay.on('mouseenter', tag, function (e) {

                        map.current.getCanvas().style.cursor = 'pointer';
                        const coordinates = e.features[0].geometry.coordinates.slice();
                        const atype = toNameCase(e.features[0].properties.atype)

                        const html= `<div class="popup">
<table class="table-sm table-bordered">
<tr><td class="popup-td">Name</td><td>${e.features[0].properties.name}</td></tr>
<tr><td class="popup-td">Type</td><td>${atype}</td></tr>
<tr><td class="popup-td">Score</td><td>${e.features[0].properties.score.toFixed(2)}</td></tr>
</table></div>`
                        popup.setLngLat(coordinates)
                            .setHTML(html)
                            .addTo(map.current);
                        if (setHoverActive !== null){
                            setHoverActive(e.features[0].properties.name)
                        }
                        // setHoverActive(e.features[0].properties.name)
                    })

                    map.current.on('mouseleave', tag, function () {
                        map.current.getCanvas().style.cursor = '';
                        popup.remove();
                    })
                })
            }) // end forEach
        })


}