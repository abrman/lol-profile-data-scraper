import Capture from "../Capture";
import * as tf from "@tensorflow/tfjs";
// import JSZip from "jszip";
// import { saveAs } from "file-saver";

type Color = [r: number, g: number, b: number];
type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
  cat?: string;
  type?: string;
  count?: number;
  name?: string;
};

type Models = {
  champions: tf.LayersModel;
  skins: tf.LayersModel;
  wards: tf.LayersModel;
  numbers: tf.LayersModel;
  shard_permanent: tf.LayersModel;
};

type LookupLabels =
  | [id: number, name: string, price: number, legacy: number][]
  | string[];

type LookupTable = {
  champions: LookupLabels;
  skins: LookupLabels;
  wards: LookupLabels;
  [x: string]: any;
};

export default class Champions extends Capture {
  constructor(
    video: React.RefObject<HTMLVideoElement>,
    currentViewFunction: () => string | false
  ) {
    const checkFunction = () => currentViewFunction() === "champions";

    const options = {
      screenshotArea: {
        "1920": { x: 398, y: 218, w: 1138, h: 852, add: 5 },
        "1600": { x: 332, y: 180, w: 950, h: 713, add: 5 },
        "1280": { x: 264, y: 145, w: 762, h: 565, add: 5 },
        "1024": { x: 210, y: 116, w: 613, h: 454, add: 5 },
      },

      matchingArea: {
        "1920": { w: 160, h: 160 },
        "1600": { w: 160, h: 120 },
        "1280": { w: 160, h: 80 },
        "1024": { w: 160, h: 80 },
      },

      scrollBar: {
        "1920": { x: 1574, y1: 211, y2: 1073 },
        "1600": { x: 1312, y1: 175, y2: 894 },
        "1280": { x: 1049, y1: 140, y2: 715 },
        "1024": { x: 840, y1: 112, y2: 572 },
      },

      loadCheck: {
        "1920": [{ x: 73, y: 504, color: [240, 230, 210] as Color }],
        "1600": [{ x: 60, y: 420, color: [223, 214, 196] as Color }],
        "1280": [{ x: 49, y: 335, color: [236, 226, 206] as Color }],
        "1024": [{ x: 40, y: 266, color: [236, 226, 206] as Color }],
      },
    };
    super(video, options, checkFunction);
  }

  lookupTable: LookupTable;
  models: Models;
  classifiedRects: Rect[];
  annotatedCanvas: HTMLCanvasElement;

  recognize() {
    if (this.classifiedRects) return this.classifiedRects;

    const rects = this.computeRects();
    this.classifiedRects = rects; //this.classifyRects(rects);

    this.annotatedCanvas = document.createElement("canvas");
    const annotatedCtx = this.annotatedCanvas.getContext("2d");
    this.annotatedCanvas.width = this.canvas.width;
    this.annotatedCanvas.height = this.canvas.height;

    annotatedCtx.drawImage(this.canvas, 0, 0);

    // var zip = new JSZip();

    this.classifiedRects.forEach((rect: Rect, i: number) => {
      // const c = document.createElement("canvas").getContext("2d");
      // if (c != null) {
      //   c.canvas.width = rect.w;
      //   c.canvas.height = rect.h;
      //   c.drawImage(
      //     this.canvas,
      //     rect.x,
      //     rect.y,
      //     rect.w,
      //     rect.h,
      //     0,
      //     0,
      //     rect.w,
      //     rect.h
      //   );
      //   console.log(`Zipping: skin_${i}.png`);
      //   zip.file(`skin_${i}.png`, c.canvas.toDataURL().split("base64,")[1], {
      //     base64: true,
      //   });
      // }

      annotatedCtx.beginPath();

      annotatedCtx.globalAlpha = 0.4;
      annotatedCtx.fillStyle = "#000";
      annotatedCtx.fillRect(rect.x, rect.y, rect.w, rect.h);
      annotatedCtx.globalAlpha = 1;

      annotatedCtx.lineWidth = 0.5;
      annotatedCtx.strokeStyle =
        (rect.name || "").indexOf("(?)") < 0 ? "#fff" : "yellow";
      annotatedCtx.rect(rect.x, rect.y, rect.w, rect.h);
      annotatedCtx.stroke();
      if (
        typeof rect.type !== "undefined" &&
        typeof rect.count !== "undefined" &&
        typeof rect.name !== "undefined"
      ) {
        annotatedCtx.font = "10px Arial";
        annotatedCtx.fillStyle = "#fff";
        annotatedCtx.fillText(
          `${rect.count.toString()}x ${rect.name} ${rect.type}`,
          rect.x + 3,
          rect.y + 15,
          rect.w - 3
        );
      }
    });
    // const clientWidth = this.clientWidth;
    // console.log("Saving");
    // zip.generateAsync({ type: "blob" }).then(function (content) {
    //   saveAs(content, "champions_" + clientWidth + ".zip");
    // });
  }

  computeRects() {
    this.workCanvas.width = 10;
    this.workCanvas.height = 10;

    const offset = {
      "1920": {
        xStart: 7,
        yStart: 6,
        iconWidth: 201,
        iconHeight: 246,
        iconOffsetX: 231,
        iconOffsetY: 375,
      },
      "1600": {
        xStart: 5,
        yStart: 7,
        iconWidth: 168,
        iconHeight: 206,
        iconOffsetX: 192.54,
        iconOffsetY: 312.54,
      },
      "1280": {
        xStart: 6,
        yStart: 7,
        iconWidth: 134,
        iconHeight: 163,
        iconOffsetX: 154,
        iconOffsetY: 250,
      },
      "1024": {
        xStart: 6,
        yStart: 6,
        iconWidth: 107,
        iconHeight: 131,
        iconOffsetX: 123.25,
        iconOffsetY: 200,
      },
    }[this.clientWidth];

    let rects: Rect[] = [];
    let x = offset.xStart;
    let y = offset.yStart;

    while (y + offset.iconHeight < this.canvas.height) {
      if (x < this.canvas.width) {
        rects.push({
          cat: "coll_skin",
          x,
          y,
          w: offset.iconWidth,
          h: offset.iconHeight,
        });
        x += offset.iconOffsetX;
      } else {
        y += offset.iconOffsetY;
        x = offset.xStart;
      }
    }
    return rects;
  }
}
