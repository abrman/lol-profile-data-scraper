import React from "react";

type Point = { x: number; y: number };

type InterfaceData = {
  [x: string]: {
    edgeSearch: Point;
    storePixelOffset: Point;
    menuItemGaps: number;
    profileIconOffset: Point;
    collection: { x: number[]; y: number };
  };
};

type searchPoint = [string, number, number, [number, number, number]];

interface InterfaceManager {
  initiated: boolean;
  pixelCanvas: CanvasRenderingContext2D;
  edgeSearch: CanvasRenderingContext2D;
  searchCoordinates: { [interfaceName: string]: searchPoint[] } | false;
  videoElement: React.RefObject<HTMLVideoElement>;
  currentUi: string;
  collectionLabels: string[];
  interfaceData: InterfaceData;
  init(videoElement: React.RefObject<HTMLVideoElement>): void;
  storePixel: Point | false;
  findStorePixel: () => Point | false;
  generateSearchCoordinates: () =>
    | { [interfaceName: string]: searchPoint[] }
    | false;
  getPixelDataFromVideo: (
    x: number,
    y: number
  ) => [number, number, number] | false;
  currentInterface(
    videoElement: React.RefObject<HTMLVideoElement>
  ): string | false;
  // [x: string]: any;
}

export const interfaceManager: InterfaceManager = {
  initiated: false,
  pixelCanvas: document.createElement("canvas").getContext("2d")!,
  edgeSearch: document.createElement("canvas").getContext("2d")!,
  searchCoordinates: false,
  videoElement: React.createRef<HTMLVideoElement>(),
  currentUi: "main_menu",
  storePixel: { x: -1, y: -1 },

  collectionLabels: [
    "champions",
    "skins",
    "emotes",
    "runes",
    "spells",
    "items",
    "icons",
    "wards",
    "chromas",
  ],
  interfaceData: {
    1920: {
      edgeSearch: { x: 1393, y: 32 },
      storePixelOffset: { x: -55, y: -30 },
      menuItemGaps: 81,
      profileIconOffset: { x: -315, y: 60 },
      collection: {
        y: 164,
        x: [134, 266, 376, 494, 611, 708, 823, 930, 1061],
      },
    },
    1600: {
      edgeSearch: { x: 1161, y: 25 },
      storePixelOffset: { x: -46, y: -24 },
      menuItemGaps: 68,
      profileIconOffset: { x: -260, y: 50 },
      collection: {
        y: 137,
        x: [112, 221, 314, 412, 509, 590, 685, 775, 884],
      },
    },
    1280: {
      edgeSearch: { x: 929, y: 21 },
      storePixelOffset: { x: -37, y: -20 },
      menuItemGaps: 54,
      profileIconOffset: { x: -210, y: 40 },
      collection: {
        y: 109,
        x: [89, 177, 251, 329, 407, 472, 548, 620, 707],
      },
    },
    1024: {
      edgeSearch: { x: 743, y: 16 },
      storePixelOffset: { x: -29, y: -15 },
      menuItemGaps: 43,
      profileIconOffset: { x: -168, y: 30 },
      collection: {
        y: 87,
        x: [71, 142, 201, 263, 326, 377, 438, 496, 565],
      },
    },
  },

  init(videoElement: React.RefObject<HTMLVideoElement>) {
    if (this.initiated) return;
    this.videoElement = videoElement;
    this.pixelCanvas.canvas.height = 1;
    this.pixelCanvas.canvas.width = 1;
    this.edgeSearch.canvas.width = 200;
    this.edgeSearch.canvas.height = 1;
    this.storePixel = this.findStorePixel();
    this.searchCoordinates = this.generateSearchCoordinates();
    if (!this.storePixel || !this.searchCoordinates) return;
    this.initiated = true;
  },

  getPixelDataFromVideo(x: number, y: number) {
    if (this.videoElement.current == null) {
      console.error("couldn't find videoElement on getPixelDataFromVideo()");
      return false;
    }
    this.pixelCanvas.drawImage(
      this.videoElement.current,
      x,
      y,
      1,
      1,
      0,
      0,
      1,
      1
    );
    const pixelData = Array.from(
      this.pixelCanvas.getImageData(0, 0, 1, 1).data
    );
    return [pixelData[0], pixelData[1], pixelData[2]];
  },

  currentInterface(videoElement: React.RefObject<HTMLVideoElement>) {
    this.init(videoElement);
    if (!this.initiated) return false;
    if (this.searchCoordinates === false) {
      console.error("couldn't find searchCoordinates on currentInterface()");
      return false;
    }

    this.currentUi = "main_menu";
    while (Object.keys(this.searchCoordinates).indexOf(this.currentUi) >= 0) {
      //   console.log(this.searchCoordinates, this.currentUi);

      const active_menu_items = this.searchCoordinates[this.currentUi].filter(
        ([name, x, y, expectedColor]: [string, number, number, number[]]) => {
          const pixelData = this.getPixelDataFromVideo(x, y);
          if (!pixelData) return false;
          const [r, g, b] = pixelData;
          return (
            Math.abs(r - expectedColor[0]) +
              Math.abs(g - expectedColor[1]) +
              Math.abs(b - expectedColor[2]) <
            100
          );
        }
      );
      //   if (active_menu_items.length > 1)
      //     console.error(`More than one active menu item`, active_menu_items);
      if (active_menu_items[0]) this.currentUi = active_menu_items[0][0];
      else this.currentUi = "unknown";
    }
    return this.currentUi;
  },

  findStorePixel() {
    if (this.videoElement.current == null) return false;
    this.edgeSearch.drawImage(
      this.videoElement.current,
      this.interfaceData[this.videoElement.current.videoWidth].edgeSearch.x -
        100,
      this.interfaceData[this.videoElement.current.videoWidth].edgeSearch.y,
      200,
      1,
      0,
      0,
      200,
      1
    );
    const greenChannel = this.edgeSearch
      .getImageData(0, 0, 200, 1)
      .data.filter((_: number, i: number) => i % 4 === 1);
    let i;
    for (i = 1; i < greenChannel.length; i++)
      if (
        greenChannel[i] > greenChannel[0] + 30 &&
        greenChannel[i] - 20 > greenChannel[i - 1] &&
        greenChannel[i] - 20 > greenChannel[i + 1]
      ) {
        break;
      }

    return {
      x:
        this.interfaceData[this.videoElement.current.videoWidth].edgeSearch.x -
        100 +
        i +
        this.interfaceData[this.videoElement.current.videoWidth]
          .storePixelOffset.x,
      y:
        this.interfaceData[this.videoElement.current.videoWidth].edgeSearch.y +
        this.interfaceData[this.videoElement.current.videoWidth]
          .storePixelOffset.y,
    };
  },

  generateSearchCoordinates() {
    if (!this.storePixel || !this.videoElement.current) {
      return false;
    }

    const profilePixelData = this.getPixelDataFromVideo(
      this.storePixel.x +
        this.interfaceData[this.videoElement.current.videoWidth]
          .profileIconOffset.x,
      this.storePixel.y +
        this.interfaceData[this.videoElement.current.videoWidth]
          .profileIconOffset.y
    );

    if (!profilePixelData) return false;
    const yourStoreOpen = profilePixelData[0] > 180;

    /* Doing some fake checks here (as Point or as HTMLVideoElement)
    as there isn't anything between the check earlier in the function
    and the return value that could change the fact of that check. */
    return {
      main_menu: [
        "store",
        yourStoreOpen ? "shop" : "false",
        "loot",
        "collection",
        "profile",
      ]
        .filter((v) => v !== "false")
        .map((menu_item, i) => [
          menu_item,
          (this.storePixel as Point).x -
            this.interfaceData[
              (this.videoElement.current as HTMLVideoElement).videoWidth
            ].menuItemGaps *
              i,
          (this.storePixel as Point).y,
          [1, 10, 19],
        ]),
      collection: this.interfaceData[
        this.videoElement.current.videoWidth
      ].collection.x.map((x: number, i: number) => [
        this.collectionLabels[i],
        x,
        this.interfaceData[
          (this.videoElement.current as HTMLVideoElement).videoWidth
        ].collection.y,
        [185, 185, 165],
      ]),
    };
  },
};
