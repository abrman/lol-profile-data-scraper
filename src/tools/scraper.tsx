import React from "react";
import { interfaceManager } from "./interfaceManager";
import { lootCaptureManager } from "./lootCaptureManager";
import { lootScreenshotRecognitionTool } from "./lootScreenshotRecognitionTool";
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
  loot_ids: {},
  updateAssistant: (content: JSX.Element) => {},

  currentView: "home",
  loop() {
    scraper.currentView = interfaceManager.currentInterface(
      scraper.videoElement
    );

    if (scraper.currentView === "loot") lootCaptureManager.loop();

    if (lootCaptureManager.finalScreenshotComplete)
      lootScreenshotRecognitionTool.recognize(lootCaptureManager.lootCanvas);

    scraper.updateAssistant(<>Current view: {scraper.currentView}</>);
    requestAnimationFrame(scraper.loop);
    // setTimeout(scraper.loop, 1000);
  },

  async init() {
    if (this.initiated) return;
    this.initiated = true;
    scraper.loot_ids = (await fetch("/lookup_table.json"))
      .text()
      .then((data) => {
        scraper.loot_ids = JSON.parse(data);
        scraper.model_classes = data.match(/(?<=\[")([^"]+)(?=")/g);
      });
    this.model = await tf.loadLayersModel("/model/model.json");

    setTimeout(() => console.log(scraper.loot_ids), 1000);
  },

  startCapture(callback: () => void) {
    mediaStreamManager.startCapture(callback);
  },
};
