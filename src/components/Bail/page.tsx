/**
 * Bail Tab Component
 * 
 * This component displays bail decision data through horizontal bar charts.
 * It shows the count of each bail decision type and the average costs.
 */

import { useMemo } from 'react';
import { Typography, Box } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { BailDecisionData } from '@/types';

interface BailTabProps {
  data: BailDecisionData[];
}

const BailTab = ({ data }: BailTabProps) => {
  // Process data for the count chart
  const countChartData = useMemo(() => {
    if (!data || data.length === 0) return { types: [], counts: [] };
    
    // Sort data by count in descending order
    const sortedData = [...data].sort((a, b) => b.count - a.count);
    
    return {
      types: sortedData.map(item => item.type),
      counts: sortedData.map(item => item.count)
    };
  }, [data]);

  // Process data for the average cost chart
  const costChartData = useMemo(() => {
    if (!data || data.length === 0) return { types: [], costs: [] };
    
    // Sort data by average cost in descending order
    const sortedData = [...data].filter(item => item.averageCost > 0)
                                .sort((a, b) => b.averageCost - a.averageCost);
    
    return {
      types: sortedData.map(item => item.type),
      costs: sortedData.map(item => item.averageCost)
    };
  }, [data]);

  // If no data, display a message
  if (!data || data.length === 0) {
    return (
      <div className="no-data">
        <Typography variant="body1">No bail decision data available</Typography>
      </div>
    );
  }

  return (
    <div>
      <div className="chart-container">
        <BarChart
          layout="horizontal"
          yAxis={[{ 
            scaleType: 'band', 
            data: countChartData.types,
            label: 'Decision Type' 
          }]}
          xAxis={[{ 
            scaleType: 'linear',
            label: 'Count' 
          }]}
          series={[
            {
              data: countChartData.counts,
              label: 'Count',
              color: 'var(--accent-main)',
              valueFormatter: (value) => `${value} cases`
            }
          ]}
          height={350}
          margin={{ top: 30, bottom: 30, left: 50, right: 50 }}
        />
      </div>

      {/* Secondary Chart: Average Costs */}
      {costChartData.types.length > 0 && (
        <div className="breakdown-section">
          <div className="chart-container">
            <BarChart
              layout="horizontal"
              yAxis={[{ 
                scaleType: 'band', 
                data: costChartData.types,
                label: 'Decision Type' 
              }]}
              xAxis={[{ 
                scaleType: 'linear',
                label: 'Cost ($)' 
              }]}
              series={[
                {
                  data: costChartData.costs,
                  label: 'Average Cost',
                  color: 'var(--primary-main)',
                  valueFormatter: (value) => value !== null ? `$${value.toLocaleString()}` : '$0'
                }
              ]}
              height={350}
              margin={{ top: 30, bottom: 30, left: 50, right: 50 }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BailTab;