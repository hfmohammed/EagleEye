// Camera.js
import React, { useRef, useEffect } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5001"); // Connect to your backend

const Camera = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Error accessing the camera: ", err);
      }
    };

    startCamera();
  }, []);

  useEffect(() => {
    // Start capturing frames every 50 milliseconds
    const intervalId = setInterval(() => {
      captureImage();
    }, 50);

    // Cleanup function to clear the interval and disconnect the socket
    return () => {
      clearInterval(intervalId);
      socket.disconnect();
    };
  }, []);

  const captureImage = () => {
    console.log("Capturing image..."); // Debug log

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = canvas.toDataURL("image/jpeg");

    // Emit the captured image to the backend
    console.log("emitting..."); // Debug log
    socket.emit("frame", { image });
  };

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline></video>
      <button onClick={captureImage}>Capture Frame</button>
      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
    </div>
  );
};

export default Camera;
