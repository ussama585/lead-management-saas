import React, { useState, useEffect } from "react";
import { AutoComplete, Input } from "antd";
import { industryNames } from "../pages/shared/utils/countries.js";

export default function IndustryAutoSelect ({ name, value, onChange }) {

  const industryList = industryNames.map(industry => industry.value);
  
  const [options, setOptions] = useState([]);
  const handleSearch = (input) => {
    const filtered = industryList.filter((industry) =>
      industry.toLowerCase().includes(input.toLowerCase())
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
      placeholder="Select or type an industry"
      filterOption={false} // manual filtering
    >
      <Input />
    </AutoComplete>
  );
}
