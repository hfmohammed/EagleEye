import React, { createContext, useState } from 'react';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [data, setData] = useState({
    fpsData: [],
    tableData: [],
    category_counts: {},
  });

  const updateData = (newData) => {
    const currentTime = new Date().getTime();

    setData(( prevData ) => ({
      ...prevData,
      fpsData: [...prevData.fpsData, { time: currentTime, fps: newData.fps }].filter(
        (entry) => currentTime - entry.time <= 60000
      ),
      tableData: [...prevData.tableData, { timestamp: newData.timestamp, count: newData.count }].filter(
        (entry) => currentTime - new Date(entry.timestamp).getTime() <= 60000
      ),
      category_counts: newData.category_counts,
    }));
  };

  return (
    <DataContext.Provider value={{ data, updateData }}>
      { children }
    </DataContext.Provider>
  );
};
