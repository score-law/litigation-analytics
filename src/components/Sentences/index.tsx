/**
 * Sentences Tab Component
 * 
 * This component displays sentence data through horizontal bar charts.
 * It shows the percentage of each sentence type and the average days/costs.
 */
import { useMemo } from 'react';
import { Box } from '@mui/material';
import { SentenceData } from '@/types';
import { ViewMode } from '@/types';
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
  displayMode: string;
}

const SentencesTab = ({ data, viewMode, displayMode }: SentencesTabProps) => {
  // Create frequency formatter for percentage values
  const frequencyValueFormatter = (value: number | null) => {
    if (value === null) return '';
    
    // Find the matching data item using fuzzy matching
    const item = data.find(d => {
      if (viewMode === 'objective') {
        // In objective mode, directly match the percentage
        return Math.abs(d.percentage - value) < 0.01;
      } else {
        // In comparative mode, the value is transformed to (value - 1) * 100
        // We need to transform back: value/100 + 1
        const originalValue = value / 100 + 1;
        return Math.abs(d.percentage - originalValue) < 0.01;
      }
    });
    
    if (!item) return '';
    
    const count = item.count || 0;
    
    if (viewMode === 'comparative') {
      // In comparative mode, BarChartDisplay transforms values to percentage difference
      if (Math.abs(value) < 0.01) {
        return `Same as average | ${count.toLocaleString()} Sentences Found`;
      } else if (value > 0) {
        return `${Math.abs(value).toFixed(1)}% above average | ${count.toLocaleString()} Sentences Found`;
      } else {
        return `${Math.abs(value).toFixed(1)}% below average | ${count.toLocaleString()} Sentences Found`;
      }
    } else {
      return `${value.toFixed(1)}% | ${count.toLocaleString()} Sentences Found`;
    }
  };
  
  // Create formatter for monetary values (dollars)
  const dollarsValueFormatter = (value: number | null) => {
    if (value === null) return '';
    
    // Find the monetary item (Fine) with this value
    const item = data.find(d => {
      const isMonetary = d.type.toLowerCase().includes('fine');
      if (!isMonetary) return false;
      
      if (viewMode === 'objective') {
        return Math.abs(d.averageCost - value) < 0.01;
      } else {
        // In comparative mode, transform back: value/100 + 1
        const originalValue = value / 100 + 1;
        return Math.abs(d.averageCost - originalValue) < 0.01;
      }
    });
    
    if (!item) return '';
    
    const count = item.count || 0;
    
    if (viewMode === 'comparative') {
      if (Math.abs(value) < 0.01) {
        return `Same as average | ${count} Sentences Found`;
      } else if (value > 0) {
        return `${Math.abs(value).toFixed(1)}% above average | ${count} Sentences Found`;
      } else {
        return `${Math.abs(value).toFixed(1)}% below average | ${count} Sentences Found`;
      }
    } else {
      return `$${value.toFixed(0)} | ${count} Sentences Found`;
    }
  };
  
  // Create formatter for day values
  const daysValueFormatter = (value: number | null) => {
    if (value === null) return '';
    
    // Find the non-monetary item with this day value
    const item = data.find(d => {
      const isMonetary = d.type.toLowerCase().includes('fine');
      if (isMonetary) return false;
      
      if (viewMode === 'objective') {
        return Math.abs(d.averageDays - value) < 0.01;
      } else {
        // In comparative mode, transform back: value/100 + 1
        const originalValue = value / 100 + 1;
        return Math.abs(d.averageDays - originalValue) < 0.01;
      }
    });
    
    if (!item) return '';
    
    const count = item.count || 0;
    
    if (viewMode === 'comparative') {
      if (Math.abs(value) < 0.01) {
        return `Same as average | ${count} Sentences Found`;
      } else if (value > 0) {
        return `${Math.abs(value).toFixed(1)}% above average | ${count} Sentences Found`;
      } else {
        return `${Math.abs(value).toFixed(1)}% below average | ${count} Sentences Found`;
      }
    } else {
      return `${value.toFixed(0)} days | ${count} Sentences Found`;
    }
  };

  // Process data for the chart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return { labels: [], datasets: [] };
    }
    
    const labels = data.map(item => item.type);
    
    if (displayMode === 'frequency') {
      const chartValues = data.map(item => item.percentage);
      
      return {
        labels,
        datasets: [
          {
            data: chartValues,
            label: '',
            color: SENTENCE_TYPE_COLORS.FREQUENCY,
            backgroundColor: SENTENCE_TYPE_COLORS.FREQUENCY,
            valueFormatter: frequencyValueFormatter
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
      
      return {
        labels,
        datasets: [
          {
            data: dollarValues,
            label: 'Dollars',
            color: SENTENCE_TYPE_COLORS.DOLLARS,
            backgroundColor: SENTENCE_TYPE_COLORS.DOLLARS,
            stack: 'stack1',
            valueFormatter: dollarsValueFormatter
          },
          {
            data: dayValues,
            label: 'Days',
            backgroundColor: SENTENCE_TYPE_COLORS.DAYS,
            stack: 'stack1',
            valueFormatter: daysValueFormatter
          }
        ]
      };
    }
  }, [data, viewMode, displayMode]);

  // If no data, display a message
  if (!data || data.length === 0) {
    return (
      <Box className="no-data-container">
        No sentence data available.
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
                    baseBuffer: 0.8,
                    minBuffer: 0.1,
                    decayFactor: 0.5,
                    thresholdValue: 5,
                    safeguardMin: 0
                  }
                }
              : {
                  type: 'dynamic',
                  strategy: 'exponential',
                  parameters: {
                    baseBuffer: 0.6,
                    minBuffer: 0.1,
                    decayFactor: 0.4,
                    thresholdValue: 0.5,
                  }
                }
          }
        />
      </div>
    </div>
  );
};

export default SentencesTab;