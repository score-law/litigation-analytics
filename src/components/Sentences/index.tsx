/**
 * Sentences Tab Component
 * 
 * This component displays sentence data through horizontal bar charts.
 * It shows the percentage of each sentence type and the average days/costs.
 */

import React, { useMemo } from 'react';
import { Typography, Box } from '@mui/material';
import { SentenceData, ViewMode } from '@/types';
import BarChartDisplay from '@/components/BarChartDisplay';

interface SentencesTabProps {
  data: SentenceData[];
  viewMode: ViewMode;
}

const SentencesTab = ({ data, viewMode }: SentencesTabProps) => {
  // Process data for the percentage chart
  const percentageChartData = useMemo(() => {
    if (!data || data.length === 0) {
      return { labels: [], datasets: [] };
    }
    
    // Sort data by percentage in descending order
    const sortedData = [...data].sort((a, b) => b.percentage - a.percentage);
    
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
        return `${value.toFixed(0)}%`;
      }
    };
    
    return {
      labels: sortedData.map(item => item.type),
      datasets: [
        {
          data: sortedData.map(item => item.percentage),
          label: 'Sentence Frequency',
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
        <Typography variant="body1">No sentence data available.</Typography>
      </Box>
    );
  }

  return (
    <div className="sentences-container">
      <div className="chart-section">
        <BarChartDisplay 
          chartData={percentageChartData} 
          xAxisLabel={viewMode === 'comparative' ? 'Relative to Average' : 'Percentage'}
          viewMode={viewMode}
        />
      </div>
    </div>
  );
};

export default SentencesTab;