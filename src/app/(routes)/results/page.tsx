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
import { transformApiResponseToSearchResultData } from '@/utils';
import { SearchResultData, ApiResponse } from '@/types';
import DispositionsTab from '@/components/Dispositions/page';
import SentencesTab from '@/components/Sentences/page';
import BailTab from '@/components/Bail/page';
import MotionsTab from '@/components/Motions/page';
import './styles.scss';

const ResultsPage = () => {
  const [activeTab, setActiveTab] = useState('dispositions');
  const [data, setData] = useState<SearchResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Fetch data from the API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Extract parameters from URL
        //const courtId = searchParams.get('courtId') || '0';
        const courtId = 0; //!Temporary
        const judgeId = searchParams.get('judgeId') || '0';
        const chargeId = searchParams.get('chargeId') || '0';
        
        // Build the API URL with query parameters
        const apiUrl = `/api/specification?courtId=${courtId}&judgeId=${judgeId}&chargeId=${chargeId}`;
        
        // Fetch data from real API
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        // Parse the API response
        const apiData: ApiResponse = await response.json();

        console.log('API response:', apiData);
        
        // Transform the API response into the format expected by components
        const transformedData = transformApiResponseToSearchResultData(apiData);
        
        setData(transformedData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams]); // Dependency on searchParams ensures it runs when URL params change

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  return (
    <div className="results-container">
      <Box className="results-header">
        <Typography variant="h4" component="h1" sx={{ 
          color: 'var(--primary-dark)',
          fontWeight: 600
        }}>
          Case Analytics Results
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'var(--text-secondary)' }}>
          Showing analytics for selected criteria
        </Typography>
      </Box>

      <Paper className="results-card">
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
                {data && <DispositionsTab data={data.dispositions} />}
              </TabPanel>
              
              <TabPanel value="sentences" className="results-tab-panel">
                {data && <SentencesTab data={data.sentences} />}
              </TabPanel>
              
              <TabPanel value="bail" className="results-tab-panel">
                {data && <BailTab data={data.bailDecisions} />}
              </TabPanel>
              
              <TabPanel value="motions" className="results-tab-panel">
                {data && <MotionsTab data={data.motions} />}
              </TabPanel>
            </TabContext>
          </Box>
        )}
      </Paper>
    </div>
  );
};

export default ResultsPage;