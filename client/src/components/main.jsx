import React, { useContext } from 'react';
import Camera from './camera';
import PieChartCard from './PieChartCard';
import LineChartCard from './LineChartCard';
import DetectionTable from './DetectionTable';
import { DataContext } from '../context/DataContext';
import { SettingsContext } from '../context/SettingsContext';

// main.jsx or App.jsx
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  TimeScale,
  Title,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  TimeScale,
  Title
);


function Main() {
  const { data, updateData } = useContext(DataContext);
  const { _isCameraEnabled } = useContext(SettingsContext);

  const pieChartData = {
    labels: Object.keys(data.category_counts || {}),
    datasets: [{
      data: Object.values(data.category_counts || {}),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
    }],
  };

  const lineChartData = {
    labels: data.fpsData.map((entry) => new Date(entry.time).toLocaleTimeString()),
    datasets: [{
      label: 'FPS Over Time',
      data: data.fpsData.map((entry) => entry.fps),
      borderColor: '#36A2EB',
      fill: false,
    }],
  };

  return (
    <main className='min-h-screen bg-gray-100 p-6 overflow-hidden'>
      <div className='flex flex-row gap-6'>

        {/* {isCameraEnabled && ( */}
          <Camera onDataUpdate={updateData} />
        {/* )} */}

        <div className='flex flex-col gap-6 flex-1 max-h-screen overflow-hidden'>
          <PieChartCard data={pieChartData} />
          <LineChartCard data={lineChartData} />
        </div>
      </div>
      <DetectionTable rows={data.tableData} />
    </main>
  );
}

export default Main;
