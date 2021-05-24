import React, { useState, useEffect } from "react";
import { lootCaptureManager } from "../tools/lootCaptureManager";
import { championsCaptureManager } from "../tools/championsCaptureManager";

const Debug = () => {
  const [img1, setImg1] = useState("data:image/jpeg;base64,");
  const [img2, setImg2] = useState("data:image/jpeg;base64,");
  const [img3, setImg3] = useState("data:image/jpeg;base64,");

  useEffect(() => {
    lootCaptureManager.setImg1 = setImg1;
    lootCaptureManager.setImg2 = setImg2;
    lootCaptureManager.setImg3 = setImg3;
    championsCaptureManager.setImg1 = setImg1;
    championsCaptureManager.setImg2 = setImg2;
    championsCaptureManager.setImg3 = setImg3;
  }, []);

  return (
    <div className="debug">
      <img src={img1} alt="" />
      <img src={img2} alt="" />
      <img src={img3} alt="" />
    </div>
  );
};

export default Debug;
