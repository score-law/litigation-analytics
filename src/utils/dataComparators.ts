import { 
  DispositionData, 
  SentenceData, 
  BailDecisionData, 
  MotionData,
} from '@/types';

/**
 * Calculates comparative metrics for disposition data by comparing with averages.
 * Handles trial type breakdowns.
 * 
 * @param data - The current disposition data
 * @param averageData - The average disposition data
 * @returns Disposition data with comparative metrics
 */
export function calculateComparativeDispositionsData(
    data: DispositionData[], 
    averageData: DispositionData[]
  ): DispositionData[] {
    if (!data || !averageData) {
      return data || [];
    }
  
    // Create a map of average dispositions for easy lookup
    const averageMap = new Map<string, DispositionData>();
    averageData.forEach(item => {
      averageMap.set(item.type, item);
    });
  
    // Calculate comparative metrics for each disposition
    return data.map(item => {
      const average = averageMap.get(item.type);
      
      if (!average) {
        return item; // Return unchanged if no average found
      }
  
      // Calculate comparative ratio
      const comparativeRatio = average.ratio > 0 ? item.ratio / average.ratio : 0;
      
      // Calculate comparative trial type breakdown
      const comparativeTrialTypeBreakdown = {
        bench: average.trialTypeBreakdown.bench > 0 
          ? item.trialTypeBreakdown.bench / average.trialTypeBreakdown.bench
          : 0,
        jury: average.trialTypeBreakdown.jury > 0 
          ? item.trialTypeBreakdown.jury / average.trialTypeBreakdown.jury 
          : 0,
        none: average.trialTypeBreakdown.none > 0 
          ? item.trialTypeBreakdown.none / average.trialTypeBreakdown.none 
          : 0,
      };
  
      // Return the disposition with comparative metrics
      return {
        type: item.type,
        ratio: comparativeRatio,
        trialTypeBreakdown: comparativeTrialTypeBreakdown
      };
    });
  }
  
  /**
   * Calculates comparative metrics for sentence data by comparing with averages.
   * 
   * @param data - The current sentence data
   * @param averageData - The average sentence data
   * @returns Sentence data with comparative metrics
   */
  export function calculateComparativeSentencesData(
    data: SentenceData[], 
    averageData: SentenceData[]
  ): SentenceData[] {
    // Create a map of average data for quick lookup
    const averageMap = new Map<string, SentenceData>();
    averageData.forEach(item => {
      averageMap.set(item.type, item);
    });
  
    // Calculate comparative metrics for each sentence type
    return data.map(item => {
      const average = averageMap.get(item.type);
      
      // If no matching average found, return original data
      if (!average) {
        return item;
      }
  
      // Calculate comparative metrics
      const comparativePercentage = average.percentage > 0 
        ? item.percentage / average.percentage 
        : 0;
      
      const comparativeAverageDays = average.averageDays > 0 
        ? item.averageDays / average.averageDays 
        : 0;
      
      const comparativeAverageCost = average.averageCost > 0 
        ? item.averageCost / average.averageCost 
        : 0;
  
      // Return the comparative data
      return {
        type: item.type,
        percentage: comparativePercentage,
        averageDays: comparativeAverageDays,
        averageCost: comparativeAverageCost
      };
    });
  }
  
  /**
   * Calculates comparative metrics for bail decision data by comparing with averages.
   * 
   * @param data - The current bail decision data
   * @param averageData - The average bail decision data
   * @returns Bail decision data with comparative metrics
   */
  export function calculateComparativeBailData(
    data: BailDecisionData[], 
    averageData: BailDecisionData[]
  ): BailDecisionData[] {
    // Create a map of average data for quick lookup
    const averageMap = new Map<string, BailDecisionData>();
    averageData.forEach(item => {
      averageMap.set(item.type, item);
    });
  
    // Calculate comparative metrics for each bail decision type
    return data.map(item => {
      const average = averageMap.get(item.type);
      
      // If no matching average found, return original data
      if (!average || average.count === 0) {
        return item;
      }
  
      // Calculate comparative metrics
      const comparativeCount = item.count / average.count;
      const comparativeAverageCost = average.averageCost > 0 
        ? item.averageCost / average.averageCost 
        : 0;
  
      // Return the comparative data
      return {
        type: item.type,
        count: comparativeCount,
        averageCost: comparativeAverageCost
      };
    });
  }
  
  /**
   * Calculates comparative metrics for motion data by comparing with averages.
   * In this updated version, we calculate the granted/total ratio for each motion
   * type and compare with the average granted/total ratio.
   * 
   * @param data - The current motion data
   * @param averageData - The average motion data
   * @returns Motion data with comparative metrics
   */
  export function calculateComparativeMotionsData(
    data: MotionData[], 
    averageData: MotionData[]
  ): MotionData[] {
    if (!data || !averageData || data.length === 0 || averageData.length === 0) {
      return [];
    }
  
    return data.map(currentMotion => {
      // Find corresponding average data for this motion type
      const averageMotion = averageData.find(avg => avg.type === currentMotion.type);
      
      if (!averageMotion) {
        return currentMotion; // Return original if no average data found
      }
  
      // Calculate current granted ratio (granted / total)
      const currentTotal = currentMotion.status.granted + currentMotion.status.denied + currentMotion.status.other;
      const currentGrantedRatio = currentTotal > 0 ? currentMotion.status.granted / currentTotal : 0;
      
      // Calculate average granted ratio
      const averageTotal = averageMotion.status.granted + averageMotion.status.denied + averageMotion.status.other;
      const averageGrantedRatio = averageTotal > 0 ? averageMotion.status.granted / averageTotal : 0;
      
      // Calculate comparative ratio (how current ratio compares to average)
      // If average ratio is 0, use a special value to indicate infinity or N/A
      const comparativeRatio = averageGrantedRatio > 0 
        ? currentGrantedRatio / averageGrantedRatio
        : currentGrantedRatio > 0 ? 2 : 1; // If average is 0, show as above average if current has grants
      
      // Create new motion object with the comparative metrics
      return {
        ...currentMotion,
        count: comparativeRatio,
        status: {
          granted: comparativeRatio,
          denied: 0,  // We're only showing granted ratio now
          other: 0    // We're only showing granted ratio now
        },
        partyFiled: {
          granted: comparativeRatio,
          denied: 0,  // We're only showing granted ratio now
          other: 0    // We're only showing granted ratio now
        }
      };
    });
  }