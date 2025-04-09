'use client';

/**
 * Results Page Component
 *
 * This component displays litigation analytics data through a tabbed interface.
 * It shows data for Dispositions, Sentences, Bail Decisions, and Motions using
 * horizontal bar graphs. Each tab provides interactive visualizations tailored 
 * to different aspects of court case data.
 */
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

import { Box, Tab, Tabs, Typography, Paper, CircularProgress, Accordion, AccordionSummary, AccordionDetails, TextField, Chip, IconButton } from '@mui/material';
import { TabContext, TabPanel } from '@mui/lab';

import ExpandMore from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import GavelIcon from '@mui/icons-material/Gavel';
import CourtIcon from '@mui/icons-material/AccountBalance';
import ChargeIcon from '@mui/icons-material/Person4';
import ChargeGroupsIcon from '@mui/icons-material/Groups2';

import { courts, chargeGroups } from '@/data';
import { SearchResultData, ViewMode, chargeGroup } from '@/types';

import { calculateComparativeDispositionsData, calculateComparativeSentencesData, calculateComparativeBailData, calculateComparativeMotionsData } from '@/utils/dataComparators';
import { transformApiResponseToSearchResultData } from '@/utils/dataTransformers';

import DispositionsTab from '@/components/Dispositions';
import SentencesTab from '@/components/Sentences';
import BailTab from '@/components/Bail';
import MotionsTab from '@/components/Motions';
import ViewModeToggle from '@/components/ViewModeToggle';
import CategoryFilter from '@/components/CategoryFilter';
import SelectionList from '@/components/SelectionList';

import './styles.scss';

const ResultsPage = () => {
  const [activeTab, setActiveTab] = useState('dispositions');
  const [data, setData] = useState<SearchResultData | null>(null);
  const [averageData, setAverageData] = useState<SearchResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCases, setTotalCases] = useState<number>(0);
  
  const searchParams = useSearchParams();
  
  // State variables for filters (primary source of truth)
  const [selectedCourtId, setSelectedCourtId] = useState<number>(
    parseInt(searchParams.get('courtId') || '0')
  );
  const [selectedJudgeId, setSelectedJudgeId] = useState<number>(
    parseInt(searchParams.get('judgeId') || '0')
  );
  const [selectedChargeId, setSelectedChargeId] = useState<number>(
    parseInt(searchParams.get('chargeId') || '0')
  );
  
  // tracking charge name
  const [chargeName, setChargeName] = useState<string>('');
  const [judgeName, setJudgeName] = useState<string>('');
  
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
  const [bailDisplayMode, setBailDisplayMode] = useState<string>("frequency");
  const [motionsPartyType, setMotionsPartyType] = useState<string>("all");
  
  // State for accordion expansion
  const [courtAccordionExpanded, setCourtAccordionExpanded] = useState<boolean>(false);
  const [judgeAccordionExpanded, setJudgeAccordionExpanded] = useState<boolean>(false);
  const [chargeAccordionExpanded, setChargeAccordionExpanded] = useState<boolean>(false);

  // State for search terms
  const [courtSearchTerm, setCourtSearchTerm] = useState('');
  const [judgeSearchTerm, setJudgeSearchTerm] = useState('');
  const [chargeSearchTerm, setChargeSearchTerm] = useState('');

  // Added debounced charge search term state
  const [debouncedChargeSearchTerm, setDebouncedChargeSearchTerm] = useState('');
  // Added typing state for loading indicator
  const [isTypingCharge, setIsTypingCharge] = useState(false);

  const [debouncedJudgeSearchTerm, setDebouncedJudgeSearchTerm] = useState('');
  const [isTypingJudge, setIsTypingJudge] = useState(false);

  // New state for selection lists
  const [visibleCourts, setVisibleCourts] = useState<Array<{ id: number; name: string }>>([]);
  const [visibleJudges, setVisibleJudges] = useState<Array<{ id: number; name: string }>>([]);
  const [visibleCharges, setVisibleCharges] = useState<Array<{ id: number; name: string }>>([]);
  
  // State for loading indicators
  const [loadingCourts, setLoadingCourts] = useState<boolean>(false);
  const [loadingJudges, setLoadingJudges] = useState<boolean>(false);
  const [loadingCharges, setLoadingCharges] = useState<boolean>(false);
  
  // State for loading more items
  const [hasMoreCourts, setHasMoreCourts] = useState<boolean>(true);
  const [hasMoreJudges, setHasMoreJudges] = useState<boolean>(true);
  const [hasMoreCharges, setHasMoreCharges] = useState<boolean>(true);

  // Charge Group Accordion states
  const [chargeGroupAccordionExpanded, setChargeGroupAccordionExpanded] = useState<boolean>(false);
  const [chargeGroupSearchTerm, setChargeGroupSearchTerm] = useState('');
  const [debouncedChargeGroupSearchTerm, setDebouncedChargeGroupSearchTerm] = useState('');
  const [isTypingChargeGroup, setIsTypingChargeGroup] = useState(false);

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

  // Add BAIL_DISPLAY_OPTIONS constant
  const BAIL_DISPLAY_OPTIONS = [
    { value: "frequency", label: "Frequency" },
    { value: "severity", label: "Severity" }
  ];
    
  const PARTY_OPTIONS = [
    { value: "all", label: "All Parties" },
    { value: "prosecution", label: "Prosecution" },
    { value: "defense", label: "Defense" }
  ];

  const filteredChargeGroups = chargeGroups.map(group => {
    return {
      id: (group.type == "chapter" ? group.id + 1000 : group.id),
      name: group.name,
      type: group.type,
    };
  })
  
  // Targeted data fetching function with minimal state updates
  const fetchFilteredData = useCallback(async (court: number, judge: number, charge: number) => {
    try {
      const params = new URLSearchParams();
      params.set('courtId', court.toString());
      params.set('judgeId', judge.toString());
      params.set('chargeId', charge.toString());
      
      const response = await fetch(`/api/specification?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const responseData = await response.json();

      // Extract total cases from the first specification record or set to 0 if none
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
      
      // Transform both API responses
      const transformedData = transformApiResponseToSearchResultData(responseData);

      setData(transformedData);

      if (charge != finalParams?.chargeId) {
        let averageApiUrl;
        if (charge == 0 || charge != 0 && judge == 0 && court == 0) {
          averageApiUrl = `/api/specification?courtId=0&judgeId=0&chargeId=0`;
        }
        else {
          averageApiUrl = `/api/specification?courtId=0&judgeId=0&chargeId=${
            charge.toString()
          }`;
        }
        
        // Fetch the average data
        const averageResponse = await fetch(averageApiUrl);
        
        if (!averageResponse.ok) {
          throw new Error(`API error: ${averageResponse.status}`);
        }
        
        const averageApiData = await averageResponse.json();

        console.log('Average API response:', averageApiData);
        
        // Transform both API responses
        const transformedAverageData = transformApiResponseToSearchResultData(averageApiData);
        
        setAverageData(transformedAverageData);
      }

      if (loading) {
        setLoading(false)
      }

      // Update finalParams for reference
      setFinalParams({
        courtId: court,
        judgeId: judge,
        chargeId: charge,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data. Please try again.');
    }
  }, [finalParams]);

  // Function to update URL without triggering re-fetches
  const syncUrlWithState = useCallback(() => {
    const newParams = new URLSearchParams();
    newParams.set('courtId', selectedCourtId.toString());
    newParams.set('judgeId', selectedJudgeId.toString());
    newParams.set('chargeId', selectedChargeId.toString());
    
    const newUrl = `${window.location.pathname}?${newParams.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [selectedCourtId, selectedJudgeId, selectedChargeId]);

  // Sync URL with state whenever selection changes
  useEffect(() => {
    fetchFilteredData(selectedCourtId, selectedJudgeId, selectedChargeId);
    syncUrlWithState();
  }, [selectedCourtId, selectedJudgeId, selectedChargeId, syncUrlWithState]);
  
  // Debounce effect for charge search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedChargeSearchTerm(chargeSearchTerm);
      setIsTypingCharge(false);
    }, 500); // 500ms debounce delay
    
    return () => {
      clearTimeout(timer);
    };
  }, [chargeSearchTerm]);

  // Add debounce effect for judge search (similar to charge search)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedJudgeSearchTerm(judgeSearchTerm);
      setIsTypingJudge(false);
    }, 500); // 500ms debounce delay
    
    return () => {
      clearTimeout(timer);
    };
  }, [judgeSearchTerm]);
  
  // Initialize court options with real data
  useEffect(() => {
    // Load first 20 courts
    setVisibleCourts(courts.slice(0, 20));
    setHasMoreCourts(courts.length > 20);
  }, []);

  // Updated to use debouncedChargeSearchTerm instead of chargeSearchTerm
  useEffect(() => {
    const fetchInitialCharges = async () => {
      setLoadingCharges(true);
      try {
        // API call to get first 20 charges
        const response = await fetch(
          `/api/charges?limit=20&offset=0${debouncedChargeSearchTerm ? `&search=${encodeURIComponent(debouncedChargeSearchTerm)}` : ''}`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch charges: ${response.status}`);
        }
        
        const data = await response.json();
        setVisibleCharges(data.charges);
        setHasMoreCharges(data.total > data.charges.length);
      } catch (error) {
        console.error("Failed to fetch charges:", error);
      } finally {
        setLoadingCharges(false);
      }
    };
    
    fetchInitialCharges();
  }, [debouncedChargeSearchTerm]);

  // Update the useEffect for initial judge loading to use the API
  useEffect(() => {
    const fetchInitialJudges = async () => {
      setLoadingJudges(true);
      try {
        // API call to get first 20 judges
        const response = await fetch(
          `/api/judges?limit=20&offset=0${debouncedJudgeSearchTerm ? `&search=${encodeURIComponent(debouncedJudgeSearchTerm)}` : ''}`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch judges: ${response.status}`);
        }
        
        const data = await response.json();
        setVisibleJudges(data.judges);
        setHasMoreJudges(data.total > data.judges.length);
      } catch (error) {
        console.error("Failed to fetch judges:", error);
      } finally {
        setLoadingJudges(false);
      }
    };
    
    fetchInitialJudges();
  }, [debouncedJudgeSearchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedChargeGroupSearchTerm(chargeGroupSearchTerm);
      setIsTypingChargeGroup(false);
    }, 500); // 500ms debounce delay
    
    return () => {
      clearTimeout(timer);
    };
  }, [chargeGroupSearchTerm]);

  // Handler for loading more courts with real pagination
  const loadMoreCourts = () => {
    setLoadingCourts(true);
    
    // Short timeout to prevent UI freezing
    setTimeout(() => {
      const currentLength = visibleCourts.length;
      const nextItems = courts.slice(currentLength, currentLength + 20);
      
      setVisibleCourts(prev => [...prev, ...nextItems]);
      setHasMoreCourts(currentLength + nextItems.length < courts.length);
      setLoadingCourts(false);
    }, 100);
  };

  // Handler for loading more judges with real pagination
  const loadMoreJudges = async () => {
    setLoadingJudges(true);
    
    try {
      const currentLength = visibleJudges.length;
      const response = await fetch(
        `/api/judges?limit=20&offset=${currentLength}${debouncedJudgeSearchTerm ? `&search=${encodeURIComponent(debouncedJudgeSearchTerm)}` : ''}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch more judges: ${response.status}`);
      }
      
      const data = await response.json();
      setVisibleJudges(prev => [...prev, ...data.judges]);
      setHasMoreJudges(currentLength + data.judges.length < data.total);
    } catch (error) {
      console.error("Failed to fetch more judges:", error);
    } finally {
      setLoadingJudges(false);
    }
  };

  // Handler for loading more charges with API pagination
  const loadMoreCharges = async () => {
    setLoadingCharges(true);
    
    try {
      const currentLength = visibleCharges.length;
      const response = await fetch(
        `/api/charges?limit=20&offset=${currentLength}${debouncedChargeSearchTerm ? `&search=${encodeURIComponent(debouncedChargeSearchTerm)}` : ''}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch more charges: ${response.status}`);
      }
      
      const data = await response.json();
      setVisibleCharges(prev => [...prev, ...data.charges]);
      setHasMoreCharges(currentLength + data.charges.length < data.total);
    } catch (error) {
      console.error("Failed to fetch more charges:", error);
    } finally {
      setLoadingCharges(false);
    }
  };




  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };




  // Handle charge search input change
  const handleChargeSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChargeSearchTerm(e.target.value);
    setIsTypingCharge(true);
  };

  const handleJudgeSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setJudgeSearchTerm(e.target.value);
    setIsTypingJudge(true);
  };

  const handleChargeGroupSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChargeGroupSearchTerm(e.target.value);
    setIsTypingChargeGroup(true);
  };



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

  const handleChargeGroupAccordionChange = (event: React.SyntheticEvent, isExpanded: boolean) => {
    setChargeGroupAccordionExpanded(isExpanded);
  };



  
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
  
  // Handler for court selection
  const handleCourtSelect = (id: number) => {
    setSelectedCourtId(id);
  };

  // Handler for judge selection
  const handleJudgeSelect = (id: number) => {
    setSelectedJudgeId(id);
  };

  // Handler for charge selection
  const handleChargeSelect = (id: number) => {
    setSelectedChargeId(id);
  };

  const handleChargeGroupSelect = (id: number) => {
    const selectedItem = filteredChargeGroups.find(item => item.id === id);
    
    if (selectedItem) {
      // Update selected ID and name
      setSelectedChargeId(id);
      
      // Clear charge selection for mutual exclusivity
      setChargeName('');
    }
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

  // Track charge name when selectedChargeId changes
  useEffect(() => {
    if (selectedChargeId === 0) {
      setChargeName('');
      return;
    }
    
    const selectedCharge = visibleCharges.find(charge => charge.id === (selectedChargeId - 2000));
    if (selectedCharge) {
      setChargeName(selectedCharge.name);
    } else {
      // If not found in the visible charges, fetch it
      const fetchChargeName = async () => {
        try {
          const response = await fetch(`/api/charges/${selectedChargeId}`);
          if (response.ok) {
            const data = await response.json();
            setChargeName(data.name);
          }
        } catch (error) {
          console.error("Error fetching charge name:", error);
        }
      };
      
      fetchChargeName();
    }
  }, [selectedChargeId, visibleCharges])

  useEffect(() => {
    if (selectedJudgeId === 0) {
      setJudgeName('');
      return;
    }
    
    const selectedJudge = visibleJudges.find(judge => judge.id === selectedJudgeId);
    if (selectedJudge) {
      setJudgeName(selectedJudge.name);
    } else {
      // If not found in the visible judges, fetch it
      const fetchJudgeName = async () => {
        try {
          const response = await fetch(`/api/judges?judgeId=${selectedJudgeId}`);
          if (response.ok) {
            const data = await response.json();
            setJudgeName(data.name);
          }
        } catch (error) {
          console.error("Error fetching judge name:", error);
        }
      };
      
      fetchJudgeName();
    }
  }, [selectedJudgeId, visibleJudges]);

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
              Filter by Category
            </Typography>
            
            {/* Court Accordion */}
            <Accordion 
              expanded={courtAccordionExpanded}
              onChange={handleCourtAccordionChange}
              className="filter-accordion"
            >
              <AccordionSummary
                expandIcon={<ExpandMore className="custom-expand-icon" />}
                aria-controls="court-filter-content"
                id="court-filter-header"
                sx={{
                  display: 'grid',
                  gridTemplateAreas: `
                    "title expandIcon"
                    "selection selection"
                  `,
                  gridTemplateColumns: '1fr auto',
                  alignItems: 'start',
                  '& .MuiAccordionSummary-content': {
                    display: 'contents',
                  }
                }}
              >
                <Typography className='accordion-title'>
                  <CourtIcon fontSize="small" className='icon' />
                  Court
                </Typography>
                
                {selectedCourtId !== 0 && (
                  <Box 
                    onClick={(e) => e.stopPropagation()} // Prevent accordion toggle when clicking on this box
                  >
                    <Typography>
                      {visibleCourts.find(c => c.id === selectedCourtId)?.name || 'Selected Court'}
                    </Typography>
                    <IconButton 
                      className='delete-icon'
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCourtSelect(0);
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </AccordionSummary>
              <AccordionDetails>
                {courtAccordionExpanded && (
                  <>
                    <TextField 
                      label="Search Courts"
                      variant="outlined"
                      fullWidth
                      size="small"
                      value={courtSearchTerm}
                      onChange={(e) => setCourtSearchTerm(e.target.value)}
                      sx={{
                        mt: 0,
                        mb: 0,
                        '& .MuiOutlinedInput-root': {
                          borderBottomLeftRadius: 0,
                          borderBottomRightRadius: 0,
                        }
                      }}
                    />
                    <SelectionList
                      items={visibleCourts.filter(court => 
                        court.name.toLowerCase().includes(courtSearchTerm.toLowerCase()) && 
                        court.id !== selectedCourtId
                      )}
                      selectedId={finalParams?.courtId || 0}
                      onSelect={handleCourtSelect}
                      searchTerm={courtSearchTerm}
                      loading={loadingCourts}
                      loadMore={loadMoreCourts}
                      hasMore={hasMoreCourts}
                      type="court"
                    />
                  </>
                )}
              </AccordionDetails>
            </Accordion>
            
            {/* Judge Accordion */}
            <Accordion 
              expanded={judgeAccordionExpanded}
              onChange={handleJudgeAccordionChange}
              className="filter-accordion"
            >
              <AccordionSummary 
                expandIcon={<ExpandMore className="custom-expand-icon" />}
                aria-controls="judge-filter-content"
                id="judge-filter-header"
                sx={{
                  display: 'grid',
                  gridTemplateAreas: `
                    "title expandIcon"
                    "selection selection"
                  `,
                  gridTemplateColumns: '1fr auto',
                  alignItems: 'start',
                  '& .MuiAccordionSummary-content': {
                    display: 'contents',
                  }
                }}
              >
                <Typography className='accordion-title'>
                  <GavelIcon fontSize="small" className='icon' />
                  Judge
                </Typography>
                
                {selectedJudgeId !== 0 && (
                  <Box 
                    onClick={(e) => e.stopPropagation()} // Prevent accordion toggle when clicking on this box
                  >
                    <Typography>
                      {judgeName || 'Selected Judge'}
                    </Typography>
                    <IconButton 
                      className='delete-icon'
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJudgeSelect(0);
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </AccordionSummary>
              <AccordionDetails>
                {judgeAccordionExpanded && (
                  <>
                    <TextField 
                      label="Search Judges"
                      variant="outlined"
                      fullWidth
                      size="small"
                      value={judgeSearchTerm}
                      onChange={handleJudgeSearch}
                      InputProps={{
                        endAdornment: isTypingJudge ? <CircularProgress size={20} /> : null
                      }}
                      sx={{
                        mt: 0,
                        mb: 0,
                        '& .MuiOutlinedInput-root': {
                          borderBottomLeftRadius: 0,
                          borderBottomRightRadius: 0,
                        }
                      }}
                    />
                    <SelectionList
                      items={visibleJudges.filter(judge => 
                        judge.name.toLowerCase().includes(judgeSearchTerm.toLowerCase()) && 
                        judge.id !== selectedJudgeId
                      )}
                      selectedId={finalParams?.judgeId || 0}
                      onSelect={handleJudgeSelect}
                      searchTerm={judgeSearchTerm}
                      loading={loadingJudges}
                      loadMore={loadMoreJudges}
                      hasMore={hasMoreJudges}
                      type="judge"
                    />
                  </>
                )}
              </AccordionDetails>
            </Accordion>
            
            {/* Charge Accordion */}
            <Accordion 
              expanded={chargeAccordionExpanded}
              onChange={handleChargeAccordionChange}
              className="filter-accordion"
            >
              <AccordionSummary
                expandIcon={<ExpandMore className="custom-expand-icon" />}
                aria-controls="charge-filter-content"
                id="charge-filter-header"
                sx={{
                  display: 'grid',
                  gridTemplateAreas: `
                    "title expandIcon"
                    "selection selection"
                  `,
                  gridTemplateColumns: '1fr auto',
                  alignItems: 'start',
                  '& .MuiAccordionSummary-content': {
                    display: 'contents',
                  }
                }}
              >
                <Typography className='accordion-title'>
                  <ChargeIcon fontSize="small" className='icon' />
                  Charge
                </Typography>
                
                {selectedChargeId >= 2000 && (
                  <Box 
                    onClick={(e) => e.stopPropagation()} // Prevent accordion toggle when clicking on this box
                  >
                    <Typography>
                      {chargeName || 'Selected Charge'}
                    </Typography>
                    <IconButton
                      className='delete-icon'
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChargeSelect(0);
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </AccordionSummary>
              <AccordionDetails>
                {chargeAccordionExpanded && (
                  <>
                    <TextField 
                      label="Search Charges"
                      variant="outlined"
                      fullWidth
                      size="small"
                      value={chargeSearchTerm}
                      onChange={handleChargeSearch}
                      InputProps={{
                        endAdornment: isTypingCharge ? <CircularProgress size={20} /> : null
                      }}
                      sx={{
                        mt: 0,
                        mb: 0,
                        '& .MuiOutlinedInput-root': {
                          borderBottomLeftRadius: 0,
                          borderBottomRightRadius: 0,
                        }
                      }}
                    />
                    <SelectionList
                      items={visibleCharges.filter(charge => 
                        charge.name.toLowerCase().includes(chargeSearchTerm.toLowerCase()) && 
                        (charge.id + 2000 !== selectedChargeId)
                      ).map(item => ({
                        id: item.id + 2000,
                        name: item.name,
                      }))}
                      selectedId={finalParams?.chargeId || 0}
                      onSelect={handleChargeSelect}
                      searchTerm={debouncedChargeSearchTerm}
                      loading={loadingCharges}
                      loadMore={loadMoreCharges}
                      hasMore={hasMoreCharges}
                      type="charge"
                    />
                  </>
                )}
              </AccordionDetails>
            </Accordion>

              
            {/* Charge Group Accordion */}
            <Accordion 
              expanded={chargeGroupAccordionExpanded}
              onChange={handleChargeGroupAccordionChange}
              className="filter-accordion"
            >
              <AccordionSummary
                expandIcon={<ExpandMore className="custom-expand-icon" />}
                aria-controls="charge-group-filter-content"
                id="charge-group-filter-header"
                sx={{
                  display: 'grid',
                  gridTemplateAreas: `
                    "title expandIcon"
                    "selection selection"
                  `,
                  gridTemplateColumns: '1fr auto',
                  alignItems: 'start',
                  '& .MuiAccordionSummary-content': {
                    display: 'contents',
                  }
                }}
              >
                <Typography className='accordion-title'>
                  <ChargeGroupsIcon fontSize="small" className='icon' />
                  Charge Group
                </Typography>
                
                {(selectedChargeId !== 0 && selectedChargeId < 2000) && (
                  <Box 
                    onClick={(e) => e.stopPropagation()} // Prevent accordion toggle when clicking on this box
                  >
                    <Typography>
                      {filteredChargeGroups.find(c => c.id === selectedChargeId)?.name || 'Selected Charge Group'}
                    </Typography>
                    <IconButton
                      className='delete-icon'
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedChargeId(0);
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </AccordionSummary>
              <AccordionDetails>
                {chargeGroupAccordionExpanded && (
                  <>
                    <TextField 
                      label="Search Charge Groups"
                      variant="outlined"
                      fullWidth
                      size="small"
                      value={chargeGroupSearchTerm}
                      onChange={handleChargeGroupSearch}
                      InputProps={{
                        endAdornment: isTypingChargeGroup ? <CircularProgress size={20} /> : null
                      }}
                      sx={{
                        mt: 0,
                        mb: 0,
                        '& .MuiOutlinedInput-root': {
                          borderBottomLeftRadius: 0,
                          borderBottomRightRadius: 0,
                        }
                      }}
                    />
                    <SelectionList
                      items={filteredChargeGroups
                        .filter(item => 
                          item.name.toLowerCase().includes(chargeGroupSearchTerm.toLowerCase()) && 
                          (item.id !== selectedChargeId)
                        )}
                      selectedId={selectedChargeId}
                      onSelect={handleChargeGroupSelect}
                      searchTerm={chargeGroupSearchTerm}
                      loading={false}
                      loadMore={() => {}} // No load more needed, all items are loaded at once
                      hasMore={false}
                      type="charge"
                    />
                  </>
                )}
              </AccordionDetails>
            </Accordion>
          </Box>
          <Box className="tab-container">
            <TabContext value={activeTab}>
              <Box className="results-tabs-container">
                <div className="specification-title-text">
                  {loading ? "Loading..." : `${totalCases.toLocaleString()} Total Cases`}
                </div>
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