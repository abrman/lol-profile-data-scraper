import { useState, useRef } from "react";
import scraper from "./tools/scraper";
import WelcomeView from "./views/WelcomeView/WelcomeView";
import PrepareView from "./views/PrepareView/PrepareView";
import ScrapeView from "./views/ScrapeView/ScrapeView";
import WorkView from "./views/WorkView/WorkView";
import DataView from "./views/DataView/DataView";
import "./App.css";

function App() {
  const [isHiding, setIsHiding] = useState(false);
  const [currView, setCurrView] = useState("welcome");

  scraper.videoElement = useRef<HTMLVideoElement>(null);

  const setView = (view: string, callback?: () => void) => {
    if (isHiding === false) {
      setIsHiding(true);
      setTimeout(() => {
        if (typeof callback == "function") callback();
        setIsHiding(false);
        setCurrView(view);
      }, 500);
    }
  };

  return (
    <>
      {currView === "welcome" && (
        <WelcomeView hide={isHiding} setView={setView} />
      )}

      {currView === "prepare" && (
        <PrepareView hide={isHiding} setView={setView} />
      )}

      {currView === "scrape" && (
        <ScrapeView hide={isHiding} setView={setView} />
      )}

      {currView === "work" && <WorkView hide={isHiding} setView={setView} />}

      {currView === "data" && <DataView hide={isHiding} setView={setView} />}

      <div className="debug" style={{ display: "none" }}>
        <video ref={scraper.videoElement}></video>
      </div>
    </>
  );
}

export default App;
