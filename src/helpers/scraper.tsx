import React from "react";
import { interfaceManager } from "./interfaceManager";
import { lootCaptureManager } from "./lootCaptureManager";
import { mediaStreamManager } from "./mediaStreamManager";

interface Scraper {
  videoElement: React.RefObject<HTMLVideoElement>;
  videoWidth: number;
  videoHeight: number;
  [x: string]: any;
}

export const scraper: Scraper = {
  videoElement: React.createRef<HTMLVideoElement>(),
  videoWidth: 0,
  videoHeight: 0,
  updateAssistant: (content: JSX.Element) => {},

  currentView: "home",
  async loop() {
    scraper.currentView = interfaceManager.currentInterface(
      scraper.videoElement
    );

    if (scraper.currentView === "loot") lootCaptureManager.loop();

    scraper.updateAssistant(<>Current view: {scraper.currentView}</>);
    requestAnimationFrame(scraper.loop);
    // setTimeout(scraper.loop, 1000);
  },

  startCapture(callback: () => void) {
    mediaStreamManager.startCapture(callback);
  },
};
