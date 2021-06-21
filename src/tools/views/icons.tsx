import Capture from "../Capture";
// import * as tf from "@tensorflow/tfjs";

type Color = [r: number, g: number, b: number];

export default class Icons extends Capture {
  constructor(
    video: React.RefObject<HTMLVideoElement>,
    currentViewFunction: () => string | false
  ) {
    const checkFunction = () => currentViewFunction() === "icons";

    const options = {
      screenshotArea: {
        "1920": {
          x: 389,
          y: 275,
          w: 1130,
          h: 757,
          add: 80,
          yBottomCheck: 1065,
        },
        "1600": {
          x: 322,
          y: 229,
          w: 945,
          h: 635,
          add: 70,
          yBottomCheck: 890,
        },
        "1280": {
          x: 256,
          y: 182,
          w: 760,
          h: 495,
          add: 50,
          yBottomCheck: 710,
        },
        "1024": {
          x: 203,
          y: 143,
          w: 612,
          h: 371,
          add: 40,
          yBottomCheck: 570,
        },
      },

      matchingArea: {
        "1920": { w: 160, h: 160 },
        "1600": { w: 160, h: 140 },
        "1280": { w: 160, h: 110 },
        "1024": { w: 160, h: 80 },
      },

      scrollBar: {
        "1920": { x: 1574, y1: 211, y2: 1073 },
        "1600": { x: 1312, y1: 175, y2: 894 },
        "1280": { x: 1049, y1: 140, y2: 715 },
        "1024": { x: 840, y1: 112, y2: 572 },
      },

      loadCheck: {
        "1920": [{ x: 223, y: 462, color: [254, 4, 10] as Color }],
        "1600": [{ x: 186, y: 385, color: [254, 4, 9] as Color }],
        "1280": [{ x: 149, y: 309, color: [248, 3, 13] as Color }],
        "1024": [{ x: 120, y: 247, color: [253, 4, 9] as Color }],
      },
    };
    super(video, options, checkFunction);

    this.warnMessage = null;
    //   this.prepareClassificationAssets();
  }

  warnMessage: string | null;

  attemptScreenshot() {
    if (!this.checkIsViewingMyCollection()) {
      this.warnMessage = `Make sure you have "My Collection" selected from the dropdown in the client.`;
      return;
    }
    this.warnMessage = null;
    super.attemptScreenshot();
  }

  checkIsViewingMyCollection() {
    const check = {
      "1024": { x: 46, y: 501 },
      "1280": { x: 58, y: 628 },
      "1600": { x: 72, y: 786 },
      "1920": { x: 86, y: 942 },
    }[this.clientWidth];

    this.workCanvas
      .getContext("2d")
      .drawImage(this.videoElement.current, check.x, check.y, 1, 1, 0, 0, 1, 1);
    const checkPixel = this.workCanvas
      .getContext("2d")
      .getImageData(0, 0, 1, 1).data;

    return checkPixel[0] > 50;
  }
}
