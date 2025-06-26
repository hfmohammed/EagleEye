import React, { useState, useContext, useEffect } from 'react';
import { DataContext } from '../context/DataContext';
import Camera from './camera';
import PieChartCard from './PieChartCard';
import LineChartCard from './LineChartCard';
import DetectionTable from './DetectionTable';
import { SettingsContext } from '../context/SettingsContext';


function Main() {
  const { cameraData, updateData } = useContext(DataContext);
  const {selectedTab, setSelectedTab, enableAnnotations, setEnableAnnotations} = useContext(SettingsContext);
  const [cameraIds, setCameraIds] = useState([]);

  useEffect(() => {
    console.log("djfkjlfj", Object.keys(cameraData));
    setCameraIds(Object.keys(cameraData))
  }, [cameraData])
  
  const activeData = cameraData[selectedTab] || {
    fpsData: [],
    tableData: [],
    category_counts: {},
  };

  const pieChartData = {
    labels: Object.keys(activeData.category_counts || {}),
    datasets: [{
      data: Object.values(activeData.category_counts || {}),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
    }],
  };

  const lineChartData = {
    labels: activeData.fpsData.map((entry) => new Date(entry.time).toLocaleTimeString()),
    datasets: [{
      label: 'FPS Over Time',
      data: activeData.fpsData.map((entry) => entry.fps),
      borderColor: '#36A2EB',
      fill: false,
    }],
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-6 transition-all">
      <div className='flex justify-between'>
        <div className="mb-4 flex space-x-4 camera-data-controls">
          {cameraIds.map((id) => (
            <button
              key={id}
              onClick={() => setSelectedTab(id)}
              className={`px-4 py-2 rounded hover:cursor-pointer hover:opacity-80 transition ${selectedTab === id ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              {id}
            </button>
          ))}
        </div>

        <div className=''>
          <button
            className={`px-4 py-2 rounded hover:cursor-pointer hover:opacity-80 transition ${enableAnnotations ? 'bg-purple-500' : 'bg-gray-500'} text-white`}
            onClick={() => {
              setEnableAnnotations(!enableAnnotations) || localStorage.setItem('enableAnnotations', JSON.stringify(!enableAnnotations))
            }}
          >
            Annotate
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-1/2 flex">
          <Camera
            onDataUpdate={(data) => {
              const camId = data.camera_id ?? `camera ${data.index}`;
              console.log("Updating data for camera:", camId, data);
              updateData(camId, data);
            }}
          />
        </div>

        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          <PieChartCard data={pieChartData} />
          <LineChartCard data={lineChartData} />
        </div>
      </div>

      <DetectionTable rows={activeData.tableData} />
    </main>
  );
}

export default Main;
