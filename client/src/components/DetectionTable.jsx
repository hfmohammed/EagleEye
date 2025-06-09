import React from 'react';
import { Table } from 'react-bootstrap';

function DetectionTable({ rows }) {
  return (
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
            {rows.map((row, index) => (
              <tr key={index} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4">{row.timestamp}</td>
                <td className="px-6 py-4">{row.count}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}

export default DetectionTable;
