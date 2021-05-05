import { scraper } from "./scraper";

interface LootCaptureManager {
  [x: string]: any;
}

export const lootCaptureManager: LootCaptureManager = {
  initialized: false,
  matchingCanvas: document.createElement("canvas").getContext("2d"),
  lootCanvas: document.createElement("canvas").getContext("2d"),
  scrollBarCanvas: document.createElement("canvas").getContext("2d"),

  scrollBarX: 0,
  scrollBarY1: 0,
  scrollBarY2: 0,
  scrollBarAreaHeight: 0,

  // Screenshot loot areas for different screen sizes
  screenshotAreaData: {
    "1920": { x: 80, y: 284, w: 500, h: 616, add: 60 },
    "1600": { x: 70, y: 235, w: 410, h: 514, add: 50 },
    "1280": { x: 55, y: 190, w: 330, h: 411, add: 40 },
    "1024": { x: 45, y: 150, w: 265, h: 329, add: 30 },
  },

  // Scrollbar areas for different screen sizes
  scrollBarData: {
    "1920": { x: 596, y1: 232, y2: 926 },
    "1600": { x: 497, y1: 193, y2: 770 },
    "1280": { x: 397, y1: 154, y2: 617 },
    "1024": { x: 319, y1: 123, y2: 494 },
  },

  // Loot load check locations based on orange and purple essence icons
  loadCheckData: {
    "1920": [
      { x: 260, y: 1015, color: [242, 145, 48] },
      { x: 350, y: 1005, color: [153, 38, 212] },
    ],
    "1600": [
      { x: 215, y: 845, color: [242, 145, 48] },
      { x: 290, y: 835, color: [153, 38, 212] },
    ],
    "1280": [
      { x: 172, y: 676, color: [242, 145, 48] },
      { x: 231, y: 670, color: [153, 38, 212] },
    ],
    "1024": [
      { x: 138, y: 540, color: [242, 145, 48] },
      { x: 185, y: 535, color: [153, 38, 212] },
    ],
  },

  init() {
    if (this.initialized || !this.loadCheck()) return;

    this.scrollBarX = this.scrollBarData[scraper.videoWidth].x;
    this.scrollBarY1 = this.scrollBarData[scraper.videoWidth].y1;
    this.scrollBarY2 = this.scrollBarData[scraper.videoWidth].y2;
    this.scrollBarAreaHeight = this.scrollBarY2 - this.scrollBarY1;

    this.scrollBarCanvas.canvas.width = 1;
    this.scrollBarCanvas.canvas.height = 1080;
    this.matchingCanvas.canvas.width = this.screenshotAreaData[
      scraper.videoWidth
    ].w;
    this.matchingCanvas.canvas.height =
      scraper.videoHeight - this.screenshotAreaData[scraper.videoWidth].y;

    this.lootCanvas.canvas.width = this.screenshotAreaData[
      scraper.videoWidth
    ].w;
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
    for (let i = 0; i < 2; i++) {
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
        Math.abs(r1 - r2) > 10 ||
        Math.abs(g1 - g2) > 10 ||
        Math.abs(b1 - b2) > 10
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

      diagonalSearch: for (
        let i = this.screenshotAreaData[scraper.videoWidth].h - 80;
        i >= 0;
        i--
      ) {
        for (let x = 0; x < 160; x++) {
          for (let y = 0; y < 80; y++) {
            for (let c = 0; c < 3; c++) {
              const search = searchData[x * 4 + c + (((x + y) * 640) % 51200)];
              const match =
                matchingData[i * 640 + x * 4 + c + (((x + y) * 640) % 51200)];
              if (
                Math.abs(search - match) < 100 ||
                (search < 50 && match < 50)
              ) {
              } else {
                continue diagonalSearch;
              }
            }
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
        break;
      }
    }
  },

  loop() {
    this.init();
    if (!this.initialized) return;

    if (this.scrollBar().atTop || this.firstFreeRowIndex() > 0)
      this.attemptScreenshot();

    if (typeof lootCaptureManager.setImg1 === "function")
      lootCaptureManager.setImg1(this.lootCanvas.canvas.toDataURL());
    // if (typeof lootCaptureManager.setImg2 === "function")
    //   lootCaptureManager.setImg2(this.matchingCanvas.canvas.toDataURL());
    // if (typeof lootCaptureManager.setImg3 === "function")
    //   lootCaptureManager.setImg3(this.scrollBarCanvas.canvas.toDataURL());
  },
};
