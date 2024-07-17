import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import "./App.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
} from 'chart.js';
import { Bar, Pie, Line } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  PointElement
);

// Connect to the backend on port 5001
const socket = io("http://localhost:5001");

const App = () => {
  const [imageSrc, setImageSrc] = useState("");
  const [currentData, setCurrentData] = useState({});
  const [DATA, setDATA] = useState([]);
  const [uqCategories, setUqCategories] = useState([]);

  useEffect(() => {
    socket.on("video_frame", ({ frame, current_data, data, uqCategories}) => {
      console.log("_____DEBUG 102: Received current_data:", current_data);
      console.log("_____DEBUG 103: Received data:", data);
      console.log("_____DEBUG 104: Received data:", uqCategories);

      setImageSrc(`data:image/jpeg;base64,${frame}`);
      setCurrentData(current_data);
      setDATA(data);
      setUqCategories(uqCategories)
    });

    return () => {
      socket.off("video_frame");
    };
  }, []);

  // Prepare data for bar and pie charts
  const labels = Object.keys(currentData);
  const data = Object.values(currentData);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: "Object Counts",
        data: data,
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  const pieChartData = {
    labels: labels,
    datasets: [
      {
        label: "Object Counts",
        data: data,
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 159, 64, 0.6)",
        ],
      },
    ],
  };

  // Prepare data for line chart
  const frameNumbers = Object.keys(DATA);

  const lineChartData = {
    labels: frameNumbers,
    datasets: uqCategories.map((category, index) => ({
      label: category,
      data: frameNumbers.map(frameNumber => DATA[frameNumber][category] || 0), // Get count for each category
      borderColor: `hsl(${(index * 360) / uqCategories.length}, 70%, 50%)`, // Colors mapped to categories
      backgroundColor: `hsla(${(index * 360) / uqCategories.length}, 70%, 80%, 0.2)`,
      fill: false,
    })),
  };

  console.log("_____DEBUG 200: chartData:", chartData);
  console.log("_____DEBUG 201: pieChartData:", pieChartData);
  // console.log("_____DEBUG 202: lineChartData:", lineChartData);

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
        {chartData.labels.length > 0 && (
          <>
            <Bar data={chartData} options={{ responsive: true }} />
            <Pie data={pieChartData} options={{ responsive: true }} />
            <Line data={lineChartData} options={{ responsive: true }} />
          </>
        )}
        {/* <pre>{JSON.stringify(currentData, null, 2)}</pre>
        <pre>{JSON.stringify(DATA, null, 2)}</pre> */}
      </div>
    </div>
  );
};

export default App;
