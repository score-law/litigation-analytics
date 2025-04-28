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

// Motion types configuration with custom display names in priority order
const MOTION_TYPES_CONFIG = {
  'dismiss': 'Dismiss',
  'suppress': 'Suppress', 
  'discovery': 'Discovery',
  'probable cause': 'Probable Cause',
  'edit bail': 'Edit Bail',
  'dangerousness': 'Dangerousness (58a)',
  'continue': 'Continue',
  'new trial': 'New Trial',
  'RFNG': 'Req. Find Not Guilty',
  'impound': 'Impound',
  'reconsider': 'Reconsider',
  'revoke order': 'Revoke Order',
  'limine': 'Limine',
  'funds': 'Funds',
  'sequester': 'Sequester',
  'speedy': 'Speedy Trial',
  'bill of particulars': 'Bill of Particulars',
  'amend charge': 'Amend Charge',
  'protect': 'Protective',
  'uncharged conduct': 'Uncharged Conduct',
  'nolle prosequi': 'Nolle Prosequi',
  'withdraw': 'Withdraw',
  'obtain': 'Obtain',
  'travel': 'Travel',
  'virtual': 'Virtual',
  'record-seal': 'Record Seal',
  '': 'Other',
};

//enum('dismiss','probable cause','suppress','bill of particulars','discovery','speedy','new trial','RFNG','edit bail','dangerousness','amend charge','continue','impound','reconsider','revoke order','funds','protect','uncharged conduct','sequester','nolle prosequi','withdraw','obtain','travel','limine','virtual','record-seal','other')

/**
 * Ensures all standard motion types from configuration are included in the dataset,
 * adding empty entries with zero values for any missing motion types.
 */
const ensureAllMotionTypes = (motionData: MotionData[]): MotionData[] => {
  // Create a map of existing motion types
  const existingMotions = new Map<string, MotionData>();
  motionData.forEach(motion => {
    existingMotions.set(motion.type, motion);
  });
  
  // Create a complete list with all configured motion types
  const completeMotions: MotionData[] = [];
  
  // Add configured motion types first, creating empty ones if missing
  Object.keys(MOTION_TYPES_CONFIG).forEach(motionType => {
    if (existingMotions.has(motionType)) {
      completeMotions.push(existingMotions.get(motionType)!);
      existingMotions.delete(motionType);
    } else {
      // Create empty motion data for missing types
      completeMotions.push({
        type: motionType,
        count: 0,
        status: { granted: 0, denied: 0, other: 0 },
        prosecutionFiled: { granted: 0, denied: 0, other: 0 },
        defenseFiled: { granted: 0, denied: 0, other: 0 },
        comparativeRatios: { overall: 1, prosecution: 1, defense: 1 }, // Default to 1 (no difference)
      });
    }
  });
  
  // Add any remaining motions that weren't in the configuration
  existingMotions.forEach(motion => {
    completeMotions.push(motion);
  });
  
  return completeMotions;
};

interface MotionsTabProps {
  data: MotionData[];
  viewMode: ViewMode;
  partyFilter: string;
}

const MotionsTab = ({ data, viewMode, partyFilter }: MotionsTabProps) => {
  
  const [isExpanded, setIsExpanded] = useState(false);
  const initialDisplayCount = 8;

  // Ensure all standard motion types are present and sort
  const processedData = useMemo(() => {
    const ensuredData = ensureAllMotionTypes(data);
    // Sort based on the configuration order, keeping others at the end
    const motionOrder = Object.keys(MOTION_TYPES_CONFIG);
    return ensuredData.sort((a, b) => {
      const indexA = motionOrder.indexOf(a.type);
      const indexB = motionOrder.indexOf(b.type);
      if (indexA === -1 && indexB === -1) return 0; // Keep relative order of unknown types
      if (indexA === -1) return 1; // Unknown types go after known types
      if (indexB === -1) return -1; // Known types go before unknown types
      return indexA - indexB; // Sort known types by config order
    });
  }, [data]);

  // Apply expansion limit
  const displayData = useMemo(() => {
    return isExpanded ? processedData : processedData.slice(0, initialDisplayCount);
  }, [processedData, isExpanded, initialDisplayCount]);

  // Process data for the chart
  const motionsChartData = useMemo(() => {
    if (!displayData || displayData.length === 0) {
      return { labels: [], datasets: [] };
    }

    // Create labels from motion types using the config for display names
    const labels = displayData.map(item => MOTION_TYPES_CONFIG[item.type as keyof typeof MOTION_TYPES_CONFIG] || item.type);

    /**
     * Generates tooltip content based on view mode and data context.
     * Uses dataIndex provided by the chart context for accurate data lookup.
     * @param value - The raw value of the bar segment (count in objective, % diff in comparative).
     * @param context - Context object provided by MUI Charts, includes dataIndex.
     * @returns Formatted string for the tooltip.
     */
    const valueFormatter = (value: number | null, context?: { dataIndex?: number }) => {
      // Basic validation for value and context
      if (value === null || value === undefined || context?.dataIndex === undefined) return '';

      // Retrieve the corresponding motion data item using the dataIndex
      const item = displayData[context.dataIndex];
      if (!item) return ''; // Exit if data item not found

      // Objective mode: Show count and percentage of Granted/Denied for the filtered party
      if (viewMode === 'objective') {
        let grantedCount = 0;
        let deniedCount = 0;

        // Determine counts based on the party filter
        if (partyFilter === 'all') {
          grantedCount = item.status.granted;
          deniedCount = item.status.denied;
        } else if (partyFilter === 'prosecution') {
          grantedCount = item.prosecutionFiled.granted;
          deniedCount = item.prosecutionFiled.denied;
        } else if (partyFilter === 'defense') {
          grantedCount = item.defenseFiled.granted;
          deniedCount = item.defenseFiled.denied;
        }

        // Calculate total relevant motions for percentage calculation
        const total = grantedCount + deniedCount;
        // Calculate percentage; handle division by zero
        const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

        // Return formatted string: "Count motions | Percentage%"
        return `${value.toLocaleString()} motions | ${percentage}%`;
      }
      // Comparative mode: Show difference from average and total count
      else {
        // Retrieve the total count for this motion type
        const count = item.count || 0;
        let differenceText = '';

        // Format the percentage difference text
        if (Math.abs(value) < 1) { // Use a small threshold for "Same as average"
          differenceText = 'Same as average';
        } else if (value > 0) {
          differenceText = `${Math.abs(value).toFixed(0)}% above average`;
        } else { // value < 0
          differenceText = `${Math.abs(value).toFixed(0)}% below average`;
        }

        // Return formatted string: "Difference Text | Total Count motions filed"
        return `${differenceText} | ${count.toLocaleString()} motions filed`;
      }
    };


    let datasets = [];

    if (viewMode === 'objective') {
      // Objective view: Stacked bars for Granted/Denied based on party filter
      let grantedData: number[] = [];
      let deniedData: number[] = [];

      if (partyFilter === 'all') {
        grantedData = displayData.map(item => item.status.granted);
        deniedData = displayData.map(item => item.status.denied);
      } else if (partyFilter === 'prosecution') {
        grantedData = displayData.map(item => item.prosecutionFiled.granted);
        deniedData = displayData.map(item => item.prosecutionFiled.denied);
      } else { // partyFilter === 'defense'
        grantedData = displayData.map(item => item.defenseFiled.granted);
        deniedData = displayData.map(item => item.defenseFiled.denied);
      }

      datasets = [
        {
          label: 'Granted',
          data: grantedData,
          backgroundColor: OUTCOME_COLORS.GRANTED,
          stack: 'total', // Stack granted and denied
          valueFormatter: valueFormatter // Assign the formatter
        },
        {
          label: 'Denied',
          data: deniedData,
          backgroundColor: OUTCOME_COLORS.DENIED,
          stack: 'total', // Stack granted and denied
          valueFormatter: valueFormatter // Assign the formatter
        }
      ];
    } else {
      // Comparative view: Single bar showing % difference from average
      let comparativeData: number[] = [];

      if (partyFilter === 'all') {
        // Calculate percentage difference: (ratio - 1) * 100
        comparativeData = displayData.map(item => ((item.comparativeRatios?.overall ?? 1) - 1) * 100);
      } else if (partyFilter === 'prosecution') {
        comparativeData = displayData.map(item => ((item.comparativeRatios?.prosecution ?? 1) - 1) * 100);
      } else { // partyFilter === 'defense'
        comparativeData = displayData.map(item => ((item.comparativeRatios?.defense ?? 1) - 1) * 100);
      }

      datasets = [
        {
          label: 'Comparison to Average', // Label for the legend (optional)
          data: comparativeData,
          backgroundColor: OUTCOME_COLORS.COMPARATIVE, // Use a distinct color for comparative
          valueFormatter: valueFormatter // Assign the formatter
        }
      ];
    }

    return {
      labels,
      datasets
    };
  }, [displayData, viewMode, partyFilter]);

  // If no data, display a message
  if (!data || data.length === 0) {
    return (
      <Box className="no-data-container">
        <Typography variant="body1">No motion data available.</Typography>
      </Box>
    );
  }

  const hasMoreMotions = data.length > 8;

  return (
    <div className="motions-container">
      <div className="chart-section">
        <BarChartDisplay 
          chartData={motionsChartData} 
          xAxisLabel={viewMode === 'comparative' ? '% of Motions Granted Relative to Avg' : 'Number of Motions'}
          viewMode={viewMode}
          className={isExpanded ? 'expanded' : ''}
          margin={{ top: 30, bottom: 50, left: 140, right: 20 }}
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