'use client';

/**
 * Results Page Component
 *
 * This component displays litigation analytics data through a tabbed interface.
 * It shows data for Dispositions, Sentences, Bail Decisions, and Motions using
 * horizontal bar graphs. Each tab provides interactive visualizations tailored 
 * to different aspects of court case data.
 */
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Box, 
  Tab, 
  Tabs, 
  Typography, 
  Paper,
  CircularProgress
} from '@mui/material';
import { TabContext, TabPanel } from '@mui/lab';
import { 
  transformApiResponseToSearchResultData,
  calculateComparativeDispositionsData,
  calculateComparativeSentencesData,
  calculateComparativeBailData,
  calculateComparativeMotionsData
} from '@/utils';
import { SearchResultData, ApiResponse, ViewMode } from '@/types';
import DispositionsTab from '@/components/Dispositions';
import SentencesTab from '@/components/Sentences';
import BailTab from '@/components/Bail';
import MotionsTab from '@/components/Motions';
import ViewModeToggle from '@/components/ViewModeToggle';
import CategoryToggle from '@/components/CategoryToggle';
import './styles.scss';

const ResultsPage = () => {
  const [activeTab, setActiveTab] = useState('dispositions');
  const [data, setData] = useState<SearchResultData | null>(null);
  const [averageData, setAverageData] = useState<SearchResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // State to track the parameters used in the final query
  const [finalParams, setFinalParams] = useState<{
    courtId: number;
    judgeId: number;
    chargeId: number;
  } | null>(null);
  
  // Add view mode state for each tab (independent toggles)
  const [dispositionsViewMode, setDispositionsViewMode] = useState<ViewMode>('objective');
  const [sentencesViewMode, setSentencesViewMode] = useState<ViewMode>('objective');
  const [bailViewMode, setBailViewMode] = useState<ViewMode>('objective');
  const [motionsViewMode, setMotionsViewMode] = useState<ViewMode>('objective');
  
  // Add category toggle states (all default to true/enabled)
  const [dispositionsCategoriesEnabled, setDispositionsCategoriesEnabled] = useState(true);
  const [motionsPartiesEnabled, setMotionsPartiesEnabled] = useState(true);
  const [motionsTypesEnabled, setMotionsTypesEnabled] = useState(true);
  
  const searchParams = useSearchParams();

  // Fetch data from the API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Extract parameters from URL
        const courtId = searchParams.get('courtId') || '0';
        const judgeId = searchParams.get('judgeId') || '0';
        const chargeId = searchParams.get('chargeId') || '0';
        
        // Build the API URL with query parameters for the relevant specification
        const apiUrl = `/api/relevant_specification?courtId=${courtId}&judgeId=${judgeId}&chargeId=${chargeId}`;
        
        // Fetch the relevant specification data
        const filteredResponse = await fetch(apiUrl);
        
        if (!filteredResponse.ok) {
          const errorData = await filteredResponse.json();
          throw new Error(errorData.error || `API error: ${filteredResponse.status}`);
        }
        
        const filteredApiData = await filteredResponse.json();
        
        // Extract the parameters that were actually used
        const usedParams = filteredApiData.usedParams || { courtId: 0, judgeId: 0, chargeId: 0 };
        setFinalParams(usedParams);
        
        // Build the API URL for average data (only filtered by chargeId if it was used)
        const averageApiUrl = `/api/specification?courtId=0&judgeId=0&chargeId=${
          usedParams.chargeId !== 0 ? usedParams.chargeId : '0'
        }`;
        
        // Fetch the average data
        const averageResponse = await fetch(averageApiUrl);
        
        if (!averageResponse.ok) {
          throw new Error(`API error: ${averageResponse.status}`);
        }
        
        const averageApiData = await averageResponse.json();

        console.log('Filtered API response:', filteredApiData);
        console.log('Average API response:', averageApiData);
        console.log('Used parameters:', usedParams);
        
        // Transform both API responses
        const transformedData = transformApiResponseToSearchResultData(filteredApiData);
        const transformedAverageData = transformApiResponseToSearchResultData(averageApiData);
        
        setData(transformedData);
        setAverageData(transformedAverageData);
      } catch (error) {
        console.error('Error fetching data:', error);
        if (error instanceof Error) {
          setError(`Failed to fetch data: ${error.message}`);
        } else {
          setError('Failed to fetch data. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams]); // Dependency on searchParams ensures it runs when URL params change

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };
  
  // Add handlers for view mode changes
  const handleDispositionsViewModeChange = (newMode: ViewMode) => {
    setDispositionsViewMode(newMode);
  };
  
  const handleSentencesViewModeChange = (newMode: ViewMode) => {
    setSentencesViewMode(newMode);
  };
  
  const handleBailViewModeChange = (newMode: ViewMode) => {
    setBailViewMode(newMode);
  };
  
  const handleMotionsViewModeChange = (newMode: ViewMode) => {
    setMotionsViewMode(newMode);
  };
  
  // Add handlers for category toggles
  const handleDispositionsCategoriesChange = (enabled: boolean) => {
    setDispositionsCategoriesEnabled(enabled);
  };
  
  const handleMotionsPartiesChange = (enabled: boolean) => {
    setMotionsPartiesEnabled(enabled);
  };
  
  const handleMotionsTypesChange = (enabled: boolean) => {
    setMotionsTypesEnabled(enabled);
  };
  
  // Helper function to get the appropriate data based on view mode
  const getDataForViewMode = (
    tabName: 'dispositions' | 'sentences' | 'bail' | 'motions',
    viewMode: ViewMode
  ): any[] => {
    if (!data || !averageData) return [];

    if (viewMode === 'objective') {
      // Return objective data
      switch (tabName) {
        case 'dispositions':
          return data.dispositions;
        case 'sentences':
          return data.sentences;
        case 'bail':
          return data.bailDecisions;
        case 'motions':
          return data.motions;
        default:
          return [];
      }
    } else {
      // Return comparative data
      switch (tabName) {
        case 'dispositions':
          return calculateComparativeDispositionsData(data.dispositions, averageData.dispositions);
        case 'sentences':
          return calculateComparativeSentencesData(data.sentences, averageData.sentences);
        case 'bail':
          return calculateComparativeBailData(data.bailDecisions, averageData.bailDecisions);
        case 'motions':
          return calculateComparativeMotionsData(data.motions, averageData.motions);
        default:
          return [];
      }
    }
  };

  return (
    <div className="results-container">
      {loading ? (
        <Box className="loading-container">
          <CircularProgress sx={{ color: 'var(--accent-main)' }} />
        </Box>
      ) : error ? (
        <Box className="error-container">
          <Typography color="error">{error}</Typography>
        </Box>
      ) : (
        <Box className="tab-container">
          <TabContext value={activeTab}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                className="results-tabs"
              >
                <Tab 
                  label="Dispositions" 
                  value="dispositions" 
                  className="results-tab"
                />
                <Tab 
                  label="Sentences" 
                  value="sentences"
                  className="results-tab"
                />
                {/*<Tab 
                  label="Bail Decisions" 
                  value="bail"
                  className="results-tab"
                />*/}
                <Tab 
                  label="Motions" 
                  value="motions"
                  className="results-tab"
                />
              </Tabs>
            </Box>
            
            <TabPanel value="dispositions" className="results-tab-panel">
              {data && (
                <Paper className="graph-card" elevation={2}>
                  <div className="interaction-section">
                    <ViewModeToggle
                      viewMode={dispositionsViewMode}
                      onChange={handleDispositionsViewModeChange}
                    />
                    <CategoryToggle
                      enabled={dispositionsCategoriesEnabled}
                      onChange={handleDispositionsCategoriesChange}
                      label="Categories"
                    />
                  </div>
                  <div className="graph-section">
                    <DispositionsTab 
                      data={getDataForViewMode('dispositions', dispositionsViewMode)} 
                      viewMode={dispositionsViewMode}
                      categoriesEnabled={dispositionsCategoriesEnabled}
                    />
                  </div>
                </Paper>
              )}
            </TabPanel>
            
            <TabPanel value="sentences" className="results-tab-panel">
              {data && (
                <Paper className="graph-card" elevation={2}>
                  <div className="interaction-section">
                    <ViewModeToggle
                      viewMode={sentencesViewMode}
                      onChange={handleSentencesViewModeChange}
                    />
                  </div>
                  <div className="graph-section">
                    <SentencesTab 
                      data={getDataForViewMode('sentences', sentencesViewMode)}
                      viewMode={sentencesViewMode}
                    />
                  </div>
                </Paper>
              )}
            </TabPanel>
            
            <TabPanel value="bail" className="results-tab-panel">
              {data && (
                <Paper className="graph-card" elevation={2}>
                  <div className="interaction-section">
                    <ViewModeToggle
                      viewMode={bailViewMode}
                      onChange={handleBailViewModeChange}
                    />
                  </div>
                  <div className="graph-section">
                    <BailTab 
                      data={getDataForViewMode('bail', bailViewMode)}
                      viewMode={bailViewMode}
                    />
                  </div>
                </Paper>
              )}
            </TabPanel>
            
            <TabPanel value="motions" className="results-tab-panel">
              {data && (
                <Paper className="graph-card" elevation={2}>
                  <div className="interaction-section">
                    <ViewModeToggle
                      viewMode={motionsViewMode}
                      onChange={handleMotionsViewModeChange}
                    />
                    <CategoryToggle
                      enabled={motionsPartiesEnabled}
                      onChange={handleMotionsPartiesChange}
                      label="Parties"
                    />
                    <CategoryToggle
                      enabled={motionsTypesEnabled}
                      onChange={handleMotionsTypesChange}
                      label="Types"
                    />
                  </div>
                  <div className="graph-section">
                    <MotionsTab 
                      data={getDataForViewMode('motions', motionsViewMode)}
                      viewMode={motionsViewMode}
                      partiesEnabled={motionsPartiesEnabled}
                      typesEnabled={motionsTypesEnabled}
                    />
                  </div>
                </Paper>
              )}
            </TabPanel>
          </TabContext>
            {finalParams && (
              <Box className="params-info" sx={{ mb: 2, px: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Showing data based on: 
                  {finalParams.judgeId !== 0 && ` Judge ID ${finalParams.judgeId}`}
                  {finalParams.courtId !== 0 && ` Court ID ${finalParams.courtId}`}
                  {finalParams.chargeId !== 0 && ` Charge ID ${finalParams.chargeId}`}
                  {finalParams.judgeId === 0 && finalParams.courtId === 0 && finalParams.chargeId === 0 && ' All cases'}
                </Typography>
              </Box>
            )}
        </Box>
      )}
    </div>
  );
};

export default ResultsPage;