/**
 * CategoryToggle Component
 * 
 * This component provides a toggle button for enabling/disabling specific data categories
 * in chart visualizations. It uses MUI ToggleButton with enhanced visual state indicators.
 */
import React from 'react';
import { ToggleButton, Box, Typography } from '@mui/material';

interface CategoryToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
}

const CategoryToggle: React.FC<CategoryToggleProps> = ({ enabled, onChange, label }) => {
  const handleClick = () => {
    onChange(!enabled);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
      <ToggleButton
        value="toggle"
        selected={enabled}
        onChange={handleClick}
        size="small"
        aria-label={`toggle ${label.toLowerCase()}`}
        className={`enhanced-category-toggle ${enabled ? 'active' : 'inactive'}`}
      >
        <span className="toggle-button-content">
          {label}
          {enabled && <span className="active-indicator"></span>}
        </span>
      </ToggleButton>
    </Box>
  );
};

export default CategoryToggle;