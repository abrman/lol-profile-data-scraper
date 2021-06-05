// import React, { useState, useRef } from "react";
import WelcomeView from "./views/WelcomeView/WelcomeView";
import PrepareView from "./views/PrepareView/PrepareView";
import SmallLogo from "./components/SmallLogo";
import "./AppReplacement.css";

// type View = "welcome" | "prepare" | "scrape" | "data";

function AppReplacement() {
  // const [welcomeView, setWelcomeView] = useState(true);
  // const [prepareView, setPrepareView] = useState(false);
  // const [scrapeView, setScrapeView] = useState(false);
  // const [dataView, setDataView] = useState(false);

  // //   const welcomeRef = useRef(null);
  // //   const prepareRef = useRef(null);
  // //   const scrapeRef = useRef(null);
  // //   const dataRef = useRef(null);

  // const setView = (view: View) => {
  //   setWelcomeView(view === "welcome");
  //   setPrepareView(view === "prepare");
  //   setScrapeView(view === "scrape");
  //   setDataView(view === "data");
  // };

  return (
    <>
      <WelcomeView />
      {/* <PrepareView /> */}
      {/* <div>SCRAPE</div> */}
      {/* <div>DATA</div> */}
    </>
  );
}

export default AppReplacement;
