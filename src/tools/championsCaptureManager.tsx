import { scraper } from "./scraper";

interface ChampionsCaptureManager {
  [x: string]: any;
}

export const championsCaptureManager: ChampionsCaptureManager = {
  initialized: false,
  matchingCanvas: document.createElement("canvas").getContext("2d"),
  lootCanvas: document.createElement("canvas").getContext("2d"),
  scrollBarCanvas: document.createElement("canvas").getContext("2d"),

  finalScreenshotComplete: false,

  scrollBarX: 0,
  scrollBarY1: 0,
  scrollBarY2: 0,
  scrollBarAreaHeight: 0,

  // Screenshot loot areas for different screen sizes
  screenshotAreaData: {
    "1920": { x: 398, y: 218, w: 1138, h: 852, add: 5 },
    "1600": { x: 332, y: 180, w: 950, h: 713, add: 5 },
    "1280": { x: 264, y: 145, w: 762, h: 565, add: 5 },
    "1024": { x: 210, y: 116, w: 613, h: 454, add: 5 },
  },

  matchingAreaData: {
    "1920": { w: 160, h: 160 },
    "1600": { w: 160, h: 120 },
    "1280": { w: 160, h: 80 },
    "1024": { w: 160, h: 80 },
  },

  // Scrollbar areas for different screen sizes
  scrollBarData: {
    "1920": { x: 1574, y1: 211, y2: 1073 },
    "1600": { x: 1312, y1: 175, y2: 894 },
    "1280": { x: 1049, y1: 140, y2: 715 },
    "1024": { x: 840, y1: 112, y2: 572 },
  },

  // Loot load check locations based on orange and purple essence icons
  loadCheckData: {
    "1920": [{ x: 73, y: 504, color: [240, 230, 210] }],
    "1600": [{ x: 60, y: 420, color: [223, 214, 196] }],
    "1280": [{ x: 49, y: 335, color: [236, 226, 206] }],
    "1024": [{ x: 40, y: 266, color: [236, 226, 206] }],
  },

  init() {
    if (this.initialized || !this.loadCheck()) return;

    this.scrollBarX = this.scrollBarData[scraper.videoWidth].x;
    this.scrollBarY1 = this.scrollBarData[scraper.videoWidth].y1;
    this.scrollBarY2 = this.scrollBarData[scraper.videoWidth].y2;
    this.scrollBarAreaHeight = this.scrollBarY2 - this.scrollBarY1;

    this.scrollBarCanvas.canvas.width = 1;
    this.scrollBarCanvas.canvas.height = 1080;
    this.matchingCanvas.canvas.width =
      this.screenshotAreaData[scraper.videoWidth].w;
    this.matchingCanvas.canvas.height =
      scraper.videoHeight - this.screenshotAreaData[scraper.videoWidth].y;

    this.lootCanvas.canvas.width =
      this.screenshotAreaData[scraper.videoWidth].w;
    this.lootCanvas.canvas.height =
      400 +
      this.screenshotAreaData[scraper.videoWidth].h *
        (1 / this.scrollBar().size);
    // console.log(this.lootCanvas.canvas.height, this.scrollBar().size);
    // if (typeof lootCaptureManager.setImg3 === "function")
    //   lootCaptureManager.setImg3(this.scrollBarCanvas.canvas.toDataURL());
    this.initialized = true;
  },

  loadCheck() {
    for (let i = 0; i < this.loadCheckData[scraper.videoWidth].length; i++) {
      const check = this.loadCheckData[scraper.videoWidth][i];
      // console.log(check);
      this.scrollBarCanvas.drawImage(
        scraper.videoElement.current,
        check.x,
        check.y,
        1,
        1,
        0,
        0,
        1,
        1
      );
      const [r1, g1, b1] = check.color;
      const [r2, g2, b2] = this.scrollBarCanvas.getImageData(0, 0, 1, 1).data;

      // console.log([r1, g1, b1], [r2, g2, b2]);
      // debugger;
      if (
        Math.abs(r1 - r2) > 15 ||
        Math.abs(g1 - g2) > 15 ||
        Math.abs(b1 - b2) > 15
      )
        return false;
    }
    return true;
  },

  scrollBar() {
    this.scrollBarCanvas.drawImage(
      scraper.videoElement.current,
      this.scrollBarX,
      this.scrollBarY1,
      1,
      this.scrollBarAreaHeight,
      0,
      0,
      1,
      this.scrollBarAreaHeight
    );
    const redChannel = [
      ...this.scrollBarCanvas.getImageData(0, 0, 1, this.scrollBarAreaHeight)
        .data,
    ].filter((v, i) => i % 4 === 0);
    const scrollBar = redChannel.map((v) => (v > 50 ? 1 : 0)).join("");
    return {
      size: scrollBar.replace(/0/g, "").length / redChannel.length,
      atTop:
        scrollBar[0] === "1" && scrollBar.replace(/(.)\1+/g, "$1") === "10",
      atBottom:
        scrollBar[scrollBar.length - 1] === "1" &&
        scrollBar.replace(/(.)\1+/g, "$1") === "01",
    };
  },

  firstFreeRowIndex() {
    const blueChannel = [
      ...this.lootCanvas.getImageData(0, 0, 1, this.lootCanvas.canvas.height)
        .data,
    ].filter((v, i) => i % 4 === 2);
    return blueChannel.map((v) => (v > 0 ? 1 : 0)).indexOf(0);
  },

  attemptScreenshot() {
    const freeRowIndex = this.firstFreeRowIndex();

    if (freeRowIndex === 0)
      this.lootCanvas.drawImage(
        scraper.videoElement.current,
        this.screenshotAreaData[scraper.videoWidth].x,
        this.screenshotAreaData[scraper.videoWidth].y -
          this.screenshotAreaData[scraper.videoWidth].add,
        this.screenshotAreaData[scraper.videoWidth].w,
        this.screenshotAreaData[scraper.videoWidth].h +
          this.screenshotAreaData[scraper.videoWidth].add,
        0,
        freeRowIndex,
        this.screenshotAreaData[scraper.videoWidth].w,
        this.screenshotAreaData[scraper.videoWidth].h +
          this.screenshotAreaData[scraper.videoWidth].add
      );
    else {
      const atBottom = this.scrollBar().atBottom;
      this.matchingCanvas.drawImage(
        scraper.videoElement.current,
        this.screenshotAreaData[scraper.videoWidth].x,
        this.screenshotAreaData[scraper.videoWidth].y,
        this.screenshotAreaData[scraper.videoWidth].w,
        atBottom
          ? scraper.videoHeight - this.screenshotAreaData[scraper.videoWidth].y
          : this.screenshotAreaData[scraper.videoWidth].h,
        0,
        0,
        this.screenshotAreaData[scraper.videoWidth].w,
        atBottom
          ? scraper.videoHeight - this.screenshotAreaData[scraper.videoWidth].y
          : this.screenshotAreaData[scraper.videoWidth].h
      );
      const searchData = this.matchingCanvas.getImageData(0, 0, 160, 80).data;
      const matchingData = this.lootCanvas.getImageData(
        0,
        freeRowIndex - this.screenshotAreaData[scraper.videoWidth].h,
        160,
        this.screenshotAreaData[scraper.videoWidth].h
      ).data;

      // Search algorithm visualization
      // https://flems.io/#0=N4IgtglgJlA2CmIBcBWAnAOjQJgDQgDMIEBnZAbVADsBDMRJEDACwBcxYR8BjAeytbwByEAB4oEAG4ACbrBokSAXgA6IAO4AnGgAcd8TWoB8ogPQTJRriBLwE3VhH5lGABiTYA7CAC+uanQMTABWZDz8gsKMfFQkrNLq0krSAIwAbK4A3CpUMXHSzEnSABxZOXnx3IXJKdlU5c7xWrr6mkVQvNwArvQCGACOXQYAngDKdvAOvJoAFGoYzXoGagCUdYutGHHDCCzwEADmbEXMAFTYANQA5DoAHlfr2kuaW6w78AvQrNUJ59d3DxyOXIGFBAEFNNphjN1KdmCsALoYAjTACiNCqMwA+kojMActJZI1ZHZYO1Oj0hKwMNxNPAaIJUQheqwZlcLFc1gSSbBYDT5IoADIQOIYGgwNncUmc7kbAxipZUKAAYWYxCgMylvJWOR8OvqVAQ8XI3Fwt1wwwRRXIrlwttcCLqDVi8VgvF4OiKWKSRmk+IN3Iq0ggRVupyqF24FxmM1uF2GK1OsKqKwApDC4eH4bKnpsquq6VRyBAkdtdgAjDEAawOml4XSVRTUAGJXG21NzAxcLnVCRACNJNdIjMkU8BZEostI4xdpD5uf3B7dh8l1Ctx7dJ5lpMNu3OFwOZsMVwV1zvJ-uqITbKwACoQej11luj24aSufXzg0vnQzNbWPgwB0YgDBEStyzsaxbHsRxnBETwkFcXx-BAWh6BEGlFAAiIqTA3goGPf1CWYfYjlYJBUjbSRmF7aQJBIHR5GGCiCAQW5aOCLo4n7YYAFoYkiciSQEAxaJoWBDioXiIEEMASAoqURM0OovxyBZcwMP1uSfCSqHgCiUDuaQSF4CSoGkVs2xUoEqBpUktKvaRWN4BkKIQAhWFo9QvmYCjsDuWiSMONg-IC7lK24Gs6wbKAKLpKAVKgiYHCcWIRBSAAWJAUhSXwER8IA
      // 640 = 160(width) * 4(channel count)
      // 51200 = 160(width) * 80(height) * 4(channel count)
      search: for (
        let i = this.screenshotAreaData[scraper.videoWidth].h - 80;
        i >= 0;
        i--
      ) {
        for (let x = 0; x < this.matchingAreaData[scraper.videoWidth].w; x++) {
          for (
            let y = 0;
            y < this.matchingAreaData[scraper.videoWidth].h;
            y++
          ) {
            // for (let c = 0; c < 3; c++) {
            const c = 0;
            const search = searchData[x * 4 + c + (((x + y) * 640) % 51200)];
            const match =
              matchingData[i * 640 + x * 4 + c + (((x + y) * 640) % 51200)];
            if (Math.abs(search - match) < 100 || (search < 50 && match < 50)) {
            } else {
              continue search;
            }
            // }
          }
        }

        this.lootCanvas.drawImage(
          this.matchingCanvas.canvas,
          0,
          0,
          this.screenshotAreaData[scraper.videoWidth].w,
          atBottom
            ? scraper.videoHeight -
                this.screenshotAreaData[scraper.videoWidth].y
            : this.screenshotAreaData[scraper.videoWidth].h,
          0,
          freeRowIndex - this.screenshotAreaData[scraper.videoWidth].h + i,
          this.screenshotAreaData[scraper.videoWidth].w,
          atBottom
            ? scraper.videoHeight -
                this.screenshotAreaData[scraper.videoWidth].y
            : this.screenshotAreaData[scraper.videoWidth].h
        );

        if (atBottom) {
          this.cropFinalScreenshot(
            freeRowIndex -
              this.screenshotAreaData[scraper.videoWidth].h +
              i +
              scraper.videoHeight -
              this.screenshotAreaData[scraper.videoWidth].y
          );
        }
        break;
      }
    }
  },

  cropFinalScreenshot(canvasHeight: number) {
    const screenshotData = this.lootCanvas.getImageData(
      0,
      0,
      this.lootCanvas.canvas.width,
      canvasHeight
    );
    this.lootCanvas.canvas.height = canvasHeight;
    this.lootCanvas.putImageData(screenshotData, 0, 0);
    this.finalScreenshotComplete = true;
  },

  loop() {
    this.init();
    if (!this.initialized) return;

    if (
      !this.finalScreenshotComplete &&
      (this.scrollBar().atTop || this.firstFreeRowIndex() > 0)
    )
      this.attemptScreenshot();

    if (typeof championsCaptureManager.setImg1 === "function") {
      championsCaptureManager.setImg1(this.lootCanvas.canvas.toDataURL());
      //   console.log("PAINTED");
    }
  },
};
