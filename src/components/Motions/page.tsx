/**
 * Motions Tab Component
 * 
 * This component displays motion data through horizontal bar charts.
 * It shows the count of each motion type and breakdowns by status and party filed.
 */

import { useMemo } from 'react';
import { Typography, Box } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { MotionData } from '@/types';

interface MotionsTabProps {
  data: MotionData[];
}

const MotionsTab = ({ data }: MotionsTabProps) => {
  // Process data for the main count chart
  const mainChartData = useMemo(() => {
    if (!data || data.length === 0) return { types: [], counts: [] };
    
    // Sort data by count in descending order
    const sortedData = [...data].sort((a, b) => b.count - a.count);
    
    return {
      types: sortedData.map(item => item.type),
      counts: sortedData.map(item => item.count)
    };
  }, [data]);

  // Process data for the status breakdown chart
  const statusChartData = useMemo(() => {
    if (!data || data.length === 0) return { types: [], granted: [], denied: [], other: [] };
    
    // Sort data by count in descending order
    const sortedData = [...data].sort((a, b) => b.count - a.count);
    
    return {
      types: sortedData.map(item => item.type),
      granted: sortedData.map(item => item.status.granted),
      denied: sortedData.map(item => item.status.denied),
      other: sortedData.map(item => item.status.other)
    };
  }, [data]);

  // Process data for the party filed breakdown chart
  const partyFiledChartData = useMemo(() => {
    if (!data || data.length === 0) return { types: [], granted: [], denied: [], other: [] };
    
    // Sort data by count in descending order
    const sortedData = [...data].sort((a, b) => b.count - a.count);
    
    return {
      types: sortedData.map(item => item.type),
      granted: sortedData.map(item => item.partyFiled.granted),
      denied: sortedData.map(item => item.partyFiled.denied),
      other: sortedData.map(item => item.partyFiled.other)
    };
  }, [data]);

  // If no data, display a message
  if (!data || data.length === 0) {
    return (
      <div className="no-data">
        <Typography variant="body1">No motion data available</Typography>
      </div>
    );
  }

  return (
    <div>

      {/* Secondary Chart: Status Breakdown */}
      <div className="breakdown-section">
        <div className="chart-container">
          <BarChart
            layout="horizontal"
            yAxis={[{ 
              scaleType: 'band', 
              data: statusChartData.types,
              label: 'Motion Type' 
            }]}
            xAxis={[{ 
              scaleType: 'linear',
              label: 'Count' 
            }]}
            series={[
              {
                data: statusChartData.granted,
                label: 'Granted',
                color: 'var(--success)',
                stack: 'total',
                valueFormatter: (value) => `${value} motions`
              },
              {
                data: statusChartData.denied,
                label: 'Denied',
                color: 'var(--error)',
                stack: 'total',
                valueFormatter: (value) => `${value} motions`
              },
              {
                data: statusChartData.other,
                label: 'Other',
                color: 'var(--neutral-light)',
                stack: 'total',
                valueFormatter: (value) => `${value} motions`
              }
            ]}
            height={350}
            margin={{ top: 30, bottom: 30, left: 50, right: 50 }}
          />
        </div>
      </div>

      {/* Tertiary Chart: Party Filed Breakdown */}
      <div className="breakdown-section">
        <div className="chart-container">
          <BarChart
            layout="horizontal"
            yAxis={[{ 
              scaleType: 'band', 
              data: partyFiledChartData.types,
              label: 'Motion Type' 
            }]}
            xAxis={[{ 
              scaleType: 'linear',
              label: 'Count' 
            }]}
            series={[
              {
                data: partyFiledChartData.granted,
                label: 'Granted',
                color: 'var(--success)',
                stack: 'total',
                valueFormatter: (value) => `${value} motions`
              },
              {
                data: partyFiledChartData.denied,
                label: 'Denied',
                color: 'var(--error)',
                stack: 'total',
                valueFormatter: (value) => `${value} motions`
              },
              {
                data: partyFiledChartData.other,
                label: 'Other',
                color: 'var(--neutral-light)',
                stack: 'total',
                valueFormatter: (value) => `${value} motions`
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

export default MotionsTab;