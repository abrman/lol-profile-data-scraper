import React from "react";
import scraper from "../../tools/scraper";
import "./PrepareView.css";
import PrepareIcons from "./assets/PrepareIcons";
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
      <div
        className="prepare-ready"
        onClick={() => {
          props.setView("scrape");
          scraper.startScraping();
        }}
      >
        Start scanning
      </div>
    </div>
  );
};

export default PrepareView;
