import {memo, useState, useEffect} from "react";

function ControlPanel(props) {
    const [visibility, setVisibility] = useState({
        cpc6: false,
        qpf7: false,
    });

    useEffect(() => {
        // Convert true/false to "visible"/"none"
        const visibilityState = Object.fromEntries(
            Object.entries(visibility).map(([k, v]) => [k, v ? "visible" : "none"])
        );
        props.onChange(visibilityState);
    }, [visibility]);

    const onVisibilityChange = (name, value) => {
        setVisibility({ ...visibility, [name]: value });
    };

    return(
        <div className={'control-panel'}>
            <h3>Layers</h3>
            <div>
                <label><input type="checkbox"
                              checked={visibility["cpc6"]}
                              onChange={evt => onVisibilityChange("cpc6", evt.target.checked)}
                /> Climate Prediction Center 6-10 Day Outlook</label>
            </div>
            <div>
                <label><input type="checkbox"
                              checked={visibility["qpf7"]}
                              onChange={evt => onVisibilityChange("qpf7", evt.target.checked)}
                /> Cumulative Precip. 1-7 days</label>
            </div>

        </div>
    )
}

export default memo(ControlPanel);
