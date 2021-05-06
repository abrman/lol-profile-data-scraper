import { scraper } from "./scraper";

interface LootScreenshotRecognitionTool {
  [x: string]: any;
}

export const lootScreenshotRecognitionTool: LootScreenshotRecognitionTool = {
  recognize(ctx: CanvasRenderingContext2D) {
    const lines = this.findLines(ctx);
    const lootRects = this.computeLootCropRects(ctx, lines);
    // console.log(lootRects);
  },

  // Finds horizontal lines seperating sections in loot screenshots (Material, Champions, Skins, etc.)
  // Returns normalized Y of lines as if screen width was 1280 (Seems like that's riots working resolution)
  // Everything is upscaled or downscaled with high res assets on client resize (Ctrl +/-)
  findLines(ctx: CanvasRenderingContext2D) {
    const lines = [];
    const centerColumn = ctx.getImageData(
      Math.round(ctx.canvas.width / 2),
      0,
      1,
      ctx.canvas.height
    ).data;
    for (let i = 0; i < centerColumn.length; i += 4) {
      if (centerColumn[i] > 70)
        lines.push(Math.round(((i / 4) * 1280) / scraper.videoWidth));
    }
    console.log(lines);
    return lines;
  },

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

    let items = [];
    let currLine = lines.shift() || Infinity;
    let currCategory = "";
    const normalizedCanvasHeight =
      (ctx.canvas.height / scraper.videoWidth) * 1280;
    for (let y = 1; y < normalizedCanvasHeight; y += 85) {
      if (y < currLine && y > currLine - 60) {
        currLine = lines.shift() || Infinity;
        currCategory = categories.shift() || "none";
        y -= 45 + (scraper.videoWidth == 1024 ? 1 : 0); // extra pixel at 1024 client width for some odd reason
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
              x: ((7 + 83 * i) * scraper.videoWidth) / 1280,
              y: (y * scraper.videoWidth) / 1280,
              w: (70 * scraper.videoWidth) / 1280,
              h: (70 * scraper.videoWidth) / 1280,
            });
          }
        }
      }
    }

    items.forEach((item) => {
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "red";
      ctx.rect(item.x, item.y, item.w, item.h);
      ctx.stroke();
      ctx.font = "10px Arial";
      ctx.fillStyle = "red";
      ctx.fillText(item.cat, item.x + 3, item.y + 15);
    });
    return items;
  },
};
