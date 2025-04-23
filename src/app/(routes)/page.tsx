'use client'
/**
 * SearchForm Component
 *
 * This component implements the search page UI for the Litigation Analytics Tool.
 * It provides a SearchBar component for selecting Courts, Judges, and Charges.
 * When valid selections are made, users can search and navigate to results.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import SearchIcon from '@mui/icons-material/Search';

import SearchBar from '@/components/SearchBar';

import { encodeSelectionsToBase64 } from '@/utils/paramCoding';

import Link from 'next/link';
import Image from 'next/image';
import Logo from '@/../public/logo.svg';

import './styles.scss';

// Import the Selection type to match SearchBar's type
import { Selection } from '@/types';

const SearchForm: React.FC = () => {
  // Replace individual state variables with unified selections state
  const [selections, setSelections] = useState<Array<Selection | null>>([null, null]);
  
  // Derive whether there's any valid selection for search
  const hasValidSelection = selections.some(selection => 
    selection !== null && selection.type !== null && selection.value !== null
  );

  // Router for navigation
  const router = useRouter();

  // Updated handleSearch function to use selections
  const handleSearch = () => {
    const params = encodeSelectionsToBase64(selections);
    router.push(`/results?selections=${params.toString()}`);
  };

  return (
    <div className="search-page-container">
      <header>
        <Link href="/" className="logo">
          <Image src={Logo} alt="Logo" />
        </Link>
      </header>
      <div className="search-bar-container">
        <div className="search-bar-contain">
          <SearchBar selections={selections} onSelectionsChange={setSelections} />
          <div className="submit-button-container">
            <button
              className={`submit-button ${!hasValidSelection ? 'disabled' : ''}`}
              onClick={handleSearch}
              disabled={!hasValidSelection}
            >
              <SearchIcon fontSize='medium' />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchForm;