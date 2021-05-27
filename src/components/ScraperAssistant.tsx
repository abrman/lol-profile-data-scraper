import React, { useState } from "react";
import scraper from "../tools/scraper";

const ScraperAssistant = () => {
  const [content, setContent] = useState(<p>Loading...</p>);

  scraper.updateAssistant = (content: JSX.Element) => setContent(content);

  return <div>{content}</div>;
};

export default ScraperAssistant;
