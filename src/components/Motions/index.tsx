/**
 * Motions Tab Component
 * 
 * This component displays motion data through horizontal bar charts.
 * It shows the count of each motion type and breakdowns by status and party filed.
 * Motion outcomes (Granted/Denied) are always visible regardless of filter states.
 * Note: "Other" outcome category has been intentionally hidden from visualization.
 */
import React, { useMemo } from 'react';
import { Typography, Box } from '@mui/material';
import { MotionData, ViewMode } from '@/types';
import BarChartDisplay from '@/components/BarChartDisplay';

// Consistent colors for outcomes
const OUTCOME_COLORS = {
  GRANTED: '#38A169', // Green
  DENIED: '#E53E3E',  // Red
  // OTHER: '#4A5568'    // Gray - Intentionally hidden from visualization but preserved for future use
};

interface MotionsTabProps {
  data: MotionData[];
  viewMode: ViewMode;
  partyFilter: string;
}

const MotionsTab = ({ data, viewMode, partyFilter }: MotionsTabProps) => {

  // Create value formatter based on view mode
  const valueFormatter = (value: number | null) => {
    if (value === null) return '';
    
    if (viewMode === 'comparative') {
      if (Math.abs(value - 1) < 0.05)
        return 'Average';
      
      const percent = Math.abs((value - 1) * 100).toFixed(0);
      return value > 1
        ? `${percent}% above average`
        : `${percent}% below average`;
    } else {
      return value.toString();
    }
  };

  // Process data for the chart
  const motionsChartData = useMemo(() => {
    if (!data || data.length === 0) {
      return { labels: [], datasets: [] };
    }
    
    const labels = data.map(item => item.type);
    
    // Handle comparative view - only show granted ratio compared to average
    if (viewMode === 'comparative') {
      return {
        labels,
        datasets: [
          {
            label: 'Granted Ratio',
            data: data.map(item => item.status.granted),
            backgroundColor: OUTCOME_COLORS.GRANTED,
          }
        ]
      };
    }
    
    // Handle objective view with stacked bars
    if (partyFilter === "all") {
      // Show combined data with stacked bars
      return {
        labels,
        datasets: [
          {
            label: 'Granted',
            data: data.map(item => item.status.granted),
            backgroundColor: OUTCOME_COLORS.GRANTED,
            stack: 'stack1',  // Same stack name for all datasets
          },
          {
            label: 'Denied',
            data: data.map(item => item.status.denied),
            backgroundColor: OUTCOME_COLORS.DENIED,
            stack: 'stack1',  // Same stack name for all datasets
          }
          // "Other" category intentionally hidden from visualization but preserved for future use
        ]
      };
    } 
    else if (partyFilter === "prosecution") {
      // Show only prosecution data with stacked bars
      return {
        labels,
        datasets: [
          {
            label: 'Granted',
            data: data.map(item => item.partyFiled.granted),
            backgroundColor: OUTCOME_COLORS.GRANTED,
            stack: 'stack1',
          },
          {
            label: 'Denied',
            data: data.map(item => item.partyFiled.denied),
            backgroundColor: OUTCOME_COLORS.DENIED,
            stack: 'stack1',
          }
        ]
      };
    }
    else if (partyFilter === "defense") {
      // Show only defense data with stacked bars
      return {
        labels,
        datasets: [
          {
            label: 'Granted',
            data: data.map(item => item.status.granted - item.partyFiled.granted),
            backgroundColor: OUTCOME_COLORS.GRANTED,
            stack: 'stack1',
          },
          {
            label: 'Denied',
            data: data.map(item => item.status.denied - item.partyFiled.denied),
            backgroundColor: OUTCOME_COLORS.DENIED,
            stack: 'stack1',
          }
        ]
      };
    }
    
    // Default empty return if no filter matches
    return {
      labels,
      datasets: []
    };
  }, [data, viewMode, partyFilter]);

  // If no data, display a message
  if (!data || data.length === 0) {
    return (
      <Box className="no-data-container">
        <Typography variant="body1">No motion data available.</Typography>
      </Box>
    );
  }

  return (
    <div className="motions-container">
      <div className="chart-section">
        <BarChartDisplay 
          chartData={motionsChartData} 
          xAxisLabel={viewMode === 'comparative' ? 'Relative to Average' : 'Count'}
          viewMode={viewMode}
          margin={{ top: 30, bottom: 50, left: 120, right: 120 }}
        />
      </div>
    </div>
  );
};

export default MotionsTab;