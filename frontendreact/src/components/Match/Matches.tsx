import React, {useEffect, useMemo, useState} from "react";
import {flexRender, getCoreRowModel, getSortedRowModel, useReactTable} from "@tanstack/react-table";
import {api_getJson} from "../../util.js";
import {settings} from "../../settings.js";

export default function Matches() {
    const [matches, setMatches] = useState([])
    useEffect(() => {

        api_getJson('/admin/matches').then((data) => {
            console.log('matches:', data)
            setMatches(data)
        })
        // setMatches()

    }, [])

    const columns = useMemo(()=>[
        {accessorKey: 'slug', header: 'Slug'},
        {accessorKey: 'player_a', header: 'Home'},
        {accessorKey: 'player_b', header: 'Away'},
        {accessorKey: 'score_a', header: 'Home(score)'},
        {accessorKey: 'score_b', header: 'Away(score)'},
        {accessorKey: 'game', header: 'Game'},

        ], []
    )
    const matchtable = useReactTable({ data: matches,
        columns: columns ,
        // meta: {
        //     getRowStyles: getRowStyles
        // },
        // state: {sorting},
        // onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        getCoreRowModel: getCoreRowModel()})

    return (
        <div>
            <h1>Match</h1>
            <div>
                <table className={'table-sm table-bordered display-table'}>
                    <thead>
                    {matchtable.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                                <th key={header.id}
                                    // style={{height: '10px' ,
                                    //     width: header.column.columnDef.meta?.width}}
                                >
                                    {header.isPlaceholder
                                        ? null
                                        :
                                        <div {...{className:
                                                header.column.getCanSort()?
                                                    'cursor-pointer': '',
                                            onClick: header.column.getToggleSortingHandler()}}>
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext(),

                                            )}

                                        </div>
                                    }
                                </th>
                            ))}
                        </tr>
                    ))}
                    </thead>
                    <tbody>
                    {matchtable.getRowModel().rows.map(row => (
                        <tr key={row.id}
                            // style={matchtable.options.meta.getRowStyles(row)}
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
        </div>
    )
}