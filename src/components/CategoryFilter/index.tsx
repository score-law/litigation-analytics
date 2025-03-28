/**
 * CategoryFilter Component
 * 
 * This component provides a dropdown filter for selecting specific categories in data visualizations.
 * It uses MUI Select with FormControl for a clean, accessible filtering interface.
 */
import React from 'react';
import { 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  SelectChangeEvent,
  Box
} from '@mui/material';

interface CategoryFilterProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: Array<{
    value: string;
    label: string;
  }>;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ value, onChange, label, options }) => {
  const handleChange = (event: SelectChangeEvent) => {
    onChange(event.target.value);
  };

  // Generate unique ID for the label
  const labelId = `${label.toLowerCase().replace(/\s+/g, '-')}-filter-label`;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', ml: 1, minWidth: 150 }}>
      <FormControl size="small" fullWidth>
        <InputLabel id={labelId}>Filter by {label}</InputLabel>
        <Select
          labelId={labelId}
          value={value}
          label={`Filter by ${label}`}
          onChange={handleChange}
          className="category-filter-select"
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default CategoryFilter;