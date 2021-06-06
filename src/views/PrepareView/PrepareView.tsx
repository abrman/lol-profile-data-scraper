import React from "react";
import "./PrepareView.css";
import PrepareIcons from "./PrepareViewAssets/PrepareIcons";
import SmallLogo from "../../components/SmallLogo";

type Props = {
  setView: (viewName: string) => void;
  hide: boolean;
};

const PrepareView = (props: Props) => {
  return (
    <div className={"prepare-view" + (props.hide ? " hide" : "")}>
      <SmallLogo animateIn={true} />
      <PrepareIcons />
    </div>
  );
};

export default PrepareView;
