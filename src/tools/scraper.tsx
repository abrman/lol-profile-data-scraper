import React from "react";
import { interfaceManager } from "./interfaceManager";
import { lootCaptureManager } from "./lootCaptureManager";
import { lootScreenshotRecognitionTool } from "./lootScreenshotRecognitionTool";
import { championsCaptureManager } from "./championsCaptureManager";
import { mediaStreamManager } from "./mediaStreamManager";
import * as tf from "@tensorflow/tfjs";

interface Scraper {
  videoElement: React.RefObject<HTMLVideoElement>;
  videoWidth: number;
  videoHeight: number;
  model: tf.LayersModel | undefined;
  [x: string]: any;
}

export const scraper: Scraper = {
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
    scraper.currentView = interfaceManager.currentInterface(
      scraper.videoElement
    );

    if (scraper.currentView === "loot") lootCaptureManager.loop();
    if (scraper.currentView === "champions") championsCaptureManager.loop();

    if (lootCaptureManager.finalScreenshotComplete)
      lootScreenshotRecognitionTool.recognize(lootCaptureManager.lootCanvas);

    scraper.updateAssistant(<>Current view: {scraper.currentView}</>);
    requestAnimationFrame(scraper.loop);
    // setTimeout(scraper.loop, 1000);
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
    mediaStreamManager.startCapture(callback);
  },
};
