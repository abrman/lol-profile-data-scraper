import React, { useState, useEffect } from "react";
import scraper from "../tools/scraper";

const Debug = () => {
  const [img1, setImg1] = useState("data:image/jpeg;base64,");
  const [img2, setImg2] = useState("data:image/jpeg;base64,");
  const [img3, setImg3] = useState("data:image/jpeg;base64,");
  const [img4, setImg4] = useState("data:image/jpeg;base64,");
  const [img5, setImg5] = useState("data:image/jpeg;base64,");
  const [img6, setImg6] = useState("data:image/jpeg;base64,");

  useEffect(() => {
    scraper.setImg1 = setImg1;
    scraper.setImg2 = setImg2;
    scraper.setImg3 = setImg3;
    scraper.setImg4 = setImg4;
    scraper.setImg5 = setImg5;
    scraper.setImg6 = setImg6;
  }, []);

  return (
    <div className="debug">
      <img src={img1} alt="" />
      <img src={img2} alt="" />
      <img src={img3} alt="" />
      <img src={img4} alt="" />
      <img src={img5} alt="" />
      <img src={img6} alt="" />
    </div>
  );
};

export default Debug;
