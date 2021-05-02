interface InterfaceManager {
  [x: string]: any;
}

export const interfaceManager: InterfaceManager = {
  initiated: false,
  pixelCanvas: document.createElement("canvas").getContext("2d"),
  menuLineCanvas: document.createElement("canvas").getContext("2d"),
  current_ui: "main_menu",

  ui_elements: {
    main_menu: [
      ["main_menu_with_store", 0.5342, 0.059, true],
      ["main_menu_no_store", 0.9844, 0.0191],
    ],
    main_menu_with_store: [
      ["home", 0.1982, 0.0174, true],
      ["tft", 0.251, 0.0174, true],
      ["clash", 0.3047, 0.0174, true],
      ["profile", 0.5283, 0.0174, true],
      ["collection", 0.5713, 0.0174, true],
      ["loot", 0.6133, 0.0174, true],
      ["discount_store", 0.6553, 0.0174, true],
      ["store", 0.6973, 0.0174, true],
    ],
    main_menu_no_store: [
      ["home", 0.1982, 0.0174, true],
      ["tft", 0.251, 0.0174, true],
      ["clash", 0.3047, 0.0174, true],
      ["profile", 0.5713, 0.0174, true],
      ["collection", 0.6133, 0.0174, true],
      ["loot", 0.6553, 0.0174, true],
      ["store", 0.6973, 0.0174, true],
    ],
    collection: [
      ["collection-champions", 0.0703, 0.151],
      ["collection-skins", 0.1387, 0.151],
      ["collection-emotes", 0.1963, 0.151],
      ["collection-runes", 0.2578, 0.151],
      ["collection-spells", 0.3184, 0.151],
      ["collection-items", 0.3691, 0.151],
      ["collection-icons", 0.4287, 0.151],
      ["collection-wards", 0.4848, 0.151],
      ["collection-chromas", 0.5527, 0.151],
    ],
  },
  init(videoElement: React.RefObject<HTMLVideoElement>) {
    if (this.initiated) return;
    this.pixelCanvas.canvas.height = 1;
    this.pixelCanvas.canvas.width = 1;
    this.menuLineCanvas.canvas.width = 200;
    this.menuLineCanvas.canvas.height = 1;
    this.pixelOffset = this.calculateMenuPixelOffset(videoElement);
    this.initiated = true;
  },
  getPixelDataFromVideo(
    videoElement: React.RefObject<HTMLVideoElement>,
    x: number,
    y: number,
    offsetX: boolean = false
  ) {
    if (
      videoElement == null ||
      videoElement.current == null ||
      this.pixelCanvas == null
    )
      return;

    if (x < 1) {
      x =
        Math.round(x * videoElement.current.videoWidth) +
        (offsetX ? this.pixelOffset : 0);
      y = Math.round(y * videoElement.current.videoHeight);
    }

    this.pixelCanvas.drawImage(videoElement.current, x, y, 1, 1, 0, 0, 1, 1);
    return Array.from(this.pixelCanvas.getImageData(0, 0, 1, 1).data).splice(
      0,
      3
    );
  },

  currentInterface(videoElement: React.RefObject<HTMLVideoElement>) {
    this.init(videoElement);
    this.current_ui = "main_menu";
    while (Object.keys(this.ui_elements).indexOf(this.current_ui) >= 0) {
      //   console.log(this.current_ui);
      //   console.log(this.pixelOffset);
      this.calculateMenuPixelOffset(videoElement);
      this.current_ui = this.findFirstBright(
        this.ui_elements[
          this.current_ui
        ].map((v: [string, number, number, boolean]) => [
          v[0],
          this.getPixelDataFromVideo(
            videoElement,
            v[1],
            v[2],
            v[3] ? v[3] : undefined
          ),
        ])
      );
    }
    return this.current_ui;
  },

  findFirstBright(list: any[], valueTreshold = 60) {
    for (let i = 0; i < list.length; i++) {
      if (
        list[i][1].filter((v: number, i: number) => i < 3 && v > valueTreshold)
          .length > 0
      ) {
        return list[i][0];
      }
    }
    return false;
  },

  // Caused by different RP and Blue essence value widths
  calculateMenuPixelOffset(videoElement: React.RefObject<HTMLVideoElement>) {
    if (
      videoElement == null ||
      videoElement.current == null ||
      this.pixelCanvas == null
    )
      return;

    const vw = videoElement.current.videoWidth;
    const vh = videoElement.current.videoHeight;

    this.menuLineCanvas.drawImage(
      videoElement.current,
      Math.floor(vw * 0.7),
      Math.floor(vh * 0.025),
      200,
      1,
      0,
      0,
      200,
      1
    );
    const greenChannel = this.menuLineCanvas
      .getImageData(0, 0, 200, 1)
      .data.filter((_: number, i: number) => i % 4 == 1);
    let i;
    for (i = 0; i < greenChannel.length; i++)
      if (greenChannel[i] > 30) {
        console.log(greenChannel[i], i);
        break;
      }

    const expectedValues: { [x: string]: number } = {
      "1920": 49,
      "1600": 41,
      "1280": 33,
      "1024": 27,
    };

    return expectedValues[vw.toString()] - i;
  },
};
