import React, { useState } from 'react';
import Chart from './apex-chart.jsx';
import { Select } from 'antd';
import '../../assets/styles/legacy/line-chart.component.css';

const { Option } = Select;

const LineChart = ({
  title,
  data,        // Data will now contain keys like 'active', 'potential', etc.
  categories,  // X-axis categories (dates)
  legendNames, // Legend namesp
  colors,
  initialTimeFrame = 'week', // Default selected time frame
  onTimeFrameChange, // Callback to handle time frame changes
  addOrderByFilter = false,
  statsFilter,
  handleStatsFilterChange,
}) => {

  const [selectedTimeFrame, setSelectedTimeFrame] = useState(initialTimeFrame);


  const getMinMaxValues = () => {
    const allValues = legendNames.flatMap((name) =>
      data[
        name.toLowerCase().replace(/\s+/g, '_') === 'opportunities_lost'
          ? 'lost'
          : name.toLowerCase().replace(/\s+/g, '_')
      ] || []
    );
  
    const minValue = Math.min(...allValues, 0); // Default to 0 if no values
    const maxValue = Math.max(...allValues, 0); // Default to 0 if no values
  
    // If all values are 0, define a fallback range
    if (minValue === 0 && maxValue === 0) {
      return { min: 0, max: 5 };
    }
  
    return { min: minValue, max: maxValue };
  };
  
  

  const calculateYAxis = (tickAmount = 5, minTickAmount = 5) => {
    const { min, max } = getMinMaxValues();
    let adjustedMax = max === min ? max + 1 : max; // Add buffer if max === min
  
    const range = adjustedMax - min;
  
    // Ensure the interval is at least 1
    const rawInterval = Math.ceil(range / tickAmount);
    const interval = Math.max(rawInterval, 1);
  
    // Adjust min and max to be multiples of the interval
    const yAxisMin = Math.floor(min / interval) * interval;
    const yAxisMax = Math.ceil(adjustedMax / interval) * interval;
  
    // Ensure at least `minTickAmount` ticks
    const finalTickAmount = Math.max(
      Math.ceil((yAxisMax - yAxisMin) / interval),
      minTickAmount
    );
  
    return { yAxisMin, yAxisMax, interval, finalTickAmount };
  };
  
  
  

  
  const { yAxisMin, yAxisMax, finalTickAmount } = calculateYAxis(5); // 5 ticks by default

  const options = {
    chart: {
      type: 'line',
      zoom: { enabled: false },
      toolbar: { show: false },
    },
    stroke: {
      curve: 'straight',
      width: 2,
    },
    markers: {
      size: 0,
    },
    xaxis: {
      categories: categories, // Dates or X-axis labels
      labels: {
        style: {
          colors: '#B0B0B0',
          fontSize: '12px',
        },
        
      },
      axisBorder: {
        show: true,
        color: '#B0B0B0',
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#B0B0B0',
          fontSize: '12px',
        },

        formatter: (value) => (typeof value === 'number' && !isNaN(value) ? value.toFixed(0) : '-'),

      },
      tickAmount: 5,
      min: yAxisMin, // Set dynamically based on data
      max: yAxisMax, // Set dynamically based on data
    },
    legend: {
      position: 'top',
      labels: {
        colors: '#B0B0B0',
      },
      itemMargin: {
        horizontal: 10,
      },
    },
    grid: {
      borderColor: '#e0e0e0',
      row: {
        colors: ['#f5f5f5', 'transparent'],
        opacity: 0.5,
      },
    },
    colors: colors,
  };

  const series = legendNames.map((name, index) => ({
    name,
    data: data[
      name.toLowerCase().replace(/\s+/g, '_') === 'opportunities_lost'
        ? 'lost' // Handle the special case for "Opportunities Lost"
        : name.toLowerCase().replace(/\s+/g, '_')
    ] || [] // Fallback to an empty array if no data is available
  }));

  

  // Handle time frame change from the dropdown
  const handleTimeFrameChange = (value) => {
    setSelectedTimeFrame(value);

      onTimeFrameChange(value);
    

  };

  return (
    <div className="line-chart-container">
      <div className="line-chart-header">
        <h2 className="line-chart-title">{title}</h2>
        <div className="dropdown-section">

        <Select
          defaultValue={selectedTimeFrame}
          style={{ width: 200 }}
          onChange={handleTimeFrameChange}
        >
          <Option value="week">This Week</Option>
          <Option value="month">This Month</Option>
          <Option value="year">This Year</Option>
        </Select>


      { addOrderByFilter && 
      
          <Select defaultValue={statsFilter} style={{ width: 200 }} onChange={(value) => handleStatsFilterChange(value)}>
          <Option value="All">All</Option>
          <Option value="My Stats">My Stats</Option>
          <Option value="Executive Stats">Executive Stats</Option>
        </Select>
      }

        </div>
      </div>

      <Chart options={options} series={series} type="line" height={350} />
    </div>
  );
};

export default LineChart;
