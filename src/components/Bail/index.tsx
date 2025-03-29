/**
 * Bail Tab Component
 * 
 * This component displays bail decision data through horizontal bar charts.
 * It shows the count of each bail decision type and the average costs.
 */

import React, { useMemo } from 'react';
import { Typography, Box } from '@mui/material';
import { BailDecisionData, ViewMode } from '@/types';
import BarChartDisplay from '@/components/BarChartDisplay';

interface BailTabProps {
  data: BailDecisionData[];
  viewMode: ViewMode;
}

const BailTab = ({ data, viewMode }: BailTabProps) => {
  // Process data for the count chart
  const countChartData = useMemo(() => {
    if (!data || data.length === 0) {
      return { labels: [], datasets: [] };
    }
    
    // Create value formatter based on view mode
    const valueFormatter = (value: number | null) => {
      if (value === null) return '';
      
      if (viewMode === 'comparative') {
        const percent = Math.abs((value - 1) * 100).toFixed(0);
        return value > 1 
          ? `${percent}% above average` 
          : `${percent}% below average`;
      } else {
        return `${value} cases`;
      }
    };
    
    return {
      labels: data.map(item => item.type),
      datasets: [
        {
          data: data.map(item => item.count),
          label: 'Count',
          color: 'var(--accent-main)',
          valueFormatter
        }
      ]
    };
  }, [data, viewMode]);

  // If no data, display a message
  if (!data || data.length === 0) {
    return (
      <Box className="no-data-container">
        <Typography variant="body1">No bail decision data available.</Typography>
      </Box>
    );
  }

  return (
    <div className="bail-container">
      <div className="chart-section">
        <BarChartDisplay 
          chartData={countChartData} 
          xAxisLabel={viewMode === 'comparative' ? 'Relative to Average' : 'Count'}
          viewMode={viewMode}
        />
      </div>
    </div>
  );
};

export default BailTab;