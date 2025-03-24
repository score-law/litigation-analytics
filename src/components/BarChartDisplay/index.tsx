/**
 * Standardized Bar Chart Display Component
 *
 * This component provides a standardized way to render horizontal bar charts across
 * the application. It wraps MUI's BarChart with consistent styling and configuration
 * while allowing for flexible data input and customization.
 */
'use client'
import { BarChart } from '@mui/x-charts/BarChart';
import { useRef, useEffect } from 'react';
import './styles.scss';

// Consistent color palette for better visual distinction between datasets
const CHART_COLORS = [
  '#3182CE', // blue
  '#E53E3E', // red
  '#38A169', // green
  '#805AD5', // purple
  '#DD6B20', // orange
  '#319795', // teal
  '#D69E2E', // yellow
  '#4A5568', // gray
  '#B83280', // pink
  '#2C5282', // dark blue
  '#9B2C2C', // dark red
  '#276749'  // dark green
];

/* Removed the COMPARATIVE_COLORS object */

// Interface definitions for the component props
interface BarChartDisplayProps {
    chartData: {
      labels: string[];
      datasets: Array<{
        data: number[];
        label: string;
        color?: string;
        stack?: string;
        valueFormatter?: (value: number | null) => string;
        highlightScope?: { highlighted: string; faded: string };
      }>;
    };
    layout?: 'horizontal' | 'vertical';
    xAxisLabel?: string;
    viewMode?: 'objective' | 'comparative';
    margin?: { top: number; bottom: number; left: number; right: number };
    className?: string;
}

// Create a custom value formatter for comparative mode
const createComparativeFormatter = () => {
  return (transformedValue: number | null) => {
    if (transformedValue === null || transformedValue === undefined) return '';

    // Recalculate the actual value before transformation
    const actualValue = transformedValue + 1;
    const percent = Math.abs((actualValue - 1) * 100).toFixed(0);
    const direction = actualValue >= 1 ? 'above' : 'below';

    if (Math.abs(actualValue - 1) < 0.05) {
      return 'Average';
    }
    return `${percent}% ${direction} average`;
  };
};

const BarChartDisplay = ({
  chartData,
  layout = 'horizontal',
  xAxisLabel = '',
  viewMode = 'objective',
  margin = { top: 30, bottom: 20, left: 120, right: 50 },
  className = '',
}: BarChartDisplayProps) => {
  // Reference for animation - moved before conditional return
  const chartRef = useRef<HTMLDivElement>(null);

  // Apply animation on view mode change - moved before conditional return
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.classList.add('chart-transition');
      const timer = setTimeout(() => {
        if (chartRef.current) {
          chartRef.current.classList.remove('chart-transition');
        }
      }, 800); // Match this to the CSS transition duration

      return () => clearTimeout(timer);
    }
  }, [viewMode]);

  // If no data, display an empty chart or return null
  if (
    !chartData ||
    !chartData.labels ||
    chartData.labels.length === 0 ||
    !chartData.datasets ||
    chartData.datasets.length === 0
  ) {
    return null;
  }

  // Create safe versions of datasets with guaranteed valid colors
  const safeDatasets = chartData.datasets.map((dataset, index) => {
    // Transform the data if in comparative mode
    const transformedData = Array.isArray(dataset.data)
      ? dataset.data.map((val) => {
          if (val === null || val === undefined) return 0;
          // Shift value by subtracting 1 only in comparative mode
          return viewMode === 'comparative' ? val - 1 : val;
        })
      : [];

    // Use CHART_COLORS for all modes
    const color = CHART_COLORS[index % CHART_COLORS.length];

    // Adjust the valueFormatter based on viewMode to retain above/below identification
    let valueFormatter = dataset.valueFormatter;
    if (viewMode === 'comparative') {
      valueFormatter = createComparativeFormatter();
    }

    return {
      data: transformedData,
      label: dataset.label || `Dataset ${index + 1}`,
      color,
      stack: dataset.stack || undefined,
      valueFormatter,
    };
  });

  // Compute domain to accommodate negative & positive if in comparative mode
  let xAxis;
  if (viewMode === 'comparative') {
    const allValues = safeDatasets.flatMap((ds) => ds.data);
    const compMin = Math.min(...allValues);
    const compMax = Math.max(...allValues);

    xAxis = [
      {
        scaleType: 'linear' as const,
        label: xAxisLabel,
        labelStyle: {
          fontSize: 14,
          fontWeight: 600,
        },
        min: Math.min(0, compMin),
        max: Math.max(0, compMax),
      },
    ];
  } else {
    xAxis = [
      {
        scaleType: 'linear' as const,
        label: xAxisLabel,
        labelStyle: {
          fontSize: 14,
          fontWeight: 600,
        },
      },
    ];
  }

  // Define slots to hide based on dataset count
  const slotsToHide = [];
  if (safeDatasets.length === 1) {
    slotsToHide.push('legend');
  }

  return (
    <div
      ref={chartRef}
      className={`chart-display-container ${className} ${
        viewMode === 'comparative' ? 'comparative-view' : 'objective-view'
      }`}
    >
      {/* Removed the reference-line-container block per instructions */}

      <BarChart
        layout={layout}
        yAxis={[
          {
            scaleType: 'band',
            data: chartData.labels,
            tickLabelStyle: {
              fontSize: 12,
              padding: 4,
            },
          },
        ]}
        xAxis={xAxis}
        series={safeDatasets.map((dataset) => ({
          data: dataset.data,
          label: dataset.label,
          color: dataset.color,
          stack: viewMode === 'comparative' ? undefined : dataset.stack,
          valueFormatter: dataset.valueFormatter,
          highlightScope: {
            highlighted: 'item',
            faded: 'global',
          },
        }))}
        margin={margin}
        disableAxisListener={false}
        // Hide legend for single series
        sx={{
          '& .MuiChartsLegend-root': {
            display: safeDatasets.length === 1 ? 'none' : 'flex',
          },
        }}
        slotProps={{
          legend: {
            direction: 'row',
            position: { vertical: 'top', horizontal: 'middle' },
            padding: 0,
            itemMarkWidth: 15,
            itemMarkHeight: 15,
            markGap: 5,
            itemGap: 15,
          },
          axisLabel: {
            fontSize: 14,
            fontWeight: 600,
          },
        }}
        tooltip={{ trigger: 'item' }}
      />
    </div>
  );
};

export default BarChartDisplay;