import React, { useState, useEffect } from 'react';
import { Pie, Line } from 'react-chartjs-2';
import { Table } from 'react-bootstrap';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
} from 'chart.js';

// Register required Chart.js components
ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement
);

const DataDisplay = ({ data }) => {
    const [categoryData, setCategoryData] = useState({});
    const [fpsData, setFpsData] = useState([]);
    const [tableData, setTableData] = useState([]);

    useEffect(() => {
        if (data) {
            setCategoryData(data.category_counts);
            setFpsData((prev) => [...prev, data.fps]);
            setTableData((prev) => [...prev, { timestamp: data.timestamp, count: data.count }]);
        }
    }, [data]);

    const pieChartData = {
        labels: Object.keys(categoryData),
        datasets: [
            {
                data: Object.values(categoryData),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
            },
        ],
    };

    const lineChartData = {
        labels: fpsData.map((_, index) => index),
        datasets: [
            {
                label: 'FPS Over Time',
                data: fpsData,
                borderColor: '#36A2EB',
                fill: false,
            },
        ],
    };

    return (
        <div>
            <h2>Category Share</h2>
            <Pie data={pieChartData} />

            <h2>FPS Over Time</h2>
            <Line data={lineChartData} />

            <h2>Detection Table</h2>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Timestamp</th>
                        <th>Number of Items</th>
                    </tr>
                </thead>
                <tbody>
                    {tableData.map((row, index) => (
                        <tr key={index}>
                            <td>{row.timestamp}</td>
                            <td>{row.count}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

export default DataDisplay;
