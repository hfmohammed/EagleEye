import Camera from './camera'
import React, { useState } from 'react'
import { Pie, Line } from 'react-chartjs-2';
import { Table } from 'react-bootstrap';
import 'chart.js';

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
  const [data, setData] = useState({
    fpsData: [],
    tableData: [],
    category_counts: {},
  });

  const handleDataUpdate = (newData) => {
    const currentTime = new Date().getTime();

    setData((prevData) => ({
      ...prevData,
      fpsData: [...prevData.fpsData, { time: currentTime, fps: newData.fps }].filter(
        (entry) => currentTime - entry.time <= 60000 // Keep data from the last 1 minute
      ),
      tableData: [...prevData.tableData, { timestamp: newData.timestamp, count: newData.count }].filter(
        (entry) => currentTime - new Date(entry.timestamp).getTime() <= 60000 // Keep data from the last 1 minute
      ),
      category_counts: newData.category_counts,
    }));
  };

  const pieChartData = {
    labels: Object.keys(data?.category_counts || {}),
    datasets: [
      {
        data: Object.values(data?.category_counts || {}),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      },
    ],
  };

  const lineChartData = {
    labels: data?.fpsData?.map((entry) => new Date(entry.time).toLocaleTimeString()),
    datasets: [
      {
        label: 'FPS Over Time',
        data: data?.fpsData?.map((entry) => entry.fps),
        borderColor: '#36A2EB',
        fill: false,
      },
    ],
  };

  return (
    <>
      <main className="min-h-screen bg-gray-100 p-6 overflow-hidden">
        <div className="flex flex-row gap-6 flex flex-row">
          <Camera onDataUpdate={handleDataUpdate} />

          <div className="flex flex-col gap-6 flex-1 max-h-screen overflow-hidden">
            {/* Pie Chart */}
            <div className="bg-white rounded-2xl shadow p-4 flex flex-col center items-center">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Category Share</h2>
              <div className="h-[300px] w-full flex items-center justify-center">
                <Pie data={pieChartData} />
              </div>
            </div>

            {/* Line Chart */}
            <div className="bg-white rounded-2xl shadow p-4 flex-1 overflow-hidden flex flex-col center items-center">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">FPS Over Time</h2>
              <div className="h-full w-full flex items-center justify-center">
                <Line data={lineChartData} />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Detection Table</h2>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <Table striped bordered hover className="min-w-full text-sm text-left text-gray-500">
              <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                <tr>
                  <th scope="col" className="px-6 py-3">Timestamp</th>
                  <th scope="col" className="px-6 py-3">Number of Items</th>
                </tr>
              </thead>
              <tbody>
                {data?.tableData?.map((row, index) => (
                  <tr key={index} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4">{row.timestamp}</td>
                    <td className="px-6 py-4">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
      </main>

    </>
  )
}

export default Main;