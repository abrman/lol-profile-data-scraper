import React from "react";
import "./PrepareView.css";
import PrepareIcons from "./PrepareViewAssets/PrepareIcons";
import SmallLogo from "../../components/SmallLogo";

const PrepareView = () => {
  return (
    <div className="prepare-view">
      <SmallLogo animateIn={false} />
      <PrepareIcons />
    </div>
  );
};

export default PrepareView;
