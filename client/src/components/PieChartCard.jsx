import React from 'react';
import { Pie } from 'react-chartjs-2';

function PieChartCard({ data }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4 flex flex-col items-center">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Category Share</h2>
      <div className="h-[300px] w-full flex items-center justify-center">
        <Pie data={data} />
      </div>
    </div>
  );
}

export default PieChartCard;
