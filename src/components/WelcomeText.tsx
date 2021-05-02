import React from "react";

const WelcomeText: React.FunctionComponent<{
  onShareScreenClick: () => void;
}> = (props) => {
  return (
    <>
      <span>
        <b>What it does:</b>
      </span>
      <ol>
        <li>Scrapes loot items aquired</li>
        <li>
          Calculates essence gained from
          <br />
          massive disenchanting
        </li>
        <li>Supports csv table export</li>
      </ol>

      <span>
        <b>To-do:</b>
      </span>
      <ol>
        <li>Track owned champions & skins</li>
        <li>Track cost to buy all champions</li>
        <li>Track champions with chest available</li>
        <li>your recommendations :)</li>
      </ol>
      <button className="share" onClick={props.onShareScreenClick}>
        Share League window to begin
      </button>
      <p className="note">
        *No data is sent to server.
        <br />
        all information is computed locally
      </p>
    </>
  );
};
export default WelcomeText;
