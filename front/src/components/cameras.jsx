"use client";

import io from "socket.io-client";
import { useState, useEffect } from "react";

const socket = io("https://dasboard-construction.onrender.com");

export function Cameras() {
  const [imageSrc, setImageSrc] = useState("");

  useEffect(() => {
    socket.on("video_frame", ({ frame }) => {
      setImageSrc(`data:image/jpeg;base64,${frame}`);
    });

    return () => {
      socket.off("video_frame");
    };
  }, []);

  return (
    <section className="video-section cameras-page">
      <div className="video-grid-col">
        <img className="video" id="video-1" src={imageSrc} alt="Video Stream 1" key="video-1" />
        <img className="video" id="video-2" src={imageSrc} alt="Video Stream 2" key="video-2" />
      </div>

      <div className="video-grid-col">
        <img className="video" id="video-3" src={imageSrc} alt="Video Stream 3" key="video-3" />
        <img className="video" id="video-4" src={imageSrc} alt="Video Stream 4" key="video-4" />
      </div>
    </section>
  );
}
