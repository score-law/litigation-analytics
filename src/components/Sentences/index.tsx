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

// Consistent colors for sentence types
const SENTENCE_TYPE_COLORS = {
  FREQUENCY: '#34dea9',    // Blue (lighter)
  DOLLARS: '#a0ef86', // Green
  DAYS: '#00c7c7', // Blue (darker)
};

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
    
    let chartLabel;
    const labels = data.map(item => item.type);
    
    if (displayMode === 'frequency') {
      const chartValues = data.map(item => item.percentage);
      chartLabel = 'Sentence Frequency';
      
      return {
        labels,
        datasets: [
          {
            data: chartValues,
            label: chartLabel,
            color: SENTENCE_TYPE_COLORS.FREQUENCY,
            backgroundColor: SENTENCE_TYPE_COLORS.FREQUENCY,
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
    } else { // severity mode
      // Create two separate datasets for dollars and days
      const dollarValues = data.map(item => {
        const isMonetary = item.type.toLowerCase().includes('fine');
        return isMonetary ? item.averageCost : null;
      });
      
      const dayValues = data.map(item => {
        const isMonetary = item.type.toLowerCase().includes('fine');
        return !isMonetary ? item.averageDays : null;
      });
      
      // Create map of sentence types for lookup in valueFormatter
      const sentenceTypeMap: Record<number, string> = {};
      data.forEach((item, index) => {
        sentenceTypeMap[index] = item.type;
      });
      
      return {
        labels,
        datasets: [
          {
            data: dollarValues,
            label: 'Dollars',
            color: SENTENCE_TYPE_COLORS.DOLLARS,
            backgroundColor: SENTENCE_TYPE_COLORS.DOLLARS,
            stack: 'stack1',
            valueFormatter: (value: number | null) => {
              if (value === null) return '';
              
              if (viewMode === 'comparative') {
                const percent = Math.abs((value - 1) * 100).toFixed(0);
                return value > 1 
                  ? `$${percent}% above average` 
                  : `${percent}% below average`;
              } else {
                return `$${value.toFixed(2)}`;
              }
            }
          },
          {
            data: dayValues,
            label: 'Days',
            backgroundColor: SENTENCE_TYPE_COLORS.DAYS, // Add backgroundColor property
            stack: 'stack1',
            valueFormatter: (value: number | null) => {
              if (value === null) return '';
              
              if (viewMode === 'comparative') {
                const percent = Math.abs((value - 1) * 100).toFixed(0);
                return value > 1 
                  ? `${percent}% above average` 
                  : `${percent}% below average`;
              } else {
                return `${value.toFixed(0)} days`;
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
        <Typography variant="body1">No sentence data available.</Typography>
      </Box>
    );
  }

  return (
    <div className="sentences-container">
      <div className="chart-section">
        <BarChartDisplay 
          chartData={chartData} 
          xAxisLabel={viewMode === 'comparative' ? (displayMode === 'frequency' ? 'Sentencing Ratio Relative to Average' : 'Average Sentence Days/Dollars Relative to Average') : (displayMode === 'frequency' ? 'Percent of Cases Sentenced' : 'Average Sentence Days/Dollars')}
          viewMode={viewMode}
          margin={{ top: 30, bottom: 50, left: 100, right: 50 }}
          preserveStackInComparative={true}
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

export default SentencesTab;