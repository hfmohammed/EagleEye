import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

import React from 'react';
import { Pie } from 'react-chartjs-2';
ChartJS.register(ArcElement, Tooltip, Legend);


function PieChartCard({ data }) {
  console.log("PPPPPPPPPPPPPPPP", data.datasets[0].data.length === 0)
  return (
    <div className="bg-white rounded-2xl shadow p-4 flex flex-col items-center">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Category Share</h2>
      <div className="h-[300px] w-full flex items-center justify-center">
        {data.datasets[0].data.length !== 0 && (
          <Pie data={data} />
        )}

        {data.datasets[0].data.length === 0 && (
          <div className='bg-red-200 py-2 px-3 rounded-full'>
            <p>No data to display</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PieChartCard;
