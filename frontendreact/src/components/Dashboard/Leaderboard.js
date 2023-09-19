import {flexRender, getCoreRowModel, useReactTable} from "@tanstack/react-table";
import React, {useEffect} from "react";
import {settings} from "../../settings";

export default function Leaderboard() {
    const [data, setData] = React.useState([])

    const columns = [{accessorKey: 'name',
        header: 'Name',
        cell: info => info.getValue()},
        {accessorKey: 'score',
            header: 'Score',
            cell: info => info.getValue().toFixed(2)
        },
    ]

    const table = useReactTable({ data: data, columns: columns ,
        getCoreRowModel: getCoreRowModel(),

    })
    useEffect(() => {

        fetch(settings.BASE_API_URL+'/leaderboard')
            .then(response => response.json())
            .then(data=> setData(data))

    }, []);


    return (
        <div>
            <h4>Leaderboard</h4>

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