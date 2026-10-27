import { Input } from './ui/app-controls.jsx';
import React, { useState, useEffect } from "react";
import { AutoComplete } from 'antd';
import { citiesNames } from "../pages/shared/utils/countries.js";

export default function CityAutoSelect ({ name, value, onChange }) {

  const cityList = citiesNames.map(city => city.value);
  
  const [options, setOptions] = useState([]);
  const handleSearch = (input) => {
    const filtered = cityList.filter((city) =>
      city.toLowerCase().includes(input.toLowerCase())
    );
    setOptions(filtered.map((c) => ({ value: c })));
  };

  useEffect(() => {
    handleSearch(value || '');
  }, [value]);

  return (
    <AutoComplete
      value={value}
      options={options}
      onSearch={handleSearch}
      onSelect={(val) => onChange(name, val)}
      onChange={(val) => onChange(name, val)}
      placeholder="Select or type a city"
      filterOption={false} // manual filtering
    >
      <Input />
    </AutoComplete>
  );
}
