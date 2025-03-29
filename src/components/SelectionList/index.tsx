import { useState, useEffect, useCallback, useRef } from 'react';
import { List, ListItemButton, ListItemText, Box, CircularProgress, Typography, Divider } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

interface SelectionItemProps {
  item: {
    id: number;
    name: string;
  };
  selected: boolean;
  onSelect: (id: number) => void;
}

/**
 * SelectionItem Component
 * 
 * Represents a single selectable option in the filter sidebar
 * 
 * @param props - Component properties
 * @param props.item - The data object with id and name
 * @param props.selected - Boolean indicating if this item is selected
 * @param props.onSelect - Callback function when item is selected
 */
const SelectionItem = ({ item, selected, onSelect }: SelectionItemProps) => {
  return (
    <ListItemButton
      selected={selected}
      onClick={() => onSelect(item.id)}
      sx={{
        borderLeft: selected ? 4 : 0,
        borderLeftColor: 'primary.main',
        backgroundColor: selected ? 'action.selected' : 'transparent',
        '&:hover': {
          backgroundColor: selected ? 'action.selected' : 'action.hover',
        },
        py: 1,
      }}
    >
      <ListItemText 
        primary={item.name} 
        primaryTypographyProps={{ 
          fontWeight: selected ? 'medium' : 'regular' 
        }} 
      />
      {selected && <CheckIcon color="primary" />}
    </ListItemButton>
  );
};

interface SelectionListProps {
  items: Array<{ id: number; name: string }>;
  selectedId: number;
  onSelect: (id: number) => void;
  searchTerm: string;
  loading: boolean;
  loadMore: () => void;
  hasMore: boolean;
  type: 'court' | 'judge' | 'charge';
}

/**
 * SelectionList Component
 * 
 * A reusable component for displaying selectable options with lazy loading
 * 
 * @param props - Component properties
 * @param props.items - Array of options to display
 * @param props.selectedId - Currently selected ID
 * @param props.onSelect - Callback function when item is selected
 * @param props.searchTerm - Current search term for filtering
 * @param props.loading - Boolean for loading state
 * @param props.loadMore - Function to load additional items
 * @param props.hasMore - Boolean indicating if more items can be loaded
 * @param props.type - Type of selection ('court', 'judge', or 'charge')
 */
const SelectionList = ({ 
  items, 
  selectedId, 
  onSelect, 
  searchTerm, 
  loading, 
  loadMore,
  hasMore,
  type 
}: SelectionListProps) => {
  const observer = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useRef<HTMLDivElement | null>(null);

  // Filter items based on search term
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Setup intersection observer for infinite scrolling
  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });
    
    if (node) {
      observer.current.observe(node);
      lastItemRef.current = node;
    }
  }, [loading, hasMore, loadMore]);

  return (
    <Box 
      sx={{ 
        height: 300, 
        overflowY: 'auto', 
        border: 1,
        borderColor: 'divider',
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 1,
        borderBottomRightRadius: 1,
        borderTop: 0,  // Remove top border
      }}
    >
      {filteredItems.length > 0 ? (
        <List disablePadding>
          {filteredItems.map((item, index) => (
            <div key={item.id}>
              <SelectionItem 
                item={item} 
                selected={item.id === selectedId} 
                onSelect={onSelect} 
              />
              {index < filteredItems.length - 1 && <Divider />}
              {index === filteredItems.length - 1 && hasMore && (
                <div ref={lastElementRef} />
              )}
            </div>
          ))}
        </List>
      ) : (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {searchTerm ? `No ${type}s found matching "${searchTerm}"` : `No ${type}s available`}
          </Typography>
        </Box>
      )}
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
    </Box>
  );
};

export default SelectionList;