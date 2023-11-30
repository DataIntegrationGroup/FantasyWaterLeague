import {useState} from "react";
import Form from 'react-bootstrap/Form';
import Button from "react-bootstrap/Button";


export default function Download(){

    const [checked, setChecked] = useState({
        locations: false,
        usgs_locations: false,
    });

    const handleCheck = (t) => {
        console.log(t.id)
        setChecked({...checked, [t.id]: !checked[t.id]})

    }
    const handleDownload = () => {
        // console.log('download', locationsChecked)
        // console.log('download', locationsChecked)
        console.log('download', checked)
    }

    return(
        <div>
            <h2>Download</h2>
            <Form.Check // prettier-ignore
                type='checkbox'
                id='locations'
                label='All Locations'
                onClick={(e) => handleCheck(e.target)}
            />
            <Form.Check // prettier-ignore
                type='checkbox'
                id='usgs_locations'
                label='USGS Locations'
                onClick={(e) => handleCheck(e.target)}
            />

            <Button variant="primary" type="submit"
            onClick={handleDownload}
            >Download</Button>
        </div>
    )
}