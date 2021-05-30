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

type LookupTable = string[];

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

    this.prepareClassificationAssets();
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
      const annotatedCtx = rect.canvas.getContext("2d");

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
        annotatedCtx.fillText(rect.name, rect.x + 3, rect.y + 15, rect.w - 3);
        annotatedCtx.fillText(
          "id: " + rect.data.id,
          rect.x + 3,
          rect.y + 30,
          rect.w - 3
        );
        annotatedCtx.fillText(
          "owned: " + rect.data.owned,
          rect.x + 3,
          rect.y + 45,
          rect.w - 3
        );
        annotatedCtx.fillText(
          "mastery: " + rect.data.mastery,
          rect.x + 3,
          rect.y + 60,
          rect.w - 3
        );
        annotatedCtx.fillText(
          "chest available: " + rect.data.chestAvailable,
          rect.x + 3,
          rect.y + 75,
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

  lookupTable: LookupTable;
  championCollectionModel: tf.LayersModel;
  classifiedRects: Rect[];

  async prepareClassificationAssets() {
    let [lookupTableLoot, lookupTableChampions, championCollectionModel] =
      await Promise.all([
        fetch("/lookup_data/loot.json").then((res) => res.json()),
        fetch("/lookup_data/collection_champions.json").then((res) =>
          res.json()
        ),
        tf.loadLayersModel("/models/coll_champions/model.json"),
      ]);

    this.lookupTable = lookupTableChampions.map((v: string) => {
      return [
        (lookupTableLoot["champions"] as LootLabels).filter(
          (l) => l[0] === v
        )[0][1],
        v,
      ];
    });

    this.championCollectionModel = championCollectionModel;
    this.loaded = true;
  }

  classifyRects(rects: Rect[]) {
    const isViewingUnowned = this.isViewingUnowned();

    rects.forEach((rect: Rect, i: number) => {
      const prediction = this.getPredictionFromRect(
        rect,
        this.championCollectionModel,
        this.lookupTable
      );
      if (typeof prediction !== "undefined") {
        const ownership = isViewingUnowned
          ? this.checkOwnershipFromRect(rect)
          : true;
        rects[i] = {
          ...rects[i],
          type: "collection_champion",
          count: 1,
          name: prediction[0],
          data: {
            id: prediction[1],
            owned: ownership,
            mastery: ownership ? this.checkMasteryFromRect(rect) : 0,
            chestAvailable: ownership ? this.checkChestAvailable(rect) : false,
          },
        };
      }
    });
    return rects;
  }

  getPredictionFromRect(
    rect: Rect,
    model: tf.LayersModel,
    labels: LookupTable
  ): string {
    if (!this.complete) return;

    this.workCanvas.width = 28;
    this.workCanvas.height = 28;

    const lightValues = [];
    this.workCanvas
      .getContext("2d")
      ?.drawImage(this.canvas, rect.x, rect.y, rect.w, rect.h, 0, 0, 28, 28);
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
      return "(?) " + bestPrediction;
    }
    return bestPrediction;
  }

  checkOwnershipFromRect(rect: Rect) {
    if (!this.complete) return;

    this.workCanvas.width = 28;
    this.workCanvas.height = 1;

    const offset = {
      "1920": 305,
      "1600": 255,
      "1280": 205,
      "1024": 165,
    }[this.clientWidth];

    const circleHue = this.rgb2hue(
      this.getPixelColor(rect.x + rect.w + 5, rect.y)
    );

    if (175 < circleHue && circleHue < 195) {
      return "unknown(free week rotation)";
    }

    this.workCanvas
      .getContext("2d")
      ?.drawImage(
        this.canvas,
        Math.floor(rect.x + rect.w / 2) - 10,
        rect.y + offset,
        20,
        1,
        0,
        0,
        20,
        1
      );

    return (
      Math.max(
        ...Array.from(
          this.workCanvas
            .getContext("2d")
            .getImageData(0, 0, 20, 1)
            .data.filter((_, i) => i % 4 === 0)
        )
      ) < 50
    );
  }

  checkMasteryFromRect(rect: Rect) {
    const offset = {
      "1920": [6, 66],
      "1600": [5, 55],
      "1280": [4, 44],
      "1024": [3, 35],
    }[this.clientWidth];

    const flagHue = this.rgb2hue(
      this.getPixelColor(rect.x + 2, rect.y + rect.h + 2)
    );

    if (195 < flagHue && flagHue < 210) return 7;
    if (285 < flagHue && flagHue < 300) return 6;
    if (345 < flagHue && flagHue < 360) return 5;

    // console.log(
    //   Array.from(
    //     rect.canvas
    //       .getContext("2d")
    //       .getImageData(
    //         Math.round(rect.x + offset[0]),
    //         rect.y + rect.h,
    //         1,
    //         offset[1]
    //       )
    //       .data.filter((_, i) => i % 4 === 0)
    //   )
    //     .map((v) => (v > 75 ? 1 : 0))
    //     .join(""),
    //   Array.from(
    //     rect.canvas
    //       .getContext("2d")
    //       .getImageData(rect.x + offset[0], rect.y + rect.h, 1, offset[1])
    //       .data.filter((_, i) => i % 4 === 0)
    //   )
    //     .map((v) => (v > 75 ? 1 : 0))
    //     .join("")
    //     .replace(/1+/g, "1")
    //     .replace(/0/g, "").length
    // );

    return Array.from(
      rect.canvas
        .getContext("2d")
        .getImageData(rect.x + offset[0], rect.y + rect.h, 1, offset[1])
        .data.filter((_, i) => i % 4 === 0)
    )
      .map((v) => (v > 75 ? 1 : 0))
      .join("")
      .replace(/1+/g, "1")
      .replace(/0/g, "").length;
  }

  checkChestAvailable(rect: Rect) {
    const offset = {
      "1920": 30,
      "1600": 25,
      "1280": 20,
      "1024": 18,
    }[this.clientWidth];

    const circle1Hue = this.rgb2hue(
      this.getPixelColor(rect.x + rect.w + 5, rect.y)
    );

    const circle2Hue = this.rgb2hue(
      this.getPixelColor(rect.x + rect.w + 5, rect.y + offset)
    );

    if (
      (circle1Hue > 35 && circle1Hue < 55) ||
      (circle2Hue > 35 && circle2Hue < 55)
    ) {
      return false;
    }
    return true;
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
    let canvasIndex = 0;

    while (
      y + offset.iconHeight < this.canvas.height &&
      canvasIndex < this.canvasList.length
    ) {
      if (y > 30000) {
        y -= 30000;
        canvasIndex++;
      }
      if (x < this.canvas.width) {
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
        y += offset.iconOffsetY;
        x = offset.xStart;
      }
    }

    if (rects.length >= 5) {
      const checkLastFive = [
        rects.pop(),
        rects.pop(),
        rects.pop(),
        rects.pop(),
        rects.pop(),
      ].reverse();

      checkLastFive.forEach((rect) => {
        const image = rect.canvas
          .getContext("2d")
          .getImageData(rect.x, rect.y, rect.w, rect.h)
          .data.filter((n, i) => i % 4 !== 3);
        for (let i = 0; i < image.length; i++) {
          if (image[i] > 120) {
            rects.push(rect);
            break;
          }
        }
      });
    }

    return rects;
  }

  isViewingUnowned() {
    const check = {
      "1024": { x: 30, y: 294 },
      "1280": { x: 37, y: 373 },
      "1600": { x: 46, y: 465 },
      "1920": { x: 55, y: 559 },
    }[this.clientWidth];

    this.workCanvas
      .getContext("2d")
      .drawImage(this.videoElement.current, check.x, check.y, 1, 1, 0, 0, 1, 1);
    const checkPixel = this.workCanvas
      .getContext("2d")
      .getImageData(0, 0, 1, 1).data;

    return checkPixel[0] > 50;
  }
}
