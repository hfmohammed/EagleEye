// Updated context/DataContext.jsx to support multiple camera tabs
import React, { createContext, useState } from 'react';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [cameraData, setCameraData] = useState({});

  const updateData = (cameraId, newData) => {
    const currentTime = Date.now();
  
    setCameraData((prev) => {
      console.log("jfajfkakjf", prev)
      const prevCam = prev[cameraId] || {
        fpsData: [],
        tableData: [],
        category_counts: {},
      };
  
      return {
        ...prev,
        [cameraId]: {
          fpsData: [...prevCam.fpsData, { time: currentTime, fps: newData.fps }].filter(
            (e) => currentTime - e.time <= 60000
          ),
          tableData: [...prevCam.tableData, { timestamp: newData.timestamp, count: newData.count }].filter(
            (e) => currentTime - new Date(e.timestamp).getTime() <= 60000
          ),
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
