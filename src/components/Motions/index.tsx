/**
 * Motions Tab Component
 * 
 * This component displays motion data through horizontal bar charts.
 * It shows the count of each motion type and breakdowns by status and party filed.
 * Motion outcomes (Granted/Denied) are always visible regardless of filter states.
 * Note: "Other" outcome category has been intentionally hidden from visualization.
 */
import React, { useMemo, useState } from 'react';
import { Typography, Box } from '@mui/material';
import { MotionData, ViewMode } from '@/types';
import BarChartDisplay from '@/components/BarChartDisplay';

// Consistent colors for outcomes
const OUTCOME_COLORS = {
  GRANTED: '#38A169', // Green
  DENIED: '#E53E3E',  // Red
  COMPARATIVE: "#72d99d", // Light Green for comparative
};

// Priority motions to show initially
const PRIORITY_MOTIONS = [
  'dismiss',
  'suppress',
  'discovery',
  'bail',
  'dangerousness',
  'continue',
  'funds',
  'sequester'
];


interface MotionsTabProps {
  data: MotionData[];
  viewMode: ViewMode;
  partyFilter: string;
}

const MotionsTab = ({ data, viewMode, partyFilter }: MotionsTabProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Process data for the chart
  const motionsChartData = useMemo(() => {
    if (!data || data.length === 0) {
      return { labels: [], datasets: [] };
    }
    
    // Filter and order motions based on expansion state
    let orderedData = [...data];
    
    // Sort motions: priority motions first, in the specified order, then others alphabetically
    orderedData.sort((a, b) => {
      const aIndex = PRIORITY_MOTIONS.indexOf(a.type);
      const bIndex = PRIORITY_MOTIONS.indexOf(b.type);
      
      // If both are priority motions, sort by priority order
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      // If only a is priority, it comes first
      if (aIndex !== -1) return -1;
      // If only b is priority, it comes first
      if (bIndex !== -1) return 1;
      // Otherwise sort alphabetically
      return a.type.localeCompare(b.type);
    });
    
    // If not expanded, only show priority motions
    if (!isExpanded) {
      orderedData = orderedData.filter(motion => PRIORITY_MOTIONS.includes(motion.type));
    }
    
    const labels = orderedData.map(item => item.type);
    
    // Handle comparative view using the clearer structure
    if (viewMode === 'comparative') {
      if (partyFilter === "all") {
        // Show overall comparative data
        return {
          labels,
          datasets: [
            {
              label: 'Granted Ratio',
              data: orderedData.map(item => {
                const ratio = item.comparativeRatios?.overall ?? item.status.granted;
                return ratio === 0 ? null : ratio;
              }),
              backgroundColor: OUTCOME_COLORS.COMPARATIVE,
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
              data: orderedData.map(item => {
                const ratio = item.comparativeRatios?.prosecution ?? item.partyFiled.granted;
                return ratio === 0 ? null : ratio;
              }),
              backgroundColor: OUTCOME_COLORS.COMPARATIVE,
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
              data: orderedData.map(item => {
                const ratio = item.comparativeRatios?.defense ?? 
                  // Fallback calculation if the new structure isn't available
                  (item.status.granted - item.partyFiled.granted);
                return ratio === 0 ? null : ratio;
              }),
              backgroundColor: OUTCOME_COLORS.COMPARATIVE,
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
            data: orderedData.map(item => item.status.granted),
            backgroundColor: OUTCOME_COLORS.GRANTED,
            stack: 'stack1',          },
          {
            label: 'Denied',
            data: orderedData.map(item => item.status.denied),
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
            data: orderedData.map(item => item.partyFiled.granted),
            backgroundColor: OUTCOME_COLORS.GRANTED,
            stack: 'stack1',
          },
          {
            label: 'Denied',
            data: orderedData.map(item => item.partyFiled.denied),
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
            data: orderedData.map(item => item.status.granted - item.partyFiled.granted),
            backgroundColor: OUTCOME_COLORS.GRANTED,
            stack: 'stack1',
          },
          {
            label: 'Denied',
            data: orderedData.map(item => item.status.denied - item.partyFiled.denied),
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
  }, [data, viewMode, partyFilter, isExpanded]);

  // If no data, display a message
  if (!data || data.length === 0) {
    return (
      <Box className="no-data-container">
        <Typography variant="body1">No motion data available.</Typography>
      </Box>
    );
  }

  const hasMoreMotions = data.length > PRIORITY_MOTIONS.length;

  return (
    <div className="motions-container">
      <div className="chart-section">
        <BarChartDisplay 
          chartData={motionsChartData} 
          xAxisLabel={viewMode === 'comparative' ? 'Ratio of Motions Granted Relative to Average' : 'Number of Motions'}
          viewMode={viewMode}
          className={isExpanded ? 'expanded' : ''}
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

        {hasMoreMotions && (
          <div className="load-more-button-container">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MotionsTab;