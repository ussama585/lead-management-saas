import { Input } from './ui/app-controls.jsx';
import React, { useState, useEffect } from "react";
import { AutoComplete } from 'antd';
import { countriesNames } from "../pages/shared/utils/countries.js";

export default function CountryAutoSelect ({ name, value, onChange, errors }) {

  const countryList = countriesNames.map(country => country.value);
  
  const [options, setOptions] = useState([]);
  const handleSearch = (input) => {
    const filtered = countryList.filter((country) =>
      country.toLowerCase().includes(input.toLowerCase())
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
      placeholder="Select or type a country"
      filterOption={false} // manual filtering
      styles={{
              control: (baseStyles, state) => ({
                ...baseStyles,
                borderColor: errors.country ? "#f06548" : "#3e6a9f",
                padding: "0.35rem",
              }),
            }}
    >
      <Input />
    </AutoComplete>
  );
}
