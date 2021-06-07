import "./WelcomeIcons.css";

const WelcomeIcons = () => {
  const icons = {
    scroll: (
      <svg
        className="scroll"
        width="156"
        height="156"
        viewBox="0 0 156 156"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g className="arrow">
          <path
            d="M78.239 56.9014L78.239 34.6315"
            stroke="#45B1FF"
            strokeWidth="8.20469"
            strokeLinecap="round"
          />
        </g>
        <rect
          x="46.0062"
          y="136.018"
          width="117.21"
          height="64.4654"
          rx="32.2327"
          transform="rotate(-90 46.0062 136.018)"
          stroke="#333333"
          strokeWidth="8.20469"
        />
      </svg>
    ),
    share: (
      <svg
        className="share"
        width="156"
        height="156"
        viewBox="0 0 156 156"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g className="arrow">
          <path
            d="M120.378 24.0643H149.68V52.1947"
            stroke="#45B1FF"
            strokeWidth="8.20469"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M109.829 63.3296L147.923 25.2365"
            stroke="#45B1FF"
            strokeWidth="8.20469"
            strokeLinecap="round"
          />
        </g>
        <path
          d="M149.681 69.8193V104.939H6.68457V24.0643H102.797"
          stroke="#333333"
          strokeWidth="8.20469"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M40.0894 130.725H116.276"
          stroke="#333333"
          strokeWidth="8.20469"
          strokeLinecap="round"
        />
        <rect
          x="67.6338"
          y="104.939"
          width="21.0978"
          height="25.7862"
          stroke="#333333"
          strokeWidth="8.20469"
        />
      </svg>
    ),
    download: (
      <svg
        className="download"
        width="156"
        height="156"
        viewBox="0 0 156 156"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g className="arrow">
          <path
            d="M98.708 49.9298L77.988 70.6498L58.0969 50.7586"
            stroke="#45B1FF"
            strokeWidth="8.20469"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M78.4024 14.7059V68.5778"
            stroke="#45B1FF"
            strokeWidth="8.20469"
            strokeLinecap="round"
          />
        </g>
        <path
          d="M11.615 99.0969V127.227H145.234V99.0969"
          stroke="#333333"
          strokeWidth="8.20469"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M59.671 70.9666H35.057L11.615 99.0969H145.234L121.792 70.9666H97.1782"
          stroke="#333333"
          strokeWidth="8.20469"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  };
  return (
    <div className="welcome-icons">
      <div className="block">
        <div className="icon">{icons.share}</div>
        <div className="text">
          Screen share
          <br />
          game client
        </div>
      </div>
      <div className="block">
        <div className="icon">{icons.scroll}</div>
        <div className="text">
          Scroll through
          <br />
          invetory screens
        </div>
      </div>
      <div className="block">
        <div className="icon">{icons.download}</div>
        <div className="text">
          Analyze and
          <br />
          download results
        </div>
      </div>
    </div>
  );
};

export default WelcomeIcons;
