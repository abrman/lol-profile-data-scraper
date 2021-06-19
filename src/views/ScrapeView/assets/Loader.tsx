import "./Loader.css";

type Props = {
  name: string;
  active?: boolean;
  loaded?: string;
  warning?: string | null;
};

const Loader = (props: Props) => {
  return (
    <div className="loader">
      {props.active && <div className="active"></div>}
      <div className="text">
        <div className="name">{props.name}</div>
        <div className="loaded">{props.loaded || "0%"}</div>
      </div>
      <div className="bar">
        <div
          className="loaded"
          style={{
            transform:
              `scaleX(${parseInt(props.loaded.replace("%", "")) / 100})` ||
              `scaleX(0)`,
          }}
        ></div>
      </div>
      {props.warning && (
        <>
          <div className="warning">{props.warning}</div>
          <div className="warning-point">!</div>
        </>
      )}
    </div>
  );
};

export default Loader;
