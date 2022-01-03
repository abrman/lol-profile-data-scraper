import "./Logo.css";

const Logo: React.FC<{ justTitle?: boolean }> = ({ justTitle = false }) => {
  const title = "Lots of Loot".replace(/ /g, "\u00a0");
  const subtitle1 = "A smart inventory tracker".replace(/ /g, "\u00a0");
  const subtitle2 = "for League of Legends".replace(/ /g, "\u00a0");

  return (
    <div className="logo">
      <div className="title">
        {title.split("").map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>
      {!justTitle && (
        <>
          <div className="subtitle">
            {subtitle1.split("").map((l, i) => (
              <span key={i}>{l}</span>
            ))}
          </div>
          <div className="subtitle">
            {subtitle2.split("").map((l, i) => (
              <span key={i}>{l}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Logo;
