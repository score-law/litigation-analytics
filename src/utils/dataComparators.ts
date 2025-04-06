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

    // Calculate comparative ratio - modified to handle zero/zero case
    const comparativeRatio = (average.ratio > 0 && item.ratio > 0) 
      ? item.ratio / average.ratio 
      : 1;
    
    // Calculate comparative trial type breakdown - modified to handle zero/zero case
    const comparativeTrialTypeBreakdown = {
      bench: (average.trialTypeBreakdown.bench > 0 && item.trialTypeBreakdown.bench > 0) 
        ? item.trialTypeBreakdown.bench / average.trialTypeBreakdown.bench
        : 1,
      jury: (average.trialTypeBreakdown.jury > 0 && item.trialTypeBreakdown.jury > 0) 
        ? item.trialTypeBreakdown.jury / average.trialTypeBreakdown.jury 
        : 1,
      none: (average.trialTypeBreakdown.none > 0 && item.trialTypeBreakdown.none > 0) 
        ? item.trialTypeBreakdown.none / average.trialTypeBreakdown.none 
        : 1,
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
    const comparativePercentage = average.percentage > 0 && item.percentage > 0
      ? item.percentage / average.percentage 
      : 1;
    
    const comparativeAverageDays = average.averageDays > 0 && item.averageDays > 0
      ? item.averageDays / average.averageDays 
      : 1;
    
    const comparativeAverageCost = average.averageCost > 0 && item.averageCost > 0
      ? item.averageCost / average.averageCost 
      : 1;

    // Return the comparative data
    return {
      type: item.type,
      percentage: comparativePercentage,
      averageDays: comparativeAverageDays,
      averageCost: comparativeAverageCost
    };
  });
}
  
// File: src/utils/dataComparators.ts
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
    const comparativePercentage = average.percentage > 0 && item.percentage > 0
      ? item.percentage / average.percentage 
      : 1;
    const comparativeAverageCost = average.averageCost > 0 && item.averageCost > 0
      ? item.averageCost / average.averageCost 
      : 1;

    // Return the comparative data
    return {
      type: item.type,
      count: comparativeCount,
      percentage: comparativePercentage,
      averageCost: comparativeAverageCost
    };
  });
}
  
/**
 * Calculates comparative metrics for motion data by comparing with averages.
 * Calculates separate comparative ratios for all motions, prosecution motions, and defense motions.
 * 
 * @param data - The current motion data
 * @param averageData - The average motion data
 * @returns Motion data with comparative metrics
 */
export function calculateComparativeMotionsData(
  data: MotionData[], 
  averageData: MotionData[]
): MotionData[] {
  // Create a map of average data for quick lookup
  const averageMap = new Map<string, MotionData>();
  averageData.forEach(item => {
    averageMap.set(item.type, item);
  });

  return data.map(currentMotion => {
    const avgMotion = averageMap.get(currentMotion.type);
    
    if (!avgMotion) {
      // If no matching average data, return the current data unchanged
      return currentMotion;
    }
    
    // Calculate overall comparative ratio (all motions)
    const currentTotal = currentMotion.status.granted + currentMotion.status.denied;
    const currentRatio = currentTotal > 0 ? currentMotion.status.granted / currentTotal : 0;
    
    const avgTotal = avgMotion.status.granted + avgMotion.status.denied;
    const avgRatio = avgTotal > 0 ? avgMotion.status.granted / avgTotal : 0;
    
    // Avoid division by zero
    const overallComparativeRatio = avgRatio > 0 ? currentRatio / avgRatio : (currentRatio > 0 ? 2 : 1); // 2 = better than average, 1 = same as average
    
    // Calculate prosecution-specific comparative ratio
    const currentProsTotal = currentMotion.partyFiled.granted + currentMotion.partyFiled.denied;
    const currentProsRatio = currentProsTotal > 0 ? currentMotion.partyFiled.granted / currentProsTotal : 0;
    
    const avgProsTotal = avgMotion.partyFiled.granted + avgMotion.partyFiled.denied;
    const avgProsRatio = avgProsTotal > 0 ? avgMotion.partyFiled.granted / avgProsTotal : 0;
    
    const prosecutionComparativeRatio = avgProsRatio > 0 ? currentProsRatio / avgProsRatio : 
                                     (currentProsRatio > 0 ? 2 : 1);
    
    // Calculate defense-specific comparative ratio
    // Defense motion counts are derived by subtracting prosecution counts from total counts
    const currentDefGranted = currentMotion.status.granted - currentMotion.partyFiled.granted;
    const currentDefDenied = currentMotion.status.denied - currentMotion.partyFiled.denied;
    const currentDefTotal = currentDefGranted + currentDefDenied;
    const currentDefRatio = currentDefTotal > 0 ? currentDefGranted / currentDefTotal : 0;
    
    const avgDefGranted = avgMotion.status.granted - avgMotion.partyFiled.granted;
    const avgDefDenied = avgMotion.status.denied - avgMotion.partyFiled.denied;
    const avgDefTotal = avgDefGranted + avgDefDenied;
    const avgDefRatio = avgDefTotal > 0 ? avgDefGranted / avgDefTotal : 0;
    
    const defenseComparativeRatio = avgDefRatio > 0 ? currentDefRatio / avgDefRatio :
                                  (currentDefRatio > 0 ? 2 : 1);
    
    // Return the motion with all comparative ratios in a clearer structure
    return {
      ...currentMotion,
      // For backward compatibility
      count: overallComparativeRatio,
      // Store the ratios in a more explicit structure
      comparativeRatios: {
        overall: overallComparativeRatio,
        prosecution: prosecutionComparativeRatio,
        defense: defenseComparativeRatio
      },
      // Maintain compatibility with existing structure
      status: {
        granted: overallComparativeRatio,
        denied: 0,
        other: 0
      },
      partyFiled: {
        granted: prosecutionComparativeRatio, 
        denied: 0,
        other: 0
      }
    };
  });
}