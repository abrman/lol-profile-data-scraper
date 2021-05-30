import Capture from "../Capture";
import * as tf from "@tensorflow/tfjs";

type Color = [r: number, g: number, b: number];
type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
  canvas: HTMLCanvasElement;
  cat?: string;
  type?: string;
  count?: number;
  name?: string;
  data?: any;
};

type LootLabels = [id: string, name: string, price: number, legacy: number][];

type LookupTable = [string, any][];

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

    this.prepareClassificationAssets();
  }

  lookupTable: LookupTable;
  skinsCollectionModel: tf.LayersModel;
  classifiedRects: Rect[];

  async prepareClassificationAssets() {
    let [lookupTableLoot, lookupTableSkins, skinsCollectionModel] =
      await Promise.all([
        fetch("/lookup_data/loot.json").then((res) => res.json()),
        fetch("/lookup_data/collection_skins.json").then((res) => res.json()),
        tf.loadLayersModel("/models/coll_skins/model.json"),
      ]);

    this.lookupTable = lookupTableSkins.map(
      (v: [id: string, is_limited_edition: number]) => {
        return [
          (v[1] === 1 ? "Limited edition " : "") +
            (lookupTableLoot["skins"] as LootLabels).filter(
              (l) => l[0] === v[0]
            )[0][1],
          v,
        ];
      }
    );

    this.skinsCollectionModel = skinsCollectionModel;
    this.loaded = true;
  }

  classifyRects(rects: Rect[]) {
    rects.forEach((rect: Rect, i: number) => {
      const prediction = this.getPredictionFromRect(
        rect,
        this.skinsCollectionModel,
        this.lookupTable
      );
      if (typeof prediction !== "undefined") {
        rects[i] = {
          ...rects[i],
          type: "collection_skin",
          count: 1,
          name: prediction[0],
          data: prediction[1],
        };
      }
    });
    return rects;
  }

  getPredictionFromRect(
    rect: Rect,
    model: tf.LayersModel,
    labels: LookupTable
  ): [string, any] {
    if (!this.complete) return;

    this.workCanvas.width = 28;
    this.workCanvas.height = 28;

    const lightValues = [];
    this.workCanvas
      .getContext("2d")
      ?.drawImage(rect.canvas, rect.x, rect.y, rect.w, rect.h, 0, 0, 28, 28);
    let imageData = this.workCanvas
      .getContext("2d")
      ?.getImageData(0, 0, 28, 28);
    let pixels = imageData?.data;
    if (typeof pixels !== "undefined") {
      for (var j = 0; j < pixels.length; j += 4) {
        let lightness =
          pixels[j] * 0.299 + pixels[j + 1] * 0.587 + pixels[j + 2] * 0.114;
        lightValues.push(lightness / 255);
      }
    }
    const tensor = tf.tensor(lightValues, [1, 28, 28]);

    const predictions = (model.predict(tensor) as tf.Tensor).dataSync();

    const bestPrediction =
      labels[predictions.indexOf(Math.max(...Array.from(predictions)))];

    predictions.sort((a, b) => b - a);
    if (predictions[0] - predictions[1] < 10) {
      return ["?" + bestPrediction[0], bestPrediction[1]];
    }
    return bestPrediction;
  }

  recognize() {
    super.recognize();
    if (this.classifiedRects) return this.classifiedRects;

    const rects = this.computeRects();
    this.classifiedRects = this.classifyRects(rects);

    this.cropCanvasesByRects(this.classifiedRects);
  }

  annotateImages() {
    super.annotateImages();
    if (this.classifiedRects == null) return;

    this.classifiedRects.forEach((rect: Rect, i: number) => {
      console.log(rect);
      const ctx = rect.canvas.getContext("2d");
      ctx.beginPath();

      ctx.globalAlpha = 0.6;
      ctx.fillStyle = "#000";
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.globalAlpha = 1;

      ctx.lineWidth = 2;
      ctx.strokeStyle = (rect.name || " ")[0] === "?" ? "yellow" : "#fff";
      ctx.rect(rect.x, rect.y, rect.w, rect.h);
      ctx.stroke();
      if (typeof rect.name !== "undefined") {
        ctx.font = "10px Arial";
        ctx.fillStyle = "#fff";
        ctx.fillText(
          rect.name[0] === "?" ? rect.name.slice(1) : rect.name,
          rect.x + 3,
          rect.y + 15,
          rect.w - 3
        );
      }
    });
  }

  computeRects() {
    this.workCanvas.width = 15;
    this.workCanvas.height = 15;

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
        iconOffsetY: 179.2,
        lineHeight: 43.3,
      },
    }[this.clientWidth];

    let rects: Rect[] = [];
    let x = offset.xStart;
    let y = offset.yStart;
    let canvasIndex = 0;

    const drawCheckSquare = () =>
      this.workCanvas
        .getContext("2d")
        .drawImage(
          this.canvasList[canvasIndex],
          x - 15,
          y - 15,
          15,
          15,
          0,
          0,
          15,
          15
        );

    const isIcon = () =>
      Math.max(
        ...Array.from(
          this.workCanvas.getContext("2d").getImageData(0, 0, 15, 15)
            .data as Uint8ClampedArray
        ).filter((v: number, i: number) => i % 4 === 0)
      ) > 30;

    while (
      y + offset.iconHeight < this.canvasList[canvasIndex].height &&
      canvasIndex < this.canvasList.length
    ) {
      if (y > 30000) {
        y -= 30000;
        canvasIndex++;
      }
      drawCheckSquare();
      if (x < this.canvasList[canvasIndex].width && isIcon()) {
        rects.push({
          canvas: this.canvasList[canvasIndex],
          cat: "coll_skin",
          x,
          y,
          w: offset.iconWidth,
          h: offset.iconHeight,
        });
        x += offset.iconOffsetX;
      } else {
        y += x === offset.xStart ? offset.lineHeight : offset.iconOffsetY;
        x = offset.xStart;
      }
    }
    return rects;
  }
}
