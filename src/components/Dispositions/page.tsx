/**
 * Dispositions Tab Component
 * 
 * This component displays disposition data through horizontal bar charts.
 * It shows the count of each disposition type and a breakdown by trial types.
 */

import { useMemo } from 'react';
import { Typography, Box } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { DispositionData } from '@/types';

interface DispositionsTabProps {
  data: DispositionData[];
}

const DispositionsTab = ({ data }: DispositionsTabProps) => {
  // Process data for the main chart
  const mainChartData = useMemo(() => {
    if (!data || data.length === 0) return { types: [], counts: [] };
    
    // Sort data by count in descending order
    const sortedData = [...data].sort((a, b) => b.count - a.count);
    
    return {
      types: sortedData.map(item => item.type),
      counts: sortedData.map(item => item.count)
    };
  }, [data]);

  // Process data for the trial type breakdown chart
  const breakdownChartData = useMemo(() => {
    if (!data || data.length === 0) return { types: [], bench: [], jury: [], none: [] };
    
    // Sort data by count in descending order
    const sortedData = [...data].sort((a, b) => b.count - a.count);
    
    return {
      types: sortedData.map(item => item.type),
      bench: sortedData.map(item => item.trialTypeBreakdown.bench),
      jury: sortedData.map(item => item.trialTypeBreakdown.jury),
      none: sortedData.map(item => item.trialTypeBreakdown.none)
    };
  }, [data]);

  // If no data, display a message
  if (!data || data.length === 0) {
    return (
      <div className="no-data">
        <Typography variant="body1">No disposition data available</Typography>
      </div>
    );
  }

  return (
    <div>
      {/* Secondary Chart: Trial Type Breakdown */}
      <div className="breakdown-section">
        <div className="chart-container">
          <BarChart
            layout="horizontal"
            yAxis={[{ 
              scaleType: 'band', 
              data: breakdownChartData.types,
              label: 'Disposition Type' 
            }]}
            xAxis={[{ 
              scaleType: 'linear',
              label: 'Count' 
            }]}
            series={[
              {
                data: breakdownChartData.bench,
                label: 'Bench',
                color: 'var(--primary-light)',
                stack: 'total',
                valueFormatter: (value) => `${value} cases`
              },
              {
                data: breakdownChartData.jury,
                label: 'Jury',
                color: 'var(--primary-main)',
                stack: 'total',
                valueFormatter: (value) => `${value} cases`
              },
              {
                data: breakdownChartData.none,
                label: 'None',
                color: 'var(--primary-dark)',
                stack: 'total',
                valueFormatter: (value) => `${value} cases`
              }
            ]}
            height={350}
            margin={{ top: 30, bottom: 30, left: 50, right: 50 }}
          />
        </div>
      </div>
    </div>
  );
};

export default DispositionsTab;