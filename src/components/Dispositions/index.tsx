import React, { useMemo, useState } from 'react';
import { Typography, Box, Alert } from '@mui/material';
import { DispositionData, ViewMode } from '@/types';
import BarChartDisplay from '@/components/BarChartDisplay';

interface DispositionsTabProps {
  data: DispositionData[];
  viewMode: ViewMode;
  trialTypeFilter: string;
}

const DispositionsTab = ({ data, viewMode, trialTypeFilter }: DispositionsTabProps) => {

  // Create value formatter based on view mode
  const valueFormatter = (value: number | null, trialType?: string) => {
    if (value === null) return '';
    if (viewMode === 'comparative') {
      return value > 1
        ? `${Math.abs((value - 1)).toFixed(0)}% above average`
        : `${Math.abs((value - 1)).toFixed(0)}% below average`;
    } else {
      return `${(value).toFixed(0)}% of dispositions`;
    }
  };

  console.log('DispositionsTab data:', data);
  console.log('viewMode:', viewMode);
  console.log('trialTypeFilter:', trialTypeFilter);

  // Process data for the chart
  const breakdownChartData = useMemo(() => {
    if (!data || data.length === 0) {
      return { labels: [], datasets: [] };
    }

    // Create labels from disposition types
    const labels = data.map(item => item.type);
    console.log('Chart labels:', labels);
    
    let datasets = [];
    
    if (trialTypeFilter === "all") {
      // Show total ratios without breaking down by trial type
      datasets = [
        {
          label: 'Total',
          data: viewMode === 'objective' ? data.map(item => item.ratio * 100) : data.map(item => item.ratio),
          backgroundColor: '#805AD5', // Purple for total values
          valueFormatter: (value: number | null) => valueFormatter(value)
        }
      ];
    } else {
      // Filter to specific trial type
      let trialTypeKey: 'bench' | 'jury' | 'none' = 'none';
      let color = '#E53E3E'; // Default red for 'none'
      
      if (trialTypeFilter === 'bench') {
        trialTypeKey = 'bench';
        color = '#3182CE'; // Blue
      } else if (trialTypeFilter === 'jury') {
        trialTypeKey = 'jury';
        color = '#38A169'; // Green
      }
      
      datasets = [
        {
          label: trialTypeFilter === 'bench' ? 'Bench Trial' : 
                 trialTypeFilter === 'jury' ? 'Jury Trial' : 'No Trial',
          data: viewMode === 'objective' ? data.map(item => item.trialTypeBreakdown[trialTypeKey] * 100) : data.map(item => item.trialTypeBreakdown[trialTypeKey]),
          backgroundColor: color,
          valueFormatter: (value: number | null) => valueFormatter(value, trialTypeKey)
        }
      ];
    }
    
    return {
      labels,
      datasets
    };
  }, [data, viewMode, trialTypeFilter, valueFormatter]);

  // If no data, display a message
  if (!data || data.length === 0) {
    return (
      <Box sx={{ mt: 2, p: 2 }}>
        <Typography>No disposition data available for this selection.</Typography>
      </Box>
    );
  }

  return (
    <div className="disposition container">
      <div className="chart-section">
      <BarChartDisplay
        chartData={breakdownChartData}
        layout="horizontal"
        xAxisLabel={viewMode === 'comparative' ? 'Disposition Rates Compared to Average' : 'Percentage of Total Cases'}
        viewMode={viewMode}
        domainConfig={
          viewMode === 'objective' 
            ? { type: 'fixed', min: 0, max: 100 } // Keep fixed scale for objective
            : {
                type: 'dynamic',
                strategy: 'exponential',
                parameters: {
                  baseBuffer: 0.6,    // 70% buffer for small values
                  minBuffer: 0.1,     // 10% minimum buffer for large values
                  decayFactor: 0.4,   // Moderate decay rate
                  thresholdValue: 0.5, // Start reducing buffer at 0.5 (for comparative values)
                }
              }
        }
      />
      </div>
    </div>
  );
};

export default DispositionsTab;