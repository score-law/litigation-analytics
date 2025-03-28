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
import { Box, Tab, Tabs, Typography, Paper, CircularProgress, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { TabContext, TabPanel } from '@mui/lab';
import { calculateComparativeDispositionsData, calculateComparativeSentencesData, 
calculateComparativeBailData, calculateComparativeMotionsData } from '@/utils/dataComparators';
import { transformApiResponseToSearchResultData } from '@/utils/dataTransformers';
import { getCourtName, getJudgeName, getChargeName } from '@/utils/nameUtils';
import { SearchResultData, ViewMode, Charge } from '@/types';
import DispositionsTab from '@/components/Dispositions';
import SentencesTab from '@/components/Sentences';
import BailTab from '@/components/Bail';
import MotionsTab from '@/components/Motions';
import ViewModeToggle from '@/components/ViewModeToggle';
import CategoryFilter from '@/components/CategoryFilter';
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
  
  // Update category filter states (from boolean toggles to string selectors)
  const [dispositionsTrialType, setDispositionsTrialType] = useState<string>("all");
  const [sentenceDisplayMode, setSentenceDisplayMode] = useState<string>("frequency");
  const [motionsPartyType, setMotionsPartyType] = useState<string>("all");
  
  // State for accordion expansion
  const [courtAccordionExpanded, setCourtAccordionExpanded] = useState<boolean>(false);
  const [judgeAccordionExpanded, setJudgeAccordionExpanded] = useState<boolean>(false);
  const [chargeAccordionExpanded, setChargeAccordionExpanded] = useState<boolean>(false);

  // State for search terms
  const [courtSearchTerm, setCourtSearchTerm] = useState('');
  const [judgeSearchTerm, setJudgeSearchTerm] = useState('');
  const [chargeSearchTerm, setChargeSearchTerm] = useState('');

  // Define filter options
  const TRIAL_TYPE_OPTIONS = [
    { value: "all", label: "All Trials" },
    { value: "jury", label: "Jury Trial" },
    { value: "bench", label: "Bench Trial" },
    { value: "none", label: "No Trial" }
  ];

  const SENTENCE_DISPLAY_OPTIONS = [
    { value: "frequency", label: "Frequency" },
    { value: "severity", label: "Severity" }
  ];
   
  const PARTY_OPTIONS = [
    { value: "all", label: "All Parties" },
    { value: "prosecution", label: "Prosecution" },
    { value: "defense", label: "Defense" }
  ];
  
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
        setFinalParams({ courtId: +courtId, judgeId: +judgeId, chargeId: +chargeId });
        
        // Build the API URL with query parameters for the relevant specification
        const apiUrl = `/api/specification?courtId=${courtId}&judgeId=${judgeId}&chargeId=${chargeId}`;
        
        // Fetch the relevant specification data
        const filteredResponse = await fetch(apiUrl);
        
        if (!filteredResponse.ok) {
          const errorData = await filteredResponse.json();
          throw new Error(errorData.error || `API error: ${filteredResponse.status}`);
        }
        
        const filteredApiData = await filteredResponse.json();
        
        // Build the API URL for average data (only filtered by chargeId if it was used)
        const averageApiUrl = `/api/specification?courtId=0&judgeId=0&chargeId=${
          chargeId
        }`;
        
        // Fetch the average data
        const averageResponse = await fetch(averageApiUrl);
        
        if (!averageResponse.ok) {
          throw new Error(`API error: ${averageResponse.status}`);
        }
        
        const averageApiData = await averageResponse.json();

        console.log('Filtered API response:', filteredApiData);
        console.log('Average API response:', averageApiData);
        
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

  // Handler functions for accordion toggling
  const handleCourtAccordionChange = (event: React.SyntheticEvent, isExpanded: boolean) => {
    setCourtAccordionExpanded(isExpanded);
  };

  const handleJudgeAccordionChange = (event: React.SyntheticEvent, isExpanded: boolean) => {
    setJudgeAccordionExpanded(isExpanded);
  };

  const handleChargeAccordionChange = (event: React.SyntheticEvent, isExpanded: boolean) => {
    setChargeAccordionExpanded(isExpanded);
  };

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

  // Handler functions for search inputs
  const handleCourtSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCourtSearchTerm(event.target.value);
  };

  const handleJudgeSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setJudgeSearchTerm(event.target.value);
  };

  const handleChargeSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChargeSearchTerm(event.target.value);
  };
  
  // Update the handlers for the filter changes
  const handleDispositionsTrialTypeChange = (value: string) => {
    setDispositionsTrialType(value);
  };

  const handleSentenceDisplayModeChange = (value: string) => {
    setSentenceDisplayMode(value);
  };
  
  const handleMotionsPartyTypeChange = (value: string) => {
    setMotionsPartyType(value);
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

  // Add this state variable with the other state declarations
  const [chargeName, setChargeName] = useState<string>('');

  // Add this effect to fetch the charge name when the page loads
  useEffect(() => {
    const fetchChargeName = async () => {
      // Only fetch if we have a non-zero chargeId
      const chargeId = searchParams.get('chargeId') || '0';
      if (chargeId === '0') return;
      
      try {
        const response = await fetch(`/api/charge?chargeId=${chargeId}`);
        if (!response.ok) throw new Error('Failed to fetch charge');
        
        const data = await response.json();
        setChargeName(data.name);
      } catch (error) {
        console.error('Error fetching charge name:', error);
      }
    };
    
    fetchChargeName();
  }, [searchParams]);

  return (
    <div className="results-page-container">
      {loading ? (
        <Box className="loading-container">
          <CircularProgress sx={{ color: 'var(--accent-main)' }} />
        </Box>
      ) : error ? (
        <Box className="error-container">
          <Typography color="error">{error}</Typography>
        </Box>
      ) : (
        <div className="results-container">
          {/* Court Accordion */}
          <Box className="filter-container">
            <Typography variant="h5" className="filter-title">
              Filters
            </Typography>
            
            {/* Court Accordion */}
            <Accordion 
              expanded={courtAccordionExpanded}
              onChange={handleCourtAccordionChange}
              className="filter-accordion"
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="court-filter-content"
                id="court-filter-header"
              >
                <Typography className="filter-summary-title">Court</Typography>
                {finalParams?.courtId !== 0 && finalParams?.courtId && (
                  <Typography className="filter-summary-value">
                    {getCourtName(finalParams.courtId)}
                  </Typography>
                )}
              </AccordionSummary>
              <AccordionDetails>
                <TextField
                  variant="outlined"
                  size="small"
                  placeholder="Search courts..."
                  value={courtSearchTerm}
                  onChange={handleCourtSearchChange}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  className="filter-search-input"
                />
                {/* Content will be added in future steps */}
              </AccordionDetails>
            </Accordion>
            
            {/* Judge Accordion */}
            <Accordion 
              expanded={judgeAccordionExpanded}
              onChange={handleJudgeAccordionChange}
              className="filter-accordion"
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="judge-filter-content"
                id="judge-filter-header"
              >
                <Typography className="filter-summary-title">Judge</Typography>
                {finalParams?.judgeId !== 0 && finalParams?.judgeId && (
                  <Typography className="filter-summary-value">
                    {getJudgeName(finalParams.judgeId)}
                  </Typography>
                )}
              </AccordionSummary>
              <AccordionDetails>
                <TextField
                  variant="outlined"
                  size="small"
                  placeholder="Search judges..."
                  value={judgeSearchTerm}
                  onChange={handleJudgeSearchChange}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  className="filter-search-input"
                />
                {/* Content will be added in future steps */}
              </AccordionDetails>
            </Accordion>
            
            {/* Charge Accordion */}
            <Accordion 
              expanded={chargeAccordionExpanded}
              onChange={handleChargeAccordionChange}
              className="filter-accordion"
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="charge-filter-content"
                id="charge-filter-header"
              >
                <Typography className="filter-summary-title">Charge</Typography>
                {finalParams?.chargeId !== 0 && finalParams?.chargeId && (
                  <Typography className="filter-summary-value">
                    {chargeName || `Charge #${finalParams.chargeId}`}
                  </Typography>
                )}
              </AccordionSummary>
              <AccordionDetails>
                <TextField
                  variant="outlined"
                  size="small"
                  placeholder="Search charges..."
                  value={chargeSearchTerm}
                  onChange={handleChargeSearchChange}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  className="filter-search-input"
                />
                {/* Content will be added in future steps */}
              </AccordionDetails>
            </Accordion>
          </Box>
          <Box className="tab-container">
            <TabContext value={activeTab}>
              <Box className="results-tabs-container">
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
                      <CategoryFilter
                        value={dispositionsTrialType}
                        onChange={handleDispositionsTrialTypeChange}
                        label="Trial Type"
                        options={TRIAL_TYPE_OPTIONS}
                      />
                    </div>
                    <div className="graph-section">
                      <DispositionsTab 
                        data={getDataForViewMode('dispositions', dispositionsViewMode)} 
                        viewMode={dispositionsViewMode}
                        trialTypeFilter={dispositionsTrialType}
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
                      <CategoryFilter
                        value={sentenceDisplayMode}
                        onChange={handleSentenceDisplayModeChange}
                        label="Display"
                        options={SENTENCE_DISPLAY_OPTIONS}
                      />
                    </div>
                    <div className="graph-section">
                      <SentencesTab 
                        data={getDataForViewMode('sentences', sentencesViewMode)} 
                        viewMode={sentencesViewMode}
                        displayMode={sentenceDisplayMode}
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
                      <CategoryFilter
                        value={motionsPartyType}
                        onChange={handleMotionsPartyTypeChange}
                        label="Party"
                        options={PARTY_OPTIONS}
                      />
                    </div>
                    <div className="graph-section">
                      <MotionsTab 
                        data={getDataForViewMode('motions', motionsViewMode)}
                        viewMode={motionsViewMode}
                        partyFilter={motionsPartyType}
                      />
                    </div>
                  </Paper>
                )}
              </TabPanel>
            </TabContext>
          </Box>
        </div>
      )}
    </div>
  );
};

export default ResultsPage;