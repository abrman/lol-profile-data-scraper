import React, { useState, useEffect } from "react";
import { lootCaptureManager } from "../helpers/lootCaptureManager";

const Debug = () => {
  const [img, setImg] = useState("data:image/jpeg;base64,");

  useEffect(() => {
    lootCaptureManager.setImg = setImg;
  }, []);

  return (
    <div style={{ position: "absolute", left: 0, top: 0, opacity: 0.5 }}>
      <img src={img} alt="" />
    </div>
  );
};

export default Debug;
