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

  // Process data for the chart
  const motionsChartData = useMemo(() => {
    if (!data || data.length === 0) {
      return { labels: [], datasets: [] };
    }
    
    const labels = data.map(item => item.type);
    
    // Handle comparative view using the clearer structure
    if (viewMode === 'comparative') {
      if (partyFilter === "all") {
        // Show overall comparative data
        return {
          labels,
          datasets: [
            {
              label: 'Granted Ratio',
              data: data.map(item => {
                const ratio = item.comparativeRatios?.overall ?? item.status.granted;
                return ratio === 0 ? null : ratio;
              }),
              backgroundColor: OUTCOME_COLORS.GRANTED,
            }
          ]
        };
      } 
      else if (partyFilter === "prosecution") {
        // Show prosecution-specific comparative data
        return {
          labels,
          datasets: [
            {
              label: 'Granted Ratio',
              data: data.map(item => {
                const ratio = item.comparativeRatios?.prosecution ?? item.partyFiled.granted;
                return ratio === 0 ? null : ratio;
              }),
              backgroundColor: OUTCOME_COLORS.GRANTED,
            }
          ]
        };
      }
      else if (partyFilter === "defense") {
        // Show defense-specific comparative data
        return {
          labels,
          datasets: [
            {
              label: 'Granted Ratio',
              data: data.map(item => {
                const ratio = item.comparativeRatios?.defense ?? 
                  // Fallback calculation if the new structure isn't available
                  (item.status.granted - item.partyFiled.granted);
                return ratio === 0 ? null : ratio;
              }),
              backgroundColor: OUTCOME_COLORS.GRANTED,
            }
          ]
        };
      }
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
            stack: 'stack1',          },
          {
            label: 'Denied',
            data: data.map(item => item.status.denied),
            backgroundColor: OUTCOME_COLORS.DENIED,
            stack: 'stack1',          }
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
          xAxisLabel={viewMode === 'comparative' ? 'Ratio of Motions Granted Relative to Average' : 'Number of Motions'}
          viewMode={viewMode}
          margin={{ top: 30, bottom: 50, left: 120, right: 120 }}
          domainConfig={
            viewMode === 'objective' 
              ? { type: 'auto' } // Keep fixed scale for objective
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

export default MotionsTab;