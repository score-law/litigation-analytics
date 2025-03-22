/**
 * ViewModeToggle Component
 * 
 * This component provides a toggle switch between objective and comparative data views.
 * It uses MUI ToggleButtonGroup for a clean, accessible UI element with enhanced visual feedback.
 */
import React from 'react';
import { ToggleButtonGroup, ToggleButton, Typography, Box } from '@mui/material';
import { ViewMode } from '@/types';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onChange: (newMode: ViewMode) => void;
}

const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ viewMode, onChange }) => {
  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: ViewMode | null
  ) => {
    // Prevent deselecting both options
    if (newMode !== null) {
      onChange(newMode);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <ToggleButtonGroup
        value={viewMode}
        exclusive
        onChange={handleChange}
        size="small"
        aria-label="data view mode"
        className="enhanced-toggle-group"
      >
        <ToggleButton 
          value="objective" 
          aria-label="objective view"
          className={`enhanced-toggle-button ${viewMode === 'objective' ? 'active' : ''}`}
        >
          <span className="toggle-button-content">
            Objective
            {viewMode === 'objective' && <span className="active-indicator"></span>}
          </span>
        </ToggleButton>
        <ToggleButton 
          value="comparative" 
          aria-label="comparative view"
          className={`enhanced-toggle-button ${viewMode === 'comparative' ? 'active' : ''}`}
        >
          <span className="toggle-button-content">
            Comparative
            {viewMode === 'comparative' && <span className="active-indicator"></span>}
          </span>
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default ViewModeToggle;