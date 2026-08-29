import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useCGM } from '../../hooks/useCGM';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function DonutChart({ data }) {
  const { isDarkMode } = useCGM();
  
  const chartData = {
    labels: ['Very High', 'High', 'Target', 'Low', 'Very Low'],
    datasets: [{
      data: [data.vh, data.h, data.tir, data.low, data.vl],
      backgroundColor: ['#ef4444', '#f97316', '#22c55e', '#eab308', '#dc2626'],
      borderColor: isDarkMode ? '#111827' : '#ffffff',
      borderWidth: 3,
      hoverOffset: 7
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { 
        position: 'bottom', 
        labels: { 
          color: isDarkMode ? '#8ba3bc' : '#64748b', 
          font: { size: 11, family: 'DM Sans' }, 
          padding: 8, 
          boxWidth: 8 
        } 
      },
      tooltip: { 
        callbacks: { 
          label: c => ` ${c.label}: ${c.raw}%` 
        } 
      }
    }
  };

  return (
    <div className="chart-wrap">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
