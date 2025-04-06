// File: src/components/Bail/index.tsx
/**
 * Bail Tab Component
 * 
 * This component displays bail decision data through horizontal bar charts.
 * It shows the percentage of each bail decision type and the average costs.
 */

import React, { useMemo } from 'react';
import { Typography, Box } from '@mui/material';
import { BailDecisionData, ViewMode } from '@/types';
import BarChartDisplay from '@/components/BarChartDisplay';

// Consistent colors for bail types
const BAIL_TYPE_COLORS = {
  BLUE: '#ff926b', // Green
  CASH: '#f9f871',      // Blue
};

interface BailTabProps {
  data: BailDecisionData[];
  viewMode: ViewMode;
  displayMode: string; // Added displayMode prop
}

const BailTab = ({ data, viewMode, displayMode }: BailTabProps) => {
  // Process data for the chart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return { labels: [], datasets: [] };
    }
    
    const labels = data.map(item => item.type);
    
    if (displayMode === 'frequency') {
      const chartValues = data.map(item => item.percentage);
      const chartLabel = 'Bail Decision Frequency';
      
      return {
        labels,
        datasets: [
          {
            data: chartValues,
            label: chartLabel,
            backgroundColor: BAIL_TYPE_COLORS.BLUE, // Use a single color like in Sentences tab
            valueFormatter: (value: number | null) => {
              if (value === null) return '';
              
              if (viewMode === 'comparative') {
                const percent = Math.abs((value - 1) * 100).toFixed(0);
                return value > 1 
                  ? `${percent}% above average` 
                  : `${percent}% below average`;
              } else {
                return `${(value).toFixed(1)}%`;
              }
            }
          }
        ]
      };
    } else { // severity mode - only Cash Bail has costs
      const costValues = data.map(item => {
        return item.type === 'Cash Bail' ? item.averageCost : null;
      });
      
      return {
        labels,
        datasets: [
          {
            data: costValues,
            label: 'Average Cost',
            backgroundColor: BAIL_TYPE_COLORS.CASH,
            stack: 'stack1',
            valueFormatter: (value: number | null) => {
              if (value === null) return '';
              
              if (viewMode === 'comparative') {
                const percent = Math.abs((value - 1) * 100).toFixed(0);
                return value > 1 
                  ? `${percent}% above average` 
                  : `${percent}% below average`;
              } else {
                return `$${value.toFixed(2)}`;
              }
            }
          }
        ]
      };
    }
  }, [data, viewMode, displayMode]);

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
          chartData={chartData} 
          xAxisLabel={viewMode === 'comparative' ? (displayMode === 'frequency' ? 'Bail Decision Ratio Relative to Average' : 'Average Bail Cost Relative to Average') : (displayMode === 'frequency' ? 'Percent of Bail Decisions' : 'Average Bail Cost')}
          viewMode={viewMode}
          margin={{ top: 30, bottom: 50, left: 100, right: 50 }}
          domainConfig={
            viewMode === 'objective' 
              ? {
                  type: 'dynamic',
                  strategy: 'exponential',
                  parameters: {
                    baseBuffer: 0.8,    // 80% buffer for small values
                    minBuffer: 0.1,     // 10% minimum buffer for large values
                    decayFactor: 0.5,   // Moderate decay rate
                    thresholdValue: 5,  // Start reducing buffer at 5
                    safeguardMin: 0     // Ensure minimum is always 0
                  }
                }
              : {
                  type: 'dynamic',
                  strategy: 'exponential',
                  parameters: {
                    baseBuffer: 0.6,    // 60% buffer for small values
                    minBuffer: 0.1,     // 10% minimum buffer for large values
                    decayFactor: 0.4,   // Moderate decay rate
                    thresholdValue: 0.5, // Start reducing buffer at 0.5
                  }
                }
          }
        />
      </div>
    </div>
  );
};

export default BailTab;