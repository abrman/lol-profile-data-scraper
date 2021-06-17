import React, { useState, useEffect, useMemo } from "react";
import scraper from "../../tools/scraper";
import SmallLogo from "../../components/SmallLogo";
import "./DataView.css";
import { useTable } from "react-table";

type Props = {
  setView: (viewName: string) => void;
  hide: boolean;
};

const DataView = (props: Props) => {
  const tableData = useMemo(() => scraper.data(), []);

  const Table = ({ columns, data }: { columns: any; data: any }) => {
    // Use the state and functions returned from useTable to build your UI
    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
      useTable({
        columns,
        data,
      });

    // Render the UI for your table
    return (
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()}>{column.render("Header")}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row, i) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell) => {
                  return (
                    <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  return (
    <div className={"work-view" + (props.hide ? " hide" : "")}>
      <SmallLogo animateIn={false} />
      <Table
        columns={tableData.champions.columns}
        data={tableData.champions.data}
      />
      <a href="#" onClick={() => scraper.download()}>
        Download
      </a>
    </div>
  );
};

export default DataView;
