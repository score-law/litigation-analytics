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

  // Create a unified value formatter that handles both modes
  const valueFormatter = (value: number | null) => {
    if (value === null) return '';
    
    // Find the disposition item that matches this value
    // In BarChartDisplay, comparative values are transformed to (val - 1) * 100
    // We need to account for this transformation when matching
    const item = data.find(d => {
      if (trialTypeFilter === "all") {
        if (viewMode === 'objective') {
          // In objective mode, values are displayed as percentages (0-100)
          return Math.abs(d.ratio * 100 - value) < 0.01;
        } else {
          // In comparative mode, values are transformed to (val - 1) * 100
          // So we need to transform back: value/100 + 1
          const originalValue = value / 100 + 1;
          return Math.abs(d.ratio - originalValue) < 0.01;
        }
      } else {
        const key = trialTypeFilter === 'bench' ? 'bench' : (trialTypeFilter == 'jury' ? 'jury' : 'none');
        if (viewMode === 'objective') {
          return Math.abs(d.trialTypeBreakdown[key] * 100 - value) < 0.01;
        } else {
          // Transform back for comparative mode
          const originalValue = value / 100 + 1;
          return Math.abs(d.trialTypeBreakdown[key] - originalValue) < 0.01;
        }
      }
    });
    
    if (!item) return '';
    
    // Get the appropriate count based on trial type filter
    let count = item.count || 0;
    if (trialTypeFilter !== "all" && item.trialTypeCounts) {
      const key = trialTypeFilter === 'bench' ? 'bench' : (trialTypeFilter == 'jury' ? 'jury' : 'none');
      count = item.trialTypeCounts[key] || 0;
    }
    
    if (viewMode === 'comparative') {
      // In BarChartDisplay comparative mode:
      // - value > 0 means above average
      // - value < 0 means below average
      // - value is already transformed to percentage difference
      if (value === 0) {
        return `Same as average | ${count.toLocaleString()} total charges`;
      } else if (value > 0) {
        return `${Math.abs(value).toFixed(0)}% above average | ${count.toLocaleString()} total charges`;
      } else {
        return `${Math.abs(value).toFixed(0)}% below average | ${count.toLocaleString()} total charges`;
      }
    } else {
      return `${value.toFixed(0)}% of dispositions | ${count.toLocaleString()} total charges`;
    }
  };

  // Process data for the chart
  const breakdownChartData = useMemo(() => {
    if (!data || data.length === 0) {
      return { labels: [], datasets: [] };
    }

    // Create labels from disposition types
    const labels = data.map(item => item.type);
    
    let datasets = [];
    
    if (trialTypeFilter === "all") {
      // Show total ratios without breaking down by trial type
      datasets = [
        {
          label: '',
          data: viewMode === 'objective' ? data.map(item => item.ratio * 100) : data.map(item => item.ratio),
          backgroundColor: '#805AD5', // Purple for total values
          valueFormatter // Pass the valueFormatter directly
        }
      ];
    } else {
      // Filter to specific trial type
      let trialTypeKey: 'bench' | 'jury' | 'none';
      let color = '#e052b9';
      
      if (trialTypeFilter === 'bench') {
        trialTypeKey = 'bench';
        color = '#ff6491'; // Orange
      } else if (trialTypeFilter === 'jury') {
        trialTypeKey = 'jury';
        color = '#e052b9'; // pink
      } else if (trialTypeFilter === 'none') {
        trialTypeKey = 'none';
        color = '#e052b9'; // pink
      }
      
      datasets = [
        {
          label: '',
          data: viewMode === 'objective' ? 
                data.map(item => item.trialTypeBreakdown[trialTypeKey] * 100) : 
                data.map(item => item.trialTypeBreakdown[trialTypeKey]),
          backgroundColor: color,
          valueFormatter // Pass the valueFormatter directly
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
        xAxisLabel={viewMode === 'comparative' ? 'Disposition Rates Compared to Average' : 'Percentage of Total Charges'}
        viewMode={viewMode}
        margin={{ top: 20, bottom: 50, left: 150, right: 30 }}
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