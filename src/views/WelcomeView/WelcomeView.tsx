import React, { useState } from "react";
import Logo from "./WelcomeViewAssets/Logo";
import WelcomeIcons from "./WelcomeViewAssets/WelcomeIcons";
import "./WelcomeView.css";

const WelcomeView = () => {
  const [classList, setClassList] = useState([]);

  const hide = () => {
    setClassList((p) => (p.indexOf("hide") == -1 ? p.concat(["hide"]) : p));
  };

  return (
    <div className={["welcome-view"].concat(classList).join(" ")}>
      <Logo />
      <WelcomeIcons />
      <div className="share-screen" onClick={hide}>
        Share game client window
      </div>
    </div>
  );
};

export default WelcomeView;
