'use client';

/**
 * Results Page Component
 *
 * This component displays litigation analytics data through a tabbed interface.
 * It shows data for Dispositions, Sentences, Bail Decisions, and Motions using
 * horizontal bar graphs. Each tab provides interactive visualizations tailored 
 * to different aspects of court case data.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from "framer-motion";

import Link from 'next/link';
import Image from 'next/image';
import Logo from '@/../public/logo.svg'

import { Box, Tab, Tabs, Typography, Paper, CircularProgress } from '@mui/material';
import { TabContext, TabPanel } from '@mui/lab';

import { SearchResultData, ViewMode, Selection } from '@/types';

import { calculateComparativeDispositionsData, calculateComparativeSentencesData, calculateComparativeBailData, calculateComparativeMotionsData } from '@/utils/dataComparators';
import { transformApiResponseToSearchResultData } from '@/utils/dataTransformers';
import { encodeSelectionsToBase64, decodeSelectionsFromBase64 } from '@/utils/paramCoding';

import DispositionsTab from '@/components/Dispositions';
import SentencesTab from '@/components/Sentences';
import BailTab from '@/components/Bail';
import MotionsTab from '@/components/Motions';
import ViewModeToggle from '@/components/ViewModeToggle';
import CategoryFilter from '@/components/CategoryFilter';
import SearchBar from '@/components/SearchBar';
import VariabilityDisplay from '@/components/VariabilityDisplay';

import './styles.scss';

const ResultsPage = () => {
  const [activeTab, setActiveTab] = useState('dispositions');
  const [data, setData] = useState<SearchResultData | null>(null);
  const [averageData, setAverageData] = useState<SearchResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCases, setTotalCases] = useState<number>(0);

  // --- Loading Bar State ---
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showLoadingBar, setShowLoadingBar] = useState(false);
  const loadingBarTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const searchParams = useSearchParams();
  
  // This is our single source of truth
  const [currentSelections, setCurrentSelections] = useState<Array<Selection | null>>([null, null]);
  
  // Use ref for parameter tracking to avoid infinite loop
  const finalParamsRef = useRef<{
    courtId: number;
    judgeId: number;
    chargeId: number;
  } | null>(null);
  
  // Track if selections have been initialized from URL
  const initializedRef = useRef<boolean>(false);
  
  // Add view mode state for each tab (independent toggles)
  const [dispositionsViewMode, setDispositionsViewMode] = useState<ViewMode>('objective');
  const [sentencesViewMode, setSentencesViewMode] = useState<ViewMode>('objective');
  const [bailViewMode, setBailViewMode] = useState<ViewMode>('objective');
  const [motionsViewMode, setMotionsViewMode] = useState<ViewMode>('objective');
  
  // Update category filter states (from boolean toggles to string selectors)
  const [dispositionsTrialType, setDispositionsTrialType] = useState<string>("all");
  const [sentenceDisplayMode, setSentenceDisplayMode] = useState<string>("frequency");
  const [bailDisplayMode, setBailDisplayMode] = useState<string>("frequency");
  const [motionsPartyType, setMotionsPartyType] = useState<string>("all");

  const [selectedSentenceType, setSelectedSentenceType] = useState<string>('Fine');
  
  // Define filter options
  const TRIAL_TYPE_OPTIONS = [
    { value: "all", label: "All Trials" },
    { value: "jury", label: "Jury Trial" },
    { value: "bench", label: "Bench Trial" }
  ];

  const SENTENCE_DISPLAY_OPTIONS = [
    { value: "frequency", label: "Frequency" },
    { value: "severity", label: "Severity" }
  ];

  const BAIL_DISPLAY_OPTIONS = [
    { value: "frequency", label: "Frequency" },
    { value: "severity", label: "Severity" }
  ];
    
  const PARTY_OPTIONS = [
    { value: "all", label: "All Parties" },
    { value: "prosecution", label: "Prosecution" },
    { value: "defense", label: "Defense" }
  ];

  // Utility function to extract IDs from selections
  const getIdsFromSelections = useCallback(() => {
    let courtId = 0, judgeId = 0, chargeId = 0;
    
    currentSelections.forEach(selection => {
      if (!selection?.type || !selection?.value) return;
      
      switch(selection.type) {
        case 'Courts':
          courtId = selection.value.id;
          break;
        case 'Judges':
          judgeId = selection.value.id;
          break;
        case 'Charges':
        case 'Charge Groups':
          chargeId = selection.value.id;
          break;
      }
    });
    
    return { courtId, judgeId, chargeId };
  }, [currentSelections]);
  
  const parseSelectionsFromUrl = useCallback(() => {
    const selectionsParam = searchParams.get('selections');
    if (!selectionsParam) {
      console.log('No selections parameter found in URL');
      return [null, null];
    }
    return decodeSelectionsFromBase64(selectionsParam);
  }, [searchParams]);

  // Targeted data fetching function using ref
  const fetchFilteredData = useCallback(async () => {
    try {
      const { courtId, judgeId, chargeId } = getIdsFromSelections();
  
      // Only show loading bar if initial load is complete
      if (initialLoadComplete) {
        setShowLoadingBar(true);
        setProgress(0);
        setTimeout(() => setProgress(30), 80);
      }
  
      const params = new URLSearchParams();
      params.set('courtId', courtId.toString());
      params.set('judgeId', judgeId.toString());
      params.set('chargeId', chargeId.toString());
  
      const response = await fetch(`/api/specification?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
  
      if (initialLoadComplete) setProgress(60);
  
      const responseData = await response.json();
  
      if (responseData.specification && responseData.specification.length > 0) {
        for (const spec of responseData.specification) {
          if (spec.trial_category == 'any') {
            setTotalCases(spec.total_case_dispositions);
            break;
          }
        }
      } else {
        setTotalCases(0);
      }
  
      const transformedData = transformApiResponseToSearchResultData(responseData);
      setData(transformedData);
  
      const prevParams = finalParamsRef.current;
      const currentParams = { courtId, judgeId, chargeId };
  
      if (!prevParams || chargeId !== prevParams.chargeId) {
        let averageApiUrl = `/api/specification?courtId=0&judgeId=0&chargeId=`;
  
        if (chargeId === 0 || (chargeId === 0 && judgeId === 0 && courtId === 0)) {
          averageApiUrl += '0';
        } else {
          averageApiUrl += chargeId.toString();
        }
  
        const averageResponse = await fetch(averageApiUrl);
        if (!averageResponse.ok) throw new Error('Failed to fetch average data');
  
        if (initialLoadComplete) setProgress(90);
  
        const averageApiData = await averageResponse.json();
        const transformedAverageData = transformApiResponseToSearchResultData(averageApiData);
        setAverageData(transformedAverageData);
      } else {
        if (initialLoadComplete) setProgress(90);
      }
  
      finalParamsRef.current = currentParams;
      setLoading(false);
  
      // Always animate to 100% before hiding, with a 0.15s linger at full width
      if (initialLoadComplete) {
        setProgress(100);
        if (loadingBarTimeoutRef.current) clearTimeout(loadingBarTimeoutRef.current);
        loadingBarTimeoutRef.current = setTimeout(() => {
          setShowLoadingBar(false);
          setProgress(0);
        }, 150); // 0.15s linger at full width
      } else {
        setInitialLoadComplete(true);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data. Please try again.');
      setLoading(false);
      // On error, animate to 100% and hide loading bar after 0.15s
      if (initialLoadComplete) {
        setProgress(100);
        if (loadingBarTimeoutRef.current) clearTimeout(loadingBarTimeoutRef.current);
        loadingBarTimeoutRef.current = setTimeout(() => {
          setShowLoadingBar(false);
          setProgress(0);
        }, 150);
      }
    }
  }, [getIdsFromSelections, initialLoadComplete]);

  const syncUrlWithState = useCallback(() => {
    const encoded = encodeSelectionsToBase64(currentSelections);
    const newParams = new URLSearchParams();
    if (encoded) {
      newParams.set('selections', encoded);
    }
    const newUrl = `${window.location.pathname}?${newParams.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [currentSelections]);

  // Initialize selections from URL parameters when searchParams change
  useEffect(() => {
    // Get selections directly from URL parameter
    const initialSelections = parseSelectionsFromUrl();
    setCurrentSelections(initialSelections);
    initializedRef.current = true;
  }, [parseSelectionsFromUrl]);

  // Fetch data and sync URL when selections change
  useEffect(() => {
    // Skip if not initialized yet
    if (!initializedRef.current) return;
    
    fetchFilteredData();
    syncUrlWithState();
  }, [currentSelections, fetchFilteredData, syncUrlWithState]);

  // Reset loading bar if a new fetch is triggered before previous completes
  useEffect(() => {
    return () => {
      if (loadingBarTimeoutRef.current) clearTimeout(loadingBarTimeoutRef.current);
    };
  }, []);
  
  // Add handlers for view mode changes
  const handleDispositionsViewModeChange = (newMode: ViewMode) => {
    setDispositionsViewMode(newMode);
  };
  
  const handleSentencesViewModeChange = (newMode: ViewMode) => {
    setSentencesViewMode(newMode);
  };
  
  const handleBailDisplayModeChange = (value: string) => {
    setBailDisplayMode(value);
  };

  const handleBailViewModeChange = (newMode: ViewMode) => {
    setBailViewMode(newMode);
  };
  
  const handleMotionsViewModeChange = (newMode: ViewMode) => {
    setMotionsViewMode(newMode);
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

  const handleSelectedSentenceTypeChange = (value: string) => {
    setSelectedSentenceType(value);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
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

  // Utility function to determine variability level and color
  const getVariabilityInfo = (caseCount: number) => {
    if (caseCount < 100) {
      return { 
        category: 'extreme',
        label: 'Extreme Variability',
        color: '#e53e3e' // Red
      };
    } else if (caseCount < 500) {
      return { 
        category: 'high',
        label: 'High Variability',
        color: '#dd6b20' // Orange
      };
    } else if (caseCount < 1000) {
      return { 
        category: 'mild',
        label: 'Mild Variability',
        color: '#d69e2e' // Yellow
      };
    } else {
      return { 
        category: 'low',
        label: 'Low Variability',
        color: '#38a169' // Green
      };
    }
  };

  // Non-linear mapping function that converts case counts to bar width percentages
  const calculateExponentialBarWidth = (caseCount: number) => {
    // Define the thresholds and their corresponding percentages
    const thresholds = [
      { count: 0, percentage: 0 },
      { count: 100, percentage: 20 },
      { count: 500, percentage: 50 },
      { count: 1000, percentage: 80 },
      { count: 3000, percentage: 100 }
    ];
    
    // Find the correct segment
    let i = 0;
    while (i < thresholds.length - 1 && caseCount > thresholds[i + 1].count) {
      i++;
    }
    
    // If we're at the maximum threshold or beyond
    if (i === thresholds.length - 1) {
      return thresholds[i].percentage;
    }
    
    // Calculate where we are within this segment (0-1)
    const segmentStart = thresholds[i].count;
    const segmentEnd = thresholds[i + 1].count;
    const segmentRange = segmentEnd - segmentStart;
    const positionInSegment = caseCount - segmentStart;
    const normalizedPosition = positionInSegment / segmentRange;
    
    // Apply exponential curve to this segment (1-e^(-3x) gives a nice curve)
    // Lambda value of 3 gives a reasonable curve shape
    const lambda = 3;
    const exponentialFactor = 1 - Math.exp(-lambda * normalizedPosition);
    
    // Calculate the percentage based on segment bounds and exponential factor
    const startPercentage = thresholds[i].percentage;
    const endPercentage = thresholds[i + 1].percentage;
    const percentageRange = endPercentage - startPercentage;
    
    return startPercentage + percentageRange * exponentialFactor;
  };

  // Calculate width percentage for the bar using exponential distribution
  const calculateBarWidth = (caseCount: number) => {
    return calculateExponentialBarWidth(caseCount);
  };
  
  // Render variability display with bar gauge
  const renderVariabilityDisplay = () => {
    if (loading) {
      return (
        <div className="variability-display">
          <div className="variability-text-row">
            <span className="case-count">Loading...</span>
          </div>
          <div className="variability-bar-container">
            <div className="threshold-markers">
              <div className="marker marker-100"></div>
              <div className="marker marker-500"></div>
              <div className="marker marker-1000"></div>
            </div>
          </div>
        </div>
      );
    }
    
    const { category, label, color } = getVariabilityInfo(totalCases);
    const barWidth = calculateBarWidth(totalCases);
    
    return (
      <div className="variability-display">
        <div className="variability-text-row">
          <span className="case-count">{totalCases.toLocaleString()}</span>
          <span className="case-label">Total Cases</span>
          <span className={`variability-category ${category}`}>{label}</span>
        </div>
        <div className="variability-bar-container">
          <div className="threshold-markers">
            <div className="marker marker-100"></div>
            <div className="marker marker-500"></div>
            <div className="marker marker-1000"></div>
          </div>
          <motion.div 
            className={`variability-bar-fill ${category}`}
            initial={{ width: 0 }}
            animate={{ width: `${barWidth}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="results-page-container">
      <header>
        <Link href="/" className="logo">
          <Image src={Logo} alt="Logo" />
        </Link>
        <div className="search-bar-wrapper">
          <SearchBar 
            selections={currentSelections} 
            onSelectionsChange={setCurrentSelections}
          />
        </div>
      </header>
      {showLoadingBar && (
        <div
          className={`results-loading-bar${progress === 100 ? ' results-loading-bar--hide' : ''}`}
          style={{ width: `${progress}%`, background: 'var(--accent-main)' }}
        />
      )}
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
                  <Tab 
                    label="Bail Decisions" 
                    value="bail"
                    className="results-tab"
                  />
                  <Tab 
                    label="Motions" 
                    value="motions"
                    className="results-tab"
                  />
                </Tabs>
                <VariabilityDisplay
                  loading={loading}
                  totalCases={totalCases}
                  data={data}
                  activeTab={activeTab}
                  dispositionsTrialType={dispositionsTrialType}
                  sentenceDisplayMode={sentenceDisplayMode}
                  selectedSentenceType={selectedSentenceType}
                  bailDisplayMode={bailDisplayMode}
                />
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
                        selectedSentenceType={selectedSentenceType}
                        onSelectedSentenceTypeChange={handleSelectedSentenceTypeChange}
                      />
                    </div>
                  </Paper>
                )}
              </TabPanel>
              
              <TabPanel value="bail" className="results-tab-panel">
                {data && (
                    <Paper className="graph-card" elevation={2}>
                      <div className="results-header">
                        <div className="interaction-section">
                          <ViewModeToggle 
                            viewMode={bailViewMode} 
                            onChange={handleBailViewModeChange} 
                          />
                          <CategoryFilter
                            value={bailDisplayMode}
                            onChange={handleBailDisplayModeChange}
                            label="Display"
                            options={BAIL_DISPLAY_OPTIONS}
                          />
                        </div>
                      </div>
                      <div className="graph-section">
                        <BailTab 
                          data={getDataForViewMode('bail', bailViewMode)} 
                          viewMode={bailViewMode}
                          displayMode={bailDisplayMode}
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