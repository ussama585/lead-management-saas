import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import ManualLocationInput, { ManualLocationListInput } from './manual-location-input.jsx';
import CountryInput from './select-country.jsx';
import CityInput from './select-city.jsx';

describe('manual city and country inputs', () => {
  it('renders a text field with existing values instead of a dropdown', () => {
    const markup = renderToStaticMarkup(<ManualLocationInput value="New city" placeholder="Select City" onChange={() => {}} options={[{ value: 'Other' }]} showSearch />);
    expect(markup).toContain('type="text"');
    expect(markup).toContain('value="New city"');
    expect(markup).toContain('placeholder="Enter City"');
    expect(markup).not.toContain('combobox');
    expect(markup).not.toContain('Other');
  });
  it.each([CountryInput, CityInput])('replaces legacy location autocomplete with a manual input', Component => {
    const markup = renderToStaticMarkup(<Component name="location" value="Custom location" onChange={() => {}} />);
    expect(markup).toContain('value="Custom location"');
    expect(markup).not.toContain('combobox');
  });
  it('keeps multiple filter locations visible as comma-separated text', () => {
    const markup = renderToStaticMarkup(<ManualLocationListInput value={['Lahore', 'Karachi']} onChange={() => {}} />);
    expect(markup).toContain('value="Lahore, Karachi"');
    expect(markup).not.toContain('combobox');
  });
});
