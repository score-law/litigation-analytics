/**
 * Sentences Tab Component
 * 
 * This component displays sentence data through horizontal bar charts.
 * It shows the percentage of each sentence type and the average days/costs.
 */

import { useMemo } from 'react';
import { Typography, Box } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { SentenceData } from '@/types';

interface SentencesTabProps {
  data: SentenceData[];
}

const SentencesTab = ({ data }: SentencesTabProps) => {
  // Process data for the percentage chart
  const percentageChartData = useMemo(() => {
    if (!data || data.length === 0) return { types: [], percentages: [] };
    
    // Sort data by percentage in descending order
    const sortedData = [...data].sort((a, b) => b.percentage - a.percentage);
    
    return {
      types: sortedData.map(item => item.type),
      percentages: sortedData.map(item => item.percentage)
    };
  }, [data]);

  // Process data for the average days chart
  const daysChartData = useMemo(() => {
    if (!data || data.length === 0) return { types: [], days: [] };
    
    // Sort data by average days in descending order
    const sortedData = [...data].sort((a, b) => b.averageDays - a.averageDays);
    
    return {
      types: sortedData.map(item => item.type),
      days: sortedData.map(item => item.averageDays)
    };
  }, [data]);

  // Process data for the average cost chart
  const costChartData = useMemo(() => {
    if (!data || data.length === 0) return { types: [], costs: [] };
    
    // Sort data by average cost in descending order
    const sortedData = [...data].sort((a, b) => b.averageCost - a.averageCost);
    
    return {
      types: sortedData.map(item => item.type),
      costs: sortedData.map(item => item.averageCost)
    };
  }, [data]);

  // If no data, display a message
  if (!data || data.length === 0) {
    return (
      <div className="no-data">
        <Typography variant="body1">No sentence data available</Typography>
      </div>
    );
  }

  return (
    <div>
      {/* Primary Chart: Sentence Types by Percentage */}
      <div className="chart-container">
        <BarChart
          layout="horizontal"
          yAxis={[{ 
            scaleType: 'band', 
            data: percentageChartData.types,
            label: 'Sentence Type' 
          }]}
          xAxis={[{ 
            scaleType: 'linear',
            label: 'Percentage (%)' 
          }]}
          series={[
            {
              data: percentageChartData.percentages,
              label: 'Percentage',
              color: 'var(--accent-main)',
              valueFormatter: (value) => `${value}%`
            }
          ]}
          height={350}
          margin={{ top: 30, bottom: 30, left: 50, right: 50 }}
        />
      </div>

      {/* Secondary Charts: Average Days and Costs */}
      <div className="breakdown-section">
        <div className="chart-container">
          <BarChart
            layout="horizontal"
            yAxis={[{ 
              scaleType: 'band', 
              data: daysChartData.types,
              label: 'Sentence Type' 
            }]}
            xAxis={[{ 
              scaleType: 'linear',
              label: 'Days' 
            }]}
            series={[
              {
                data: daysChartData.days,
                label: 'Average Days',
                color: 'var(--primary-main)',
                valueFormatter: (value) => `${value} days`
              }
            ]}
            height={350}
            margin={{ top: 30, bottom: 30, left: 50, right: 50 }}
          />
        </div>
      </div>

      <div className="breakdown-section">
        <div className="chart-container">
          <BarChart
            layout="horizontal"
            yAxis={[{ 
              scaleType: 'band', 
              data: costChartData.types,
              label: 'Sentence Type' 
            }]}
            xAxis={[{ 
              scaleType: 'linear',
              label: 'Cost ($)' 
            }]}
            series={[
              {
                data: costChartData.costs,
                label: 'Average Cost',
                color: 'var(--primary-dark)',
                valueFormatter: (value) => `$${(value ?? 0).toLocaleString()}`
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

export default SentencesTab;