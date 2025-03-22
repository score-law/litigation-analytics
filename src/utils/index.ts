/**
 * Data Transformation Utilities
 * 
 * This file contains functions to transform database-structured data into the format
 * expected by the frontend visualization components. Each function takes raw API response
 * data and converts it to match the specific component interfaces.
 */

import { 
  ApiResponse, 
  DispositionData, 
  SentenceData, 
  BailDecisionData, 
  MotionData,
  SearchResultData,
  SpecificationData,
  ApiMotionData
} from '@/types';

/**
 * Transforms raw disposition data from the database into the format expected by the DispositionsTab component.
 * 
 * @param rawData - The raw API response data
 * @returns An array of DispositionData objects
 */
export function transformDispositionsData(rawData: ApiResponse): DispositionData[] {
  if (!rawData || !rawData.specification || rawData.specification.length === 0) {
    return [];
  }

  // Aggregate all specifications
  const spec = rawData.specification[0];
  
  // Extract disposition counts
  const dispositions = [
    { label: 'Acquittal', ratio: spec.aquittals/spec.total_cases, trial: { bench: 0, jury: 0, none: 0 } },
    { label: 'Dismissal', ratio: spec.dismissals/spec.total_cases, trial: { bench: 0, jury: 0, none: 0 } },
    { label: 'Nolle Prosequi', ratio: spec.nolle_prosequis/spec.total_cases, trial: { bench: 0, jury: 0, none: 0 } },
    { label: 'CWOF', ratio: spec.cwof/spec.total_cases, trial: { bench: 0, jury: 0, none: 0 } },
    { label: 'Guilty Plea', ratio: spec.guilty_plea/spec.total_cases, trial: { bench: 0, jury: 0, none: 0 } },
    { label: 'Guilty', ratio: spec.guilty/spec.total_cases, trial: { bench: 0, jury: 0, none: 0 } },
    { label: 'Other', ratio: spec.other/spec.total_cases, trial: { bench: 0, jury: 0, none: 0 } },
  ];
  
  // Distribute trial types based on category
  if (spec.trial_category === 'bench_trial') {
    dispositions.forEach(disp => {
      disp.trial.bench = disp.ratio;
    });
  } else if (spec.trial_category === 'jury_trial') {
    dispositions.forEach(disp => {
      disp.trial.jury = disp.ratio;
    });
  } else {
    dispositions.forEach(disp => {
      disp.trial.none = disp.ratio;
    });
  }
  
  // Calculate total dispositions (sum of all disposition counts)
  const totalDispositions = dispositions.reduce((sum, disp) => sum + disp.ratio, 0);
  
  // Transform to final format with ratios
  const dispositionData = dispositions.map(disp => {
    const { label, ratio, trial } = disp;
    const bench = trial.bench;
    const jury = trial.jury;
    const none = trial.none;
    
    // Convert counts to ratios
    return {
      type: label,
      ratio: ratio, // Ratio of this disposition to total dispositions
      trialTypeBreakdown: {
        bench: bench, // Ratio of bench trials within this disposition
        jury: jury,   // Ratio of jury trials within this disposition
        none: none    // Ratio of cases with no trial within this disposition
      }
    };
  });
  
  // Filter out dispositions with zero count and sort by count descending
  return dispositionData
    .filter(disp => disp.ratio > 0)
    .sort((a, b) => b.ratio - a.ratio);
}

/**
 * Transforms raw sentence data from the database into the format expected by the SentencesTab component.
 * 
 * @param rawData - The raw API response data
 * @returns An array of SentenceData objects
 */
export function transformSentencesData(rawData: ApiResponse): SentenceData[] {
  // Define sentence types with their corresponding database fields
  const sentenceTypes = [
    { 
      type: 'Fine',
      countField: 'fee_count',
      totalField: 'total_fee',
      daysField: null,
    },
    { 
      type: 'Incarceration',
      countField: 'hoc_count',
      totalField: null,
      daysField: 'total_hoc_days',
    },
    { 
      type: 'Probation',
      countField: 'probation_count',
      totalField: null,
      daysField: 'probation_days',
    },
    { 
      type: 'License Suspension',
      countField: 'license_lost_count',
      totalField: null,
      daysField: 'license_lost_days',
    }
  ];

  // Calculate the total number of cases
  const totalCases = rawData.specification.reduce((sum, spec) => sum + spec.total_cases, 0);

  // Transform each sentence type
  return sentenceTypes.map(({ type, countField, totalField, daysField }) => {
    // Calculate total count, fees, and days
    let count = 0;
    let totalFees = 0;
    let totalDays = 0;

    rawData.specification.forEach(spec => {
      // Add type assertions for dynamic property access
      count += (spec[countField as keyof SpecificationData] as number) || 0;
      
      if (totalField) {
        totalFees += (spec[totalField as keyof SpecificationData] as number) || 0;
      }
      
      if (daysField) {
        totalDays += (spec[daysField as keyof SpecificationData] as number) || 0;
      }
});

    // Calculate percentage, average days, and average cost
    const percentage = totalCases > 0 ? (count / totalCases) * 100 : 0;
    const averageDays = count > 0 && daysField ? totalDays / count : 0;
    const averageCost = count > 0 && totalField ? totalFees / count : 0;

    return {
      type,
      percentage,
      averageDays,
      averageCost
    };
  }).filter(item => item.percentage > 0); // Filter out types with zero percentage
}

/**
 * Transforms raw bail data from the database into the format expected by the BailTab component.
 * 
 * @param rawData - The raw API response data
 * @returns An array of BailDecisionData objects
 */
export function transformBailData(rawData: ApiResponse): BailDecisionData[] {
  // Define bail decision types with their corresponding database fields
  const bailTypes = [
    { type: 'Personal Recognizance', countField: 'free_bail', costField: null },
    { type: 'Cash Bail', countField: 'cost_bail', costField: 'total_bail_cost' },
    { type: 'Denied', countField: 'denied_bail', costField: null }
  ];

  // Transform each bail type
  return bailTypes.map(({ type, countField, costField }) => {
    // Calculate total count and cost
    let count = 0;
    let totalCost = 0;

    rawData.specification.forEach(spec => {
      // Add type assertions for dynamic property access
      count += (spec[countField as keyof SpecificationData] as number) || 0;
      
      if (costField) {
        totalCost += (spec[costField as keyof SpecificationData] as number) || 0;
      }
});

    // Calculate average cost
    const averageCost = count > 0 && costField ? totalCost / count : 0;

    return {
      type,
      count,
      averageCost
    };
  }).filter(item => item.count > 0); // Filter out types with zero count
}

/**
 * Transforms raw motion data from the database into the format expected by the MotionsTab component.
 * 
 * @param rawData - The raw API response data
 * @returns An array of MotionData objects
 */
export function transformMotionsData(rawData: ApiResponse): MotionData[] {
  // Group by motion_id
  const motionGroups = new Map<string, {
    accepted: number;
    denied: number;
    other: number;
    total: number;
  }>();

  // Process each motion record
  rawData.motion_data.forEach(motion => {
    const id = motion.motion_id;
    
    // Initialize if not exists
    if (!motionGroups.has(id)) {
      motionGroups.set(id, {
        accepted: 0,
        denied: 0,
        other: 0,
        total: 0
      });
}
    
    const group = motionGroups.get(id)!;
    
    // Accumulate counts - replace || with ?? for better null/undefined handling
    group.accepted += motion.accepted ?? 0;
    group.denied += motion.denied ?? 0;
    group.other += (motion.no_action ?? 0) + (motion.advisement ?? 0) + (motion.unknown ?? 0);
    
    // Update total
    group.total = group.accepted + group.denied + group.other;
  });

  // Format for UI component
  return Array.from(motionGroups.entries()).map(([id, counts]) => {
    // Format motion_id for display (e.g., "dismiss" -> "Dismiss")
    const displayType = id.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return {
      type: displayType,
      count: counts.total,
      status: {
        granted: counts.accepted,
        denied: counts.denied,
        other: counts.other
      },
      // For now, use the same data for partyFiled since we don't have this distinction
      // In a real implementation, this would need to be handled differently
      partyFiled: {
        granted: counts.accepted,
        denied: counts.denied,
        other: counts.other
      }
    };
}).filter(item => item.count > 0) // Filter out types with zero count
.sort((a, b) => b.count - a.count); // Sort by count in descending order
}

/**
 * Transforms the complete API response data into the format expected by the Results page.
 * 
 * @param rawData - The raw API response data
 * @returns A SearchResultData object containing all transformed data
 */
export function transformApiResponseToSearchResultData(rawData: ApiResponse): SearchResultData {
  return {
    dispositions: transformDispositionsData(rawData),
    sentences: transformSentencesData(rawData),
    bailDecisions: transformBailData(rawData),
    motions: transformMotionsData(rawData)
  };
}

/**
 * Calculates comparative metrics for disposition data by comparing with averages.
 * 
 * @param data - The current disposition data
 * @param averageData - The average disposition data
 * @returns Disposition data with comparative metrics
 */
export function calculateComparativeDispositionsData(
  data: DispositionData[], 
  averageData: DispositionData[]
): DispositionData[] {
  return data.map(item => {
    const average = averageData.find(avg => avg.type === item.type);
    if (!average) return item;
    
    // Calculate comparative ratios
    const comparativeCount = average.ratio > 0 ? item.ratio / average.ratio : 0;
    const comparativeBreakdown = {
      bench: average.trialTypeBreakdown.bench > 0 
        ? item.trialTypeBreakdown.bench / average.trialTypeBreakdown.bench 
        : 0,
      jury: average.trialTypeBreakdown.jury > 0 
        ? item.trialTypeBreakdown.jury / average.trialTypeBreakdown.jury 
        : 0,
      none: average.trialTypeBreakdown.none > 0 
        ? item.trialTypeBreakdown.none / average.trialTypeBreakdown.none 
        : 0
    };
    
    return {
      ...item,
      count: comparativeCount,
      trialTypeBreakdown: comparativeBreakdown
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

  // Calculate comparative metrics for each motion type
  return data.map(item => {
    const average = averageMap.get(item.type);
    
    // If no matching average found, return original data
    if (!average || average.count === 0) {
      return item;
    }

    // Calculate comparative count
    const comparativeCount = item.count / average.count;
    
    // Calculate total for percentage calculations
    const itemStatusTotal = item.status.granted + item.status.denied + item.status.other;
    const averageStatusTotal = average.status.granted + average.status.denied + average.status.other;
    
    const itemPartyFiledTotal = item.partyFiled.granted + item.partyFiled.denied + item.partyFiled.other;
    const averagePartyFiledTotal = average.partyFiled.granted + average.partyFiled.denied + average.partyFiled.other;
    
    // Calculate percentages for item status
    const itemStatusPercentages = {
      granted: itemStatusTotal > 0 ? item.status.granted / itemStatusTotal : 0,
      denied: itemStatusTotal > 0 ? item.status.denied / itemStatusTotal : 0,
      other: itemStatusTotal > 0 ? item.status.other / itemStatusTotal : 0
    };
    
    // Calculate percentages for average status
    const averageStatusPercentages = {
      granted: averageStatusTotal > 0 ? average.status.granted / averageStatusTotal : 0,
      denied: averageStatusTotal > 0 ? average.status.denied / averageStatusTotal : 0,
      other: averageStatusTotal > 0 ? average.status.other / averageStatusTotal : 0
    };
    
    // Calculate comparative status percentages
    const comparativeStatus = {
      granted: averageStatusPercentages.granted > 0 
        ? itemStatusPercentages.granted / averageStatusPercentages.granted 
        : 0,
      denied: averageStatusPercentages.denied > 0 
        ? itemStatusPercentages.denied / averageStatusPercentages.denied 
        : 0,
      other: averageStatusPercentages.other > 0 
        ? itemStatusPercentages.other / averageStatusPercentages.other 
        : 0
    };
    
    // Calculate percentages for item partyFiled
    const itemPartyFiledPercentages = {
      granted: itemPartyFiledTotal > 0 ? item.partyFiled.granted / itemPartyFiledTotal : 0,
      denied: itemPartyFiledTotal > 0 ? item.partyFiled.denied / itemPartyFiledTotal : 0,
      other: itemPartyFiledTotal > 0 ? item.partyFiled.other / itemPartyFiledTotal : 0
    };
    
    // Calculate percentages for average partyFiled
    const averagePartyFiledPercentages = {
      granted: averagePartyFiledTotal > 0 ? average.partyFiled.granted / averagePartyFiledTotal : 0,
      denied: averagePartyFiledTotal > 0 ? average.partyFiled.denied / averagePartyFiledTotal : 0,
      other: averagePartyFiledTotal > 0 ? average.partyFiled.other / averagePartyFiledTotal : 0
    };
    
    // Calculate comparative partyFiled percentages
    const comparativePartyFiled = {
      granted: averagePartyFiledPercentages.granted > 0 
        ? itemPartyFiledPercentages.granted / averagePartyFiledPercentages.granted 
        : 0,
      denied: averagePartyFiledPercentages.denied > 0 
        ? itemPartyFiledPercentages.denied / averagePartyFiledPercentages.denied 
        : 0,
      other: averagePartyFiledPercentages.other > 0 
        ? itemPartyFiledPercentages.other / averagePartyFiledPercentages.other 
        : 0
    };

    // Return the comparative data
    return {
      type: item.type,
      count: comparativeCount,
      status: comparativeStatus,
      partyFiled: comparativePartyFiled
    };
  });
}

/**
 * Converts an array of selected values to an object with boolean flags
 * @param selectedValues Array of selected option values
 * @param allOptions Array of all possible option values
 * @returns Object with keys as option values and boolean values indicating selection
 */
export function selectedArrayToObject<T extends string>(
  selectedValues: string[], 
  allOptions: T[]
): Record<T, boolean> {
  const result = {} as Record<T, boolean>;
  
  allOptions.forEach(option => {
    result[option as T] = selectedValues.includes(option);
  });
  
  return result;
}