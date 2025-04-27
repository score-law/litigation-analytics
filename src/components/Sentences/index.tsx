/**
 * Sentences Tab Component
 * 
 * This component displays sentence data through horizontal bar charts.
 * It shows the percentage of each sentence type and the average days/costs.
 * In severity mode, it shows the distribution of sentence buckets.
 */
import { useMemo } from 'react';
import { Box, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { SentenceData } from '@/types';
import { ViewMode } from '@/types';
import BarChartDisplay from '@/components/BarChartDisplay';

// Consistent colors for sentence types
const SENTENCE_TYPE_COLORS = {
  FREQUENCY: '#34dea9',
  DOLLARS: '#a0ef86',
  DAYS: '#00c7c7',
  FEE: '#66bb6a',
  FINE: '#66bb6a',
  HOC: '#ef5350',
  PROBATION: '#42a5f5',
  LICENSE: '#ffca28'
};

interface SentencesTabProps {
  data: SentenceData[];
  viewMode: ViewMode;
  displayMode: string;
  selectedSentenceType: string;
  onSelectedSentenceTypeChange: (sentenceType: string) => void;
}

const SentencesTab = ({ data, viewMode, displayMode, selectedSentenceType, onSelectedSentenceTypeChange }: SentencesTabProps) => {
  // Create frequency formatter for percentage values
  const frequencyValueFormatter = (value: number | null) => {
    if (value === null) return '';
    
    // Find the matching data item using fuzzy matching
    const item = data.find(d => {
      if (viewMode === 'objective') {
        // In objective mode, directly match the percentage
        return Math.abs(d.percentage - value) < 0.01;
      } else {
        // In comparative mode, the value is transformed to (value - 1) * 100
        // We need to transform back: value/100 + 1
        const originalValue = value / 100 + 1;
        return Math.abs(d.percentage - originalValue) < 0.01;
      }
    });
    
    if (!item) return '';
    
    const count = item.count || 0;
    
    if (viewMode === 'comparative') {
      // In comparative mode, BarChartDisplay transforms values to percentage difference
      if (Math.abs(value) < 0.01) {
        return `Same as average | ${count.toLocaleString()} Sentences Found`;
      } else if (value > 0) {
        return `${Math.abs(value).toFixed(1)}% above average | ${count.toLocaleString()} Sentences Found`;
      } else {
        return `${Math.abs(value).toFixed(1)}% below average | ${count.toLocaleString()} Sentences Found`;
      }
    } else {
      return `${value.toFixed(1)}% | ${count.toLocaleString()} Sentences Found`;
    }
  };

  // Create formatter for buckets tooltip
  const bucketValueFormatter = (value: number | null) => {
    if (value === null) return '';
    
    // Find the selected sentence type item to get the buckets
    const sentenceItem = data.find(item => item.type.includes(selectedSentenceType));
    if (!sentenceItem || !sentenceItem.sentenceBuckets) return '';
    
    // Find the matching bucket
    const bucket = sentenceItem.sentenceBuckets.find(b => {
      if (viewMode === 'objective') {
        // Use nullish coalescing to handle undefined percentage
        const bucketPct = b.percentage ?? 0;
        return Math.abs(bucketPct - value) < 0.01;
      } else {
        // In comparative mode, convert back from the transformed value
        const originalValue = value / 100 + 1;
        const bucketPct = b.percentage ?? 0;
        return Math.abs(bucketPct - originalValue) < 0.01;
      }
    });
    
    if (!bucket) return '';
    
    if (viewMode === 'comparative') {
      if (Math.abs(value) < 0.01) {
        return `Same as average | ${bucket.count.toLocaleString()} ${selectedSentenceType}s`;
      } else if (value > 0) {
        return `${Math.abs(value).toFixed(1)}% above average | ${bucket.count.toLocaleString()} ${selectedSentenceType}s`;
      } else {
        return `${Math.abs(value).toFixed(1)}% below average | ${bucket.count.toLocaleString()} ${selectedSentenceType}s`;
      }
    } else {
      // Handle potentially undefined percentage
      const percentage = bucket.percentage ?? 0;
      return `${percentage.toFixed(1)}% of ${selectedSentenceType}s | ${bucket.count.toLocaleString()} total sentences`;
    }
  };

  // Handle sentence type toggle change
  const handleSentenceTypeChange = (event: React.MouseEvent<HTMLElement>, newType: string) => {
    if (newType !== null) {
      onSelectedSentenceTypeChange(newType);
    }
  };

  // Process data for the chart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return { labels: [], datasets: [] };
    }
    
    const labels = data.map(item => item.type);
    
    if (displayMode === 'frequency') {
      const chartValues = data.map(item => item.percentage);
      
      return {
        labels,
        datasets: [
          {
            data: chartValues,
            label: '',
            color: SENTENCE_TYPE_COLORS.FREQUENCY,
            backgroundColor: SENTENCE_TYPE_COLORS.FREQUENCY,
            valueFormatter: frequencyValueFormatter
          }
        ]
      };
    } else { // severity mode
      // In severity mode, show bucket distribution for the selected sentence type
      const selectedItem = data.find(item => item.type.includes(selectedSentenceType));
      
      if (!selectedItem || !selectedItem.sentenceBuckets || selectedItem.sentenceBuckets.length === 0) {
        return { labels: [], datasets: [] };
      }
      
      // Extract bucket data for the chart
      const labels = selectedItem.sentenceBuckets.map(bucket => bucket.label);
      const chartValues = selectedItem.sentenceBuckets.map(bucket => bucket.percentage ?? 0);
      
      // Determine color based on sentence type
      let color = SENTENCE_TYPE_COLORS.FREQUENCY;
      if (selectedSentenceType === 'Fine') color = SENTENCE_TYPE_COLORS.FINE;
      else if (selectedSentenceType === 'FEE') color = SENTENCE_TYPE_COLORS.FEE;
      else if (selectedSentenceType === 'Incarceration') color = SENTENCE_TYPE_COLORS.HOC;
      else if (selectedSentenceType === 'Probation') color = SENTENCE_TYPE_COLORS.PROBATION;
      else if (selectedSentenceType === 'License\nSuspension') color = SENTENCE_TYPE_COLORS.LICENSE;
      
      return {
        labels,
        datasets: [
          {
            data: chartValues,
            label: '',
            color: color,
            backgroundColor: color,
            valueFormatter: bucketValueFormatter
          }
        ]
      };
    }
  }, [data, viewMode, displayMode, selectedSentenceType]);

  // If no data, display a message
  if (!data || data.length === 0) {
    return (
      <Box className="no-data-container">
        No sentence data available.
      </Box>
    );
  }

  return (
    <div className="sentences-container">
      <div className="chart-section">
        <BarChartDisplay 
          chartData={chartData} 
          layout={displayMode === 'severity' ? 'vertical' : 'horizontal'}
          xAxisLabel={
            viewMode === 'comparative' 
              ? (displayMode === 'frequency' 
                ? 'Sentencing % Relative to Avg' 
                : '% Relative to Avg')
              : (displayMode === 'frequency' 
                ? 'Percent of Cases Sentenced' 
                : 'Percent of Sentences')
          }
          viewMode={viewMode}
          margin={
            displayMode === 'severity'
              ? { top: 0, bottom: 40, left: 60, right: 20 }
              : { top: 0, bottom: 50, left: 90, right: 20 }
          }
          preserveStackInComparative={displayMode === 'frequency'}
          domainConfig={
            viewMode === 'objective' 
              ? (displayMode === 'severity'
                  ? { type: 'fixed', min: 0, max: 100 } 
                  : { 
                      type: 'dynamic',
                      strategy: 'exponential',
                      parameters: {
                        baseBuffer: 0.8,
                        minBuffer: 0.1,
                        decayFactor: 0.5,
                        thresholdValue: 5,
                        safeguardMin: 0
                      }
                    })
              : {
                  type: 'dynamic',
                  strategy: 'exponential',
                  parameters: {
                    baseBuffer: 0.6,
                    minBuffer: 0.1,
                    decayFactor: 0.4,
                    thresholdValue: 0.5,
                  }
                }
          }
        />
        
        {/* Add toggle buttons for sentence types when in severity mode */}
        {displayMode === 'severity' && (
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              '& .MuiToggleButtonGroup-root': {
                height: '36px'
              }
            }}
          >
            <ToggleButtonGroup
              value={selectedSentenceType}
              exclusive
              onChange={handleSentenceTypeChange}
              aria-label="sentence type"
              size="medium"
              color="primary"
              sx={{paddingLeft: 2, paddingRight: 2}} 
            >
              <ToggleButton value="Fine">Fine</ToggleButton>
              <ToggleButton value="Incarceration">Incarceration</ToggleButton>
              <ToggleButton value="Probation">Probation</ToggleButton>
              <ToggleButton value="License">License</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}
      </div>
    </div>
  );
};

export default SentencesTab;