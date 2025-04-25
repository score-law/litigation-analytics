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
  'bail': 'Revoke Bail (58b)',
  'dangerousness': 'Dangerousness (58a)',
  'continue': 'Continue',
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
  'third party records': 'Third Party Records',
  'virtual': 'Virtual',
  'record-seal': 'Record Seal',
  'record-medical': 'Record Medical',
  'record-criminal': 'Record Criminal',
  'other': 'Other',
};

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
        partyFiled: { granted: 0, denied: 0, other: 0 }
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

  // Create a unified value formatter that handles both modes
  const valueFormatter = (value: number | null) => {
    if (value === null || value === undefined) return '';
    
    // For objective mode (stacked bars)
    if (viewMode === 'objective') {
      // Since we're using stacked bars, we need to match the value with either granted or denied count
      // for the correct motion type based on the current dataset
      let matchingMotion = null;
      let isGranted = false;
      
      // Find the motion and determine if this is a granted or denied value
      for (const motion of data) {
        if (partyFilter === 'all' && (motion.status.granted === value || motion.status.denied === value)) {
          matchingMotion = motion;
          isGranted = motion.status.granted === value;
          break;
        } else if (partyFilter === 'prosecution' && (motion.partyFiled.granted === value || motion.partyFiled.denied === value)) {
          matchingMotion = motion;
          isGranted = motion.partyFiled.granted === value;
          break;
        } else if (partyFilter === 'defense') {
          const defenseGranted = motion.status.granted - motion.partyFiled.granted;
          const defenseDenied = motion.status.denied - motion.partyFiled.denied;
          if (defenseGranted === value || defenseDenied === value) {
            matchingMotion = motion;
            isGranted = defenseGranted === value;
            break;
          }
        }
      }
      
      if (!matchingMotion) return '';
      
      // Get the count and total based on party filter
      let count = 0;
      let total = 0;
      
      if (partyFilter === 'all') {
        count = isGranted ? matchingMotion.status.granted : matchingMotion.status.denied;
        total = matchingMotion.status.granted + matchingMotion.status.denied;
      } else if (partyFilter === 'prosecution') {
        count = isGranted ? matchingMotion.partyFiled.granted : matchingMotion.partyFiled.denied;
        total = matchingMotion.partyFiled.granted + matchingMotion.partyFiled.denied;
      } else if (partyFilter === 'defense') {
        const defenseGranted = matchingMotion.status.granted - matchingMotion.partyFiled.granted;
        const defenseDenied = matchingMotion.status.denied - matchingMotion.partyFiled.denied;
        count = isGranted ? defenseGranted : defenseDenied;
        total = defenseGranted + defenseDenied;
      }
      
      // Calculate percentage relative to total motions filed of this type with this party filter
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
      
      return `${count.toLocaleString()} motions | ${percentage}%`;
    } 
    // For comparative mode
    else {
      // In BarChartDisplay, comparative values are transformed to (val - 1) * 100
      // We need to convert back to original ratio: value/100 + 1
      const originalRatio = value / 100 + 1;
      
      // Find the motion with the closest matching ratio based on party filter
      const matchingMotion = data.find(motion => {
        if (!motion.comparativeRatios) return false;
        
        let motionRatio = 0;
        if (partyFilter === 'all') {
          motionRatio = motion.comparativeRatios.overall || 0;
        } else if (partyFilter === 'prosecution') {
          motionRatio = motion.comparativeRatios.prosecution || 0;
        } else if (partyFilter === 'defense') {
          motionRatio = motion.comparativeRatios.defense || 0;
        }
        
        // Use approximate matching with a small tolerance
        return Math.abs(motionRatio - originalRatio) < 0.01;
      });
      
      if (!matchingMotion) return '';
      
      // Format for comparative view (above/below average)
      if (Math.abs(value) < 1) {
        return `Same as average | ${matchingMotion.count.toLocaleString()} motions filed`;
      } else if (value > 0) {
        return `${Math.abs(value).toFixed(0)}% above average | ${matchingMotion.count.toLocaleString()} motions filed`;
      } else {
        return `${Math.abs(value).toFixed(0)}% below average | ${matchingMotion.count.toLocaleString()} motions filed`;
      }
    }
  };

  // Process data for the chart
  const motionsChartData = useMemo(() => {
    if (!data || data.length === 0) {
      return { labels: [], datasets: [] };
    }
    
    // Ensure all standard motion types are included
    const completeData = ensureAllMotionTypes(data);
    
    // Sort motions: configured motions first in config order, then others alphabetically
    const sortedData = completeData.sort((a, b) => {
      const aIndex = Object.keys(MOTION_TYPES_CONFIG).indexOf(a.type);
      const bIndex = Object.keys(MOTION_TYPES_CONFIG).indexOf(b.type);
      
      // If both are in the config, sort by config order
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      // If only a is in config, it comes first
      if (aIndex !== -1) return -1;
      // If only b is in config, it comes first
      if (bIndex !== -1) return 1;
      // Otherwise sort alphabetically
      return a.type.localeCompare(b.type);
    });
    
    // If not expanded, only show the first 8 motion types
    const orderedData = isExpanded ? sortedData : sortedData.slice(0, 8);
    
    // Use custom display names from configuration or capitalize first letter as fallback
    const labels = orderedData.map(item => {
      if (item.type in MOTION_TYPES_CONFIG) {
        return MOTION_TYPES_CONFIG[item.type as keyof typeof MOTION_TYPES_CONFIG];
      }
      return item.type.charAt(0).toUpperCase() + item.type.slice(1);
    });

    // Handle comparative view using the clearer structure
    if (viewMode === 'comparative') {
      return {
        labels,
        datasets: [
          {
            label: '',
            data: orderedData.map(item => {
              if (!item.comparativeRatios) return 0;
              
              if (partyFilter === 'all') {
                return item.comparativeRatios.overall || 0;
              } else if (partyFilter === 'prosecution') {
                return item.comparativeRatios.prosecution || 0;
              } else if (partyFilter === 'defense') {
                return item.comparativeRatios.defense || 0;
              }
              return 0;
            }),
            backgroundColor: OUTCOME_COLORS.COMPARATIVE,
            valueFormatter: valueFormatter,
          }
        ]
      };
    }
    
    // Handle objective view with stacked bars
    if (partyFilter === "all") {
      return {
        labels,
        datasets: [
          {
            label: 'Granted',
            data: orderedData.map(item => item.status.granted),
            backgroundColor: OUTCOME_COLORS.GRANTED,
            stack: 'stack1',
            valueFormatter: valueFormatter,
          },
          {
            label: 'Denied',
            data: orderedData.map(item => item.status.denied),
            backgroundColor: OUTCOME_COLORS.DENIED,
            stack: 'stack1',
            valueFormatter: valueFormatter,
          }
        ]
      };
    } 
    else if (partyFilter === "prosecution") {
      return {
        labels,
        datasets: [
          {
            label: 'Granted',
            data: orderedData.map(item => item.partyFiled.granted),
            backgroundColor: OUTCOME_COLORS.GRANTED,
            stack: 'stack1',
            valueFormatter: valueFormatter,
          },
          {
            label: 'Denied',
            data: orderedData.map(item => item.partyFiled.denied),
            backgroundColor: OUTCOME_COLORS.DENIED,
            stack: 'stack1',
            valueFormatter: valueFormatter,
          }
        ]
      };
    }
    else if (partyFilter === "defense") {
      return {
        labels,
        datasets: [
          {
            label: 'Granted',
            data: orderedData.map(item => {
              const defenseGranted = item.status.granted - item.partyFiled.granted;
              return defenseGranted > 0 ? defenseGranted : 0;
            }),
            backgroundColor: OUTCOME_COLORS.GRANTED,
            stack: 'stack1',
            valueFormatter: valueFormatter,
          },
          {
            label: 'Denied',
            data: orderedData.map(item => {
              const defenseDenied = item.status.denied - item.partyFiled.denied;
              return defenseDenied > 0 ? defenseDenied : 0;
            }),
            backgroundColor: OUTCOME_COLORS.DENIED,
            stack: 'stack1',
            valueFormatter: valueFormatter,
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

  const hasMoreMotions = data.length > 8;

  return (
    <div className="motions-container">
      <div className="chart-section">
        <BarChartDisplay 
          chartData={motionsChartData} 
          xAxisLabel={viewMode === 'comparative' ? 'Ratio of Motions Granted Relative to Average' : 'Number of Motions'}
          viewMode={viewMode}
          className={isExpanded ? 'expanded' : ''}
          margin={{ top: 30, bottom: 50, left: 150, right: 80 }}
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