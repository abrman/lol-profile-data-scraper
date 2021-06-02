import Capture from "../Capture";
// import * as tf from "@tensorflow/tfjs";

type Color = [r: number, g: number, b: number];

export default class Champions extends Capture {
  constructor(
    video: React.RefObject<HTMLVideoElement>,
    currentViewFunction: () => string | false
  ) {
    const checkFunction = () => currentViewFunction() === "emotes";

    const options = {
      screenshotArea: {
        "1920": { x: 49, y: 331, w: 505, h: 719, add: 120, yBottomCheck: 1073 },
        "1600": { x: 40, y: 275, w: 422, h: 597, add: 100, yBottomCheck: 895 },
        "1280": { x: 31, y: 220, w: 340, h: 481, add: 85, yBottomCheck: 716 },
        "1024": { x: 24, y: 174, w: 274, h: 380, add: 64, yBottomCheck: 573 },
      },

      matchingArea: {
        "1920": { w: 160, h: 160 },
        "1600": { w: 140, h: 140 },
        "1280": { w: 110, h: 110 },
        "1024": { w: 80, h: 80 },
      },

      scrollBar: {
        "1920": { x: 574, y1: 326, y2: 1067 },
        "1600": { x: 478, y1: 272, y2: 890 },
        "1280": { x: 382, y1: 218, y2: 713 },
        "1024": { x: 306, y1: 173, y2: 570 },
      },

      loadCheck: {
        "1920": [
          { x: 1027, y: 493, color: [100, 78, 30] as Color },
          { x: 1135, y: 493, color: [100, 78, 30] as Color },
          { x: 1027, y: 603, color: [74, 58, 29] as Color },
          { x: 1135, y: 603, color: [75, 59, 29] as Color },
        ],
        "1600": [
          { x: 857, y: 412, color: [100, 78, 30] as Color },
          { x: 947, y: 412, color: [100, 78, 30] as Color },
          { x: 857, y: 503, color: [74, 58, 29] as Color },
          { x: 947, y: 503, color: [74, 58, 29] as Color },
        ],
        "1280": [
          { x: 685, y: 328, color: [100, 78, 30] as Color },
          { x: 757, y: 329, color: [100, 78, 30] as Color },
          { x: 685, y: 402, color: [74, 58, 29] as Color },
          { x: 757, y: 402, color: [73, 58, 29] as Color },
        ],
        "1024": [
          { x: 548, y: 262, color: [100, 78, 30] as Color },
          { x: 606, y: 263, color: [100, 78, 30] as Color },
          { x: 547, y: 321, color: [74, 58, 29] as Color },
          { x: 605, y: 321, color: [73, 57, 29] as Color },
        ],
      },
    };
    super(video, options, checkFunction);

    //   this.prepareClassificationAssets();
  }
}
