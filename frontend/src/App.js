import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import "./App.css";

// Connect to the backend on port 5001
const socket = io("http://localhost:5001");

const App = () => {
  const [imageSrc, setImageSrc] = useState("");
  const [currentData, setCurrentData] = useState([]);
  const [DATA, setDATA] = useState([]);

  useEffect(() => {
    socket.on("video_frame", ({ frame, current_data, DATA }) => {
      console.log("_____DEBUG 101: Received frame:", frame);
      console.log("_____DEBUG 102: Received current_data:", current_data);
      console.log("_____DEBUG 103: Received DATA:", DATA);

      setImageSrc(`data:image/jpeg;base64,${frame}`);
      setCurrentData(current_data);
      setDATA(DATA);
    });

    return () => {
      socket.off("video_frame");
    };
  }, []);

  return (
    <div className="App">
      <h1>CCTV Dashboard</h1>
      <div>
        <img
          src={imageSrc}
          alt="Video Stream"
          style={{ width: "100%", maxWidth: "800px" }}
        />
      </div>
      <div>
        <h2>Analysis Results</h2>
        <pre>{JSON.stringify(currentData, null, 2)}</pre>
        <pre>{JSON.stringify(DATA, null, 2)}</pre>
      </div>
    </div>
  );
};

export default App;
