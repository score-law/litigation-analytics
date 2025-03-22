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

// Type definitions for data objects
interface Court {
  id: number;
  name: string;
}

interface Judge {
  id: number;
  name: string;
  names: string[];
}

interface Charge {
  id: number;
  name: string;
}

// Static data for courts and judges
const courts: Court[] = [
  { id: 1, name: "BMC Central" },
  { id: 2, name: "BMC Dorchester" },
  { id: 3, name: "BMC East Boston" },
  { id: 4, name: "BMC Roxbury" },
  { id: 5, name: "BMC South Boston" },
  { id: 6, name: "BMC West Roxbury" },
  { id: 7, name: "BMC Charlestown" },
  { id: 8, name: "BMC Brighton" },
];

const known_judges: Judge[] = [
  {"id": 1, "name": "Margaret F Albertson", "names": ["Margaret", "F", "Albertson"]},
  {"id": 2, "name": "David J Breen", "names": ["David", "J", "Breen"]},
  {"id": 3, "name": "James W Coffey", "names": ["James", "W", "Coffey"]},
  {"id": 4, "name": "Kathleen E Coffey", "names": ["Kathleen", "E", "Coffey"]},
  {"id": 5, "name": "Debra A DelVecchio", "names": ["Debra", "A", "DelVecchio"]},
  {"id": 6, "name": "David T Donnelly", "names": ["David", "T", "Donnelly"]},
  {"id": 7, "name": "Maureen Flaherty", "names": ["Maureen", "Flaherty"]},
  {"id": 8, "name": "Kenneth J Fiandaca", "names": ["Kenneth", "J", "Fiandaca"]},
  {"id": 9, "name": "John Garland", "names": ["John", "Garland"]},
  {"id": 10, "name": "Rebeca Gomez-Figueroa", "names": ["Rebeca", "Gomez", "Figueroa"]},
  {"id": 11, "name": "Lisa Grant", "names": ["Lisa", "Grant"]},
  {"id": 12, "name": "Lisa Ann Grant", "names": ["Lisa", "Ann", "Grant"]},
  {"id": 13, "name": "Joseph Griffin", "names": ["Joseph", "Griffin"]},
  {"id": 14, "name": "Shelley Joseph", "names": ["Shelley", "Joseph"]},
  {"id": 15, "name": "Thomas S Kaplanes", "names": ["Thomas", "S", "Kaplanes"]},
  {"id": 16, "name": "Steven Key", "names": ["Steven", "Key"]},
  {"id": 17, "name": "Steven Kim", "names": ["Steven", "Kim"]},
  {"id": 19, "name": "Stephen McClenon", "names": ["Stephen", "McClenon"]},
  {"id": 20, "name": "John E McDonald Jr", "names": ["John", "E", "McDonald", "Jr"]},
  {"id": 21, "name": "David B Poole", "names": ["David", "B", "Poole"]},
  {"id": 22, "name": "Erika P Reis", "names": ["Erika", "P", "Reis"]},
  {"id": 23, "name": "Roberto Ronquillo Jr", "names": ["Roberto", "Ronquillo", "Jr"]},
  {"id": 24, "name": "Richard J Sinnott", "names": ["Richard", "J", "Sinnott"]},
  {"id": 25, "name": "James M Stanton", "names": ["James", "M", "Stanton"]},
  {"id": 26, "name": "Mark H Summerville", "names": ["Mark", "H", "Summerville"]},
  {"id": 27, "name": "Paul Treseler", "names": ["Paul", "Treseler"]},
  {"id": 28, "name": "Jonathan R Tynes", "names": ["Jonathan", "R", "Tynes"]},
  {"id": 29, "name": "Vanessa Vélez", "names": ["Vanessa", "Vélez"]},
  {"id": 30, "name": "Samir Zaganjori", "names": ["Samir", "Zaganjori"]},
  {"id": 31, "name": "Michael C Bolden", "names": ["Michael", "C", "Bolden"]},
  {"id": 32, "name": "Pamela M Dashiell", "names": ["Pamela", "M", "Dashiell"]},
  {"id": 33, "name": "Raymond G Dougan Jr", "names": ["Raymond", "G", "Dougan", "Jr"]},
  {"id": 34, "name": "Mary Ann Driscoll", "names": ["Mary", "Ann", "Driscoll"]},
  {"id": 35, "name": "Annette Forde", "names": ["Annette", "Forde"]},
  {"id": 36, "name": "Serge Georges Jr", "names": ["Serge", "Georges", "Jr"]},
  {"id": 37, "name": "Thomas C Horgan", "names": ["Thomas", "C", "Horgan"]},
  {"id": 38, "name": "Charles R Johnson", "names": ["Charles", "R", "Johnson"]},
  {"id": 39, "name": "Myong J Joun", "names": ["Myong", "J", "Joun"]},
  {"id": 40, "name": "Sally A Kelly", "names": ["Sally", "A", "Kelly"]},
  {"id": 41, "name": "Paul K Leary", "names": ["Paul", "K", "Leary"]},
  {"id": 42, "name": "Tracy L Lyons", "names": ["Tracy", "L", "Lyons"]},
  {"id": 43, "name": "Paul F Mahoney", "names": ["Paul", "F", "Mahoney"]},
  {"id": 44, "name": "Lawrence McCormick", "names": ["Lawrence", "McCormick"]},
  {"id": 45, "name": "Robert J McKenna Jr", "names": ["Robert", "J", "McKenna", "Jr"]},
  {"id": 46, "name": "Paul J McManus", "names": ["Paul", "J", "McManus"]},
  {"id": 47, "name": "Edward R Redd", "names": ["Edward", "R", "Redd"]},
  {"id": 48, "name": "Ernest L Sarason Jr", "names": ["Ernest", "L", "Sarason", "Jr"]},
  {"id": 50, "name": "Debra Shopteese", "names": ["Debra", "Shopteese"]},
  {"id": 51, "name": "Eleanor Coe Sinnott", "names": ["Eleanor", "Coe", "Sinnott"]},
  {"id": 52, "name": "Anthony P Sullivan", "names": ["Anthony", "P", "Sullivan"]},
  {"id": 54, "name": "David Weingarten", "names": ["David", "Weingarten"]},
  {"id": 55, "name": "Milton L Wright Jr", "names": ["Milton", "L", "Wright", "Jr"]},
  {"id": 56, "name": "Patricia E Bernstein", "names": ["Patricia", "E", "Bernstein"]},
  {"id": 57, "name": "Theresa Caprigno", "names": ["Theresa", "Caprigno"]},
  {"id": 58, "name": "Eric Donovan", "names": ["Eric", "Donovan"]},
  {"id": 59, "name": "Gary F Myrick", "names": ["Gary", "F", "Myrick"]},
  {"id": 60, "name": "Catherine K Byrne", "names": ["Catherine", "K", "Byrne"]},
  {"id": 61, "name": "Sheila F Lawn", "names": ["Sheila", "F", "Lawn"]},
  {"id": 62, "name": "George L Shea", "names": ["George", "L", "Shea"]},
  {"id": 63, "name": "Christopher E Phillips", "names": ["Christopher", "E", "Phillips"]},
  {"id": 64, "name": "Myriam Anderson", "names": ["Myriam", "Anderson"]},
  {"id": 65, "name": "Matthew J Nestor", "names": ["Matthew", "J", "Nestor"]},
  {"id": 66, "name": "Ellen Flatley", "names": ["Ellen", "Flatley"]},
  {"id": 67, "name": "Franco J Gobourne", "names": ["Franco", "J", "Gobourne"]},
  {"id": 68, "name": "Warren A Powers", "names": ["Warren", "A", "Powers"]},
  {"id": 69, "name": "Alexander M Early", "names": ["Alexander", "M", "Early"]},
  {"id": 70, "name": "Daniel J Hogan", "names": ["Daniel", "J", "Hogan"]},
  {"id": 71, "name": "Peter M Coyne", "names": ["Peter", "M", "Coyne"]},
  {"id": 72, "name": "William B McDonough", "names": ["William", "B", "McDonough"]},
  {"id": 73, "name": "Kevin W Sandefer", "names": ["Kevin", "W", "Sandefer"]},
  {"id": 74, "name": "Katherine Hartigan", "names": ["Katherine", "Hartigan"]},
  {"id": 75, "name": "Hassan Williams", "names": ["Hassan", "Williams"]},
  {"id": 76, "name": "Elizabeth R Cerda", "names": ["Elizabeth", "R", "Cerda"]},
  {"id": 77, "name": "Courtney Monahan", "names": ["Courtney", "Monahan"]},
  {"id": 78, "name": "Pearl Wong", "names": ["Pearl", "Wong"]},
  {"id": 79, "name": "Brendan Creedon", "names": ["Brendan", "Creedon"]},
  {"id": 80, "name": "Keith Watts", "names": ["Keith", "Watts"]},
  {"id": 81, "name": "Kareem A Morgan", "names": ["Kareem", "A", "Morgan"]},
  {"id": 82, "name": "Justine M Miller", "names": ["Justine", "M", "Miller"]},
  {"id": 83, "name": "Maurin Howard", "names": ["Maurin", "Howard"]},
  {"id": 84, "name": "Jarrad Lawlor", "names": ["Jarrad", "Lawlor"]},
  {"id": 85, "name": "Diana S Velez Harris", "names": ["Diana", "S", "Velez", "Harris"]},
  {"id": 86, "name": "Kristin Nelson", "names": ["Kristin", "Nelson"]},
  {"id": 87, "name": "Benjamin A Nunez", "names": ["Benjamin", "A", "Nunez"]},
  {"id": 88, "name": "Patrick Mulligan", "names": ["Patrick", "Mulligan"]},
  {"id": 89, "name": "Colby Tilley", "names": ["Colby", "Tilley"]},
  {"id": 90, "name": "Terry M Craven", "names": ["Terry", "M", "Craven"]},
  {"id": 91, "name": "Heidi Brieger", "names": ["Heidi", "Brieger"]},
  {"id": 92, "name": "Donald F MacKinnon", "names": ["Donald", "F", "MacKinnon"]},
  {"id": 93, "name": "Timothy H Gailey", "names": ["Timothy", "H", "Gailey"]},
  {"id": 94, "name": "Stacey J Fortes", "names": ["Stacey", "J", "Fortes"]},
  {"id": 95, "name": "David E Frank", "names": ["David", "E", "Frank"]},
  {"id": 96, "name": "Andrew J Burke", "names": ["Andrew", "J", "Burke"]},
  {"id": 97, "name": "Patrick F Mullaney", "names": ["Patrick", "F", "Mullaney"]},
  {"id": 98, "name": "Patty Wong Murphy", "names": ["Patty", "Wong", "Murphy"]},
  {"id": 99, "name": "Peri Nawawi", "names": ["Peri", "Nawawi"]},
  {"id": 100, "name": "Helen J White", "names": ["Helen", "J", "White"]},
  {"id": 101, "name": "Lynn C Rooney", "names": ["Lynn", "C", "Rooney"]},
  {"id": 102, "name": "Dana Pierce", "names": ["Dana", "Pierce"]},
  {"id": 103, "name": "Sarah Kennedy", "names": ["Sarah", "Kennedy"]},
  {"id": 104, "name": "Neil A Hourihan", "names": ["Neil", "A", "Hourihan"]},
  {"id": 105, "name": "Eddie Lee Amos", "names": ["Eddie", "Lee", "Amos"]},
  {"id": 106, "name": "Amanda Ward", "names": ["Amanda", "Ward"]},
  {"id": 107, "name": "Brian Palmucci", "names": ["Brian", "Palmucci"]},
  {"id": 108, "name": "Joshua Wall", "names": ["Joshua", "Wall"]},
  {"id": 109, "name": "William G Farrell", "names": ["William", "G", "Farrell"]},
  {"id": 110, "name": "Asha Z White", "names": ["Asha", "Z", "White"]},
  {"id": 111, "name": "Lloyd Parham", "names": ["Lloyd", "Parham"]},
  {"id": 113, "name": "Benjamin C Barnes", "names": ["Benjamin", "C", "Barnes"]},
  {"id": 114, "name": "Elaine M Gately", "names": ["Elaine", "M", "Gately"]},
  {"id": 115, "name": "J Elizabeth Cremens", "names": ["J", "Elizabeth", "Cremens"]},
  {"id": 116, "name": "Valerie Caldwell", "names": ["Valerie", "Caldwell"]},
  {"id": 118, "name": "Rosalind H Miller", "names": ["Rosalind", "H", "Miller"]},
  {"id": 119, "name": "Michael Coyne", "names": ["Michael", "Coyne"]},
  {"id": 121, "name": "Kenneth M Desmond", "names": ["Kenneth", "M", "Desmond"]},
  {"id": 122, "name": "Robert N Tochka", "names": ["Robert", "N", "Tochka"]},
  {"id": 123, "name": "Shannon Frison", "names": ["Shannon", "Frison"]},
  {"id": 125, "name": "Sydney Hanlon", "names": ["Sydney", "Hanlon"]},
  {"id": 126, "name": "Robert E Baylor", "names": ["Robert", "E", "Baylor"]},
  {"id": 127, "name": "Sandra Penta", "names": ["Sandra", "Penta"]},
  {"id": 128, "name": "Vincent Capolupo", "names": ["Vincent", "Capolupo"]},
  {"id": 129, "name": "Ariel Madaro", "names": ["Ariel", "Madaro"]},
  {"id": 130, "name": "Connor Barusch", "names": ["Connor", "Barusch"]},
  {"id": 131, "name": "Nicholas Brandt", "names": ["Nicholas", "Brandt"]},
  {"id": 132, "name": "William Fitzpatrick", "names": ["William", "Fitzpatrick"]},
  {"id": 133, "name": "Nadine Bennett", "names": ["Nadine", "Bennett"]},
  {"id": 134, "name": "Kevin Lyles", "names": ["Kevin", "Lyles"]},
  {"id": 135, "name": "Emily A Karstetter", "names": ["Emily", "A", "Karstetter"]},
  {"id": 136, "name": "William F Mazanec", "names": ["William", "F", "Mazanec"]},
  {"id": 137, "name": "Martine Carroll", "names": ["Martine", "Carroll"]},
  {"id": 138, "name": "Holly V Broadbent", "names": ["Holly", "V", "Broadbent"]},
  {"id": 139, "name": "Dawn Kelley", "names": ["Dawn", "Kelley"]},
  {"id": 140, "name": "Dennis J Curran", "names": ["Dennis", "J", "Curran"]},
  {"id": 141, "name": "Mitchell H Kaplan", "names": ["Mitchell", "H", "Kaplan"]},
  {"id": 142, "name": "Kevin Russell", "names": ["Kevin", "Russell"]},
  {"id": 145, "name": "Fredy Martinez", "names": ["Fredy", "Martinez"]},
  {"id": 146, "name": "William K Walsh", "names": ["William", "K", "Walsh"]},
  {"id": 148, "name": "Severlin B Singleton", "names": ["Severlin", "B", "Singleton"]}
]

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
      setJudgeOptions(known_judges);
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
      let chargesString = '';
      validCharges.forEach(charge => {
        if (charge) {
          chargesString += charge.id + ','; // Comma-separated list of charge IDs
        }
      });
      params.append('chargeId', chargesString);
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