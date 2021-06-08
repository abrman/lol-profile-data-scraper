import React from "react";
import { interfaceManager } from "./interfaceManager";
import { mediaStreamManager } from "./mediaStreamManager";

import Skins from "./views/skins";
import Loot from "./views/loot";
import Champions from "./views/champions";
import Emotes from "./views/emotes";
import Icons from "./views/icons";

import JSZip from "jszip";
import { saveAs } from "file-saver";

interface Scraper {
  videoElement: React.RefObject<HTMLVideoElement>;
  videoWidth: number;
  videoHeight: number;
  getCurrView: () => string | false;
  startCapture: (onSuccess: () => void) => any;
  startScraping: () => void;
  recognize: () => void;
  download: () => void;
  skins: any;
  loot: any;
  champions: any;
  emotes: any;
  icons: any;
}

const scraper: Scraper = {
  videoElement: React.createRef<HTMLVideoElement>(),
  videoWidth: 0,
  videoHeight: 0,
  skins: null,
  loot: null,
  champions: null,
  emotes: null,
  icons: null,

  recognize() {
    const views = [
      ["skins", scraper.skins],
      ["loot", scraper.loot],
      ["champions", scraper.champions],
      ["emotes", scraper.emotes],
      ["icons", scraper.icons],
    ];

    views.forEach(([viewName, view]) => {
      view.recognize();
    });
  },

  download() {
    const zip = new JSZip();
    const views = [
      ["skins", scraper.skins],
      ["loot", scraper.loot],
      ["champions", scraper.champions],
      ["emotes", scraper.emotes],
      ["icons", scraper.icons],
    ];

    views.forEach(([viewName, view]) => {
      view.recognize();
      view.annotateImages();

      view.canvasList.forEach((canvas: HTMLCanvasElement, i: number) => {
        if (canvas.height < 200) return;
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
        if (canvas.height < 200) return;
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

  getCurrView() {
    return interfaceManager.currentInterface(scraper.videoElement);
  },

  startScraping() {
    console.log("Started scraping");
    this.skins = new Skins(this.videoElement, scraper.getCurrView);
    this.loot = new Loot(this.videoElement, scraper.getCurrView);
    this.champions = new Champions(this.videoElement, scraper.getCurrView);
    this.emotes = new Emotes(this.videoElement, scraper.getCurrView);
    this.icons = new Icons(this.videoElement, scraper.getCurrView);
  },

  startCapture(onSuccess) {
    mediaStreamManager.startCapture(onSuccess);
  },
};

export default scraper;
