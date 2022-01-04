import Logo from "./assets/Logo";
import WelcomeIcons from "./assets/WelcomeIcons";
import scraper from "../../tools/scraper";
import "./WelcomeView.css";

type Props = {
  setView: (viewName: string) => void;
  hide: boolean;
};

const WelcomeView = (props: Props) => {
  const shareWindow = () => {
    scraper.startCapture(() => {
      props.setView("prepare");
    });
  };

  return (
    <div className={"welcome-view" + (props.hide ? " hide" : "")}>
      <Logo />
      <WelcomeIcons />
      {typeof (navigator.mediaDevices as any).getDisplayMedia === "function" ? (
        <div className="share-screen" onClick={shareWindow}>
          Share game client window
        </div>
      ) : (
        <div className="unsupported">
          Your browser might not support some of the technologies required to
          run this app. Please update your web browser.
        </div>
      )}
    </div>
  );
};

export default WelcomeView;
