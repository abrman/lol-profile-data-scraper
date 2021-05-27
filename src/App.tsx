import React, { useState, useEffect } from "react";
import "./App.css";
import loot from "./assets/loot-tab.jpg";
import scraper from "./tools/scraper";
import WelcomeText from "./components/WelcomeText";
import ScraperAssistant from "./components/ScraperAssistant";
import Debug from "./components/Debug";

function App() {
  scraper.videoElement = React.useRef<HTMLVideoElement>(null);

  const [view, setView] = useState("landing");

  useEffect(() => {
    scraper.init();
  }, []);

  const tableData = [
    ["Aatrox", 1, 2880, 4800],
    ["Ahri", 0, 2880, 4800],
    ["Akali", 2, 1890, 3150],
    ["Alistar", 2, 810, 1350],
    ["Amumu", 2, 270, 450],
    ["Anivia", 3, 1890, 3150],
    ["Annie", 2, 270, 450],
    ["Aphelios", 0, 3780, 6300],
    ["Ashe", 3, 270, 450],
    ["Aurelion", 3, 3780, 6300],
    ["Azir", 3, 3780, 6300],
    ["Bard", 1, 3780, 6300],
    ["Blitzcrank", 1, 1890, 3150],
    ["Brand", 1, 2880, 4800],
    ["Braum", 0, 2880, 4800],
    ["Caitlyn", 0, 2880, 4800],
    ["Camille", 1, 3780, 6300],
  ];

  return (
    <div className="app" data-view={view}>
      <header className="landing-page-welcome">
        <Debug />
        <h1>
          Profile scraper for
          <br />
          League of Legends
        </h1>
        <br />
        {view === "landing" ? (
          <WelcomeText
            onShareScreenClick={() => {
              scraper.startCapture(() => {
                setView("video");
              });
            }}
          />
        ) : (
          <ScraperAssistant />
        )}
      </header>
      <div className="side-panel">
        <div className="video-container">
          <img className="loot-image" src={loot} alt="" />
          <video ref={scraper.videoElement}></video>
          <div className="table">
            <table>
              <thead>
                <tr>
                  <th>Champion</th>
                  <th>Champion Shards</th>
                  <th>Crafting Price</th>
                  <th>Store Price</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((v, i) => (
                  <tr key={`t_${i}`}>
                    <td>{v[0]}</td>
                    <td>{v[1]}</td>
                    <td>{v[2]}</td>
                    <td>{v[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
