import React, { useRef, useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("https://dasboard-construction.onrender.com", {
  transports: ['websocket'],
  upgrade: false,
  withCredentials: true,
});

const Camera = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setIsStreaming(true);
          };
        }
      } catch (err) {
        console.error("Error accessing the camera: ", err);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    let intervalId;

    if (isStreaming) {
      intervalId = setInterval(() => {
        captureImage();
      }, 50);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      socket.disconnect();
    };
  }, [isStreaming]);

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const image = canvas.toDataURL("image/jpeg");
      socket.emit("frame", { image });
    }
  };

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline></video>
      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
      <p>{isStreaming ? "Streaming..." : "Initializing camera..."}</p>
    </div>
  );
};

export default Camera;
