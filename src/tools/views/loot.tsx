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

export default class Loot extends Capture {
  constructor(
    video: React.RefObject<HTMLVideoElement>,
    currentViewFunction: () => string | false
  ) {
    const checkFunction = () => currentViewFunction() === "loot";

    const options = {
      screenshotArea: {
        "1920": { x: 80, y: 284, w: 500, h: 616, add: 60 },
        "1600": { x: 70, y: 235, w: 410, h: 514, add: 50 },
        "1280": { x: 55, y: 190, w: 330, h: 411, add: 40 },
        "1024": { x: 45, y: 150, w: 265, h: 329, add: 30 },
      },

      matchingArea: {
        "1920": { w: 160, h: 160 },
        "1600": { w: 140, h: 140 },
        "1280": { w: 110, h: 110 },
        "1024": { w: 80, h: 80 },
      },

      scrollBar: {
        "1920": { x: 596, y1: 232, y2: 926 },
        "1600": { x: 497, y1: 193, y2: 770 },
        "1280": { x: 397, y1: 154, y2: 617 },
        "1024": { x: 319, y1: 123, y2: 494 },
      },

      loadCheck: {
        "1920": [
          { x: 260, y: 1015, color: [242, 145, 48] as Color },
          { x: 350, y: 1005, color: [153, 38, 212] as Color },
        ],
        "1600": [
          { x: 215, y: 845, color: [242, 145, 48] as Color },
          { x: 290, y: 835, color: [153, 38, 212] as Color },
        ],
        "1280": [
          { x: 172, y: 676, color: [242, 145, 48] as Color },
          { x: 231, y: 670, color: [153, 38, 212] as Color },
        ],
        "1024": [
          { x: 138, y: 540, color: [242, 145, 48] as Color },
          { x: 185, y: 535, color: [153, 38, 212] as Color },
        ],
      },
    };
    super(video, options, checkFunction);

    this.prepareClassificationAssets();
  }

  lookupTable: LookupTable;
  models: Models;
  classifiedRects: Rect[];
  annotatedCanvas: HTMLCanvasElement;

  async prepareClassificationAssets() {
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
      this.lookupTable = JSON.parse(data);
    });

    this.models = {
      champions,
      skins,
      wards,
      numbers,
      shard_permanent,
    };
  }

  recognize() {
    if (this.classifiedRects) return this.classifiedRects;

    const rects = this.computeRects();
    this.classifiedRects = this.classifyRects(rects);

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

  classifyRects(rects: Rect[]) {
    rects.forEach((rect: Rect, i: number) => {
      if (rect.cat === "materials") {
        const token = this.masteryTokenFromRect(rect);
        if (token > 0) {
          rects[i] = {
            ...rects[i],
            type: "token" + token.toString(),
            count: this.lootCountFromRect(rect),
            name: this.getPredictionFromRect(
              rect,
              this.models.champions,
              this.lookupTable.champions
            ),
          };
        }
      } else if (rect.cat === "champions") {
        rects[i] = {
          ...rects[i],
          type: this.getPredictionFromRect(rect, this.models.shard_permanent, [
            "shard",
            "permanent",
          ]),
          count: this.lootCountFromRect(rect),
          name: this.getPredictionFromRect(
            rect,
            this.models.champions,
            this.lookupTable.champions
          ),
        };
      } else if (rect.cat === "skins") {
        rects[i] = {
          ...rects[i],
          type: this.getPredictionFromRect(rect, this.models.shard_permanent, [
            "shard",
            "permanent",
          ]),
          count: this.lootCountFromRect(rect),
          name: this.getPredictionFromRect(
            rect,
            this.models.skins,
            this.lookupTable.skins
          ),
        };
      } else if (rect.cat === "ward_skins") {
        rects[i] = {
          ...rects[i],
          type: this.getPredictionFromRect(rect, this.models.shard_permanent, [
            "shard",
            "permanent",
          ]),
          count: this.lootCountFromRect(rect),
          name: this.getPredictionFromRect(
            rect,
            this.models.wards,
            this.lookupTable.wards
          ),
        };
      } else if (rect.cat === "eternals") {
        rects[i] = {
          ...rects[i],
          type: "eternal",
          count: this.lootCountFromRect(rect),
          name: this.getPredictionFromRect(
            rect,
            this.models.champions,
            this.lookupTable.champions
          ),
        };
      } else if (["little_legends", "emotes", "icons"].indexOf(rect.cat) >= 0) {
        console.log(
          "Skipping item from category as it is not yet supported.",
          rect.cat,
          rect
        );
      }
    });
    return rects;
  }

  getPredictionFromRect(
    rect: Rect,
    model: tf.LayersModel,
    labels: LookupLabels
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
      typeof labels[0] == "string"
        ? (labels[
            predictions.indexOf(Math.max(...Array.from(predictions)))
          ] as string)
        : labels[predictions.indexOf(Math.max(...Array.from(predictions)))][1];

    predictions.sort((a, b) => b - a);
    if (predictions[0] - predictions[1] < 10) {
      return "(?) " + bestPrediction;
    }
    return bestPrediction;
  }

  rgb2hue(r: number, g: number, b: number) {
    const max = Math.max(r, g, b);
    const diff = max - Math.min(r, g, b);
    const hue =
      max === r
        ? 6 + (g - b) / diff
        : max === g
        ? 2 + (b - r) / diff
        : 4 + (r - g) / diff;
    return Math.round(hue * 60) % 360;
  }

  masteryTokenFromRect(rect: Rect) {
    this.workCanvas
      .getContext("2d")
      ?.drawImage(
        this.canvas,
        rect.x + rect.w / 2,
        rect.y - 2,
        1,
        1,
        0,
        0,
        1,
        1
      );
    const [r, g, b] = Array.from(
      this.workCanvas.getContext("2d")?.getImageData(0, 0, 1, 1).data
    );
    const hue = this.rgb2hue(r, g, b);
    if (hue > 275 && hue < 325) return 6;
    if (hue > 150 && hue < 200) return 7;
    return 0;
  }

  lootCountFromRect(rect: Rect) {
    const offset = {
      "1024": {
        w: 20,
        h: 9,
        xPad: 4,
        yPad: 5,
        minNumberHeight: 7,
        maxNumberHeight: 8,
      },
      "1280": {
        w: 25,
        h: 9,
        xPad: 4,
        yPad: 7,
        minNumberHeight: 8,
        maxNumberHeight: 9,
      },
      "1600": {
        w: 30,
        h: 13,
        xPad: 6,
        yPad: 7,
        minNumberHeight: 10,
        maxNumberHeight: 13,
      },
      "1920": {
        w: 35,
        h: 16,
        xPad: 8,
        yPad: 9,
        minNumberHeight: 11,
        maxNumberHeight: 14,
      },
    }[this.clientWidth];

    this.workCanvas.width = offset.w;
    this.workCanvas.height = offset.h;

    let x = Math.round(rect.x + rect.w - offset.w - offset.xPad);
    let y = Math.round(rect.y + rect.h - offset.h - offset.yPad);
    let [w, h] = [offset.w, offset.h];

    this.workCanvas
      .getContext("2d")
      ?.drawImage(this.canvas, x, y, w, h, 0, 0, w, h);

    let picture: number[] | number[][] = Array.from(
      this.workCanvas.getContext("2d")?.getImageData(0, 0, offset.w, offset.h)
        .data
    )
      .map((v: number, i: number, a: number[]) =>
        i % 4 !== 0 ? 0 : v > 128 && (v > a[i + 2] || 0) ? 1 : 0
      )
      .filter((_: number, i: number) => i % 4 === 0);

    if (typeof picture !== "undefined")
      picture = [...Array(Math.ceil(picture.length / offset.w))].map((_) =>
        (picture as number[]).splice(0, offset.w)
      );

    while (picture[0] && picture[0].join("").match(/0{5}$/)) {
      picture.shift();
      y++;
      h--;
    }

    while (picture[0] && picture[picture.length - 1].join("").match(/0{5}$/)) {
      picture.pop();
      h--;
    }

    this.workCanvas
      .getContext("2d")
      ?.drawImage(
        this.canvas,
        Math.round(rect.x + rect.w - 15 - offset.xPad),
        Math.round(rect.y + rect.h - offset.h - offset.yPad - 2),
        15,
        1,
        0,
        0,
        15,
        1
      );

    const rowAboveLineDark =
      Math.max(
        ...Array.from(
          this.workCanvas.getContext("2d")?.getImageData(0, 0, 15, 1).data
        )
          .map((v: number, i: number, a: number[]) =>
            i % 4 !== 0 ? 0 : v > 128 && (v > a[i + 2] || 0) ? 1 : 0
          )
          .filter((_: number, i: number) => i % 4 === 0)
      ) === 0;

    const isNumber =
      picture.length <= offset.maxNumberHeight &&
      picture.length >= offset.minNumberHeight &&
      rowAboveLineDark;

    if (isNumber) {
      let foundNumbers = "";

      const freeColumns = [...Array(picture[0].length)].map((_, i) =>
        [...Array(picture.length)]
          .map((_, j) => (picture as number[][])[j][i])
          .reduce((a, b) => a + b, 0)
      );

      let numberColumnsRanges = [];
      let start: number | false = false;
      for (let i = freeColumns.length - 1; i >= 0; i--) {
        if (freeColumns[i] > 0 && start === false) start = i;
        else if (freeColumns[i] === 0 && start !== false) {
          numberColumnsRanges.push([i + 1, start]);
          start = false;
        }
      }

      this.workCanvas.width = 7;
      this.workCanvas.height = 7;
      numberColumnsRanges = numberColumnsRanges
        .reverse()
        .filter((v) => v[1] - v[0] > 2);

      numberColumnsRanges.forEach((range: number[]) => {
        this.workCanvas
          .getContext("2d")
          ?.drawImage(
            this.canvas,
            x + range[0],
            y,
            range[1] - range[0] + 1,
            h,
            0,
            0,
            7,
            7
          );

        let number: number[] = Array.from(
          this.workCanvas
            .getContext("2d")
            ?.getImageData(0, 0, 7, 7)
            .data.filter((_: number, i: number) => i % 4 === 0)
            .map((v: number) => (v > 100 ? 1 : 0)) as Uint8ClampedArray
        );

        const tensor = tf.tensor(number, [1, 7, 7]);

        const predictions = (
          this.models.numbers.predict(tensor) as tf.Tensor
        ).dataSync();

        foundNumbers += predictions
          .indexOf(Math.max(...Array.from(predictions)))
          .toString();
      });
      return parseInt(foundNumbers, 10);
    } else {
      return 1;
    }
  }

  computeRects(): Rect[] {
    const categories = [
      "materials",
      "champions",
      "skins",
      "little_legends",
      "eternals",
      "emotes",
      "ward_skins",
      "icons",
    ];

    const offset = {
      "1920": {
        xStart: 12,
        yStart: 2,
        lineHeight: 68.4,
        iconWidth: 105,
        iconHeight: 105,
        iconOffsetX: 125,
        iconOffsetY: 127.57,
      },
      "1600": {
        xStart: 8,
        yStart: 3,
        lineHeight: 56.3,
        iconWidth: 87,
        iconHeight: 87,
        iconOffsetX: 103.6,
        iconOffsetY: 106.25,
      },
      "1280": {
        xStart: 7,
        yStart: 1,
        lineHeight: 45,
        iconWidth: 70,
        iconHeight: 70,
        iconOffsetX: 83,
        iconOffsetY: 85,
      },
      "1024": {
        xStart: 5,
        yStart: 1,
        lineHeight: 37,
        iconWidth: 56,
        iconHeight: 56,
        iconOffsetX: 66.4,
        iconOffsetY: 68.02,
      },
    }[this.clientWidth];

    const lines = [];
    const centerColumn = this.canvas
      .getContext("2d")
      .getImageData(
        Math.round(this.canvas.width / 2),
        0,
        1,
        this.canvas.height
      ).data;
    for (let i = 0; i < centerColumn.length; i += 4) {
      if (centerColumn[i] > 70) lines.push(i / 4);
    }

    let items = [];
    let currLine = lines.shift() || Infinity;
    let currCategory = "";

    for (
      let y = offset.yStart;
      y < this.canvas.height;
      y += offset.iconOffsetY
    ) {
      if (y + offset.iconHeight < currLine) {
        if (currCategory !== "none") {
          for (let i = 0; i < 4; i++) {
            items.push({
              cat: currCategory,
              x: offset.xStart + offset.iconOffsetX * i,
              y: y,
              w: offset.iconWidth,
              h: offset.iconHeight,
            });
          }
        }
      } else {
        currLine = lines.shift() || Infinity;
        currCategory = categories.shift() || "none";

        y -= offset.lineHeight;

        if (items.length > 3) {
          const checkLastThree = [
            items.pop(),
            items.pop(),
            items.pop(),
          ].reverse();

          checkLastThree.forEach((item) => {
            const squareImage = this.canvas
              .getContext("2d")
              .getImageData(item.x, item.y, item.w, item.h).data;
            root: for (let i = 0; i < Math.max(item.y, item.x); i++) {
              for (let c = 0; c < 3; c++) {
                if (squareImage[i * 4 + i * item.w * 4 + c] > 50) {
                  items.push(item);
                  break root;
                }
              }
            }
          });
        }
      }
    }
    return items;
  }
}
