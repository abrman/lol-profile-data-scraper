import React, { useState, useEffect } from "react";
import scraper from "../../tools/scraper";
import Loader from "./assets/Loader";
import SmallLogo from "../../components/SmallLogo";
import "./ScrapeView.css";
import { finished } from "node:stream";

type Props = {
  setView: (viewName: string, callback?: () => void) => void;
  hide: boolean;
};

const ScrapeView = (props: Props) => {
  const getLoadedStates = () => {
    const output: { [x: string]: any } = {};
    [
      "loot",
      "champions",
      "skins",
      "emotes",
      "icons",
      "wards",
      "chromas",
    ].forEach((type) => {
      if (typeof (scraper as any)[type] !== "undefined") {
        output[type] = {
          loaded: (scraper as any)[type].progress(),
          isActive: scraper.getCurrView() === type,
          warnMessage:
            typeof (scraper as any)[type].warnMessage !== "undefined"
              ? (scraper as any)[type].warnMessage
              : null,
        };
      }
    });
    return output;
  };

  const [loadStates, setLoadStates] = useState(getLoadedStates());
  const requestRef = React.useRef<number | null>();

  const updateLoadedStateLoop = () => {
    setLoadStates(getLoadedStates());
    requestRef.current = requestAnimationFrame(updateLoadedStateLoop);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updateLoadedStateLoop);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  return (
    <div className={"scrape-view" + (props.hide ? " hide" : "")}>
      <SmallLogo animateIn={false} />
      <div className="row">
        <div className="loaders">
          {[
            "loot",
            "collection",
            "champions",
            "skins",
            "emotes",
            "wards",
            "icons",
            "chromas",
          ].map((type) => {
            if (type === "collection")
              return (
                <div key="subtitle" className="subtitle">
                  Collection:
                </div>
              );
            if (typeof (loadStates as any)[type] !== "undefined")
              return (
                <Loader
                  key={type}
                  name={type}
                  loaded={loadStates[type].loaded}
                  active={loadStates[type].isActive}
                  warning={loadStates[type].warnMessage}
                />
              );
            return "";
          })}
          <div
            className={
              "finish-scanning" +
              (Object.values(loadStates)
                .map((v: any) => v.loaded)
                .reduce((p: any, c: any) => p + (c !== "100.0%"), 0) === 0
                ? " done"
                : "")
            }
            onClick={() => props.setView("work")}
          >
            Finish scanning
          </div>
        </div>
        <div className="instructions">
          <h2 style={{ marginTop: 0 }}>Instructions:</h2>
          <p>
            Open up each of the views seen on the left in game client.
            <br />
            In each view do the following:
          </p>
          <ol>
            <li>Scroll to the top</li>
            <li>Slowly scroll down paying attention to the percentages</li>
            <li>If percentage doesn't change as you scroll, back up a bit</li>
          </ol>
          <p>Notes:</p>
          <ul>
            <li>
              Chat hovers & popups can obstruct the view, try to avoid them.
            </li>
            <li>
              While scrolling keep mouse on the scrollbar, or right of it after
              you grab it
            </li>
            <li>
              Please be patient while recognizing the data once scanned. This
              can take anywhere from a couple seconds to a couple minutes
              depending on the speed of your machine and the size of your League
              inventory
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ScrapeView;
