import React from "react";
import "./SmallLogo.css";

const SmallLogo = (props: { animateIn?: boolean } = { animateIn: true }) => {
  return (
    <div>
      <h1 className={"small-logo " + (props.animateIn ? "animate-in" : "")}>
        Lots of Loot
      </h1>
    </div>
  );
};

export default SmallLogo;
