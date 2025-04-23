// MUI
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import CircularProgress from '@mui/material/CircularProgress';
import InfiniteScroll from 'react-infinite-scroll-component';
import { SearchResultItem, Selection, SelectionType } from '@/types';

import './styles.scss';

interface SearchBarProps {
  // Changed from initialSelections to selections
  selections?: Array<Selection | null>;
  
  // Callback for when selections change
  onSelectionsChange?: (selections: Array<Selection | null>) => void;
}

export default function SearchBar({ 
  selections = [null, null], 
  onSelectionsChange 
}: SearchBarProps = {}) {
  // Group categories by their logical relationship
  const categoryGroups = {
    locationGroup: ['Judges', 'Courts'],
    chargeGroup: ['Charges', 'Charge Groups']
  };
  
  // Track whether second input is expanded
  const [expanded, setExpanded] = useState<boolean>(!!selections[1]);

  // Track active input for dropdown
  const [activeInputIndex, setActiveInputIndex] = useState<number | null>(null);

  // State to track whether to animate the dropdown
  const [shouldAnimateDropdown, setShouldAnimateDropdown] = useState(false);

  // Track selected category in dropdown
  const [selectedCategory, setSelectedCategory] = useState<SelectionType>('Judges');
  
  // Track disabled categories
  const [disabledCategories, setDisabledCategories] = useState<SelectionType[]>([]);

  // Track search term and debounced search term
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');

  // Refs for positioning and focus management
  const inputRefs = useRef<(HTMLDivElement | null)[]>([null, null]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null]);

  // Ref for scrollable results list
  const resultsListRef = useRef<HTMLDivElement | null>(null);
  // Ref to store last scrollTop
  const lastScrollTopRef = useRef<number>(0);
  // Ref to track if infinite scroll append is in progress
  const isAppendingRef = useRef<boolean>(false);
  // Ref to track previous results length
  const prevResultsLengthRef = useRef<number>(0);

  const [categoryResults, setCategoryResults] = useState<{
    Judges: SearchResultItem[],
    Courts: SearchResultItem[],
    Charges: SearchResultItem[],
    'Charge Groups': SearchResultItem[]
  }>({
    Judges: [],
    Courts: [],
    Charges: [],
    'Charge Groups': []
  });
  
  const [categoryLoading, setCategoryLoading] = useState<{
    Judges: boolean,
    Courts: boolean,
    Charges: boolean,
    'Charge Groups': boolean
  }>({
    Judges: false,
    Courts: false,
    Charges: false,
    'Charge Groups': false
  });
  
  const [categoryErrors, setCategoryErrors] = useState<{
    Judges: string | null,
    Courts: string | null,
    Charges: string | null,
    'Charge Groups': string | null
  }>({
    Judges: null,
    Courts: null,
    Charges: null,
    'Charge Groups': null
  });
  
  const [categoryPagination, setCategoryPagination] = useState<{
    Judges: { hasMore: boolean, offset: number },
    Courts: { hasMore: boolean, offset: number },
    Charges: { hasMore: boolean, offset: number },
    'Charge Groups': { hasMore: boolean, offset: number }
  }>({
    Judges: { hasMore: true, offset: 0 },
    Courts: { hasMore: true, offset: 0 },
    Charges: { hasMore: true, offset: 0 },
    'Charge Groups': { hasMore: true, offset: 0 }
  });
  
  const [categorySearchTerms, setCategorySearchTerms] = useState<{
    Judges: string,
    Courts: string,
    Charges: string,
    'Charge Groups': string
  }>({
    Judges: '',
    Courts: '',
    Charges: '',
    'Charge Groups': ''
  });

  const abortControllersRef = useRef<{
    Judges: AbortController | null,
    Courts: AbortController | null,
    Charges: AbortController | null,
    'Charge Groups': AbortController | null
  }>({
    Judges: null,
    Courts: null,
    Charges: null,
    'Charge Groups': null
  });

  // Effect to update expanded state when selections prop changes
  useEffect(() => {
    setExpanded(!!selections[1]);
  }, [selections]);

  // Function to determine which categories should be disabled
  const getDisabledCategories = (
    currentSelections: Array<Selection | null>,
    activeInputIndex: number | null
  ): SelectionType[] => {
    // If no active input, nothing should be disabled
    if (activeInputIndex === null) return [];
    
    // Find the other input index (the one that's not active)
    const otherInputIndex = activeInputIndex === 0 ? 1 : 0;
    const otherSelection = currentSelections[otherInputIndex];
    
    // If no selection in other input, nothing should be disabled
    if (!otherSelection?.type) return [];
    
    // Special case: if re-selecting an existing input, don't disable its category
    const currentSelection = currentSelections[activeInputIndex];
    
    // Determine which group the other selection belongs to
    let disabledCategories: SelectionType[] = [];
    if (categoryGroups.locationGroup.includes(otherSelection.type)) {
      disabledCategories = categoryGroups.locationGroup as SelectionType[];
    } else if (categoryGroups.chargeGroup.includes(otherSelection.type)) {
      disabledCategories = categoryGroups.chargeGroup as SelectionType[];
    }
    
    // If re-selecting an existing selection, don't disable its category
    if (currentSelection?.type && disabledCategories.includes(currentSelection.type)) {
      return disabledCategories.filter(cat => cat !== currentSelection.type);
    }
    
    return disabledCategories;
  };

  // Effect to update disabled categories when selections or active input changes
  useEffect(() => {
    const newDisabledCategories = getDisabledCategories(selections, activeInputIndex);
    setDisabledCategories(newDisabledCategories);
  }, [selections, activeInputIndex]);

  // Effect to load results when debounced search term changes
  useEffect(() => {
    if (activeInputIndex !== null && selectedCategory) {
      loadResults(selectedCategory, debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, selectedCategory, activeInputIndex]);

  // Handle closing an input (clearing selection)
  const handleClose = (index: number) => {
    if (!onSelectionsChange) return;
    
    if (index === 0 && selections[1]) {
      // Move second selection to first position
      const newSelections = [selections[1], null];
      onSelectionsChange(newSelections);
    } else {
      // Just clear the selection
      const newSelections = [...selections];
      newSelections[index] = null;
      onSelectionsChange(newSelections);
    }
    
    // Collapse if second input is now empty
    if (index === 1 || (index === 0 && !selections[1])) {
      setExpanded(false);
    }
  };

  // Handle clicking on an input (opens dropdown)
  const handleInputClick = (index: number, isCollapsed: boolean) => {
    if (isCollapsed) {
      setExpanded(true);
    }

    setActiveInputIndex(index);
    
    // Determine initial category based on other input's selection
    const otherInputIndex = index === 0 ? 1 : 0;
    const otherSelection = selections[otherInputIndex];
    
    // If other input has a Judge or Court selected, start with Charges
    const initialCategory: SelectionType = (otherSelection?.type && 
      categoryGroups.locationGroup.includes(otherSelection.type)) ? 'Charges' : 'Judges';
    
    setSelectedCategory(initialCategory);
    
    // Set input value to match the stored value for selected category
    if (searchInputRef.current) {
      searchInputRef.current.value = categorySearchTerms[initialCategory];
    }
    
    // Update debounced search term to match
    setDebouncedSearchTerm(categorySearchTerms[initialCategory]);
    
    // Only load initial results if not already loaded
    if (categoryResults[initialCategory].length === 0) {
      loadResults(initialCategory, categorySearchTerms[initialCategory]);
    }
    
    // Reset scroll position when opening dropdown
    if (resultsListRef.current) {
      resultsListRef.current.scrollTop = 0;
    }
  };

  // Handle selection from the dropdown
  const handleSelect = (type: SelectionType, value: any) => {
    if (activeInputIndex !== null && onSelectionsChange) {
      const newSelections = [...selections];
      newSelections[activeInputIndex] = { type, value };
      onSelectionsChange(newSelections);
      setActiveInputIndex(null); // Close dropdown after selection
    }
  };

  // Handle retry when an error occurs
  const handleRetry = () => {
    if (selectedCategory) {
      // Clear only the error for this specific category
      setCategoryErrors(prev => ({
        ...prev,
        [selectedCategory]: null
      }));
      
      // Retry loading results
      loadResults(selectedCategory, debouncedSearchTerm);
    }
  };

  const handleCategorySelect = (category: SelectionType) => {
    if (category !== selectedCategory) {
      setSelectedCategory(category);
      
      // Update the search input value to the saved term for this category
      if (searchInputRef.current && category) {
        searchInputRef.current.value = categorySearchTerms[category];
        
        // Also update the debounced search term to load results
        setDebouncedSearchTerm(categorySearchTerms[category]);
      }
      
      // Check if we need to load results for this category
      if (category && categoryResults[category].length === 0) {
        loadResults(category, categorySearchTerms[category]);
      }
      
      // Reset scroll position when switching categories
      if (resultsListRef.current) {
        resultsListRef.current.scrollTop = 0;
      }
    }
  };

  /**
   * Loads results for a given category and search term.
   * Aborts any previous in-flight request for the same category.
   * Only updates state if the request completes (not aborted).
   */
  const loadResults = async (category: SelectionType, search: string) => {
    if (!category) return;

    // Abort any previous request for this category
    if (abortControllersRef.current[category]) {
      abortControllersRef.current[category]!.abort();
    }
    const controller = new AbortController();
    abortControllersRef.current[category] = controller;

    setCategoryLoading(prev => ({
      ...prev,
      [category]: true
    }));

    setCategoryErrors(prev => ({
      ...prev,
      [category]: null
    }));

    setCategoryPagination(prev => ({
      ...prev,
      [category]: {
        offset: 0,
        hasMore: true
      }
    }));

    try {
      const selected = selections[(activeInputIndex == 0 ? 1 : 0)];
      const selectedCat = selected?.type;
      const selectedVal = selected?.value?.id;
      // Only update if this is the latest request for this category
      const results: SearchResultItem[] = await fetchSearchResults(
        category,
        search,
        selectedCat,
        selectedVal,
        20,
        0,
        controller.signal
      );

      // If aborted, do not update state
      if (controller.signal.aborted) return;

      setCategoryResults(prev => ({
        ...prev,
        [category]: results
      }));

      setCategoryPagination(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          hasMore: results.length === 20
        }
      }));
    } catch (error: any) {
      // Ignore abort errors
      if (error.name === 'AbortError') return;
      console.error(`Error loading ${category} results:`, error);
      setCategoryErrors(prev => ({
        ...prev,
        [category]: `Failed to load ${category}. Please try again.`
      }));
    } finally {
      setCategoryLoading(prev => ({
        ...prev,
        [category]: false
      }));
    }
  };

  /**
   * Loads more results for infinite scrolling.
   * Aborts any previous in-flight request for the same category.
   * Only updates state if the request completes (not aborted).
   */
  const loadMoreResults = async () => {
    if (!selectedCategory) return;

    // Abort any previous request for this category
    if (abortControllersRef.current[selectedCategory]) {
      abortControllersRef.current[selectedCategory]!.abort();
    }
    const controller = new AbortController();
    abortControllersRef.current[selectedCategory] = controller;

    const currentPagination = categoryPagination[selectedCategory];
    if (!currentPagination.hasMore) return;

    const newOffset = currentPagination.offset + 20;

    try {
      const selected = selections[(activeInputIndex == 0 ? 1 : 0)];
      const selectedCat = selected?.type;
      const selectedVal = selected?.value?.id;
      const results: SearchResultItem[] = await fetchSearchResults(
        selectedCategory,
        debouncedSearchTerm,
        selectedCat,
        selectedVal,
        20,
        newOffset,
        controller.signal
      );

      if (controller.signal.aborted) return;

      if (resultsListRef.current) {
        lastScrollTopRef.current = resultsListRef.current.scrollTop;
      }
      isAppendingRef.current = true;

      setCategoryResults(prev => ({
        ...prev,
        [selectedCategory]: [...prev[selectedCategory], ...results]
      }));

      setCategoryPagination(prev => ({
        ...prev,
        [selectedCategory]: {
          ...prev[selectedCategory],
          offset: newOffset,
          hasMore: results.length === 20
        }
      }));
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error(`Error loading more ${selectedCategory} results:`, error);
    }
  };

  // Synchronously restore scroll position after results append
  useLayoutEffect(() => {
    if (
      isAppendingRef.current &&
      resultsListRef.current &&
      selectedCategory && 
      categoryResults[selectedCategory].length > prevResultsLengthRef.current
    ) {
      resultsListRef.current.scrollTop = lastScrollTopRef.current;
      isAppendingRef.current = false;
    }
    
    if (selectedCategory) {
      prevResultsLengthRef.current = categoryResults[selectedCategory].length;
    }
  }, [categoryResults, selectedCategory]);

  useEffect(() => {

    // Handle animation state
    if (activeInputIndex !== null) {
      setShouldAnimateDropdown(true);
      
      // Set timeout to remove animation class after animation completes
      const animationTimeout = setTimeout(() => {
        setShouldAnimateDropdown(false);
      }, 200); // Match the 0.2s animation duration
      
      // Clean up timeout if component unmounts or activeInputIndex changes
      return () => clearTimeout(animationTimeout);
    } else {
      // Reset animation flag when dropdown closes
      setShouldAnimateDropdown(false);
    }
  }, [activeInputIndex]);

  // Add click outside listener to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        activeInputIndex !== null && 
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        inputRefs.current.every(ref => ref && !ref.contains(e.target as Node))
      ) {
        setActiveInputIndex(null);
      }
    };
    
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [activeInputIndex]);

  /**
   * Fetches search results for a given category and search term.
   * Accepts an optional AbortSignal for request cancellation.
   * @param searchCategory - The category to search in.
   * @param searchTerm - The search string.
   * @param selectedCategory - The other selected category (if any).
   * @param selectedId - The id of the other selected value (if any).
   * @param limit - Number of results to fetch.
   * @param offset - Offset for pagination.
   * @param signal - Optional AbortSignal for cancellation.
   * @returns Promise resolving to an array of SearchResultItem.
   */
  async function fetchSearchResults(
    searchCategory: SelectionType,
    searchTerm: string = '',
    selectedCategory?: SelectionType,
    selectedId?: number,
    limit: number = 20,
    offset: number = 0,
    signal?: AbortSignal
  ): Promise<SearchResultItem[]> {
    if (!searchCategory) return [];
    const params = new URLSearchParams();
    params.append('searchCategory', searchCategory);
    if (searchTerm) params.append('searchTerm', searchTerm);
    if (selectedCategory && selectedId !== undefined) {
      params.append('selectedCategory', selectedCategory);
      params.append('selectedId', String(selectedId));
    }
    params.append('limit', String(limit));
    params.append('offset', String(offset));
    const response = await fetch(`/api/search?${params.toString()}`, { signal });
    if (!response.ok) throw new Error('Failed to fetch search results');
    return await response.json();
  }


  // Type Indicator component to show what type of item is selected
  const TypeIndicator = ({ type }: { type: SelectionType }) => {
    if (!type) return null;
    
    return (
      <div className="type-indicator">
        {type}
      </div>
    );
  };

  // Search Input component
  const SearchInput = ({ 
    index, 
    selection,
    isCollapsed = false,
    widthClass = '' // Add new prop for width class
  }: { 
    index: number, 
    selection: Selection | null,
    isCollapsed?: boolean,
    widthClass?: string
  }) => {
    return (
      <div 
        className={`input-wrapper ${isCollapsed ? 'collapsed' : ''} ${widthClass}`} 
        ref={el => { inputRefs.current[index] = el; }}
      >
        {selection?.type && (
          <TypeIndicator type={selection.type} />
        )}
        
        <div 
          className={`search-input ${isCollapsed ? 'collapsed-input' : ''}`} 
          onClick={() => handleInputClick(index, isCollapsed)}
        >
          {!isCollapsed && (
            selection ? (
              <div className="selection-display">
                {selection.value?.name || 'Selected Item'}
              </div>
            ) : (
              <div className="placeholder">
                <AddIcon fontSize="small" />
                <span>Search</span>
              </div>
            )
          )}
          
          {isCollapsed && (
            <div className="placeholder">
              <AddIcon fontSize="small" />
              <span>Filter</span>
            </div>
          )}
          
          {((selection || index == 1) && !isCollapsed) && (
            <button 
              className="close-button"
              onClick={(e) => {
                e.stopPropagation();
                handleClose(index);
              }}
            >
              <CloseIcon fontSize="small" />
            </button>
          )}
        </div>
      </div>
    );
  };

  // Dropdown component
  const Dropdown = () => {
    // Categories for the sidebar
    const categories: SelectionType[] = ['Judges', 'Courts', 'Charges', 'Charge Groups'];

    const currentInputValue = selectedCategory ? categorySearchTerms[selectedCategory] : '';

    // Debounce the search term using useEffect
    useEffect(() => {
      if (!selectedCategory) return;
      const handler = setTimeout(() => {
        setDebouncedSearchTerm(categorySearchTerms[selectedCategory]);
      }, 300);
      return () => clearTimeout(handler);
    }, [categorySearchTerms, selectedCategory]);

    // Handle input change: update state immediately
    const handleControlledInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!selectedCategory) return;
      const inputValue = e.target.value;
      setCategorySearchTerms(prev => ({
        ...prev,
        [selectedCategory]: inputValue
      }));
    };

    // When switching categories, focus the input
    useEffect(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, [selectedCategory, activeInputIndex]);

    return (
      <div 
        className={`search-dropdown ${activeInputIndex !== null ? 'visible' : ''} ${shouldAnimateDropdown ? 'animate-dropdown' : ''}`}
        ref={dropdownRef}
      >        
        <div className="dropdown-content">
          <div className="category-sidebar">
            <h3>Categories</h3>
            <div className="category-select">
              {categories.map((category, idx) => (
                <div
                  key={category}
                  className={`category-item ${selectedCategory === category ? 'active' : ''} ${
                    disabledCategories.includes(category) ? 'disabled' : ''
                  }`}
                  onClick={() => !disabledCategories.includes(category) && handleCategorySelect(category)}
                  tabIndex={disabledCategories.includes(category) ? -1 : 0}
                  ref={el => { categoryRefs.current[idx] = el; }}
                  title={disabledCategories.includes(category) ? "Not available with current selection" : ""}
                >
                  <span>{category}</span>
                  {selectedCategory === category && <CheckIcon className="check-icon" />}
                </div>
              ))}
            </div>
          </div>
          
          <div className="main-dropdown-content-container">
            <div className="dropdown-header">
              <div className="search-filter">
                <SearchIcon className="search-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={currentInputValue}
                  onChange={handleControlledInputChange}
                />
              </div>
              <button 
                className="close-dropdown-button"
                onClick={() => setActiveInputIndex(null)}
              >
                <CloseIcon />
              </button>
            </div>
            <div className="results-label">
              <p>Name:</p>
              <p>Total Cases:</p>
            </div>
            <div className="results-list" id="scrollableResultsList" ref={resultsListRef}>
              {selectedCategory && categoryLoading[selectedCategory] ? (
                <div className="loading-container">
                  <CircularProgress size={40} />
                </div>
              ) : selectedCategory && categoryErrors[selectedCategory] ? (
                <div className="error-container">
                  <div className="error-message">{categoryErrors[selectedCategory]}</div>
                  <button className="retry-button" onClick={handleRetry}>
                    Retry
                  </button>
                </div>
              ) : selectedCategory ? (
                <InfiniteScroll
                  dataLength={categoryResults[selectedCategory].length}
                  next={loadMoreResults}
                  hasMore={categoryPagination[selectedCategory].hasMore}
                  loader={
                    <div className="loading-more">
                      <CircularProgress size={30} />
                    </div>
                  }
                  scrollableTarget="scrollableResultsList"
                >
                  {categoryResults[selectedCategory].map(item => (
                    <div 
                      key={`${selectedCategory}-${item.id}`}
                      className={`result-item ${item.total_case_dispositions == 0 ? 'disabled' : ''}`}
                      onClick={() => item.total_case_dispositions > 0 ? handleSelect(selectedCategory, item) : null}
                    >
                      <div className="result-item-name">{item.name}</div>
                      <div className="result-item-count">{Intl.NumberFormat('en-US', {notation: "compact", maximumFractionDigits: 1}).format(item.total_case_dispositions)}</div>
                    </div>
                  ))}
                </InfiniteScroll>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="search-bar">
      <div className="search-input-container">
        {/* First Input - gets different width classes based on expanded state */}
        <SearchInput 
          index={0} 
          selection={selections[0]} 
          widthClass={expanded ? 'input-wrapper-narrow' : 'input-wrapper-wide'} 
        />
        
        {/* Second Input - always rendered but with different states */}
        <SearchInput 
          index={1} 
          selection={selections[1]} 
          isCollapsed={!expanded}
          widthClass={expanded ? 'expanded' : ''} 
        />
      </div>
      
      {/* Render dropdown when an input is active */}
      <Dropdown />
    </div>
  );
}