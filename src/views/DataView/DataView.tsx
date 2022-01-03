import React, { useState, useEffect, useMemo } from "react";
import scraper from "../../tools/scraper";
import Logo from "../WelcomeView/assets/Logo";
import "./DataView.css";
import { useTable } from "react-table";

type Props = {
  setView: (viewName: string) => void;
  hide: boolean;
};

const DataView = (props: Props) => {
  const tableData = useMemo(() => scraper.data(), []);
  console.log(tableData.skins);

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
              <tr key={`row_${i}`} {...row.getRowProps()}>
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
    <div style={{ margin: "0 auto", width: 1080, textAlign: "center" }}>
      <div className={"work-view" + (props.hide ? " hide" : "")}>
        <Logo justTitle={true} />
        {/* <h2>
          Total blue essense spent for champions assuming all were bought with
          blue essence: {tableData.blueEssenceSpent}
        </h2> */}
        <button
          style={{
            cursor: "pointer",
            margin: "10px 0 30px",
            background: "#0a98ff",
            border: "none",
            color: "#fff",
            padding: "1rem 2rem",
            fontSize: "20px",
            borderRadius: "2rem",
          }}
          onClick={() => {
            scraper.download();
          }}
        >
          DOWNLOAD GENERATED CSV AND SCREENSHOTS
        </button>
        <Table
          columns={tableData.champions.columns}
          data={tableData.champions.data}
        />
        <br />
        {tableData.skins.data.length > 0 && (
          <Table
            columns={tableData.skins.columns}
            data={tableData.skins.data}
          />
        )}
      </div>
    </div>
  );
};

export default DataView;
