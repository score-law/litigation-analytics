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
      return {
        ...item,
        ratio: 1, // Default to 1 (equal to average) if no average data exists
        trialTypeBreakdown: {
          bench: 1,
          jury: 1,
          none: 1
        }
      };
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
        : 1
    };
    
    return {
      ...item,
      ratio: comparativeRatio,
      trialTypeBreakdown: comparativeTrialTypeBreakdown,
      // Preserve the count data from the original item
      count: item.count,
      trialTypeCounts: item.trialTypeCounts
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
    
    // Calculate comparative ratios for sentence buckets
    let comparativeSentenceBuckets = item.sentenceBuckets;
    
    if (item.sentenceBuckets && average.sentenceBuckets) {
      // Create a map of average buckets for quick lookup
      const averageBucketsMap = new Map();
      average.sentenceBuckets.forEach(bucket => {
        averageBucketsMap.set(bucket.label, bucket);
      });
      
      // Calculate comparative values for each bucket
      comparativeSentenceBuckets = item.sentenceBuckets.map(bucket => {
        const avgBucket = averageBucketsMap.get(bucket.label);
        
        if (!avgBucket || avgBucket.count === 0 || (avgBucket.percentage ?? 0) === 0) {
          return {
            ...bucket,
            percentage: 1 // Set to exactly average (1) instead of keeping original
          };
        }
        
        // Keep the actual count instead of replacing it with a ratio
        const actualCount = bucket.count;
        
        // Calculate comparative percentage for the bucket
        const comparativePercentage = (avgBucket.percentage ?? 0) > 0 && actualCount > 0
          ? (bucket.percentage ?? 0) / (avgBucket.percentage ?? 0)
          : 1;
        
        return {
          label: bucket.label,
          count: actualCount,
          percentage: comparativePercentage
        };
      });
    }
    
    return {
      type: item.type,
      percentage: comparativePercentage,
      averageDays: comparativeAverageDays,
      averageCost: comparativeAverageCost,
      count: item.count, // Preserve the count field
      sentenceBuckets: comparativeSentenceBuckets // Include the comparative buckets
    };
  });
}
  
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
    const comparativePercentage = average.percentage > 0 && item.percentage > 0
      ? item.percentage / average.percentage 
      : 1;
    const comparativeAverageCost = average.averageCost > 0 && item.averageCost > 0
      ? item.averageCost / average.averageCost 
      : 1;

    // Calculate comparative ratios for bail buckets
    let comparativeBailBuckets = item.bailBuckets;
    
    if (item.bailBuckets && average.bailBuckets) {
      // Create a map of average buckets for quick lookup
      const averageBucketsMap = new Map();
      average.bailBuckets.forEach(bucket => {
        averageBucketsMap.set(bucket.amount, bucket);
      });
      
      // Calculate comparative values for each bucket
      comparativeBailBuckets = item.bailBuckets.map(bucket => {
        const avgBucket = averageBucketsMap.get(bucket.amount);
        
        if (!avgBucket || avgBucket.count === 0) {
          return {
            ...bucket,
            percentage: 1 // Set to exactly average (1) instead of keeping original
          };
        }
        
        // Keep the actual count instead of replacing it with a ratio
        const actualCount = bucket.count;
        
        // Calculate comparative percentage for the bucket
        const comparativePercentage = (avgBucket.percentage ?? 0) > 0 && actualCount > 0
          ? (bucket.percentage ?? 0) / (avgBucket.percentage ?? 0)
          : 1;
        
        return {
          amount: bucket.amount,
          count: actualCount, // Keep the original count instead of using comparativeCount
          percentage: comparativePercentage // Transform percentage for the chart
        };
      });
    }

    // Return the comparative data
    return {
      type: item.type,
      count: item.count,
      percentage: comparativePercentage,
      averageCost: comparativeAverageCost,
      bailBuckets: comparativeBailBuckets
    };
  });
}

/**
 * Calculates comparative metrics for motion data by comparing with averages.
 * Calculates separate comparative ratios for all motions, prosecution motions, and defense motions,
 * storing them in the `comparativeRatios` field. Original counts are preserved.
 * 
 * @param data - The current motion data array.
 * @param averageData - The average motion data array.
 * @returns Motion data array with added `comparativeRatios`.
 */
export function calculateComparativeMotionsData(
  data: MotionData[], 
  averageData: MotionData[]
): MotionData[] {
  if (!data || !averageData) {
    return data || [];
  }

  // Create a map of average data for quick lookup
  const averageMap = new Map<string, MotionData>();
  averageData.forEach(item => {
    // Ensure average items also have the necessary structures initialized if they came from transformation
    // This guards against potential missing fields if average data source differs.
    const avgItem = {
        ...item,
        status: item.status ?? { granted: 0, denied: 0, other: 0 },
        prosecutionFiled: item.prosecutionFiled ?? { granted: 0, denied: 0, other: 0 },
        defenseFiled: item.defenseFiled ?? { granted: 0, denied: 0, other: 0 },
    };
    averageMap.set(item.type, avgItem);
  });

  return data.map(currentMotion => {
    const averageMotion = averageMap.get(currentMotion.type);

    // Ensure current motion also has structures initialized, defensively
    const curItem = {
        ...currentMotion,
        status: currentMotion.status ?? { granted: 0, denied: 0, other: 0 },
        prosecutionFiled: currentMotion.prosecutionFiled ?? { granted: 0, denied: 0, other: 0 },
        defenseFiled: currentMotion.defenseFiled ?? { granted: 0, denied: 0, other: 0 },
    };

    if (!averageMotion) {
      // If no average data for this motion type, return current data with default ratios
      return {
        ...curItem,
        comparativeRatios: { overall: 1, prosecution: 1, defense: 1 }
      };
    }

    // Calculate overall comparative ratio (based on granted status)
    const overallRatio = (averageMotion.status.granted > 0 && curItem.status.granted >= 0) 
      ? curItem.status.granted / averageMotion.status.granted 
      : (curItem.status.granted > 0 ? Infinity : 1); // Handle 0 average: Infinity if current > 0, else 1

    // Calculate prosecution comparative ratio (based on granted status)
    const prosecutionRatio = (averageMotion.prosecutionFiled.granted > 0 && curItem.prosecutionFiled.granted >= 0)
      ? curItem.prosecutionFiled.granted / averageMotion.prosecutionFiled.granted
      : (curItem.prosecutionFiled.granted > 0 ? Infinity : 1);

    // Calculate defense comparative ratio (based on granted status)
    const defenseRatio = (averageMotion.defenseFiled.granted > 0 && curItem.defenseFiled.granted >= 0)
      ? curItem.defenseFiled.granted / averageMotion.defenseFiled.granted
      : (curItem.defenseFiled.granted > 0 ? Infinity : 1);
      
    // Handle Infinity case - perhaps cap it or represent it differently if needed. Capping at a large number or using a specific flag might be options.
    // For now, let's cap Infinity ratios at a high value like 999 for practical display.
    const capRatio = (r: number) => isFinite(r) ? r : (r > 0 ? 999 : 1);


    return {
      ...curItem, // Return the original motion data with counts intact
      comparativeRatios: { // Add the calculated ratios
        overall: capRatio(overallRatio),
        prosecution: capRatio(prosecutionRatio),
        defense: capRatio(defenseRatio)
      }
    };
  });
}