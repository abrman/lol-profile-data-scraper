import { lootCaptureManager } from "./lootCaptureManager";
import { scraper } from "./scraper";

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

  downloadRect(ctx: CanvasRenderingContext2D, rects: any, i: number = 0) {
    if (rects.length == 0) return;
    const item = rects.shift();
    var canvas = document.createElement("canvas");
    canvas.width = item.w;
    canvas.height = item.h;
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
        item.w,
        item.h
      );
    var image = canvas.toDataURL();

    var aDownloadLink = document.createElement("a");
    aDownloadLink.download = `${item.cat}_loot_${i}.png`;
    aDownloadLink.href = image;
    aDownloadLink.click();

    const self = this;
    requestAnimationFrame(() => {
      self.downloadRect(ctx, rects, i + 1);
    });
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
