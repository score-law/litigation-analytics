/**
 * Motions Tab Component
 * 
 * This component displays motion data through horizontal bar charts.
 * It shows the count of each motion type and breakdowns by status and party filed.
 * Motion outcomes (Granted/Denied/Other) are always visible regardless of toggle states.
 */
import React, { useMemo } from 'react';
import { Typography, Box } from '@mui/material';
import { MotionData, ViewMode } from '@/types';
import BarChartDisplay from '@/components/BarChartDisplay';

// Consistent colors for outcomes
const OUTCOME_COLORS = {
  GRANTED: '#38A169', // Green
  DENIED: '#E53E3E',  // Red
  OTHER: '#4A5568'    // Gray
};

interface MotionsTabProps {
  data: MotionData[];
  viewMode: ViewMode;
  partiesEnabled: boolean;
  typesEnabled: boolean;
}

const MotionsTab = ({ data, viewMode, partiesEnabled, typesEnabled }: MotionsTabProps) => {

  // Process data for the chart
  const partyFiledChartData = useMemo(() => {
    if (!data || data.length === 0) {
      return { labels: [], datasets: [] };
    }
    
    // Create value formatter based on view mode
    const valueFormatter = (value: number | null) => {
      if (value === null) return '';
      
      if (viewMode === 'comparative') {
        if (Math.abs(value - 1) < 0.05) return 'Average';
        
        // For comparative mode, we display how the percentage compares to average
        const percent = Math.abs((value - 1) * 100).toFixed(0);
        return value > 1
          ? `${percent}% above average`
          : `${percent}% below average`;
      } else {
        // For objective mode, we display the count
        return `${value} motions`;
      }
    };
    
    const datasets = [];
    let labels: string[] = [];

    // Sort data by count in descending order if types are enabled
    const sortedData = [...data].sort((a, b) => b.count - a.count);
    
    // Case 1: Both toggles disabled - Show aggregate with outcome breakdown
    if (!typesEnabled && !partiesEnabled) {
      // Aggregate all motion data
      const totalGranted = data.reduce((sum, item) => sum + item.status.granted, 0);
      const totalDenied = data.reduce((sum, item) => sum + item.status.denied, 0);
      const totalOther = data.reduce((sum, item) => sum + item.status.other, 0);
      
      labels = ['All Motions'];
      
      datasets.push({
        data: [totalGranted],
        label: 'Granted',
        valueFormatter,
        color: OUTCOME_COLORS.GRANTED
      });
      
      datasets.push({
        data: [totalDenied],
        label: 'Denied',
        valueFormatter,
        color: OUTCOME_COLORS.DENIED
      });
      
      datasets.push({
        data: [totalOther],
        label: 'Other',
        valueFormatter,
        color: OUTCOME_COLORS.OTHER
      });
    }
    
    // Case 2: Types enabled, parties disabled - Show each type with outcome breakdown
    else if (typesEnabled && !partiesEnabled) {
      labels = sortedData.map(item => item.type);
      
      datasets.push({
        data: sortedData.map(item => item.status.granted),
        label: 'Granted',
        stack: 'stack1',
        valueFormatter,
        color: OUTCOME_COLORS.GRANTED
      });
      
      datasets.push({
        data: sortedData.map(item => item.status.denied),
        label: 'Denied',
        stack: 'stack1',
        valueFormatter,
        color: OUTCOME_COLORS.DENIED
      });
      
      datasets.push({
        data: sortedData.map(item => item.status.other),
        label: 'Other',
        stack: 'stack1',
        valueFormatter,
        color: OUTCOME_COLORS.OTHER
      });
    }
    
    // Case 3: Types disabled, parties enabled - Show parties as categories with outcome breakdown
    else if (!typesEnabled && partiesEnabled) {
      // Set labels for prosecution and defense
      labels = ['Prosecution', 'Defense'];
      
      // Aggregate data for each party
      const prosecutionGranted = data.reduce((sum, item) => sum + item.partyFiled.granted, 0);
      const prosecutionDenied = data.reduce((sum, item) => sum + item.partyFiled.denied, 0);
      const prosecutionOther = data.reduce((sum, item) => sum + item.partyFiled.other, 0);
      
      // Use status data for defense (assuming status represents defense-filed motions)
      const defenseGranted = data.reduce((sum, item) => sum + item.status.granted, 0);
      const defenseDenied = data.reduce((sum, item) => sum + item.status.denied, 0);
      const defenseOther = data.reduce((sum, item) => sum + item.status.other, 0);
      
      // Create dataset for Granted outcomes
      datasets.push({
        data: [prosecutionGranted, defenseGranted],
        label: 'Granted',
        valueFormatter,
        color: OUTCOME_COLORS.GRANTED,
        stack: 'stack1' // Stack by category
      });
      
      // Create dataset for Denied outcomes
      datasets.push({
        data: [prosecutionDenied, defenseDenied],
        label: 'Denied',
        valueFormatter,
        color: OUTCOME_COLORS.DENIED,
        stack: 'stack1' // Stack by category
      });
      
      // Create dataset for Other outcomes
      datasets.push({
        data: [prosecutionOther, defenseOther],
        label: 'Other',
        valueFormatter,
        color: OUTCOME_COLORS.OTHER,
        stack: 'stack1' // Stack by category
      });
    }
    // Case 4: Both toggles enabled - Show each type and party with outcome breakdown
    else {
      // Implementation for both toggles enabled
      const typeLabels = sortedData.map(item => item.type);
      const allLabels: string[] = [];
      
      // Create combined labels for each type and party
      typeLabels.forEach(type => {
        allLabels.push(`${type} (Prosecution)`);
        allLabels.push(`${type} (Defense)`);
      });
      
      labels = allLabels;
      
      // Flatten the data for all combinations
      const grantedData: number[] = [];
      const deniedData: number[] = [];
      const otherData: number[] = [];
      
      sortedData.forEach(item => {
        // Add prosecution data
        grantedData.push(item.partyFiled.granted);
        deniedData.push(item.partyFiled.denied);
        otherData.push(item.partyFiled.other);
        
        // Add defense data
        grantedData.push(item.status.granted);
        deniedData.push(item.status.denied);
        otherData.push(item.status.other);
      });
      
      // Add datasets for each outcome
      datasets.push({
        data: grantedData,
        label: 'Granted',
        stack: 'stack1',
        valueFormatter,
        color: OUTCOME_COLORS.GRANTED
      });
      
      datasets.push({
        data: deniedData,
        label: 'Denied',
        stack: 'stack1',
        valueFormatter,
        color: OUTCOME_COLORS.DENIED
      });
      
      datasets.push({
        data: otherData,
        label: 'Other',
        stack: 'stack1',
        valueFormatter,
        color: OUTCOME_COLORS.OTHER
      });
    }
    
    return {
      labels,
      datasets
    };
  }, [data, viewMode, partiesEnabled, typesEnabled]);

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
          chartData={partyFiledChartData} 
          xAxisLabel={viewMode === 'comparative' ? 'Relative to Average' : 'Count'}
          viewMode={viewMode}
          margin={{ top: 30, bottom: 50, left: 120, right: 120 }}
        />
      </div>
    </div>
  );
};

export default MotionsTab;