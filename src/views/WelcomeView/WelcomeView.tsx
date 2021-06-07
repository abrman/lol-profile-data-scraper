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
      <div className="share-screen" onClick={shareWindow}>
        Share game client window
      </div>
    </div>
  );
};

export default WelcomeView;
