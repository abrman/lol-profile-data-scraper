import React from "react";

interface InterfaceManager {
  [x: string]: any;
}

export const interfaceManager: InterfaceManager = {
  initiated: false,
  pixelCanvas: document.createElement("canvas").getContext("2d"),
  edgeSearch: document.createElement("canvas").getContext("2d"),
  searchCoordinates: [],
  videoElement: React.createRef<HTMLVideoElement>(),
  current_ui: "main_menu",

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
  ui_data: {
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
    this.initiated = true;
  },

  getPixelDataFromVideo(x: number, y: number) {
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
    return Array.from(this.pixelCanvas.getImageData(0, 0, 1, 1).data).splice(
      0,
      3
    );
  },

  currentInterface(videoElement: React.RefObject<HTMLVideoElement>) {
    this.init(videoElement);
    if (!this.initiated) return;
    this.current_ui = "main_menu";
    while (Object.keys(this.searchCoordinates).indexOf(this.current_ui) >= 0) {
      //   console.log(this.searchCoordinates, this.current_ui);

      const active_menu_items = this.searchCoordinates[this.current_ui].filter(
        ([name, x, y, expectedColor]: [string, number, number, number[]]) => {
          const [r, g, b] = this.getPixelDataFromVideo(x, y);
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
      if (active_menu_items[0]) this.current_ui = active_menu_items[0][0];
      else this.current_ui = false;
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

  findStorePixel() {
    this.edgeSearch.drawImage(
      this.videoElement.current,
      this.ui_data[this.videoElement.current.videoWidth].edgeSearch.x - 100,
      this.ui_data[this.videoElement.current.videoWidth].edgeSearch.y,
      200,
      1,
      0,
      0,
      200,
      1
    );
    const greenChannel = this.edgeSearch
      .getImageData(0, 0, 200, 1)
      .data.filter((_: number, i: number) => i % 4 == 1);
    let i;
    for (i = 0; i < greenChannel.length; i++)
      if (greenChannel[i] > greenChannel[0] + 30) {
        break;
      }

    return {
      x:
        this.ui_data[this.videoElement.current.videoWidth].edgeSearch.x -
        100 +
        i +
        this.ui_data[this.videoElement.current.videoWidth].storePixelOffset.x,
      y:
        this.ui_data[this.videoElement.current.videoWidth].edgeSearch.y +
        this.ui_data[this.videoElement.current.videoWidth].storePixelOffset.y,
    };
  },

  generateSearchCoordinates() {
    const yourStoreOpen =
      this.getPixelDataFromVideo(
        this.storePixel.x +
          this.ui_data[this.videoElement.current.videoWidth].profileIconOffset
            .x,
        this.storePixel.y +
          this.ui_data[this.videoElement.current.videoWidth].profileIconOffset.y
      )[0] > 180;

    return {
      main_menu: [
        "store",
        yourStoreOpen ? "shop" : false,
        "loot",
        "collection",
        "profile",
      ]
        .filter((v) => v !== false)
        .map((menu_item, i) => [
          menu_item,
          this.storePixel.x -
            this.ui_data[this.videoElement.current.videoWidth].menuItemGaps * i,
          this.storePixel.y,
          [1, 10, 19],
        ]),
      collection: this.ui_data[
        this.videoElement.current.videoWidth
      ].collection.x.map((x: number, i: number) => [
        this.collectionLabels[i],
        x,
        this.ui_data[this.videoElement.current.videoWidth].collection.y,
        [185, 185, 165],
      ]),
    };
  },
};
