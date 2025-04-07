/**
 * Bail Tab Component
 * 
 * This component displays bail decision data through horizontal bar charts.
 * It shows the percentage of each bail decision type and the average costs.
 */
import { useMemo } from 'react';
import { Box } from '@mui/material';
import { BailDecisionData } from '@/types';
import { ViewMode } from '@/types';
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
  // Create formatter for bail percentage values
  const bailPercentageFormatter = (value: number | null) => {
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
        return `Same as average | ${count.toLocaleString()} Bail Decisions`;
      } else if (value > 0) {
        return `${Math.abs(value).toFixed(1)}% above average | ${count.toLocaleString()} Bail Decisions`;
      } else {
        return `${Math.abs(value).toFixed(1)}% below average | ${count.toLocaleString()} Bail Decisions`;
      }
    } else {
      return `${value.toFixed(1)}% | ${count.toLocaleString()} Bail Decisions`;
    }
  };
  
  // Create formatter for bail cost values
  const bailCostFormatter = (value: number | null) => {
    if (value === null) return '';
    
    // Find the item with this cost value
    const item = data.find(d => {
      if (viewMode === 'objective') {
        // In objective mode, directly match the cost
        return Math.abs(d.averageCost - value) < 0.01;
      } else {
        // In comparative mode, the value is transformed to (value - 1) * 100
        // We need to transform back: value/100 + 1
        const originalValue = value / 100 + 1;
        return Math.abs(d.averageCost - originalValue) < 0.01;
      }
    });
    
    if (!item) return '';
    
    const count = item.count || 0;
    
    if (viewMode === 'comparative') {
      if (Math.abs(value) < 0.01) {
        return `Same as average | ${count.toLocaleString()} Bail Decisions`;
      } else if (value > 0) {
        return `${Math.abs(value).toFixed(1)}% above average | ${count.toLocaleString()} Bail Decisions`;
      } else {
        return `${Math.abs(value).toFixed(1)}% below average | ${count.toLocaleString()} Bail Decisions`;
      }
    } else {
      return `$${value.toFixed(0)} | ${count.toLocaleString()} Bail Decisions`;
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
            color: BAIL_TYPE_COLORS.BLUE,
            backgroundColor: BAIL_TYPE_COLORS.BLUE,
            valueFormatter: bailPercentageFormatter
          }
        ]
      };
    } else { // cost mode
      const chartValues = data.map(item => item.averageCost);
      
      return {
        labels,
        datasets: [
          {
            data: chartValues,
            label: '',
            color: BAIL_TYPE_COLORS.CASH,
            backgroundColor: BAIL_TYPE_COLORS.CASH,
            valueFormatter: bailCostFormatter
          }
        ]
      };
    }
  }, [data, viewMode, displayMode]);
  
  // If no data, display a message
  if (!data || data.length === 0) {
    return (
      <Box className="no-data-container">
        No bail decision data available.
      </Box>
    );
  }

  return (
    <div className="bail-container">
      <div className="chart-section">
        <BarChartDisplay
          chartData={chartData}
          xAxisLabel={viewMode === 'comparative' ? (displayMode === 'frequency' ? 'Bail Decision Ratio Relative to Average' : 'Average Bail Cost Relative to Average') : (displayMode === 'frequency' ? 'Percent of Cases' : 'Average Bail Cost')}
          viewMode={viewMode}
          margin={{ top: 30, bottom: 50, left: 100, right: 50 }}
          domainConfig={{
            type: 'dynamic',
            strategy: 'exponential',
            parameters: {
              baseBuffer: 0.6,
              minBuffer: 0.1,
              decayFactor: 0.4,
              thresholdValue: displayMode === 'frequency' ? 5 : 1000,
            }
          }}
        />
      </div>
    </div>
  );
};

export default BailTab;