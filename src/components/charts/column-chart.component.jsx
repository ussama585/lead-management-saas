import { Select } from '../ui/app-select.jsx';
import React, { useState } from 'react';
import Chart from './apex-chart.jsx';


const { Option } = Select;

const ColumnChart = ({
  title,
  data,              // Data object containing different categories
  categories,        // X-axis categories (e.g., months)
  colors,
  onCategoryChange,  // Callback to handle category changes
  initialCategory = 'Company Approached', // Default category
}) => {

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  const options = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 8, // Round the top of the bars
        endingShape: 'flat',
      },
    },
    xaxis: {
      categories: categories,
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
      },
    },
    colors: colors,
    grid: {
      borderColor: '#e0e0e0',
    },
  };

  const series = [
    {
      name: selectedCategory,
      data: data[selectedCategory.replace(/\s+/g, '').toLowerCase()] || [], // Dynamically load data based on selected category
    },
  ];


  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    onCategoryChange(value); // Call the parent component callback with the selected category
  };

  return (
    <div style={{ width: '100%', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)', border: '1px solid #e8e8e8' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#333' }}>{title}</h2>

        <Select
          defaultValue={selectedCategory}
          style={{ width: 200 }}
          onChange={handleCategoryChange}
        >
          <Option value="Company Approached">Company Approached</Option>
          <Option value="Company Signups">Company Signups</Option>
          <Option value="Job Post">Job Post</Option>
          <Option value="Hirings">Hirings</Option>
          <Option value="Applications">Applications</Option>
        </Select>
      </div>

      <Chart options={options} series={series} type="bar" height={350} />
    </div>
  );
};

export default ColumnChart;
