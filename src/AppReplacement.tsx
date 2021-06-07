import { useState, useRef } from "react";
import scraper from "./tools/scraper";
import WelcomeView from "./views/WelcomeView/WelcomeView";
import PrepareView from "./views/PrepareView/PrepareView";
import ScrapeView from "./views/ScrapeView/ScrapeView";
import "./AppReplacement.css";

function AppReplacement() {
  const [isHiding, setIsHiding] = useState(false);
  const [currView, setCurrView] = useState("welcome");

  scraper.videoElement = useRef<HTMLVideoElement>(null);

  const setView = (view: string) => {
    if (isHiding === false) {
      setIsHiding(true);
      setTimeout(() => {
        setCurrView(view);
        setIsHiding(false);
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

      <div className="debug" style={{ display: "none" }}>
        <video ref={scraper.videoElement}></video>
      </div>
    </>
  );
}

export default AppReplacement;
