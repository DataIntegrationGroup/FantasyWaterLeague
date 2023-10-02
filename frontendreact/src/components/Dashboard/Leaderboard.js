import {flexRender, getCoreRowModel, useReactTable} from "@tanstack/react-table";
import React, {useEffect} from "react";
import {settings} from "../../settings";
import star_icon from "../../img/icon/star.png";

function nameCell(info) {
    let name = info.getValue()
    if (info.row.original.rank > 0){
        let images = []
        for (let i=0; i<info.row.original.rank; i++){
            images.push(<img key={'star'+i} src={star_icon} style={{width: '20px', height: '20px'}}/>)
        }
        return <span>{name} {images} </span>
    }
    return name
}


export default function Leaderboard(props) {
    const [data, setData] = React.useState([])

    const columns = [{accessorKey: 'name',
        header: 'Name',
        cell: nameCell
        },
        {'accessorKey': 'team_name',
            'header': 'Team',
            'cell': info => info.getValue()},
        {accessorKey: 'score',
            header: 'Score',
            cell: info => info.getValue().toFixed(2)
        },

    ]

    const table = useReactTable({ data: data, columns: columns ,
        getCoreRowModel: getCoreRowModel(),
        meta: {getRowStyles: (row) => {
                console.log('asdf', row.original.slug, props.displayPlayer)
                if (row.original.slug === props.displayPlayer){
                    return {backgroundColor: '#85b7e8'}
                } else {
                    return {backgroundColor: '#ffffff'}
                }
            }
        }

    })
    useEffect(() => {

        fetch(settings.BASE_API_URL+'/leaderboard')
            .then(response => response.json())
            .then(data=> setData(data))

    }, []);


    return (
        <div>
            <div className={'card card-dashboard'}>
                <h4>Leaderboard</h4>
            </div>

            <table className={'table-bordered display-table'} style={{ width: '100%'}}>
                <thead>
                {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                            <th key={header.id}>
                                {header.isPlaceholder
                                    ? null
                                    : flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                    )}
                            </th>
                        ))}
                    </tr>
                ))}
                </thead>
                <tbody>
                {table.getRowModel().rows.map(row => (
                    <tr key={row.id}
                        onDoubleClick={() => {
                            console.log(row.original)
                            props.setDisplayPlayer(row.original.slug)
                            // window.open('/teams/view/' + row.original.team_id, '_blank')
                        }}
                        style={table.options.meta?.getRowStyles(row)}
                    >
                        {row.getVisibleCells().map(cell => (
                            <td key={cell.id}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                        ))}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
        )
}