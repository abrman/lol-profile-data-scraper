import Capture from "../Capture";

type Color = [r: number, g: number, b: number];

export default class Champions extends Capture {
  constructor(
    video: React.RefObject<HTMLVideoElement>,
    currentViewFunction: () => string | false
  ) {
    const checkFunction = () => currentViewFunction() === "champions";

    const options = {
      screenshotArea: {
        "1920": { x: 398, y: 218, w: 1138, h: 852, add: 5 },
        "1600": { x: 332, y: 180, w: 950, h: 713, add: 5 },
        "1280": { x: 264, y: 145, w: 762, h: 565, add: 5 },
        "1024": { x: 210, y: 116, w: 613, h: 454, add: 5 },
      },

      matchingArea: {
        "1920": { w: 160, h: 160 },
        "1600": { w: 160, h: 120 },
        "1280": { w: 160, h: 80 },
        "1024": { w: 160, h: 80 },
      },

      scrollBar: {
        "1920": { x: 1574, y1: 211, y2: 1073 },
        "1600": { x: 1312, y1: 175, y2: 894 },
        "1280": { x: 1049, y1: 140, y2: 715 },
        "1024": { x: 840, y1: 112, y2: 572 },
      },

      loadCheck: {
        "1920": [{ x: 73, y: 504, color: [240, 230, 210] as Color }],
        "1600": [{ x: 60, y: 420, color: [223, 214, 196] as Color }],
        "1280": [{ x: 49, y: 335, color: [236, 226, 206] as Color }],
        "1024": [{ x: 40, y: 266, color: [236, 226, 206] as Color }],
      },
    };
    super(video, options, checkFunction);
  }
}
