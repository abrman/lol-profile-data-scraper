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

  // Screenshot areas for different screens
  ss: {
    "1920": { x: 80, y: 284, w: 500, h: 616, add: 60 },
    "1600": { x: 70, y: 235, w: 410, h: 514, add: 50 },
    "1280": { x: 55, y: 190, w: 330, h: 411, add: 40 },
    "1024": { x: 45, y: 150, w: 265, h: 329, add: 30 },
  },

  // Scrollbar areas for different screens
  sb: {
    "1920": { x: 596, y1: 232, y2: 926 },
    "1600": { x: 497, y1: 193, y2: 770 },
    "1280": { x: 397, y1: 154, y2: 617 },
    "1024": { x: 319, y1: 123, y2: 494 },
  },

  init() {
    if (this.initialized) return;
    this.scrollBarX = this.sb[scraper.videoWidth].x; // Math.floor(0.3105 * scraper.videoWidth); this.sb[scraper.videoWidt].x
    this.scrollBarY1 = this.sb[scraper.videoWidth].y1; // Math.ceil(0.2148 * scraper.videoHeight);
    this.scrollBarY2 = this.sb[scraper.videoWidth].y2; // Math.ceil(0.8576 * scraper.videoHeight);
    this.scrollBarAreaHeight = this.scrollBarY2 - this.scrollBarY1;

    this.scrollBarCanvas.canvas.width = 1;
    this.scrollBarCanvas.canvas.height = 1080;
    this.matchingCanvas.canvas.width = this.ss[scraper.videoWidth].w;
    this.matchingCanvas.canvas.height =
      scraper.videoHeight - this.ss[scraper.videoWidth].y;

    // Prevent finishing initialization if the scrollBar UI didn't load yet
    if (this.lootScrollBar().size < 6 / scraper.videoHeight) return;

    this.lootCanvas.canvas.width = this.ss[scraper.videoWidth].w;
    this.lootCanvas.canvas.height =
      400 + this.ss[scraper.videoWidth].h * (1 / this.lootScrollBar().size);
    console.log(this.lootCanvas.canvas.height);
    this.initialized = true;
  },

  lootScrollBar() {
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
        /*source x*/ this.ss[scraper.videoWidth].x,
        /*source y*/ this.ss[scraper.videoWidth].y -
          this.ss[scraper.videoWidth].add,
        /*source w*/ this.ss[scraper.videoWidth].w,
        /*source h*/ this.ss[scraper.videoWidth].h +
          this.ss[scraper.videoWidth].add,
        /*target x*/ 0,
        /*target y*/ freeRowIndex,
        /*target w*/ this.ss[scraper.videoWidth].w,
        /*target h*/ this.ss[scraper.videoWidth].h +
          this.ss[scraper.videoWidth].add
      );
    else {
      const atBottom = this.lootScrollBar().atBottom;
      this.matchingCanvas.drawImage(
        scraper.videoElement.current,
        /*source x*/ this.ss[scraper.videoWidth].x,
        /*source y*/ this.ss[scraper.videoWidth].y,
        /*source w*/ this.ss[scraper.videoWidth].w,
        /*source h*/ atBottom
          ? scraper.videoHeight - this.ss[scraper.videoWidth].y
          : this.ss[scraper.videoWidth].h,
        /*target x*/ 0,
        /*target y*/ 0,
        /*target w*/ this.ss[scraper.videoWidth].w,
        /*target h*/ atBottom
          ? scraper.videoHeight - this.ss[scraper.videoWidth].y
          : this.ss[scraper.videoWidth].h
      );
      const searchData = this.matchingCanvas.getImageData(0, 0, 80, 80).data;
      const matchingData = this.lootCanvas.getImageData(
        0,
        freeRowIndex - this.ss[scraper.videoWidth].h,
        80,
        this.ss[scraper.videoWidth].h
      ).data;

      diagonalSearch: for (
        let i = this.ss[scraper.videoWidth].h - 80;
        i >= 0;
        i--
      ) {
        for (let j = 0; j < 80; j++) {
          if (
            [
              [
                searchData[0 + j * (80 + 1) * 4],
                matchingData[i * 80 * 4 + 0 + j * (80 + 1) * 4],
              ],
              [
                searchData[1 + j * (80 + 1) * 4],
                matchingData[i * 80 * 4 + 1 + j * (80 + 1) * 4],
              ],
              [
                searchData[2 + j * (80 + 1) * 4],
                matchingData[i * 80 * 4 + 2 + j * (80 + 1) * 4],
              ],
            ]
              .map(
                (channel) =>
                  Math.abs(channel[0] - channel[1]) < 10 ||
                  (channel[0] < 50 && channel[1] < 50)
                    ? 0
                    : 1 // Treshold 5
              )
              .filter((v) => v === 1).length > 0
          ) {
            continue diagonalSearch;
          }
        }
        // this.lootCanvas.beginPath();
        // this.lootCanvas.moveTo(
        //   0,
        //   freeRowIndex - this.ss[scraper.videoWidth].h + i - 1
        // );
        // this.lootCanvas.lineTo(
        //   400,
        //   freeRowIndex - this.ss[scraper.videoWidth].h + i - 1
        // );
        // this.lootCanvas.strokeStyle = "red";
        // this.lootCanvas.stroke();

        this.lootCanvas.drawImage(
          this.matchingCanvas.canvas,
          /*source x*/ 0,
          /*source y*/ 0,
          /*source w*/ this.ss[scraper.videoWidth].w,
          /*source h*/ atBottom
            ? scraper.videoHeight - this.ss[scraper.videoWidth].y
            : this.ss[scraper.videoWidth].h,
          /*target x*/ 0,
          /*target y*/ freeRowIndex - this.ss[scraper.videoWidth].h + i,
          /*target w*/ this.ss[scraper.videoWidth].w,
          /*target h*/ atBottom
            ? scraper.videoHeight - this.ss[scraper.videoWidth].y
            : this.ss[scraper.videoWidth].h
        );
        break;
      }
    }
  },

  loop() {
    this.init();
    if (!this.initialized) return;

    if (this.lootScrollBar().atTop || this.firstFreeRowIndex() > 0)
      this.attemptScreenshot();

    if (typeof lootCaptureManager.setImg === "function")
      lootCaptureManager.setImg(this.lootCanvas.canvas.toDataURL());
  },
};
