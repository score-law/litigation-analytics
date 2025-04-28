/**
 * BarLabelOutside Component
 * 
 * Renders a formatted value label just outside the end of each bar in a bar chart.
 * Supports both horizontal and vertical layouts. Used as a custom barLabel slot in MUI X-Charts BarPlot.
 * 
 * Props:
 * - value: number | null - The value to display.
 * - formatter: (value: number | null, context?: any) => string - Function to format the value.
 * - layout: 'horizontal' | 'vertical' - Bar chart layout.
 * - x, y, width, height: number - Bar geometry.
 * - color: string - Bar color (not used for label).
 * - dataIndex: number - Index of the bar in the dataset.
 * - ...otherProps: any - Additional props from MUI.
 */

import React from 'react';

interface BarLabelOutsideProps {
  value: number | null;
  formatter: (value: number | null, context?: { dataIndex?: number }) => string;
  layout: 'horizontal' | 'vertical';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  dataIndex: number;
  [key: string]: any;
}

const LABEL_OFFSET = 8; // px

const BarLabelOutside: React.FC<BarLabelOutsideProps> = ({
  value,
  formatter,
  layout,
  x,
  y,
  width,
  height,
  dataIndex,
  ...otherProps
}) => {
  // Format the value using the provided formatter
  const label = formatter(value, { dataIndex });

  if (!label) return null;

  // Calculate label position based on layout
  let labelX = x, labelY = y;

  if (layout === 'horizontal') {
    labelX = x + width + LABEL_OFFSET;
    labelY = y + height / 2;
  } else {
    labelX = x + width / 2;
    labelY = y - LABEL_OFFSET;
  }

  return (
    <text
      x={labelX}
      y={labelY}
      fill="black"
      fontSize={14}
      dominantBaseline="middle"
      textAnchor={layout === 'horizontal' ? 'start' : 'middle'}
      pointerEvents="none"
      {...otherProps}
    >
      {label}
    </text>
  );
};