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
  displayMode: string; // Added displayMode prop
}

const SentencesTab = ({ data, viewMode, displayMode }: SentencesTabProps) => {
  // Process data for the chart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return { labels: [], datasets: [] };
    }
    
    let chartValues;
    let chartLabel;
    
    if (displayMode === 'frequency') {
      chartValues = data.map(item => item.percentage);
      chartLabel = 'Sentence Frequency';
    } else { // severity mode
      chartValues = data.map(item => {
        // Use the appropriate severity value based on sentence type
        const isMonetary = item.type.toLowerCase().includes('fine');
        return isMonetary ? item.averageCost : item.averageDays;
      });
      chartLabel = 'Sentence Severity';
    }

    // Create map of sentence types for lookup in valueFormatter
    const sentenceTypeMap: Record<number, string> = {};
    data.forEach((item, index) => {
      sentenceTypeMap[index] = item.type;
    });
    
    return {
      labels: data.map(item => item.type),
      datasets: [
        {
          data: chartValues,
          label: chartLabel,
          color: 'var(--accent-main)',
          valueFormatter: (value: number | null) => {
            if (value === null) return '';
            
            // Look up the sentence type based on the current data point
            const currentIndex = chartValues.indexOf(value);
            const sentenceType = sentenceTypeMap[currentIndex];
            const isMonetary = sentenceType?.toLowerCase().includes('fine');
            
            if (viewMode === 'comparative') {
              if (Math.abs(value - 1) < 0.05) return 'Average';
              const percent = Math.abs((value - 1) * 100).toFixed(0);
              return value > 1 
                ? `${percent}% above average` 
                : `${percent}% below average`;
            } else {
              // Format based on display mode and sentence type
              if (displayMode === 'frequency') {
                return `${value.toFixed(1)}%`;
              } else { // severity mode
                if (isMonetary) {
                  return `$${value.toFixed(0)}`;
                } else {
                  return `${value.toFixed(0)} days`;
                }
              }
            }
          }
        }
      ]
    };
  }, [data, viewMode, displayMode]);

  // Calculate xAxisLabel based on viewMode and displayMode
  // MOVED: This useMemo is now above the conditional return
  const xAxisLabel = useMemo(() => {
    if (viewMode === 'comparative') {
      return 'Relative to Average';
    } else {
      return displayMode === 'frequency' ? 'Percentage' : 'Average Duration/Cost';
    }
  }, [viewMode, displayMode]);

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
          chartData={chartData} 
          xAxisLabel={xAxisLabel}
          viewMode={viewMode}
        />
      </div>
    </div>
  );
};

export default SentencesTab;