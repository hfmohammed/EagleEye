import React, { useState, useContext, useEffect } from 'react';
import { DataContext } from '../context/DataContext';
import Camera from './camera';
import PieChartCard from './PieChartCard';
import LineChartCard from './LineChartCard';
import DetectionTable from './DetectionTable';
import { SettingsContext } from '../context/SettingsContext';
import BarChartCard from './BarChartCard';

function Main() {
  const { cameraData, updateData } = useContext(DataContext);
  const {selectedTab, setSelectedTab, enableAnnotationsRef } = useContext(SettingsContext);
  const [cameraIds, setCameraIds] = useState([]);

  useEffect(() => {
    console.log("djfkjlfj", Object.keys(cameraData));
    setCameraIds(Object.keys(cameraData))
  }, [cameraData])
  
  const activeData = cameraData[selectedTab] || {
    fpsData: [],
    latencyData: [],
    tableData: [],
    personCountData: [],
    category_counts: {},
  };

  const pieChartData = {
    labels: Object.keys(activeData.category_counts || {}),
    datasets: [{
      data: Object.values(activeData.category_counts || {}),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
    }],
  };

  const fpsLineChartData = {
    labels: activeData.fpsData.map((entry) => new Date(entry.time).toLocaleTimeString()),
    datasets: [{
      label: 'FPS Over Time',
      data: activeData.fpsData.map((entry) => entry.fps),
      borderColor: '#36A2EB',
      fill: false,
    }],
  };

  const latencyLineChartData = {
    labels: activeData.latencyData.map((entry) => new Date(entry.time).toLocaleTimeString()),
    datasets: [{
      label: 'Latency Over Time',
      data: activeData.latencyData.map((entry) => entry.latency),
      borderColor: '#36A2EB',
      fill: false,
    }],
  };

  console.log('activedata', activeData)

  const detectionsLineChartData = {
    labels: activeData.tableData.map((entry) => new Date(entry.timestamp).toLocaleTimeString()),
    datasets: [{
      label: 'Detections Over Time',
      data: activeData.tableData.map((entry) => entry.count),
      borderColor: '#36A2EB',
      fill: false,
    }],
  };

  const personCountLineChartData = {
    labels: activeData.personCountData.map((entry) => new Date(entry.time).toLocaleTimeString()),
    datasets: [{
      label: 'Detections Over Time',
      data: activeData.personCountData.map((entry) => entry.count),
      borderColor: '#36A2EB',
      fill: false,
    }],
  };

  const personCountBarChartData = {
    labels: activeData.personCountData.map((entry) => new Date(entry.time).toLocaleTimeString()),
    datasets: [{
      label: 'Person Count',
      data: activeData.personCountData.map((entry) => entry.count),
      backgroundColor: '#FF6384',
      borderColor: '#FF6384',
      borderWidth: 1,
    }],
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-6 transition-all flex flex-col gap-6">
      <div className='flex justify-between'>
        <div className="flex camera-data-controls">
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

        <div className={''}>
          <button
            className={`px-4 py-2 rounded hover:cursor-pointer hover:opacity-80 transition ${enableAnnotationsRef.current ? 'bg-purple-500' : 'bg-gray-500'} text-white`}
            onClick={() => {
              enableAnnotationsRef.current = !(enableAnnotationsRef.current);
              localStorage.setItem('enableAnnotationsRef', JSON.stringify(enableAnnotationsRef.current))
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

        <div className="w-full lg:w-1/2 flex flex-col gap-6 max-h-screen">
          <div className={'flex-1'}>
            <PieChartCard data={pieChartData} />
          </div>
          <div className={'flex-1'}>
            <LineChartCard data={fpsLineChartData} title="FPS over time" />
          </div>
        </div>
      </div>
      <div className={'flex flex-row gap-6 h-84'}>
        <LineChartCard data={latencyLineChartData} title="Latency over time" />
        <LineChartCard data={detectionsLineChartData} title="Detections over time" />
        <LineChartCard data={personCountLineChartData} title="Person Count over time" />
        <BarChartCard data={personCountBarChartData} title="Person Count over time" />
      </div>
      <DetectionTable rows={activeData.tableData} />
    </main>
  );
}

export default Main;
