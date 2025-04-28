/**
 * Bail Tab Component
 * 
 * This component displays bail decision data through horizontal bar charts.
 * It shows the percentage of each bail decision type and the average costs.
 */
import { useMemo } from 'react';
import { BailDecisionData } from '@/types';
import { ViewMode } from '@/types';
import BarChartDisplay from '@/components/BarChartDisplay';

// Consistent colors for bail types
const BAIL_TYPE_COLORS = {
  BLUE: '#ff926b', // Green
  CASH: '#f9f871',      // Blue
};

interface BailTabProps {
  data: BailDecisionData[];
  viewMode: ViewMode;
  displayMode: string; // Added displayMode prop
}

const BailTab = ({ data, viewMode, displayMode }: BailTabProps) => {
  // Create formatter for bail percentage values
  const bailPercentageFormatter = (value: number | null, context?: { dataIndex?: number }) => {
    if (value === null || context?.dataIndex === undefined) return '';
    
    // Get the item directly using the dataIndex
    const item = data[context.dataIndex];
    
    if (!item) return '';
    
    const count = item.count || 0;
    
    if (viewMode === 'comparative') {
      // In comparative mode, BarChartDisplay transforms values to percentage difference
      if (Math.abs(value) < 0.01) {
        return `Same as average | ${count.toLocaleString()} Bail Decisions`;
      } else if (value > 0) {
        return `${value.toFixed(1)}% more than average | ${count.toLocaleString()} Bail Decisions`;
      } else {
        return `${Math.abs(value).toFixed(1)}% less than average | ${count.toLocaleString()} Bail Decisions`;
      }
    } else {
      return `${value.toFixed(1)}% | ${count.toLocaleString()} Bail Decisions`;
    }
  };

  // Replace the existing bailBucketFormatter function
  const bailBucketFormatter = (value: number | null, context?: { dataIndex?: number }) => {
    if (value === null || context?.dataIndex === undefined) return '';
    
    // Find the cash bail item to get the buckets
    const cashBailItem = data.find(item => item.type === 'Cash Bail');
    if (!cashBailItem || !cashBailItem.bailBuckets) return '';
    
    // Get the bucket directly using the dataIndex
    const bucket = cashBailItem.bailBuckets[context.dataIndex];
    
    if (!bucket) return '';
    
    if (viewMode === 'comparative') {
      if (Math.abs(value) < 0.01) {
        return `Same as average | ${bucket.count.toLocaleString()} Bail Decisions`;
      } else if (value > 0) {
        return `${value.toFixed(1)}% more than average | ${bucket.count.toLocaleString()} Bail Decisions`;
      } else {
        return `${Math.abs(value).toFixed(1)}% less than average | ${bucket.count.toLocaleString()} Bail Decisions`;
      }
    } else {
      // Handle potentially undefined percentage
      const percentage = bucket.percentage ?? 0;
      return `${percentage.toFixed(1)}% of bail costs | ${bucket.count.toLocaleString()} Bail Decisions`;
    }
  };

  // Update the chartData useMemo to handle the bucket data for severity mode
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return { labels: [], datasets: [] };
    }
    
    if (displayMode === 'frequency') {
      // Keep existing frequency display code
      const labels = data.map(item => item.type);
      const chartValues = data.map(item => item.percentage);
      
      return {
        labels,
        datasets: [
          {
            data: chartValues,
            label: '',
            color: BAIL_TYPE_COLORS.BLUE,
            backgroundColor: BAIL_TYPE_COLORS.BLUE,
            valueFormatter: bailPercentageFormatter
          }
        ]
      };
    } else { // severity mode
      // Find the Cash Bail item to get bucket data
      const cashBailItem = data.find(item => item.type === 'Cash Bail');
      
      // If no Cash Bail item or no bucket data, return empty chart
      if (!cashBailItem || !cashBailItem.bailBuckets || cashBailItem.bailBuckets.length === 0) {
        return { labels: [], datasets: [] };
      }
      
      // Extract bucket data for the chart
      const labels = cashBailItem.bailBuckets.map(bucket => bucket.amount);
      // Handle potentially undefined percentage values
      const chartValues = cashBailItem.bailBuckets.map(bucket => bucket.percentage ?? 0);
      
      return {
        labels,
        datasets: [
          {
            data: chartValues,
            label: '',
            color: BAIL_TYPE_COLORS.CASH,
            backgroundColor: BAIL_TYPE_COLORS.CASH,
            valueFormatter: bailBucketFormatter
          }
        ]
      };
    }
  }, [data, viewMode, displayMode]);

  // Update the BarChartDisplay component to use vertical layout for severity mode
  return (
    <div className="bail-container">
      <div className="chart-section">
        <BarChartDisplay
          chartData={chartData}
          layout={displayMode === 'severity' ? 'vertical' : 'horizontal'}
          xAxisLabel={
            viewMode === 'comparative'
              ? (displayMode === 'frequency' 
                  ? 'Bail Decision % Relative to Avg' 
                  : 'Bail Percentage Relative to Avg')
              : (displayMode === 'frequency' 
                  ? 'Percent of Cases' 
                  : 'Percent of Cash Bail Cases')
          }
          viewMode={viewMode}
          margin={
            displayMode === 'severity'
              ? { top: 5, bottom: 50, left: 60, right: 20 }
              : { top: 5, bottom: 50, left: 100, right: 20 }
          }
          domainConfig={
            viewMode === 'objective' 
            ? { type: 'fixed', min: 0, max: 100 } // Keep fixed scale for objective
            : {
              type: 'dynamic',
              strategy: 'exponential',
              parameters: {
                baseBuffer: 0.6,
                minBuffer: 0.1,
                decayFactor: 0.4,
                thresholdValue: 0.5,
              }
            }}
        />
      </div>
    </div>
  );
};

export default BailTab;