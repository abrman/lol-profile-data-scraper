import React, { useState, useEffect } from "react";
import scraper from "../../tools/scraper";
import SmallLogo from "../../components/SmallLogo";
import "./WorkView.css";

type Props = {
  setView: (viewName: string) => void;
  hide: boolean;
};

const WorkView = (props: Props) => {
  useEffect(() => {
    setTimeout(() => {
      scraper.recognize(() => {
        props.setView("data");
      });
    }, 600);
  }, []);

  return (
    <div className={"work-view" + (props.hide ? " hide" : "")}>
      <SmallLogo animateIn={false} />
      <div className="work-center">
        <h1>Working...</h1>
        <p>
          This may take up to a couple minutes for large libraries on slow
          machines.
        </p>
      </div>
    </div>
  );
};

export default WorkView;
