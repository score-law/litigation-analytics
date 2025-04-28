/**
 * Standardized Bar Chart Display Component
 *
 * This component provides a standardized way to render horizontal bar charts across
 * the application. It wraps MUI's BarChart with consistent styling and configuration
 * while allowing for flexible data input and customization.
 */
'use client'

import React, { useEffect, useRef } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import './styles.scss'

// Domain configuration types for controlling chart axis scales
type DomainConfigAuto = { 
  type: 'auto' 
};

type DomainConfigFixed = { 
  type: 'fixed', 
  min: number, 
  max: number 
};

type DomainConfigDynamic = { 
  type: 'dynamic', 
  strategy: 'exponential', 
  parameters: {
    baseBuffer: number;    // Initial buffer percentage when values are small (e.g., 50%)
    minBuffer: number;     // Minimum buffer percentage to approach (e.g., 10%)
    decayFactor: number;   // Controls how quickly buffer reduces (higher = faster decay)
    thresholdValue: number; // Value at which we start reducing buffer (e.g., 20)
    safeguardMin?: number; // Optional minimum value for the domain (e.g., 0)
  } 
};

type DomainConfig = DomainConfigAuto | DomainConfigFixed | DomainConfigDynamic;

// Consistent color palette for better visual distinction between datasets
const CHART_COLORS = [
  '#3182CE', // blue
  '#38A169', // green
  '#805AD5', // purple
  '#DD6B20', // orange
  '#E53E3E', // red
  '#319795', // teal
  '#D69E2E', // yellow
  '#4A5568', // gray
  '#B83280', // pink
  '#2C5282', // dark blue
  '#9B2C2C', // dark red
  '#276749'  // dark green
];

// Interface definitions for the component props
interface BarChartDisplayProps {
  chartData: {
    labels: string[];
    datasets: Array<{
      data: (number | null)[];      
      label: string;
      color?: string;
      backgroundColor?: string;      
      stack?: string;
      valueFormatter?: (value: number | null, context?: { dataIndex?: number | undefined; }) => string;
      highlightScope?: { highlighted: string; faded: string };
    }>;
  };
  layout?: 'horizontal' | 'vertical';
  xAxisLabel?: string;
  viewMode?: 'objective' | 'comparative';
  margin?: { top: number; bottom: number; left: number; right: number };
  className?: string;
  domainConfig?: DomainConfig;
  preserveStackInComparative?: boolean;
}

/**
 * Calculates domain min/max values based on dynamic configuration with exponential distribution
 * This creates a buffer between the most offset bar and the edge of the chart
 * The buffer decreases exponentially as values increase
 */
const calculateDynamicDomain = (
  maxVal: number, 
  config: DomainConfigDynamic,
  isComparative: boolean
): { min: number; max: number } => {
  // For comparative mode, values are now on a 0-100 scale instead of 0-1
  const scaleFactor = isComparative ? 1 : 1;
  const { baseBuffer, minBuffer, decayFactor, thresholdValue, safeguardMin } = config.parameters;
  
  // For comparative mode, adjust the threshold value to account for the percentage scale
  const adjustedThresholdValue = isComparative ? thresholdValue * 100 : thresholdValue;
  
  // Calculate buffer percentage using exponential decay
  let bufferPercentage = baseBuffer;
  if (maxVal > adjustedThresholdValue) {
    bufferPercentage = minBuffer + (baseBuffer - minBuffer) * 
      Math.exp(-decayFactor * (maxVal - adjustedThresholdValue) / adjustedThresholdValue);
  }
  
  // Calculate what percentage of the graph the bar should take up
  const barPercentage = 1 - bufferPercentage;
  
  // Calculate domain max
  // If bufferPercentage is very close to 1, we need to cap it to avoid division by zero
  const cappedBarPercentage = Math.max(barPercentage, 0.05); // At least 5% of graph for bars
  const domainMax = maxVal / cappedBarPercentage;
  
  // Calculate domain min (different for comparative vs objective)
  const domainMin = isComparative ? 
    -domainMax : // For comparative, use symmetrical domain
    (typeof safeguardMin === 'number' ? safeguardMin : 0); // For objective, use safeguardMin or 0
  
  return { min: domainMin, max: domainMax };
};

/**
 * Creates a wrapper for valueFormatter functions to provide dataIndex context
 * @param valueFormatter The original valueFormatter function
 * @returns A new valueFormatter function that passes dataIndex context
 */
const createValueFormatterWithContext = (
  valueFormatter?: (value: number | null, context?: { dataIndex?: number | undefined; }) => string,
) => {
  // If no valueFormatter, return a basic formatter
  if (!valueFormatter) {
    return (value: number | null) => value?.toString() || '';
  }
  
  // Return a new formatter that passes the dataIndex context
  return (value: number | null, context?: { dataIndex?: number }) => {
    // Pass the dataIndex context to the original formatter
    return valueFormatter(value, context);
  };
};

const BarChartDisplay = ({
  chartData,
  layout = 'horizontal',
  xAxisLabel = '',
  viewMode = 'objective',
  margin = { top: 30, bottom: 50, left: 120, right: 50 },
  className = '',
  domainConfig = { type: 'auto' },
  preserveStackInComparative = false,
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
          if (val === null || val === undefined) return null;  // Keep null values as null
          // Shift value by subtracting 1 and multiplying by 100 in comparative mode
          return viewMode === 'comparative' ? (val - 1) * 100 : val;
        })
      : [];

    // Use backgroundColor if provided, fall back to color prop, then use chart colors
    const color = dataset.backgroundColor || dataset.color || CHART_COLORS[index % CHART_COLORS.length];
    
    // Adjust the valueFormatter based on viewMode to retain above/below identification
    const valueFormatter = createValueFormatterWithContext(dataset.valueFormatter);
    
    return {
      data: transformedData,
      label: dataset.label,
      color: color,
      backgroundColor: color,
      stack: dataset.stack || undefined,
      valueFormatter,
      highlightScope: dataset.highlightScope,
    };
  });

  // Compute domain to accommodate negative & positive if in comparative mode
  let xAxis;
  let yAxis;

  // Find maximum absolute value in the datasets
  const maxVal = Math.max(
    ...safeDatasets.flatMap((ds) =>
      ds.data.filter((v): v is number => v !== null && !isNaN(v)).map(Math.abs)
    ),
    0.25 // Minimum range to avoid empty charts
  );

  // Prepare linear axis configuration based on domain config
  let linearAxisConfig;
  if (domainConfig.type === 'fixed') {
    // Fixed domain configuration
    linearAxisConfig = {
      scaleType: 'linear' as const,
      min: domainConfig.min,
      max: domainConfig.max,
      label: xAxisLabel,
      labelStyle: {
        fontSize: 14,
        fontWeight: 600,
      },
    };
  }
  else if (domainConfig.type === 'dynamic') {
    // Dynamic domain configuration with exponential distribution
    const dynamicDomain = calculateDynamicDomain(maxVal, domainConfig, viewMode === 'comparative');
    linearAxisConfig = {
      scaleType: 'linear' as const,
      min: dynamicDomain.min,
      max: dynamicDomain.max,
      label: xAxisLabel,
      labelStyle: {
        fontSize: 14,
        fontWeight: 600,
      },
    };
  }
  else {
    // Auto domain configuration
    linearAxisConfig = {
      scaleType: 'linear' as const,
      label: xAxisLabel,
      labelStyle: {
        fontSize: 14,
        fontWeight: 600,
      },
    };
  }

  // Prepare band axis configuration
  const bandAxisConfig = {
    scaleType: 'band' as const,
    data: chartData.labels,
    tickLabelStyle: {
      fontSize: 12,
      padding: 4,
      fontFamily: 'Inter',
    },
  };

  // Swap axis configuration based on layout
  if (layout === 'vertical') {
    xAxis = [bandAxisConfig];
    yAxis = [linearAxisConfig];
  } else {
    xAxis = [linearAxisConfig];
    yAxis = [bandAxisConfig];
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
      <BarChart
        layout={layout}
        yAxis={yAxis}
        xAxis={xAxis}
        series={safeDatasets.map((dataset) => ({
          data: dataset.data,
          label: dataset.label,
          labelStyle: {
            fontFamily: 'Inter',
            fontSize: 12,
            fontWeight: 600,
          },
          color: dataset.color,
          backgroundColor: dataset.color,
          stack: (viewMode === 'comparative' && !preserveStackInComparative) ? undefined : dataset.stack,
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
            fontFamily: 'Inter',
          },
        }}
        tooltip={{ 
          trigger: 'axis'
        }}
      />
    </div>
  );
};

export default BarChartDisplay;