import React from 'react';
import { Line } from 'react-chartjs-2';

function LineChartCard({ data }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4 flex-1 overflow-hidden flex flex-col items-center">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">FPS Over Time</h2>
      <div className="h-full w-full flex items-center justify-center">
        <Line data={data} />
      </div>
    </div>
  );
}

export default LineChartCard;
