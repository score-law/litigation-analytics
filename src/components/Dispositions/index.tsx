/**
 * Dispositions Tab Component
 * 
 * This component displays disposition data through horizontal bar charts.
 * It shows the count of each disposition type and a breakdown by trial types.
 */

import React, { useMemo } from 'react';
import { Typography, Box } from '@mui/material';
import { DispositionData, ViewMode } from '@/types';
import BarChartDisplay from '@/components/BarChartDisplay';

interface DispositionsTabProps {
  data: DispositionData[];
  viewMode: ViewMode;
  categoriesEnabled: boolean;
}

const DispositionsTab = ({ data, viewMode, categoriesEnabled }: DispositionsTabProps) => {

  // Process data for the trial type breakdown chart
  const breakdownChartData = useMemo(() => {
    if (!data || data.length === 0) {
      return { labels: [], datasets: [] };
    }

    // Sort data by count in descending order
    const sortedData = [...data].sort((a, b) => b.ratio - a.ratio);

    // Create value formatter based on view mode
    const valueFormatter = (value: number | null) => {
      if (value === null) return '';
      if (viewMode === 'comparative') {
        if (Math.abs(value - 1) < 0.05) return 'Average';
        const percent = Math.abs((value - 1) * 100).toFixed(0);
        return value > 1
          ? `${percent}% above average`
          : `${percent}% below average`;
      } else {
        return `${Math.abs((value) * 100).toFixed(0)}% of Total Cases`;
      }
    };

    // If categories are disabled, aggregate the trial type data
    if (!categoriesEnabled) {
      return {
        labels: sortedData.map((item) => item.type),
        datasets: [
          {
            data: sortedData.map((item) => 
              item.trialTypeBreakdown.jury + 
              item.trialTypeBreakdown.bench + 
              item.trialTypeBreakdown.none
            ),
            label: 'All Trials',
            valueFormatter,
          }
        ],
      };
    }

    // Categories are enabled, show breakdown by trial type
    return {
      labels: sortedData.map((item) => item.type),
      datasets: [
        {
          data: sortedData.map((item) => item.trialTypeBreakdown.jury),
          label: 'Jury Trial',
          // Conditionally stack only in objective mode
          stack: viewMode === 'comparative' ? undefined : 'stack1',
          valueFormatter,
        },
        {
          data: sortedData.map((item) => item.trialTypeBreakdown.bench),
          label: 'Bench Trial',
          stack: viewMode === 'comparative' ? undefined : 'stack1',
          valueFormatter,
        },
        {
          data: sortedData.map((item) => item.trialTypeBreakdown.none),
          label: 'No Trial',
          stack: viewMode === 'comparative' ? undefined : 'stack1',
          valueFormatter,
        },
      ],
    };
  }, [data, viewMode, categoriesEnabled]); // Added categoriesEnabled to dependencies

  // If no data, display a message
  if (!data || data.length === 0) {
    return (
      <Box className="no-data-container">
        <Typography variant="body1">No disposition data available.</Typography>
      </Box>
    );
  }

  return (
    <div className="dispositions-container">
      <div className="chart-section">
        <BarChartDisplay 
          chartData={breakdownChartData} 
          xAxisLabel={viewMode === 'comparative' ? 'Types Relative to Average' : 'Type Ratio'}
          viewMode={viewMode}
        />
      </div>
    </div>
  );
};

export default DispositionsTab;