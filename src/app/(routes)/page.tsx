'use client'
/**
 * SearchForm Component
 *
 * This component implements the search page UI for the Litigation Analytics Tool.
 * It provides inputs for Courtroom, Judge, and dynamic Charges using MUI components.
 * Dynamic Charges allow users to add or remove charge inputs. The form connects to 
 * real data sources and navigates to the results page with search parameters upon submission.
 */

import React, { useState, useEffect } from 'react';
import { Autocomplete, TextField, IconButton, Box, Grid, Button, Typography, CircularProgress } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { useRouter } from 'next/navigation';
import './styles.scss';
import { Charge, Court, Judge } from '@/types';
import { courts, judges } from '@/data';
import { Delete } from '@mui/icons-material';

/**
 * Fetch charges from the API with pagination and search support.
 * Transforms the response to match the Charge interface.
 * 
 * @param search - Optional search term to filter charges
 * @param limit - Number of results to return per page
 * @param offset - Starting position for pagination
 * @returns Object containing charges array and total count
 */
const fetchCharges = async (
  search: string = '',
  limit: number = 20,
  offset: number = 0
): Promise<{ charges: Charge[], total: number }> => {
  try {
    // Build URL with query parameters
    const url = new URL('/api/charges', window.location.origin);
    if (search) url.searchParams.append('search', search);
    if (limit > 0) url.searchParams.append('limit', limit.toString());
    if (offset > 0) url.searchParams.append('offset', offset.toString());
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch charges');
    }
    
    const data = await response.json();
    
    // Handle both paginated responses and legacy responses
    if (data.charges && data.total !== undefined) {
      // Transform API response to match Charge interface
      const transformedCharges = data.charges.map((c: any) => ({
        id: c.id,
        name: c.name,
        severity: c.severity || 0 // Default to 0 if not provided
      }));
      
      return {
        charges: transformedCharges,
        total: data.total
      };
    } else {
      // Handle legacy response (array of charges)
      const transformedCharges = data.map((c: any) => ({
        id: c.id || c.charge_id, // Handle both formats
        name: c.name,
        severity: c.severity || 0 // Default to 0 if not provided
      }));
      
      return {
        charges: transformedCharges,
        total: transformedCharges.length
      };
    }
  } catch (error) {
    console.error('Error fetching charges:', error);
    return { charges: [], total: 0 };
  }
};

const SearchForm: React.FC = () => {
  // State for form selections
  const [courtroom, setCourtroom] = useState<Court | null>(null);
  const [judge, setJudge] = useState<Judge | null>(null);

  const [selectedCharge, setSelectedCharge] = useState<Charge | null>(null);

  // State for options data
  const [courtroomOptions, setCourtroomOptions] = useState<Court[]>([]);
  const [judgeOptions, setJudgeOptions] = useState<Judge[]>([]);
  
  // New state for charge search and pagination
  const [chargeSearchTerm, setChargeSearchTerm] = useState('');
  const [debouncedChargeSearchTerm, setDebouncedChargeSearchTerm] = useState('');
  const [isTypingCharge, setIsTypingCharge] = useState(false);
  const [visibleCharges, setVisibleCharges] = useState<Charge[]>([]);
  const [loadingCharges, setLoadingCharges] = useState(false);
  const [hasMoreCharges, setHasMoreCharges] = useState(true);

  // Router for navigation
  const router = useRouter();

  // Debounce effect for charge search
  useEffect(() => {
    setIsTypingCharge(true);
    
    const timer = setTimeout(() => {
      setDebouncedChargeSearchTerm(chargeSearchTerm);
      setIsTypingCharge(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [chargeSearchTerm]);

  // Load charges when debounced search term changes
  useEffect(() => {
    // Reset visible charges when search term changes
    setVisibleCharges([]);
    loadInitialCharges(debouncedChargeSearchTerm);
  }, [debouncedChargeSearchTerm]);

  // On mount, load court and judge data
  useEffect(() => {
    const fetchData = async () => {
      setCourtroomOptions(courts);
      setJudgeOptions(judges);
      // Initial charge loading is now handled by the debounced search effect
    };
    fetchData();
  }, []);

  /**
   * Load the initial set of charges, optionally filtered by search term
   */
  const loadInitialCharges = async (search: string = '') => {
    setLoadingCharges(true);
    try {
      const { charges, total } = await fetchCharges(search);
      setVisibleCharges(charges);
      setHasMoreCharges(charges.length < total);
    } catch (error) {
      console.error('Error loading initial charges:', error);
    } finally {
      setLoadingCharges(false);
    }
  };

  /**
   * Load more charges when scrolling (for infinite scrolling)
   */
  const loadMoreCharges = async () => {
    if (loadingCharges || !hasMoreCharges) return;
    
    setLoadingCharges(true);
    try {
      const { charges, total } = await fetchCharges(
        debouncedChargeSearchTerm, 
        20, 
        visibleCharges.length
      );
      
      setVisibleCharges(prev => [...prev, ...charges]);
      setHasMoreCharges(visibleCharges.length + charges.length < total);
    } catch (error) {
      console.error('Error loading more charges:', error);
    } finally {
      setLoadingCharges(false);
    }
  };

  // Handle selection of a charge in the Autocomplete
  const handleChargeChange = (value: Charge | null) => {
    setSelectedCharge(value);
  };

  const handleChargeSearch = (_event: React.SyntheticEvent<Element, Event>, value: string) => {
    setChargeSearchTerm(value);
  };

  const handleSearch = () => {
    // Build query params
    const params = new URLSearchParams();
  
    // Add courtroom ID if selected
    if (courtroom) {
      params.append('courtId', courtroom.id.toString());
    }
  
    // Add judge ID if selected
    if (judge) {
      params.append('judgeId', judge.id.toString());
    }
  
    // Add charge ID if selected
    if (selectedCharge) {
      params.append('chargeId', selectedCharge.id.toString());
    }
  
    // Redirect to /results with the query string
    router.push(`/results?${params.toString()}`);
  };

  // Styles for MUI TextField focus/hover
  const inputStyles = {
    '& .MuiOutlinedInput-root': {
      '&:hover fieldset': {
        borderColor: 'var(--accent-main)',
      },
      '&.Mui-focused fieldset': {
        borderColor: 'var(--accent-main)',
        boxShadow: 'var(--focused-shadow)',
      },
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: 'var(--accent-main)',
    },
  };

  return (
    <div className="search-container">
      <Box sx={{ padding: { xs: 2, sm: 3, md: 4 } }} className="search-form">
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            mb: 1, 
            color: 'var(--primary-dark)',
            fontWeight: 600,
            textAlign: 'center' 
          }}
        >
          Case Analytics Search
        </Typography>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            mb: 3, 
            color: 'var(--neutral-dark)', 
            textAlign: 'center' 
          }}
        >
          Search for case analytics by selecting any combination of a courtroom, judge, and/or charges.
        </Typography>

        {/* Court and Judge Section */}
        <Box className="search-section">
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Autocomplete
                value={courtroom}
                onChange={(_event, newValue) => setCourtroom(newValue)}
                options={courtroomOptions}
                getOptionLabel={(option) => option.name}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Courtroom" 
                    variant="outlined"
                    fullWidth
                    sx={inputStyles}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                value={judge}
                onChange={(_event, newValue) => setJudge(newValue)}
                options={judgeOptions}
                getOptionLabel={(option) => option.name}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Judge" 
                    variant="outlined"
                    fullWidth
                    sx={inputStyles}
                  />
                )}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Charges Section */}
        <Box className="search-section">
          <Box sx={{ position: 'relative', mb: 1 }}>
            <Autocomplete
              value={selectedCharge}
              onChange={(_event, newValue) => handleChargeChange(newValue)}
              options={visibleCharges}
              getOptionLabel={(option) => option.name}
              loading={loadingCharges || isTypingCharge}
              onInputChange={handleChargeSearch}
              filterOptions={(x) => x} // Disable built-in filtering
              renderInput={(params) => (
                <TextField 
                  {...params}
                  label="Charge"
                  variant="outlined"
                  sx={inputStyles}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {(loadingCharges || isTypingCharge) && <CircularProgress color="inherit" size={20} />}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              ListboxProps={{
                onScroll: (event) => {
                  const listboxNode = event.currentTarget;
                  if (
                    listboxNode.scrollTop + listboxNode.clientHeight >= listboxNode.scrollHeight - 20 &&
                    hasMoreCharges &&
                    !loadingCharges
                  ) {
                    loadMoreCharges();
                  }
                },
              }}
            />
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Button
            variant="contained"
            size="large"
            className="search-button"
            onClick={handleSearch}
            startIcon={<SearchIcon />}
            sx={{
              backgroundColor: 'var(--accent-main)',
              '&:hover': {
                backgroundColor: 'var(--accent-hover)',
              },
              padding: '10px 24px',
              borderRadius: '4px',
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            Search Analytics
          </Button>
        </Box>
      </Box>
    </div>
  );
};

export default SearchForm;