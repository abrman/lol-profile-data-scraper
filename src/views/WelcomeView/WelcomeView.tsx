import React, { useState } from "react";
import Logo from "./WelcomeViewAssets/Logo";
import WelcomeIcons from "./WelcomeViewAssets/WelcomeIcons";
import "./WelcomeView.css";

type Props = {
  setView: (viewName: string) => void;
  hide: boolean;
};

const WelcomeView = (props: Props) => {
  return (
    <div className={"welcome-view" + (props.hide ? " hide" : "")}>
      <Logo />
      <WelcomeIcons />
      <div className="share-screen" onClick={() => props.setView("prepare")}>
        Share game client window
      </div>
    </div>
  );
};

export default WelcomeView;
