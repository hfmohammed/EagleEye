import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import "../styles/dashboard.css";

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
} from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";
import Head from "next/head";

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
const socket = io("https://dasboard-construction.onrender.com");

const DashboardPage = () => {
  const [imageSrc, setImageSrc] = useState("");
  const [currentData, setCurrentData] = useState({});
  const [DATA, setDATA] = useState([]);
  const [uqCategories, setUqCategories] = useState([]);

  useEffect(() => {
    socket.on("video_frame", ({ frame, current_data, data, uqCategories }) => {
      setImageSrc(`data:image/jpeg;base64,${frame}`);
      setCurrentData(current_data);
      setDATA(data);
      setUqCategories(uqCategories);
    });

    return () => {
      socket.off("video_frame");
    };
  }, []);

  useEffect(() => {
    // Adjust canvas size to fit their containers
    const adjustCanvasSize = () => {
      const canvases = document.querySelectorAll(".plot canvas");
      canvases.forEach((canvas) => {
        const parent = canvas.parentElement;
        if (parent) {
          canvas.style.width = `${parent.clientWidth}px`;
          canvas.style.height = `${parent.clientHeight}px`;
        }
      });
    };

    adjustCanvasSize();

    window.addEventListener("resize", adjustCanvasSize);
    return () => window.removeEventListener("resize", adjustCanvasSize);
  }, []);

  // Prepare data for bar and pie charts
  const labels = Object.keys(currentData).filter((key) => key !== "Time" && key !== "Frame");
  const data = labels.map((label) => currentData[label]);

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
    // labels: frameNumbers,
    labels: frameNumbers.map((frameNumber) => DATA[frameNumber]['Time']),
    datasets: uqCategories
    .filter((category) => category !== "Time" && category !== "Frame")
    .map((category, index) => ({
      label: category,
      data: frameNumbers
        .map((frameNumber) => DATA[frameNumber][category] || 0),
      borderColor: `hsl(${(index * 360) / uqCategories.length}, 70%, 50%)`,
      backgroundColor: `hsla(${(index * 360) / uqCategories.length}, 70%, 80%, 0.2)`,
      fill: false,
    })),
  };

  return (
    <>
      <main className="dashboard-main">
        <section className="video-section dash-page-vedios">
          <div className="video-grid-col">
            <img className="video" id="video" src={imageSrc} alt="Video Stream" />
            <img className="video" id="video" src={imageSrc} alt="Video Stream" />
          </div>

          <div className="video-grid-col">
            <img className="video" id="video" src={imageSrc} alt="Video Stream" />
            <img className="video" id="video" src={imageSrc} alt="Video Stream" />
          </div>
        </section>

        <section className="data-section">
          <section className="data-subsection chart-section">
            <section className="plots-grid">
              <section className="plots-grid-row">
                <div className="plot single-chart">
                  <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </section>

              <section className="plots-grid-row">
                <div className="plot double-chart">
                  <Line data={lineChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
                <div className="plot double-chart">
                  <Pie data={pieChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </section>
            </section>
          </section>
          <section className="data-subsection tab-section">
            <Tabs>
              <TabList>
                <Tab>Current Data</Tab>
                <Tab>All Data</Tab>
              </TabList>

              <TabPanel>
                <table className="data-table">
                  <thead>
                    <tr>
                      {Object.keys(currentData).map((key) => (
                        <th key={key}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {Object.values(currentData).map((value, index) => (
                        <td key={index}>{value}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </TabPanel>
              <TabPanel>
                <table className="data-table">
                  <thead>
                    <tr>
                      {uqCategories.map((category) => (
                        <th key={category}>{category}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(DATA).map((frameNumber) => (
                      <tr key={frameNumber}>
                        <td>{frameNumber}</td>
                        {uqCategories.map((category) => (
                          category !== 'Frame' ? <td key={category}>{DATA[frameNumber][category] || 0}</td> : ''
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TabPanel>
            </Tabs>
          </section>
        </section>
      </main>
    </>
  );
};

export default DashboardPage;
