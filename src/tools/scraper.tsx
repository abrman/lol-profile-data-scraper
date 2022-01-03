import React from "react";
import { interfaceManager } from "./interfaceManager";
import { mediaStreamManager } from "./mediaStreamManager";

import Skins from "./views/skins";
import Loot from "./views/loot";
import Champions from "./views/champions";
import Emotes from "./views/emotes";
import Icons from "./views/icons";

import Data from "./Data";

import JSZip from "jszip";
import { saveAs } from "file-saver";

import toCSV from "objects-to-csv";

interface Scraper {
  videoElement: React.RefObject<HTMLVideoElement>;
  videoWidth: number;
  videoHeight: number;
  getCurrView: () => string | false;
  startCapture: (onSuccess: () => void) => any;
  startScraping: () => void;
  recognize: (callback?: () => void) => void;
  download: (callback?: () => void) => void;
  data: () => {
    champions?: any;
    skins?: any;
    wards?: any;
    emotes?: any;
    icons?: any;
    chromas?: any;
    blueEssenceSpent?: number;
    [x: string]: any;
  };
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

  data() {
    let rects: any = [];

    if (typeof scraper.loot.classifiedRects !== "undefined")
      rects.push(scraper.loot.classifiedRects);
    if (typeof scraper.champions.classifiedRects !== "undefined")
      rects.push(scraper.champions.classifiedRects);
    if (typeof scraper.skins.classifiedRects !== "undefined")
      rects.push(scraper.skins.classifiedRects);

    rects = rects
      .flatMap((v: any) => v)
      .filter((v: any) => typeof v.name !== "undefined");

    const data = new Data(scraper.loot.lookupTable, rects);
    return data;
  },

  recognize(callback?) {
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

    if (typeof callback === "function") {
      callback();
    }
  },

  async download(callback?) {
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

    // let rects: any = [];

    // if (typeof scraper.loot.classifiedRects !== "undefined")
    //   rects.push(scraper.loot.classifiedRects);
    // if (typeof scraper.champions.classifiedRects !== "undefined")
    //   rects.push(scraper.champions.classifiedRects);
    // if (typeof scraper.skins.classifiedRects !== "undefined")
    //   rects.push(scraper.skins.classifiedRects);

    // console.log(rects);
    // rects = rects
    //   .flatMap((v: any) => v)
    //   .filter((v: any) => typeof v.name !== "undefined");

    // console.log(rects);

    // const data = new Data(scraper.loot.lookupTable, rects);

    // // const data: any = {};

    // // data["skins"] = scraper.skins.classifiedRects;
    // // data["champions"] = scraper.champions.classifiedRects;
    // // data["loot"] = scraper.loot.classifiedRects;

    // zip.file(`data.json`, JSON.stringify(data.champions));

    const { skins, champions } = this.data();

    const championsData = new toCSV(champions.data);
    const skinsData = new toCSV(skins.data);
    zip.file(`champions.csv`, await championsData.toString());
    zip.file(`skins.csv`, await skinsData.toString());

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

  async startCapture(onSuccess) {
    mediaStreamManager.startCapture(onSuccess);
  },
};

export default scraper;
