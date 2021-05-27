type ScreenshotArea = {
  x: number;
  y: number;
  w: number;
  h: number;
  add: number;
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
  canvas = document.createElement("canvas");
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
    const progress = (
      (this.firstFreeRowIndex() / this.canvas.height) *
      100
    ).toFixed(1);
    return progress !== "-0.0" ? progress + "%" : "100%";
  }

  firstFreeRowIndex() {
    const alphaChannel = Array.from(
      this.canvas.getContext("2d").getImageData(0, 0, 1, this.canvas.height)
        .data
    ).filter((_, i) => i % 4 === 3);
    return alphaChannel.indexOf(0);
  }

  attemptScreenshot() {
    const ssArea = this.screenshotArea[this.clientWidth];
    const atBottom = this.scrollBarInfo().atBottom;
    const freeRowIndex = this.firstFreeRowIndex();

    if (freeRowIndex === 0) {
      this.canvas.width = this.screenshotArea[this.clientWidth].w;
      this.canvas.height =
        400 +
        this.screenshotArea[this.clientWidth].h *
          (1 / this.scrollBarInfo().size);

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
            if (Math.abs(search - match) < 40 || (search < 50 && match < 50)) {
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

        if (atBottom) {
          this.cropFinalScreenshot();
        }
        break;
      }
    }
  }

  cropFinalScreenshot() {
    const canvasHeight = this.firstFreeRowIndex();
    const screenshotData = this.canvas
      .getContext("2d")
      .getImageData(0, 0, this.canvas.width, canvasHeight);
    this.canvas.height = canvasHeight;
    this.canvas.getContext("2d").putImageData(screenshotData, 0, 0);
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
    const scrollBar = redChannel.map((v) => (v > 32 ? 1 : 0)).join("");
    return {
      size: scrollBar.replace(/0/g, "").length / redChannel.length,
      atTop:
        scrollBar[0] === "1" && scrollBar.replace(/(.)\1+/g, "$1") === "10",
      atBottom:
        scrollBar[scrollBar.length - 1] === "1" &&
        scrollBar.replace(/(.)\1+/g, "$1") === "01",
    };
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
