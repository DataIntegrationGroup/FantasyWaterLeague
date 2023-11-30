import React, {useEffect, useMemo, useState} from "react";
import {retrieveItems} from "../../util";
import {settings} from "../../settings";
import {
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable
} from "@tanstack/react-table";
import Button from "react-bootstrap/Button";
import {Hourglass} from "react-loader-spinner";


function *intersperse(a, delim) {
    let first = true;
    for (const x of a) {
        if (!first) yield delim;
        first = false;
        yield x;
    }
}


function MyTable({data, columns, loading}){

    const table = useReactTable({ data: data,
        columns: columns ,
        // meta: {
        //     getRowStyles: getRowStyles
        // },
        // state: {sorting},
        // onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        getCoreRowModel: getCoreRowModel(),
            getPaginationRowModel: getPaginationRowModel(),},
        )
    return (
        <div>
            <Hourglass
                height={80}
                width={80}
                color="#4fa94d"
                wrapperStyle={{}}
                wrapperClass="map-loading"
                visible={loading}
                ariaLabel='oval-loading'
                secondaryColor="#4fa94d"
                strokeWidth={2}
                strokeWidthSecondary={2}
            />
            <table className={'table-sm table-bordered display-table'}>
                <thead>
                {table.getHeaderGroups().map(headerGroup => (
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
                {table.getRowModel().rows.map(row => (
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
            <div className="flex items-center gap-2">
                <button
                    className="border rounded p-1"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                >
                    {'<<'}
                </button>
                <button
                    className="border rounded p-1"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    {'<'}
                </button>
                <button
                    className="border rounded p-1"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    {'>'}
                </button>
                <button
                    className="border rounded p-1"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                >
                    {'>>'}
                </button>
                <span className="flex items-center gap-1">
          <div>Page</div>
          <strong>
            {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
          </strong>
        </span>
                <span className="flex items-center gap-1">
          | Go to page:
          <input
              type="number"
              defaultValue={table.getState().pagination.pageIndex + 1}
              onChange={e => {
                  const page = e.target.value ? Number(e.target.value) - 1 : 0
                  table.setPageIndex(page)
              }}
              className="border p-1 rounded w-16"
          />
        </span>
                <select
                    value={table.getState().pagination.pageSize}
                    onChange={e => {
                        table.setPageSize(Number(e.target.value))
                    }}
                >
                    {[10, 20, 30, 40, 50].map(pageSize => (
                        <option key={pageSize} value={pageSize}>
                            Show {pageSize}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    )
}
export default function LocationsTable({handleGraphButton, locations}){

    const [loading, setLoading] = useState(false)

    useEffect(() => {
        // setLoading(true)
        // const url = settings.ST2_API_URL+'/Locations?$expand=Things/Datastreams&$orderby=name'
        // retrieveItems(url,
        //     [], 10000
        // ).then(locs => {
        //     setLocations(locs)}
        // ).finally(()=>{
        //     setLoading(false)
        //     }
        // )
    }, [])

    const columns = useMemo(() => [
        // {accessorKey:'name', header: 'Name'},
        {accessorFn: (data, idx)=>{
            return data
            },
            cell: info=>{
                return <a target='_blank' href={info.getValue()['@iot.selfLink']}>{info.getValue()['name']}</a>
            },
            header: 'Name'},
        {accessorKey:'description', header: 'Description'},
        {accessorFn:(data, idx)=>{
            return data['Things'][0]
            },
            cell: info=>{
            return <a target='_blank' href={info.getValue()['@iot.selfLink']}>{info.getValue()['name']}</a>
            },
            header: 'Thing'},
        {accessorFn: (data, idx)=>{
            return data['Things'][0]['Datastreams']
            },
            cell: info=>{
                const links =info.getValue().map(ds=>{
                    return <a key={ds['@iot.id']} target='_blank' href={ds['@iot.selfLink']}>{ds['name']}</a>
                })
                // return links
                return [...intersperse(links, ', ')]
            },
            header: 'Datastreams'},
        {accessorFn: (data, idx)=>{
                return data
            },
            cell: info=>{
                const location = info.getValue()
                const ds = location['Things'][0]['Datastreams']
                const links =ds.map(ds=>{
                    return <Button key={ds['@iot.id']}
                                   size='sm'
                            onClick={()=>handleGraphButton(location, ds)}
                    >{ds['name']}

                    </Button>
                })
                // return links
                return [...intersperse(links, ', ')]
            },
            header: 'Graph'
        }
    ], [])

    return(
        <div>
            <h2>Locations Table</h2>

            <MyTable data={locations} columns={columns} loading={loading}/>

        </div>
    )
}