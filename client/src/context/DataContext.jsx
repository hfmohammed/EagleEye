// Updated context/DataContext.jsx to support multiple camera tabs
import React, { createContext, useState } from 'react';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [cameraData, setCameraData] = useState({});

  const updateData = (cameraId, newData) => {
<<<<<<< HEAD
    console.log("Full newData:", newData); // Add this debug line
    console.log("Latency2 value:", newData["latency"]); // Add this debug line
    console.log(newData.hasOwnProperty('latency'));

    const currentTime = Date.now();
  
    setCameraData((prev) => {
      const prevCam = prev[cameraId] || {
        fpsData: [],
        latencyData: [],
        tableData: [],
        category_counts: {},
        personCountData: [],
      };
      console.log("jfajfkakjf", newData.latency)
      console.log("jfajfkakjf", prevCam.fpsData)
      console.log("jfajfkakjf", prevCam.latencyData)
=======
    console.log("updatingdata")
    const currentTime = Date.now();
  
    setCameraData((prev) => {
      console.log("jfajfkakjf", prev)
      const prevCam = prev[cameraId] || {
        fpsData: [],
        tableData: [],
        category_counts: {},
      };
>>>>>>> origin/main
  
      return {
        ...prev,
        [cameraId]: {
          fpsData: [...prevCam.fpsData, { time: currentTime, fps: newData.fps }].filter(
            (e) => currentTime - e.time <= 60000
          ),
<<<<<<< HEAD
          latencyData: [...prevCam.latencyData, {time: currentTime, latency: newData.latency}].filter(
            (e) => currentTime - e.time <= 60000
          ),
          tableData: [...prevCam.tableData, { timestamp: newData.timestamp, count: newData.count }].filter(
            (e) => currentTime - new Date(e.timestamp).getTime() <= 60000
          ),
          personCountData: [...prevCam.personCountData, { time: currentTime, count: newData.category_counts.person }].filter(
            (e) => currentTime - e.time <= 60000
          ),
=======
          tableData: [...prevCam.tableData, { timestamp: newData.timestamp, count: newData.count }].filter(
            (e) => currentTime - new Date(e.timestamp).getTime() <= 60000
          ),
>>>>>>> origin/main
          category_counts: newData.category_counts,
        },
      };
    });
  };
  
  return (
    <DataContext.Provider value={{ cameraData, setCameraData, updateData }}>
      {children}
    </DataContext.Provider>
  );
};
