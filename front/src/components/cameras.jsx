"use client";

import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import Camera from "./Camera"; // Assuming the Camera component is in a separate file

const socket = io("http://localhost:5001");

export function Cameras() {
  const [streams, setStreams] = useState({
    video1: 0,
    video2: 0,
    video3: 0,
    video4: 0
  });

  useEffect(() => {
    socket.on("video_frame", ({ frame, streamId }) => {
      setStreams(prevStreams => ({
        ...prevStreams,
        [streamId]: `data:image/jpeg;base64,${frame}`
      }));
    });

    return () => {
      socket.off("video_frame");
    };
  }, []);

  return (
    <section className="video-section cameras-page">
      <div className="video-grid-col">
        <Camera streamId="video1" />
        <img className="video" id="video-2" src={streams.video2} alt="Video Stream 2" />
      </div>

      <div className="video-grid-col">
        <img className="video" id="video-3" src={streams.video3} alt="Video Stream 3" />
        <img className="video" id="video-4" src={streams.video4} alt="Video Stream 4" />
      </div>
    </section>
  );
}