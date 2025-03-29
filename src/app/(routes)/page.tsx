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
import { Autocomplete, TextField, IconButton, Box, Grid, Button, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { useRouter } from 'next/navigation';
import './styles.scss';
import { Charge, Court, Judge } from '@/types';
import { courts, judges } from '@/data';

/**
 * Fetch charges from the API, then transform the property "charge_id" into "id"
 * so that it fits our Charge interface.
 */
const fetchCharges = async (): Promise<Charge[]> => {
  try {
    const response = await fetch('/api/charges');
    if (!response.ok) {
      throw new Error('Failed to fetch charges');
    }
    const data = await response.json();
    // Transform any row { charge_id, name } into { id, name }
    return data.map((c: any) => ({
      severity: c.severity,
      id: c.charge_id,
      name: c.name
    }));
  } catch (error) {
    console.error('Error fetching charges:', error);
    return [];
  }
};

const SearchForm: React.FC = () => {
  // State for form selections
  const [courtroom, setCourtroom] = useState<Court | null>(null);
  const [judge, setJudge] = useState<Judge | null>(null);
  const [charges, setCharges] = useState<(Charge | null)[]>([null]); // Start with one empty charge input

  // State for options data
  const [courtroomOptions, setCourtroomOptions] = useState<Court[]>([]);
  const [judgeOptions, setJudgeOptions] = useState<Judge[]>([]);
  const [chargeOptions, setChargeOptions] = useState<Charge[]>([]);

  // Router for navigation
  const router = useRouter();

  // On mount, load court, judge, and charge data
  useEffect(() => {
    const fetchData = async () => {
      setCourtroomOptions(courts);
      setJudgeOptions(judges);
      const fetchedCharges = await fetchCharges();
      setChargeOptions(fetchedCharges);
    };
    fetchData();
  }, []);

  // Handle selection of a charge in the Autocomplete
  const handleChargeChange = (value: Charge | null, index: number) => {
    const updatedCharges = [...charges];
    updatedCharges[index] = value;
    setCharges(updatedCharges);

    // If the last field is now filled, add another blank input
    if (index === charges.length - 1 && value) {
      setCharges([...updatedCharges, null]);
    }
  };

  // Handle deletion of a particular charge field
  const handleDeleteCharge = (index: number) => {
    const updatedCharges = charges.filter((_, idx) => idx !== index);

    // Ensure at least one blank input remains
    if (updatedCharges.length === 0) {
      updatedCharges.push(null);
    }
    setCharges(updatedCharges);
  };

  // Click handler for the "Search Analytics" button
  const handleSearch = () => {
    // Filter out any null entries
    const validCharges = charges.filter((c) => c !== null);

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

    // Add each charge ID
    if (validCharges.length > 0) {
      let maxSeverityCharge = '';
      let maxSeverity = 0;
      validCharges.forEach(charge => {
        if (charge) {
          if (charge.severity >= maxSeverity) {
            maxSeverity = charge.severity;
            maxSeverityCharge = charge.id.toString();
          }
        }
      });
      params.append('chargeId', maxSeverityCharge);
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
            mb: 3, 
            color: 'var(--primary-dark)',
            fontWeight: 600,
            textAlign: 'center' 
          }}
        >
          Case Analytics Search
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
          <Typography className="search-section-title">
            Case Charges
          </Typography>
          <Typography 
            variant="body2" 
            color="textSecondary"
            sx={{ mb: 2, color: 'var(--text-muted)' }}
          >
            Add one or more charges to analyze. Additional charge fields will appear automatically.
          </Typography>

          {charges.map((charge, index) => (
            <Box key={index} className="charge-item">
              <Autocomplete
                value={charge}
                onChange={(_event, newValue) => handleChargeChange(newValue, index)}
                options={chargeOptions}
                getOptionLabel={(option) => option.name}
                sx={{ flexGrow: 1 }}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label={`Charge ${index + 1}`} 
                    variant="outlined"
                    sx={inputStyles}
                  />
                )}
              />
              {charges.length > 1 && (
                <IconButton
                  aria-label="delete"
                  onClick={() => handleDeleteCharge(index)}
                  className="delete-icon"
                  sx={{
                    color: 'var(--neutral-medium)',
                    '&:hover': { color: 'var(--error)' }
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
          ))}
        </Box>

        {/* Search Button */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: 2
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