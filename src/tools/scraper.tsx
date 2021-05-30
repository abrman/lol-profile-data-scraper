import React from "react";
import { interfaceManager } from "./interfaceManager";
import { mediaStreamManager } from "./mediaStreamManager";
import * as tf from "@tensorflow/tfjs";

import Skins from "./views/skins";
import Loot from "./views/loot";
import Champions from "./views/champions";

import JSZip from "jszip";
import { saveAs } from "file-saver";

interface Scraper {
  videoElement: React.RefObject<HTMLVideoElement>;
  videoWidth: number;
  videoHeight: number;
  model: tf.LayersModel | undefined;
  download: () => void;
  [x: string]: any;
}

const scraper: Scraper = {
  videoElement: React.createRef<HTMLVideoElement>(),
  videoWidth: 0,
  videoHeight: 0,
  model: undefined,
  initiated: false,
  ready: false,
  lookupTable: {},
  updateAssistant: (content: JSX.Element) => {},

  currentView: "home",
  loop() {
    const info = {
      view: interfaceManager.currentInterface(scraper.videoElement),
      progress: {
        loot:
          (scraper.loot &&
            (scraper.loot.complete ? "100%" : scraper.loot.progress())) ||
          "0%",
        skins:
          (scraper.skins &&
            (scraper.skins.complete ? "100%" : scraper.skins.progress())) ||
          "0%",
        champions:
          (scraper.champions &&
            (scraper.champions.complete
              ? "100%"
              : scraper.champions.progress())) ||
          "0%",
      },
    };

    const scanningFinished = Object.values(info.progress).reduce(
      (prev, curr) => prev && curr === "100%",
      true
    );

    scraper.updateAssistant(
      <>
        <p>
          Current view: {info.view}
          <br />
          Loot: {info.progress.loot}
          <br />
          Skins: {info.progress.skins}
          <br />
          Champions: {info.progress.champions}
        </p>
        {scanningFinished && "Scanning is finished :)"}
        <button onClick={() => scraper.download()}>Download ZIP</button>
      </>
    );

    // if (info.progress.loot === "100%") {
    //   scraper.loot.recognize();
    //   if (typeof scraper.setImg1 == "function" && scraper.loot.canvasList[0])
    //     scraper.setImg1(scraper.loot.canvasList[0].toDataURL());
    //   scraper.setImg1 = null;
    //   if (typeof scraper.setImg2 == "function" && scraper.loot.canvasList[1])
    //     scraper.setImg2(scraper.loot.canvasList[1].toDataURL());
    //   scraper.setImg2 = null;
    //   if (typeof scraper.setImg3 == "function" && scraper.loot.canvasList[2])
    //     scraper.setImg3(scraper.loot.canvasList[2].toDataURL());
    //   scraper.setImg3 = null;
    //   if (typeof scraper.setImg4 == "function" && scraper.loot.canvasList[3])
    //     scraper.setImg4(scraper.loot.canvasList[3].toDataURL());
    //   scraper.setImg4 = null;
    //   if (typeof scraper.setImg5 == "function" && scraper.loot.canvasList[4])
    //     scraper.setImg5(scraper.loot.canvasList[4].toDataURL());
    //   scraper.setImg5 = null;
    //   if (typeof scraper.setImg6 == "function" && scraper.loot.canvasList[5])
    //     scraper.setImg6(scraper.loot.canvasList[5].toDataURL());
    //   scraper.setImg6 = null;
    // }

    requestAnimationFrame(scraper.loop);
  },

  download() {
    const zip = new JSZip();
    const views = [
      ["skins", this.skins],
      ["loot", this.loot],
      ["champions", this.champions],
    ];

    views.forEach(([viewName, view]) => {
      view.recognize();
      view.annotateImages();

      view.canvasList.forEach((canvas: HTMLCanvasElement, i: number) => {
        if (canvas.height < 10) return;
        const index = view.canvasList.length > 1 ? `_${i}` : "";
        zip.file(
          `${viewName}_annotated_${index}.png`,
          canvas.toDataURL().split("base64,")[1],
          {
            base64: true,
          }
        );
      });

      view.rawCanvasList.forEach((canvas: HTMLCanvasElement, i: number) => {
        if (canvas.height < 10) return;
        const index = view.canvasList.length > 1 ? `_${i}` : "";
        zip.file(
          `${viewName}_original_${index}.png`,
          canvas.toDataURL().split("base64,")[1],
          {
            base64: true,
          }
        );
      });
    });

    zip.generateAsync({ type: "blob" }).then(function (content) {
      saveAs(content, "account_data.zip");
    });
  },

  startCapture(callback: () => void) {
    (window as any).scraper = scraper;
    const currView = () => interfaceManager.currentInterface(this.videoElement);

    mediaStreamManager.startCapture(() => {
      callback();
      this.skins = new Skins(this.videoElement, currView);
      this.loot = new Loot(this.videoElement, currView);
      this.champions = new Champions(this.videoElement, currView);
    });
  },
};

export default scraper;
