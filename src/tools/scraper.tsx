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
        {scanningFinished && "temp button :)"}
      </>
    );

    if (info.progress.loot === "100%") {
      scraper.loot.recognize();
      scraper.setImg1(scraper.loot.annotatedCanvas.toDataURL());
      scraper.setImg1 = null;
    }
    if (info.progress.skins === "100%") {
      scraper.skins.recognize();
      scraper.setImg2(scraper.skins.annotatedCanvas.toDataURL());
      scraper.setImg2 = null;
    }
    if (info.progress.champions === "100%") {
      scraper.champions.recognize();
      scraper.setImg3(scraper.champions.annotatedCanvas.toDataURL());
      scraper.setImg3 = null;
    }

    requestAnimationFrame(scraper.loop);
  },

  async init() {
    if (this.initiated) return;
    this.initiated = true;

    const [lookupTable, champions, skins, wards, numbers, shard_permanent] =
      await Promise.all([
        fetch("/lookup_table.json"),
        tf.loadLayersModel("/models/champions/model.json"),
        tf.loadLayersModel("/models/skins/model.json"),
        tf.loadLayersModel("/models/wards/model.json"),
        tf.loadLayersModel("/models/numbers/model.json"),
        tf.loadLayersModel("/models/shard_permanent/model.json"),
      ]);

    await lookupTable.text().then((data) => {
      scraper.lookupTable = JSON.parse(data);
      scraper.lookupTableLabels = data.match(/(?<=")([^"]+)(?=":)/g);
    });

    scraper.models = {
      champions,
      skins,
      wards,
      numbers,
      shard_permanent,
    };

    scraper.ready = true;
  },

  startCapture(callback: () => void) {
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
