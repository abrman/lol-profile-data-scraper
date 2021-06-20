type ScreenshotArea = {
  x: number;
  y: number;
  w: number;
  h: number;
  add: number;
  yBottomCheck?: number;
};

type ScreenshotAreas = {
  1920: ScreenshotArea;
  1600: ScreenshotArea;
  1280: ScreenshotArea;
  1024: ScreenshotArea;
} | null;

type MatchingArea = {
  w: number;
  h: number;
};

type MatchingAreas = {
  1920: MatchingArea;
  1600: MatchingArea;
  1280: MatchingArea;
  1024: MatchingArea;
} | null;

type ScrollBar = {
  x: number;
  y1: number;
  y2: number;
};

type ScrollBars = {
  1920: ScrollBar;
  1600: ScrollBar;
  1280: ScrollBar;
  1024: ScrollBar;
} | null;

type LoadCheck = {
  x: number;
  y: number;
  color: [r: number, g: number, b: number];
}[];

type LoadChecks = {
  1920: LoadCheck;
  1600: LoadCheck;
  1280: LoadCheck;
  1024: LoadCheck;
} | null;

type Options = {
  screenshotArea: ScreenshotAreas;
  matchingArea: MatchingAreas;
  scrollBar: ScrollBars;
  loadCheck: LoadChecks;
};

export default class Capture {
  rawCanvasList: HTMLCanvasElement[] = [document.createElement("canvas")];
  canvasList: HTMLCanvasElement[] = [document.createElement("canvas")];
  workCanvas = document.createElement("canvas");
  scrollBarCanvas = document.createElement("canvas");

  complete: Boolean = false;
  clientWidth: 1920 | 1600 | 1280 | 1024;
  clientHeight: 1080 | 900 | 720 | 576;

  screenshotArea: ScreenshotAreas;
  matchingArea: MatchingAreas;
  scrollBar: ScrollBars;
  loadCheck: LoadChecks;
  videoElement: React.RefObject<HTMLVideoElement>;
  checkFunction: () => Boolean;
  currentProgress: number = 0;
  loaded: boolean = false;

  constructor(
    videoElement: React.RefObject<HTMLVideoElement>,
    options: Options,
    checkFunction: () => Boolean
  ) {
    this.screenshotArea = options.screenshotArea;
    this.matchingArea = options.matchingArea;
    this.scrollBar = options.scrollBar;
    this.loadCheck = options.loadCheck;
    this.videoElement = videoElement;
    this.clientWidth = videoElement.current.videoWidth as
      | 1920
      | 1600
      | 1280
      | 1024;
    this.clientHeight = videoElement.current.videoHeight as
      | 1080
      | 900
      | 720
      | 576;
    this.checkFunction = checkFunction;

    this.scrollBarCanvas.width = 1;
    this.scrollBarCanvas.height = 1080;

    this.workCanvas.width = this.screenshotArea[this.clientWidth].w;
    this.workCanvas.height = this.screenshotArea[this.clientWidth].h;

    this.loop();
  }

  get canvas() {
    return this.canvasList[this.canvasList.length - 1];
  }

  get rawCanvas() {
    return this.rawCanvasList[this.rawCanvasList.length - 1];
  }

  addCanvas() {
    const prevCanvas = this.canvas;

    this.canvasList.push(document.createElement("canvas"));
    this.canvas.width = prevCanvas.width;
    this.canvas.height = prevCanvas.height;
    this.canvas
      .getContext("2d")
      .drawImage(
        prevCanvas,
        0,
        30000,
        prevCanvas.width,
        1000,
        0,
        0,
        prevCanvas.width,
        1000
      );
  }

  loop() {
    if (
      !this.complete &&
      this.checkFunction() &&
      this.isLoaded() &&
      (this.scrollBarInfo().atTop || this.firstFreeRowIndex() > 0)
    ) {
      this.attemptScreenshot();
    }

    setTimeout(() => this.loop(), 30);
  }

  progress() {
    return (this.currentProgress * 100).toFixed(1) + "%";
  }

  firstFreeRowIndex(canvas?: HTMLCanvasElement) {
    canvas = canvas || this.canvas;
    const alphaChannel = Array.from(
      canvas.getContext("2d").getImageData(0, 0, 1, canvas.height).data
    ).filter((_, i) => i % 4 === 3);
    return alphaChannel.indexOf(0);
  }

  attemptScreenshot() {
    if (this.firstFreeRowIndex() > 31000) this.addCanvas();

    const ssArea = this.screenshotArea[this.clientWidth];
    const scrollBarInfo = this.scrollBarInfo();
    const atBottom = scrollBarInfo.atBottom;
    const freeRowIndex = this.firstFreeRowIndex();

    if (freeRowIndex === 0) {
      this.canvas.width = this.screenshotArea[this.clientWidth].w;
      this.canvas.height = 32000;

      this.canvas
        .getContext("2d")
        .drawImage(
          this.videoElement.current,
          ssArea.x,
          ssArea.y - ssArea.add,
          ssArea.w,
          ssArea.h + ssArea.add,
          0,
          freeRowIndex,
          ssArea.w,
          ssArea.h + ssArea.add
        );
    } else {
      this.workCanvas
        .getContext("2d")
        .drawImage(
          this.videoElement.current,
          ssArea.x,
          atBottom ? this.clientHeight - ssArea.h : ssArea.y,
          ssArea.w,
          ssArea.h,
          0,
          0,
          ssArea.w,
          ssArea.h
        );

      const h = this.matchingArea[this.clientWidth].h;
      const w = this.matchingArea[this.clientWidth].w;

      const searchData = this.workCanvas
        .getContext("2d")
        .getImageData(0, 0, w, h).data;
      const matchingData = this.canvas
        .getContext("2d")
        .getImageData(0, freeRowIndex - ssArea.h, w, ssArea.h).data;

      // Search algorithm visualization
      // https://flems.io/#0=N4IgtglgJlA2CmIBcBWAnAOjQJgDQgDMIEBnZAbVADsBDMRJEDACwBcxYR8BjAeytbwByEAB4oEAG4ACbrBokSAXgA6IAO4AnGgAcd8TWoB8ogPQTJRriBLwE3VhH5lGABiTYA7CAC+uanQMTABWZDz8gsKMfFQkrNLq0krSAIwAbK4A3CpUMXHSzEnSABxZOXnx3IXJKdlU5c7xWrr6mkVQvNwArvQCGACOXQYAngDKdvAOvJoAFGoYzXoGagCUdYutGHHDCCzwEADmbEXMAFTYANQA5DoAHlfr2kuaW6w78AvQrNUJ59d3DxyOXIGFBAEFNNphjN1KdmCsALoYAjTACiNCqMwA+kojMActJZI1ZHZYO1Oj0hKwMNxNPAaIJUQheqwZlcLFc1gSSbBYDT5IoADIQOIYGgwNncUmc7kbAxipZUKAAYWYxCgMylvJWOR8OvqVAQ8XI3Fwt1wwwRRXIrlwttcCLqDVi8VgvF4OiKWKSRmk+IN3Iq0ggRVupyqF24FxmM1uF2GK1OsKqKwApDC4eH4bKnpsquq6VRyBAkdtdgAjDEAawOml4XSVRTUAGJXG21NzAxcLnVCRACNJNdIjMkU8BZEostI4xdpD5uf3B7dh8l1Ctx7dJ5lpMNu3OFwOZsMVwV1zvJ-uqITbKwACoQej11luj24aSufXzg0vnQzNbWPgwB0YgDBEStyzsaxbHsRxnBETwkFcXx-BAWh6BEGlFAAiIqTA3goGPf1CWYfYjlYJBUjbSRmF7aQJBIHR5GGCiCAQW5aOCLo4n7YYAFoYkiciSQEAxaJoWBDioXiIEEMASAoqURM0OovxyBZcwMP1uSfCSqHgCiUDuaQSF4CSoGkVs2xUoEqBpUktKvaRWN4BkKIQAhWFo9QvmYCjsDuWiSMONg-IC7lK24Gs6wbKAKLpKAVKgiYHCcWIRBSAAWJAUhSXwER8IA
      // 640 = 160(width) * 4(channel count)
      // 51200 = 160(width) * 80(height) * 4(channel count)

      search: for (let i = ssArea.h - h; i >= -h; i--) {
        for (let x = 0; x < w; x++) {
          for (let y = 0; y < h; y++) {
            // for (let c = 0; c < 3; c++) {
            const c = 0;
            const search =
              searchData[x * 4 + c + (((x + y) * w * 4) % (w * h * 4))];
            const match =
              matchingData[
                i * w * 4 + x * 4 + c + (((x + y) * w * 4) % (w * h * 4))
              ];
            if (Math.abs(search - match) < 55 || (search < 50 && match < 50)) {
            } else {
              continue search;
            }
            // }
          }
        }

        this.canvas
          .getContext("2d")
          .drawImage(
            this.workCanvas,
            0,
            0,
            ssArea.w,
            atBottom ? this.clientHeight - ssArea.y : ssArea.h,
            0,
            freeRowIndex - ssArea.h + i,
            ssArea.w,
            atBottom ? this.clientHeight - ssArea.y : ssArea.h
          );

        this.currentProgress = Math.min(
          scrollBarInfo.offsetTop +
            scrollBarInfo.size * scrollBarInfo.offsetTop,
          0.999
        );

        if (atBottom) {
          let bottomRowY = ssArea.y + ssArea.h;
          if (typeof ssArea.yBottomCheck !== "undefined") {
            bottomRowY = ssArea.yBottomCheck;
          }
          this.workCanvas
            .getContext("2d")
            .drawImage(
              this.videoElement.current,
              ssArea.x,
              bottomRowY,
              ssArea.w,
              1,
              0,
              0,
              ssArea.w,
              1
            );

          const lastRowRedChannel = Array.from(
            this.workCanvas.getContext("2d").getImageData(0, 0, ssArea.w, 1)
              .data
          ).filter((_, i) => i % 4 === 0);

          // Confirm it's the last row - important with large collections where scrollbar
          // appears at the bottom even though there's a couple more pixels to render
          if (Math.max(...lastRowRedChannel) < 30) {
            this.currentProgress = 1;
            this.cropAlphaFromCanvases();
          }
        }
        break;
      }
    }
  }

  recognize() {
    if (!this.complete) this.cropAlphaFromCanvases();
  }

  annotateImages() {
    for (let i = 0; i < this.canvasList.length; i++) {
      if (i > 0) this.rawCanvasList.push(document.createElement("canvas"));
      this.rawCanvas.width = this.canvasList[i].width;
      this.rawCanvas.height = this.canvasList[i].height;
      this.rawCanvas.getContext("2d").drawImage(this.canvasList[i], 0, 0);
    }
  }

  cropCanvasesByRects(
    rects: {
      x: number;
      y: number;
      w: number;
      h: number;
      canvas: HTMLCanvasElement;
      [x: string]: any;
    }[]
  ) {
    const minMaxArr = Array(this.canvasList.length)
      .fill(0)
      .map((_) => [Infinity, 0]);
    rects.forEach((rect) => {
      const i = this.canvasList.indexOf(rect.canvas);
      minMaxArr[i] = [
        Math.min(minMaxArr[i][0], rect.y),
        Math.max(minMaxArr[i][1], rect.y + rect.h),
      ];
    });

    const offsetRectsTop = [0];

    for (let i = 0; i < minMaxArr.length; i++) {
      const canvas = this.canvasList[i];
      let cropTop = 0;
      let cropBottom = canvas.height;
      if (i !== 0) {
        // define crop top
        const prevMaxY = minMaxArr[i - 1][1];
        const currMinY = minMaxArr[i][0];
        cropTop = Math.floor(currMinY + prevMaxY - 30000) / 2;
        offsetRectsTop[i] = cropTop;
      }
      if (i !== this.canvasList.length - 1) {
        // define crop bottom
        const currMaxY = minMaxArr[i][1];
        const nextMinY = minMaxArr[i + 1][0];
        cropBottom = Math.floor(currMaxY + nextMinY + 30000) / 2;
      }
      const imageData = canvas
        .getContext("2d")
        .getImageData(0, cropTop, canvas.width, cropBottom - cropTop);
      canvas.height = cropBottom - cropTop;
      canvas.getContext("2d").putImageData(imageData, 0, 0);

      const rawCanvas = this.rawCanvasList[i];
      const rawCanvasImageData = rawCanvas
        .getContext("2d")
        .getImageData(0, cropTop, rawCanvas.width, cropBottom - cropTop);
      rawCanvas.height = cropBottom - cropTop;
      rawCanvas.getContext("2d").putImageData(rawCanvasImageData, 0, 0);
    }

    // rects.map((rect) => ({
    //   ...rect,
    //   y: rect.y - offsetRectsTop[this.canvasList.indexOf(rect.canvas)],
    // }));

    // return rects;
  }

  cropAlphaFromCanvases() {
    this.canvasList.forEach((canvas) => {
      const canvasHeight = Math.max(this.firstFreeRowIndex(canvas), 1);
      const screenshotData = canvas
        .getContext("2d")
        .getImageData(0, 0, canvas.width, canvasHeight);
      canvas.height = canvasHeight;
      canvas.getContext("2d").putImageData(screenshotData, 0, 0);
    });
    this.complete = true;
  }

  scrollBarInfo() {
    const sb = this.scrollBar[this.clientWidth];
    this.scrollBarCanvas
      .getContext("2d")
      .drawImage(
        this.videoElement.current,
        sb.x,
        sb.y1,
        1,
        sb.y2 - sb.y1,
        0,
        0,
        1,
        sb.y2 - sb.y1
      );
    const redChannel = Array.from(
      this.scrollBarCanvas.getContext("2d").getImageData(0, 0, 1, sb.y2 - sb.y1)
        .data
    ).filter((_, i) => i % 4 === 0);
    const scrollBar = redChannel
      .map((v) => (v > 32 && v < 210 ? 1 : 0))
      .join("");
    if (scrollBar.indexOf("1") === -1) {
      return {
        size: 1,
        offsetTop: 1,
        atTop: 1,
        atBottom: 1,
      };
    }
    return {
      size: scrollBar.replace(/0/g, "").length / redChannel.length,
      // offsetTop: scrollBar.replace(/1+0+/g, "").length / redChannel.length,
      offsetTop:
        (scrollBar.replace(/1+0+/g, "").length +
          redChannel.length -
          scrollBar.replace(/0+1+/g, "").length) /
        2 /
        redChannel.length,
      atTop:
        scrollBar[0] === "1" && scrollBar.replace(/(.)\1+/g, "$1") === "10",
      atBottom: scrollBar.slice(-2).indexOf("1") >= 0,
    };
  }

  getPixelColor(x: number, y: number) {
    const [r, g, b] = Array.from(
      this.canvas.getContext("2d").getImageData(x, y, 1, 1).data
    );
    return [r, g, b];
  }

  rgb2hue(
    r: number | number[],
    g?: number | undefined,
    b?: number | undefined
  ) {
    if (typeof r == "number") {
      const max = Math.max(r, g, b);
      const diff = max - Math.min(r, g, b);
      const hue =
        max === r
          ? 6 + (g - b) / diff
          : max === g
          ? 2 + (b - r) / diff
          : 4 + (r - g) / diff;
      return Math.round(hue * 60) % 360;
    } else {
      const max = Math.max(r[0], r[1], r[2]);
      const diff = max - Math.min(r[0], r[1], r[2]);
      const hue =
        max === r[0]
          ? 6 + (r[1] - r[2]) / diff
          : max === r[1]
          ? 2 + (r[2] - r[0]) / diff
          : 4 + (r[0] - r[1]) / diff;
      return Math.round(hue * 60) % 360;
    }
  }

  isLoaded() {
    for (let i = 0; i < this.loadCheck[this.clientWidth].length; i++) {
      const check = this.loadCheck[this.clientWidth][i];
      this.scrollBarCanvas
        .getContext("2d")
        .drawImage(
          this.videoElement.current,
          check.x,
          check.y,
          1,
          1,
          0,
          0,
          1,
          1
        );
      const foundColor = this.scrollBarCanvas
        .getContext("2d")
        .getImageData(0, 0, 1, 1).data;
      for (let j = 0; j < check.color.length; j++) {
        if (Math.abs(check.color[j] - foundColor[j]) > 15) return false;
      }
    }
    return true;
  }
}
