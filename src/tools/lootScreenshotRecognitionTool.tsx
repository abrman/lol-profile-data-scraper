import { lootCaptureManager } from "./lootCaptureManager";
import { scraper } from "./scraper";
import JSZip from "jszip";
import { saveAs } from "file-saver";

interface LootScreenshotRecognitionTool {
  [x: string]: any;
}

export const lootScreenshotRecognitionTool: LootScreenshotRecognitionTool = {
  finished: false,

  recognize(ctx: CanvasRenderingContext2D) {
    if (this.finished) return;
    const lines = this.findLines(ctx);
    const lootRects = this.computeLootCropRects(ctx, lines);
    console.log(lootRects);
    this.downloadRect(ctx, lootRects, 0);

    this.finished = true;
  },

  // Lightness formula below was used to generate grayscale testing data
  /*
    let imageData = canvas.getContext("2d")?.getImageData(0, 0, size, size);
      let pixels = imageData?.data;
      if (typeof pixels !== "undefined") {
        for (var j = 0; j < pixels.length; j += 4) {
          let lightness =
            pixels[j] * 0.299 + pixels[j + 1] * 0.587 + pixels[j + 2] * 0.114;

          pixels[j] = lightness;
          pixels[j + 1] = lightness;
          pixels[j + 2] = lightness;
        }
      }
      if (typeof imageData !== "undefined")
        canvas.getContext("2d")?.putImageData(imageData, 0, 0);

      var image = canvas.toDataURL();
  */

  // Delete from here when model training pipeline is complete
  filenames: [
    "champion_capsule",
    "eternals_series_1_capsule",
    "hextech_chest",
    "hextech_mystery_emote",
    "honor_level_4_capsule",
    "masterwork_chest",
    "gemstone",
    "honor_5_token",
    "key_fragment",
    "prestige_point",
    "space_groove_2021_token",
    "mastery_7_token_202000",
    "mastery_7_token_222000",
    "mastery_7_token_111000",
    "mastery_7_token_101000",
    "266000",
    "84000",
    "12000",
    "32000",
    "34000",
    "1000",
    "22000",
    "136000",
    "268000",
    "432000",
    "53000",
    "63000",
    "164000",
    "31000",
    "42000",
    "122000",
    "131000",
    "119000",
    "9000",
    "114000",
    "3000",
    "41000",
    "86000",
    "79000",
    "104000",
    "120000",
    "74000",
    "39000",
    "40000",
    "59000",
    "24000",
    "429000",
    "43000",
    "30000",
    "38000",
    "55000",
    "10000",
    "141000",
    "121000",
    "203000",
    "240000",
    "7000",
    "876000",
    "127000",
    "236000",
    "117000",
    "99000",
    "54000",
    "11000",
    "21000",
    "82000",
    "75000",
    "518000",
    "76000",
    "56000",
    "20000",
    "2000",
    "516000",
    "78000",
    "555000",
    "246000",
    "133000",
    "497000",
    "33000",
    "421000",
    "107000",
    "92000",
    "68000",
    "13000",
    "360000",
    "113000",
    "235000",
    "98000",
    "102000",
    "27000",
    "14000",
    "15000",
    "72000",
    "37000",
    "16000",
    "50000",
    "517000",
    "223000",
    "163000",
    "44000",
    "17000",
    "18000",
    "48000",
    "23000",
    "4000",
    "29000",
    "77000",
    "6000",
    "45000",
    "161000",
    "254000",
    "112000",
    "8000",
    "106000",
    "19000",
    "498000",
    "5000",
    "83000",
    "350000",
    "154000",
    "238000",
    "26000",
    "142000",
  ],

  zip: new JSZip(),

  downloadRect(ctx: CanvasRenderingContext2D, rects: any, i: number = 0) {
    if (rects.length === 0) return;
    const item = rects.shift();

    [16, 24, 32, 48, 64].forEach((size) => {
      var canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      canvas
        .getContext("2d")
        ?.drawImage(
          ctx.canvas,
          item.x,
          item.y,
          item.w,
          item.h,
          0,
          0,
          size,
          size
        );
      let imageData = canvas.getContext("2d")?.getImageData(0, 0, size, size);
      let pixels = imageData?.data;
      if (typeof pixels !== "undefined") {
        for (var j = 0; j < pixels.length; j += 4) {
          let lightness =
            pixels[j] * 0.299 + pixels[j + 1] * 0.587 + pixels[j + 2] * 0.114;

          pixels[j] = lightness;
          pixels[j + 1] = lightness;
          pixels[j + 2] = lightness;
        }
      }
      if (typeof imageData !== "undefined")
        canvas.getContext("2d")?.putImageData(imageData, 0, 0);

      var image = canvas.toDataURL();
      this.zip.file(
        `${size}:1920_${this.filenames[i]}.png`,
        image.split(";base64,")[1],
        {
          base64: true,
        }
      );
      console.log(`Saving ${this.filenames[i]}`);
    });
    if (typeof this.filenames[i + 1] == "undefined") {
      console.log("Generating zip");
      this.zip.generateAsync({ type: "blob" }).then(function (content: any) {
        saveAs(content, scraper.videoWidth.toString() + ".zip");
      });
    } else {
      const self = this;
      self.downloadRect(ctx, rects, i + 1);
    }
  },
  // Delete to here when model training pipeline is complete

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
          if (typeof item == "undefined") return;
          const squareImage = ctx.getImageData(item.x, item.y, item.w, item.h)
            .data;
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

    // Debug

    // items.forEach((item) => {
    //   if (ctx2d == null) return;
    //   ctx2d.beginPath();
    //   ctx2d.lineWidth = 1;
    //   ctx2d.strokeStyle = "red";
    //   ctx2d.rect(item.x, item.y, item.w, item.h);
    //   ctx2d.stroke();
    //   ctx2d.font = "10px Arial";
    //   ctx2d.fillStyle = "red";
    //   ctx2d.fillText(item.cat, item.x + 3, item.y + 15);
    // });

    // if (typeof lootCaptureManager.setImg2 === "function")
    //   lootCaptureManager.setImg2(canvas.toDataURL());
    return items;
  },
};
