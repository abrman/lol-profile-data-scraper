import scraper from "./scraper";

interface MediaStreamManager {
  captureStream: any;
  [x: string]: any;
}

const mediaDevices = navigator.mediaDevices as any; // workaround: https://github.com/microsoft/TypeScript/issues/33232

export const mediaStreamManager: MediaStreamManager = {
  captureStream: null,

  startCapture(onSuccess: () => void) {
    (async () => {
      try {
        this.captureStream = await mediaDevices.getDisplayMedia({
          video: { cursor: "never" },
          audio: false,
        });
      } catch (err) {
        console.error("Error: " + err);
        alert(
          "Error: " +
            err +
            "\nIt's possible that your browser doesn't support this feature."
        );
      }
      return this.captureStream;
    })().then((stream) => {
      this.captureStream = stream;
      this.onStreamBegin(stream, onSuccess);
    });
  },

  stopCapture() {
    let tracks = (
      scraper.videoElement.current.srcObject as MediaStream
    ).getTracks();

    tracks.forEach((track) => track.stop());
    scraper.videoElement.current.srcObject = null;
  },

  onStreamBegin(stream: MediaStream, onSuccess: () => void) {
    if (scraper.videoElement == null || scraper.videoElement.current == null) {
      return;
    }

    scraper.videoElement.current.srcObject = stream;
    scraper.videoElement.current.onloadedmetadata = function (e) {
      if (scraper.videoElement.current == null) {
        return;
      }
      scraper.videoElement.current.play().then(() => {
        scraper.videoWidth = scraper.videoElement.current.videoWidth;
        scraper.videoHeight = scraper.videoElement.current.videoHeight;

        if (
          ["19201080", "1600900", "1024576", "1280720"].indexOf(
            scraper.videoWidth.toString() + scraper.videoHeight.toString()
          ) < 0
        ) {
          alert(
            "Please share only the League of Legends window. Site will reload now"
          );
          window.location.reload();
        }
        onSuccess();
      });
    };
  },
};
