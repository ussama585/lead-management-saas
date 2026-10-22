import React from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { message } from 'antd';
import OverallExperienceFilter from './OverallExperienceFilter.jsx';
import ResumeFiltersHeader from './ResumeFiltersHeader.jsx';
import { AutocompleteFilterTagPill, ExperienceFilterPill } from './FilterPills.jsx';
import ResumeClearAllFiltersButton from './ResumeClearAllFiltersButton.jsx';
import { yearsInputToStoredMonths, storedMonthsToYearsDisplay } from '../utils/experienceFilterUnits.js';

const integerYearsInput = (value) => {
  const beforeDot = String(value ?? '').split('.')[0];
  return beforeDot.replace(/\D/g, '');
};

const CvFilters = ({
  filters,
  activeFilters,
  searchQuery,
  setSearchQuery,
  removeFilter,
  clearAllFilters,
  handleFilterChange,
  resetToFirstPage,
  overallExperienceOptions,
  debouncedSetGeneralFilter,
  debouncedSetCitiesSearchText,
  debouncedSetCountriesSearchText,
  debouncedSetCompaniesSearchText,
  debouncedSetLanguagesSearchText,
  debouncedSetUniversitiesSearchText,
  debouncedSetSkillsSearchText,
  debouncedSetDesignationsSearchText,
  citiesData,
  countriesData,
  companiesData,
  languagesData,
  universitiesData,
  skillsData,
  designationsData,
  loadingCities,
  loadingCountries,
  loadingCompanies,
  loadingLanguages,
  loadingUniversities,
  skillExpInput,
  setSkillExpInput,
  designationExpInput,
  setDesignationExpInput,
}) => {
  return (
    <Card className="resume-filters-card">
      <CardContent>
        <ResumeFiltersHeader />

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Autocomplete
              multiple
              size="small"
              clearOnBlur
              options={citiesData || []}
              value={filters.city}
              onChange={(event, newValue) => handleFilterChange('city', newValue)}
              onInputChange={(_event, value, reason) => {
                if (reason === 'input' || reason === 'clear') {
                  debouncedSetCitiesSearchText(value || '');
                }
              }}
              onClose={() => {
                debouncedSetCitiesSearchText('');
              }}
              filterOptions={(options) => options}
              renderInput={(params) => <TextField {...params} label="City" placeholder="Select cities..." />}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <AutocompleteFilterTagPill
                    key={`${String(option)}-${index}`}
                    label={option}
                    tagProps={getTagProps({ index })}
                  />
                ))
              }
              loading={loadingCities}
              loadingText="Loading cities..."
              noOptionsText="No cities found"
              className="rf-autocomplete"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Autocomplete
              multiple
              size="small"
              clearOnBlur
              options={countriesData || []}
              value={filters.country}
              onChange={(event, newValue) => handleFilterChange('country', newValue)}
              onInputChange={(_event, value, reason) => {
                if (reason === 'input' || reason === 'clear') debouncedSetCountriesSearchText(value || '');
              }}
              onClose={() => {
                debouncedSetCountriesSearchText('');
              }}
              filterOptions={(options) => options}
              renderInput={(params) => <TextField {...params} label="Country" placeholder="Select countries..." />}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <AutocompleteFilterTagPill
                    key={`${String(option)}-${index}`}
                    label={option}
                    tagProps={getTagProps({ index })}
                  />
                ))
              }
              loading={loadingCountries}
              loadingText="Loading countries..."
              noOptionsText="No countries found"
              className="rf-autocomplete"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Autocomplete
              multiple
              size="small"
              clearOnBlur
              options={['Middle School', 'High School', 'Intermediate', 'Bachelors', 'Masters', 'Doctorate']}
              value={filters.category}
              onChange={(event, newValue) => handleFilterChange('category', newValue)}
              renderInput={(params) => <TextField {...params} label="Education" placeholder="Select education levels..." />}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <AutocompleteFilterTagPill
                    key={`${String(option)}-${index}`}
                    label={option}
                    tagProps={getTagProps({ index })}
                  />
                ))
              }
              noOptionsText="No education levels found"
              className="rf-autocomplete"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Autocomplete
              size="small"
              clearOnBlur
              options={['Both', 'Male', 'Female']}
              value={filters.gender}
              onChange={(event, newValue) => handleFilterChange('gender', newValue || 'Both')}
              renderInput={(params) => <TextField {...params} label="Gender" placeholder="Select gender..." />}
              getOptionLabel={(option) => option}
              isOptionEqualToValue={(option, value) => option === value}
              className="rf-autocomplete"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Autocomplete
              multiple
              size="small"
              clearOnBlur
              options={companiesData || []}
              value={filters.company}
              onChange={(event, newValue) => handleFilterChange('company', newValue)}
              onInputChange={(_event, value, reason) => {
                if (reason === 'input' || reason === 'clear') debouncedSetCompaniesSearchText(value || '');
              }}
              onClose={() => {
                debouncedSetCompaniesSearchText('');
              }}
              filterOptions={(options) => options}
              renderInput={(params) => <TextField {...params} label="Company" placeholder="Select companies..." />}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <AutocompleteFilterTagPill
                    key={`${String(option)}-${index}`}
                    label={option}
                    tagProps={getTagProps({ index })}
                  />
                ))
              }
              loading={loadingCompanies}
              loadingText="Loading companies..."
              noOptionsText="No companies found"
              className="rf-autocomplete"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Autocomplete
              multiple
              size="small"
              clearOnBlur
              options={languagesData || []}
              value={filters.language}
              onChange={(event, newValue) => handleFilterChange('language', newValue)}
              onInputChange={(_event, value, reason) => {
                if (reason === 'input' || reason === 'clear') debouncedSetLanguagesSearchText(value || '');
              }}
              onClose={() => {
                debouncedSetLanguagesSearchText('');
              }}
              filterOptions={(options) => options}
              renderInput={(params) => <TextField {...params} label="Language" placeholder="Select languages..." />}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <AutocompleteFilterTagPill
                    key={`${String(option)}-${index}`}
                    label={option}
                    tagProps={getTagProps({ index })}
                  />
                ))
              }
              loading={loadingLanguages}
              loadingText="Loading languages..."
              noOptionsText="No languages found"
              className="rf-autocomplete"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Autocomplete
              multiple
              size="small"
              clearOnBlur
              options={universitiesData || []}
              value={filters.university}
              onChange={(event, newValue) => handleFilterChange('university', newValue)}
              onInputChange={(_event, value, reason) => {
                if (reason === 'input' || reason === 'clear') debouncedSetUniversitiesSearchText(value || '');
              }}
              onClose={() => {
                debouncedSetUniversitiesSearchText('');
              }}
              filterOptions={(options) => options}
              renderInput={(params) => <TextField {...params} label="University" placeholder="Select universities..." />}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <AutocompleteFilterTagPill
                    key={`${String(option)}-${index}`}
                    label={option}
                    tagProps={getTagProps({ index })}
                  />
                ))
              }
              loading={loadingUniversities}
              loadingText="Loading universities..."
              noOptionsText="No universities found"
              className="rf-autocomplete"
            />
          </Grid>

          <OverallExperienceFilter
            value={filters.overallExperience}
            mode={filters.overallExperienceMode}
            options={overallExperienceOptions}
            onExperienceChange={(nextValue) => handleFilterChange('overallExperience', nextValue)}
            onModeChange={(nextMode) => handleFilterChange('overallExperienceMode', nextMode)}
          />

          <Grid item xs={12} className="rf-section-spacing">
            <Box className="rf-stack-1">
              <Typography variant="body2" className="rf-label-title">
                Designation (Experience, years)
              </Typography>
              <Box className="resume-filter-row-inline rf-input-row">
                <Autocomplete
                  size="small"
                  clearOnBlur
                  options={designationsData || []}
                  value={designationExpInput.designation || null}
                  onInputChange={(_event, value, reason) => {
                    if (reason === 'input' || reason === 'clear') debouncedSetDesignationsSearchText(value || '');
                  }}
                  onClose={() => {
                    debouncedSetDesignationsSearchText('');
                  }}
                  onChange={(_event, newValue) => setDesignationExpInput((prev) => ({ ...prev, designation: newValue || null }))}
                  filterOptions={(options) => options}
                  renderInput={(params) => <TextField {...params} label="" placeholder="Search Designation..." />}
                  className="rf-autocomplete-inline"
                />
                <TextField
                  size="small"
                  type="number"
                  label=""
                  placeholder="Years"
                  value={designationExpInput.years}
                  onChange={(event) => {
                    setDesignationExpInput((prev) => ({ ...prev, years: integerYearsInput(event.target.value) }));
                  }}
                  inputProps={{ min: 0, step: 1 }}
                  className="rf-years-input"
                />
                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    if (!designationExpInput.designation) return;
                    const months = yearsInputToStoredMonths(designationExpInput.years);
                    const existingIndex = (filters.designationsExperience || []).findIndex((d) => d.designation.toLowerCase() === designationExpInput.designation.toLowerCase());
                    if (existingIndex !== -1) {
                      message.warning(`${designationExpInput.designation} is already added`);
                      return;
                    }
                    const next = [...(filters.designationsExperience || []), { designation: designationExpInput.designation, years: String(months) }];
                    handleFilterChange('designationsExperience', next);
                    setDesignationExpInput({ designation: '', years: '' });
                  }}
                  disabled={!designationExpInput.designation}
                  className="rf-add-btn"
                >
                  ADD
                </Button>
              </Box>
              {Array.isArray(filters.designationsExperience) && filters.designationsExperience.length > 0 && (
                <Grid container spacing={1} className="rf-chip-grid">
                  {filters.designationsExperience.map((item, index) => (
                    <ExperienceFilterPill
                      key={`${item.designation}-${index}`}
                      title={item.designation}
                      yearsDisplay={storedMonthsToYearsDisplay(item.years)}
                      onYearsChange={(e) => {
                        const months = yearsInputToStoredMonths(integerYearsInput(e.target.value));
                        const next = [...filters.designationsExperience];
                        next[index] = { ...next[index], years: String(months) };
                        handleFilterChange('designationsExperience', next);
                      }}
                      onRemove={() => {
                        const next = filters.designationsExperience.filter((_, i) => i !== index);
                        handleFilterChange('designationsExperience', next);
                      }}
                    />
                  ))}
                </Grid>
              )}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box className="rf-stack-1">
              <Typography variant="body2" className="rf-label-title">
                Experience (Per Skill, years)
              </Typography>
              <Box className="resume-filter-row-inline rf-input-row">
                <Autocomplete
                  size="small"
                  clearOnBlur
                  options={skillsData || []}
                  value={skillExpInput.skill || null}
                  onInputChange={(_event, value, reason) => {
                    if (reason === 'input' || reason === 'clear') debouncedSetSkillsSearchText(value || '');
                  }}
                  onClose={() => {
                    debouncedSetSkillsSearchText('');
                  }}
                  onChange={(_event, newValue) => setSkillExpInput((prev) => ({ ...prev, skill: newValue || null }))}
                  filterOptions={(options) => options}
                  renderInput={(params) => <TextField {...params} label="" placeholder="Search Skill..." />}
                  className="rf-autocomplete-inline"
                />
                <TextField
                  size="small"
                  type="number"
                  label=""
                  placeholder="Years"
                  value={skillExpInput.years}
                  onChange={(event) =>
                    setSkillExpInput((prev) => ({ ...prev, years: integerYearsInput(event.target.value) }))
                  }
                  inputProps={{ min: 0, step: 1 }}
                  className="rf-years-input"
                />
                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    if (!skillExpInput.skill) return;
                    const raw = skillExpInput.skill;
                    const skillLabel =
                      typeof raw === 'string'
                        ? raw.trim()
                        : String(raw?.label ?? raw?.name ?? raw ?? '').trim();
                    if (!skillLabel) return;
                    const months = yearsInputToStoredMonths(skillExpInput.years);
                    const existingIndex = (filters.skillsExperience || []).findIndex(
                      (s) => String(s.skill).toLowerCase() === skillLabel.toLowerCase()
                    );
                    if (existingIndex !== -1) {
                      message.warning(`${skillLabel} is already added`);
                      return;
                    }
                    const next = [...(filters.skillsExperience || []), { skill: skillLabel, years: String(months) }];
                    handleFilterChange('skillsExperience', next);
                    setSkillExpInput({ skill: '', years: '' });
                  }}
                  disabled={!skillExpInput.skill}
                  className="rf-add-btn"
                >
                  ADD
                </Button>
              </Box>
              {Array.isArray(filters.skillsExperience) && filters.skillsExperience.length > 0 && (
                <Grid container spacing={1} className="rf-chip-grid">
                  {filters.skillsExperience.map((item, index) => (
                    <ExperienceFilterPill
                      key={`${item.skill}-${index}`}
                      title={item.skill}
                      yearsDisplay={storedMonthsToYearsDisplay(item.years)}
                      onYearsChange={(e) => {
                        const months = yearsInputToStoredMonths(integerYearsInput(e.target.value));
                        const next = [...filters.skillsExperience];
                        next[index] = { ...next[index], years: String(months) };
                        handleFilterChange('skillsExperience', next);
                      }}
                      onRemove={() => {
                        const next = filters.skillsExperience.filter((_, i) => i !== index);
                        handleFilterChange('skillsExperience', next);
                      }}
                    />
                  ))}
                </Grid>
              )}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box className="rf-search-wrap">
              <Typography variant="body2" className="rf-search-label">
                Search
              </Typography>
              <Box className="resume-filter-row-inline rf-search-row">
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Search by name, email, phone, city or university"
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    resetToFirstPage();
                    setSearchQuery(value);
                    debouncedSetGeneralFilter(value);
                  }}
                  className="rf-search-input"
                />
                <Autocomplete
                  size="small"
                  clearOnBlur
                  options={[{ value: 'broad', label: 'Broad' }, { value: 'exact', label: 'Exact' }]}
                  value={filters.searchType === 'exact' ? { value: 'exact', label: 'Exact' } : { value: 'broad', label: 'Broad' }}
                  onChange={(_event, newValue) => handleFilterChange('searchType', newValue?.value || 'broad')}
                  isOptionEqualToValue={(option, value) => option.value === value?.value}
                  getOptionLabel={(option) => option.label}
                  renderInput={(params) => <TextField {...params} label="" placeholder="Search type" />}
                  disableClearable
                  className="rf-search-type"
                />
              </Box>
            </Box>
          </Grid>
        </Grid>

        {activeFilters.length > 0 && (
          <Box className="rf-active-filters-wrap">
            {/* Chips mirror every criterion sent to the CV list API (structured filters + search text + search type). */}
            <Typography variant="body2" className="rf-active-filters-label">
              Active filters:
            </Typography>
            {activeFilters.map((filter) => (
              <Chip
                key={filter.key}
                label={`${filter.label}: ${filter.value}`}
                onDelete={() => removeFilter(filter.key)}
                size="small"
                className="rf-active-filter-chip"
              />
            ))}
            <ResumeClearAllFiltersButton onClick={clearAllFilters} />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// P6: Only re-renders when its own props change (not on modal/download state changes in Resume).
export default React.memo(CvFilters);
