import { lootCaptureManager } from "./lootCaptureManager";
import { scraper } from "./scraper";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import * as tf from "@tensorflow/tfjs";
import { type } from "node:os";

type Rect = {
  cat: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type?: string;
  count?: number;
  name?: string;
};

interface LootScreenshotRecognitionTool {
  [x: string]: any;
}

export const lootScreenshotRecognitionTool: LootScreenshotRecognitionTool = {
  finished: false,
  tokenCanvas: document.createElement("canvas"),
  numberCanvas: document.createElement("canvas"),
  rectCanvas: document.createElement("canvas"),

  recognize(ctx: CanvasRenderingContext2D) {
    if (this.finished) return;
    const lines = this.findLines(ctx);
    const lootRects = this.computeLootCropRects(ctx, lines);
    const data = this.classifyRects(ctx, lootRects);
    this.finished = true;
    return data;
  },

  rgb2hsv(r: number, g: number, b: number) {
    let h = 0;
    let rabs,
      gabs,
      babs,
      rr,
      gg,
      bb,
      s: number,
      v: number,
      diff: number,
      diffc,
      percentRoundFn;
    rabs = r / 255;
    gabs = g / 255;
    babs = b / 255;
    v = Math.max(rabs, gabs, babs);
    diff = v - Math.min(rabs, gabs, babs);
    diffc = (c: any) => (v - c) / 6 / diff + 1 / 2;
    percentRoundFn = (num: number) => Math.round(num * 100) / 100;
    if (diff === 0) {
      h = s = 0;
    } else {
      s = diff / v;
      rr = diffc(rabs);
      gg = diffc(gabs);
      bb = diffc(babs);

      if (rabs === v) {
        h = bb - gg;
      } else if (gabs === v) {
        h = 1 / 3 + rr - bb;
      } else if (babs === v) {
        h = 2 / 3 + gg - rr;
      }
      if (h < 0) {
        h += 1;
      } else if (h > 1) {
        h -= 1;
      }
    }
    return {
      h: Math.round(h * 360),
      s: percentRoundFn(s * 100),
      v: percentRoundFn(v * 100),
    };
  },

  getMasteryTokenFromRect(ctx: CanvasRenderingContext2D, rect: Rect) {
    const canvas = this.tokenCanvas;
    canvas
      .getContext("2d")
      ?.drawImage(
        ctx.canvas,
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
      canvas.getContext("2d")?.getImageData(0, 0, 1, 1)
        .data as Uint8ClampedArray
    );
    const hue = this.rgb2hsv(r, g, b).h;
    if (hue > 275 && hue < 325) return 6;
    if (hue > 150 && hue < 200) return 7;
    return 0;
  },

  classifyRects(ctx: CanvasRenderingContext2D, lootRects: Rect[]) {
    lootRects.forEach((rect: Rect, i: number) => {
      if (rect.cat === "materials") {
        const token = this.getMasteryTokenFromRect(ctx, rect);
        if (token > 0) {
          lootRects[i] = {
            ...lootRects[i],
            type: "token" + token.toString(),
            count: this.getLootCountFromRect(ctx, rect),
            name: this.getChampionPredictionFromRect(ctx, rect),
          };
        }
      } else if (rect.cat === "champions") {
        lootRects[i] = {
          ...lootRects[i],
          type: this.getPermanentOrShardPrediction(ctx, rect),
          count: this.getLootCountFromRect(ctx, rect),
          name: this.getChampionPredictionFromRect(ctx, rect),
        };
      } else if (rect.cat === "skins") {
        lootRects[i] = {
          ...lootRects[i],
          type: this.getPermanentOrShardPrediction(ctx, rect),
          count: this.getLootCountFromRect(ctx, rect),
          name: this.getSkinPredictionFromRect(ctx, rect),
        };
      } else if (rect.cat === "ward_skins") {
        lootRects[i] = {
          ...lootRects[i],
          type: this.getPermanentOrShardPrediction(ctx, rect),
          count: this.getLootCountFromRect(ctx, rect),
          name: this.getWardPredictionFromRect(ctx, rect),
        };
      } else if (rect.cat === "eternals") {
        lootRects[i] = {
          ...lootRects[i],
          type: "eternal",
          count: this.getLootCountFromRect(ctx, rect),
          name: this.getChampionPredictionFromRect(ctx, rect),
        };
      } else if (["little_legends", "emotes", "icons"].indexOf(rect.cat) >= 0) {
        console.log(
          "Skipping item from category as it is not yet supported.",
          rect.cat,
          rect
        );
      }
    });

    const canvas = document.createElement("canvas");
    const ctx2d = canvas.getContext("2d");
    canvas.width = ctx.canvas.width;
    canvas.height = ctx.canvas.height;
    ctx2d?.putImageData(
      ctx.getImageData(0, 0, canvas.width, canvas.height),
      0,
      0
    );

    lootRects.forEach((rect: Rect, i: number) => {
      if (ctx2d === null) return;
      ctx2d.beginPath();

      ctx2d.globalAlpha = 0.6;
      ctx2d.fillStyle = "#000";
      ctx2d.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx2d.globalAlpha = 1;

      ctx2d.lineWidth = 2;
      ctx2d.strokeStyle =
        (rect.name || "").indexOf("(?)") < 0 ? "#fff" : "yellow";
      ctx2d.rect(rect.x, rect.y, rect.w, rect.h);
      ctx2d.stroke();
      if (
        typeof rect.type !== "undefined" &&
        typeof rect.count !== "undefined" &&
        typeof rect.name !== "undefined"
      ) {
        ctx2d.font = "10px Arial";
        ctx2d.fillStyle = "#fff";
        ctx2d.fillText(
          `${rect.count.toString()}x ${rect.name} ${rect.type}`,
          rect.x + 3,
          rect.y + 15,
          rect.w - 3
        );
      }
    });

    if (typeof lootCaptureManager.setImg2 === "function")
      lootCaptureManager.setImg2(canvas.toDataURL());

    return {
      data: lootRects,
      image: canvas.toDataURL(),
    };
  },

  getLootCountFromRect(ctx: CanvasRenderingContext2D, rect: Rect) {
    const offsets = {
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
    };

    const offset =
      offsets[
        scraper.videoWidth.toString() as "1024" | "1280" | "1600" | "1920"
      ] || offsets["1024"];
    //Find individual number rects
    const canvas = this.numberCanvas;
    canvas.width = offset.w;
    canvas.height = offset.h;

    let x = Math.round(rect.x + rect.w - offset.w - offset.xPad);
    let y = Math.round(rect.y + rect.h - offset.h - offset.yPad);
    let [w, h] = [offset.w, offset.h];

    canvas.getContext("2d")?.drawImage(ctx.canvas, x, y, w, h, 0, 0, w, h);

    let picture: number[] | number[][] = Array.from(
      canvas
        .getContext("2d")
        ?.getImageData(0, 0, offset.w, offset.h)
        .data.map((v: number, i: number, a: number[]) =>
          i % 4 !== 0 ? 0 : v > 128 && (v > a[i + 2] || 0) ? 1 : 0
        )
        .filter((_: number, i: number) => i % 4 === 0) as Uint8ClampedArray
    );

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

    canvas
      .getContext("2d")
      ?.drawImage(
        ctx.canvas,
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
          canvas
            .getContext("2d")
            ?.getImageData(0, 0, 15, 1)
            .data.map((v: number, i: number, a: number[]) =>
              i % 4 !== 0 ? 0 : v > 128 && (v > a[i + 2] || 0) ? 1 : 0
            )
            .filter((_: number, i: number) => i % 4 === 0) as Uint8ClampedArray
        )
      ) === 0;

    const isNumber =
      picture.length <= offset.maxNumberHeight &&
      picture.length >= offset.minNumberHeight &&
      rowAboveLineDark;

    // console.log(
    //   "%c" +
    //     picture
    //       ?.map((l) => l.join(""))
    //       .join("\n")
    //       .replace(/0/g, ".")
    //       .replace(/1/g, "#"),
    //   isNumber ? "color:green" : "color: red"
    // );

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
      canvas.width = 7;
      canvas.height = 7;
      numberColumnsRanges = numberColumnsRanges
        .reverse()
        .filter((v) => v[1] - v[0] > 2);
      numberColumnsRanges.forEach((range: number[]) => {
        // console.log(h);
        canvas
          .getContext("2d")
          ?.drawImage(
            ctx.canvas,
            x + range[0],
            y,
            range[1] - range[0] + 1,
            h,
            0,
            0,
            7,
            7
          );
        // let number: number[] | number[][] = Array.from(
        let number: number[] = Array.from(
          canvas
            .getContext("2d")
            ?.getImageData(0, 0, 7, 7)
            .data.filter((_: number, i: number) => i % 4 === 0)
            .map((v: number) => (v > 100 ? 1 : 0)) as Uint8ClampedArray
        );

        const tensor = tf.tensor(number, [1, 7, 7]);

        const predictions = (
          scraper.models.numbers.predict(tensor) as tf.Tensor
        ).dataSync();

        foundNumbers += predictions
          .indexOf(Math.max(...Array.from(predictions)))
          .toString();

        // console.log(
        //   predictions.indexOf(Math.max(...Array.from(predictions))).toString(),
        //   foundNumbers
        // );

        // console.log(
        //   "%c  ",
        //   `font-size:70px;color:red;background-size:contain;background-repeat:no-repeat;background-image:url('${canvas.toDataURL()}');`
        // );

        // number = [...Array(Math.ceil(number.length / 7))].map((_) =>
        //   (number as number[]).splice(0, 7)
        // );
        // console.log(number);
        // console.log(
        //   number
        //     ?.map((l) => l.join(""))
        //     .join("\n")
        //     .replace(/0/g, ".")
        //     .replace(/1/g, "#")
        // );

        // if (typeof lootCaptureManager.setImg3 === "function")
        //   lootCaptureManager.setImg3(canvas.toDataURL());
      });
      return parseInt(foundNumbers, 10);
    } else {
      return 1;
    }
  },

  getChampionPredictionFromRect(ctx: CanvasRenderingContext2D, rect: Rect) {
    const canvas = this.rectCanvas;
    canvas.width = 28;
    canvas.height = 28;
    const lightValues = [];
    canvas
      .getContext("2d")
      ?.drawImage(ctx.canvas, rect.x, rect.y, rect.w, rect.h, 0, 0, 28, 28);
    let imageData = canvas.getContext("2d")?.getImageData(0, 0, 28, 28);
    let pixels = imageData?.data;
    if (typeof pixels !== "undefined") {
      for (var j = 0; j < pixels.length; j += 4) {
        let lightness =
          pixels[j] * 0.299 + pixels[j + 1] * 0.587 + pixels[j + 2] * 0.114;
        lightValues.push(lightness / 255);
      }
    }
    const tensor = tf.tensor(lightValues, [1, 28, 28]);

    const predictions = (
      scraper.models.champions.predict(tensor) as tf.Tensor
    ).dataSync();

    const bestPrediction =
      scraper.lookupTable["champions"][
        predictions.indexOf(Math.max(...Array.from(predictions)))
      ][1];

    predictions.sort((a, b) => b - a);
    if (predictions[0] - predictions[1] < 10) {
      return "(?) " + bestPrediction;
    }
    return bestPrediction;
  },

  getSkinPredictionFromRect(ctx: CanvasRenderingContext2D, rect: Rect) {
    const canvas = this.rectCanvas;
    canvas.width = 28;
    canvas.height = 28;
    const lightValues = [];
    canvas
      .getContext("2d")
      ?.drawImage(ctx.canvas, rect.x, rect.y, rect.w, rect.h, 0, 0, 28, 28);
    let imageData = canvas.getContext("2d")?.getImageData(0, 0, 28, 28);
    let pixels = imageData?.data;
    if (typeof pixels !== "undefined") {
      for (var j = 0; j < pixels.length; j += 4) {
        let lightness =
          pixels[j] * 0.299 + pixels[j + 1] * 0.587 + pixels[j + 2] * 0.114;
        lightValues.push(lightness / 255);
      }
    }
    const tensor = tf.tensor(lightValues, [1, 28, 28]);

    const predictions = (
      scraper.models.skins.predict(tensor) as tf.Tensor
    ).dataSync();

    const bestPrediction =
      scraper.lookupTable["skins"][
        predictions.indexOf(Math.max(...Array.from(predictions)))
      ][1];

    predictions.sort((a, b) => b - a);
    if (predictions[0] - predictions[1] < 10) {
      return "(?) " + bestPrediction;
    }
    return bestPrediction;
  },

  getWardPredictionFromRect(ctx: CanvasRenderingContext2D, rect: Rect) {
    const canvas = this.rectCanvas;
    canvas.width = 28;
    canvas.height = 28;
    const lightValues = [];
    canvas
      .getContext("2d")
      ?.drawImage(ctx.canvas, rect.x, rect.y, rect.w, rect.h, 0, 0, 28, 28);
    let imageData = canvas.getContext("2d")?.getImageData(0, 0, 28, 28);
    let pixels = imageData?.data;
    if (typeof pixels !== "undefined") {
      for (var j = 0; j < pixels.length; j += 4) {
        let lightness =
          pixels[j] * 0.299 + pixels[j + 1] * 0.587 + pixels[j + 2] * 0.114;
        lightValues.push(lightness / 255);
      }
    }
    const tensor = tf.tensor(lightValues, [1, 28, 28]);

    const predictions = (
      scraper.models.wards.predict(tensor) as tf.Tensor
    ).dataSync();

    const bestPrediction =
      scraper.lookupTable["wards"][
        predictions.indexOf(Math.max(...Array.from(predictions)))
      ][1];

    predictions.sort((a, b) => b - a);
    if (predictions[0] - predictions[1] < 10) {
      return "(?) " + bestPrediction;
    }
    return bestPrediction;
  },

  getPermanentOrShardPrediction(ctx: CanvasRenderingContext2D, rect: Rect) {
    const canvas = document.createElement("canvas");
    canvas.width = 28;
    canvas.height = 28;
    const lightValues = [];
    canvas
      .getContext("2d")
      ?.drawImage(ctx.canvas, rect.x, rect.y, rect.w, rect.h, 0, 0, 28, 28);
    let imageData = canvas.getContext("2d")?.getImageData(0, 0, 28, 28);
    let pixels = imageData?.data;
    if (typeof pixels !== "undefined") {
      for (var j = 0; j < pixels.length; j += 4) {
        let lightness =
          pixels[j] * 0.299 + pixels[j + 1] * 0.587 + pixels[j + 2] * 0.114;
        lightValues.push(lightness / 255);
      }
    }
    const tensor = tf.tensor(lightValues, [1, 28, 28]);

    const predictions = (
      scraper.models.shard_permanent.predict(tensor) as tf.Tensor
    ).dataSync();

    return predictions.indexOf(Math.max(...Array.from(predictions))) === 0
      ? "shard"
      : "permanent";
  },

  // Finds horizontal lines seperating sections in loot screenshots (Material, Champions, Skins, etc.)
  findLines(ctx: CanvasRenderingContext2D) {
    const lines = [];
    const centerColumn = ctx.getImageData(
      Math.round(ctx.canvas.width / 2),
      0,
      1,
      ctx.canvas.height
    ).data;
    for (let i = 0; i < centerColumn.length; i += 4) {
      if (centerColumn[i] > 70) lines.push(i / 4);
    }
    // console.log(lines);
    return lines;
  },

  // Finds loot item rectangles (x,y,w,h) with their category
  computeLootCropRects(ctx: CanvasRenderingContext2D, lines: number[]) {
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

    const offsets: { [x: string]: any } = {
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
    };

    let items = [];
    let currLine = lines.shift() || Infinity;
    let currCategory = "";
    const offset = offsets[scraper.videoWidth] || offsets["1280"];

    for (
      let y = offset.yStart;
      y < ctx.canvas.height;
      y += offset.iconOffsetY
    ) {
      if (y + offset.iconHeight > currLine) {
        currLine = lines.shift() || Infinity;
        currCategory = categories.shift() || "none";

        y -= offset.lineHeight;
        const checkLastThree = [
          items.pop(),
          items.pop(),
          items.pop(),
        ].reverse();
        checkLastThree.forEach((item) => {
          if (typeof item === "undefined") return;
          const squareImage = ctx.getImageData(
            item.x,
            item.y,
            item.w,
            item.h
          ).data;
          root: for (let i = 0; i < Math.max(item.y, item.x); i++) {
            for (let c = 0; c < 3; c++) {
              if (squareImage[i * 4 + i * item.w * 4 + c] > 50) {
                items.push(item);
                break root;
              }
            }
          }
        });
      } else {
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
      }
    }

    const canvas = document.createElement("canvas");
    const ctx2d = canvas.getContext("2d");
    canvas.width = ctx.canvas.width;
    canvas.height = ctx.canvas.height;
    ctx2d?.putImageData(
      ctx.getImageData(0, 0, canvas.width, canvas.height),
      0,
      0
    );

    return items;
  },
};
