import Capture from "../Capture";
import * as tf from "@tensorflow/tfjs";

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

export default class Skins extends Capture {
  constructor(
    video: React.RefObject<HTMLVideoElement>,
    currentViewFunction: () => string | false
  ) {
    const checkFunction = () => currentViewFunction() === "skins";
    const options = {
      screenshotArea: {
        "1920": { x: 398, y: 218, w: 1156, h: 852, add: 5 },
        "1600": { x: 332, y: 180, w: 962, h: 713, add: 5 },
        "1280": { x: 264, y: 145, w: 770, h: 565, add: 5 },
        "1024": { x: 210, y: 116, w: 618, h: 454, add: 5 },
      },

      matchingArea: {
        "1920": { w: 160, h: 160 },
        "1600": { w: 160, h: 140 },
        "1280": { w: 160, h: 110 },
        "1024": { w: 160, h: 80 },
      },

      scrollBar: {
        "1920": { x: 1574, y1: 211, y2: 1073 },
        "1600": { x: 1312, y1: 175, y2: 894 },
        "1280": { x: 1049, y1: 140, y2: 715 },
        "1024": { x: 840, y1: 112, y2: 572 },
      },

      loadCheck: {
        "1920": [{ x: 223, y: 462, color: [254, 4, 10] as Color }],
        "1600": [{ x: 186, y: 385, color: [254, 4, 9] as Color }],
        "1280": [{ x: 149, y: 309, color: [248, 3, 13] as Color }],
        "1024": [{ x: 120, y: 247, color: [253, 4, 9] as Color }],
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

    this.classifiedRects.forEach((rect: Rect, i: number) => {
      if (annotatedCtx === null) return;
      annotatedCtx.beginPath();

      annotatedCtx.globalAlpha = 0.6;
      annotatedCtx.fillStyle = "#000";
      annotatedCtx.fillRect(rect.x, rect.y, rect.w, rect.h);
      annotatedCtx.globalAlpha = 1;

      annotatedCtx.lineWidth = 2;
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
  }

  computeRects() {
    this.workCanvas.width = 10;
    this.workCanvas.height = 10;

    const offset = {
      "1920": {
        xStart: 26,
        yStart: 88,
        iconWidth: 174,
        iconHeight: 249,
        iconOffsetX: 231,
        iconOffsetY: 336,
        lineHeight: 81,
      },
      "1600": {
        xStart: 22,
        yStart: 76,
        iconWidth: 146,
        iconHeight: 208,
        iconOffsetX: 192,
        iconOffsetY: 280,
        lineHeight: 68,
      },
      "1280": {
        xStart: 19,
        yStart: 61,
        iconWidth: 116,
        iconHeight: 166,
        iconOffsetX: 154,
        iconOffsetY: 224,
        lineHeight: 54,
      },
      "1024": {
        xStart: 17,
        yStart: 50,
        iconWidth: 91,
        iconHeight: 130,
        iconOffsetX: 123,
        iconOffsetY: 180,
        lineHeight: 42,
      },
    }[this.clientWidth];

    let rects: Rect[] = [];
    let x = offset.xStart;
    let y = offset.yStart;

    const drawCheckSquare = () =>
      this.workCanvas
        .getContext("2d")
        .drawImage(this.canvas, x - 10, y - 10, 10, 10, 0, 0, 10, 10);

    const isIcon = () =>
      Math.max(
        ...Array.from(
          this.workCanvas.getContext("2d").getImageData(0, 0, 10, 10)
            .data as Uint8ClampedArray
        ).filter((v: number, i: number) => i % 4 == 0)
      ) > 50;

    while (y + offset.iconHeight < this.canvas.height) {
      drawCheckSquare();
      if (x < this.canvas.width && isIcon()) {
        rects.push({
          cat: "coll_skin",
          x,
          y,
          w: offset.iconWidth,
          h: offset.iconHeight,
        });
        x += offset.iconOffsetX;
      } else {
        y += x == offset.xStart ? offset.lineHeight : offset.iconOffsetY;
        x = offset.xStart;
      }
    }
    return rects;
  }
}
