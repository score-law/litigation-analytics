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
  const dispositionTypes = [
    { field: 'aquittals', label: 'Acquittal' },
    { field: 'dismissals', label: 'Dismissal' },
    { field: 'nolle_prosequis', label: 'Nolle Prosequi' },
    { field: 'cwof', label: 'CWOF' },
    { field: 'guilty_plea', label: 'Guilty Plea' },
    { field: 'guilty', label: 'Guilty' },
    { field: 'other', label: 'Other' }
  ];

  // Group by trial category and disposition type
  const byTypeAndTrial = dispositionTypes.map(({ field, label }) => {
    // Initialize counts for each trial type
    let bench = 0;
    let jury = 0;
    let none = 0;
    let total = 0;

    // Aggregate counts across all specification records
    rawData.specification.forEach(spec => {
      const value = (spec[field as keyof SpecificationData] as number) || 0;
      
      // Add to the appropriate trial type
      // Ensure type safety when comparing trial_category values
      const trialCategory = spec.trial_category;
      if (trialCategory === 'bench_trial') {
        bench += value;
      } else if (trialCategory === 'jury_trial') {
        jury += value;
      } else if (trialCategory === 'no_trial' || trialCategory === 'any') {
        none += value;
      }
      
      total += value;
    });

    // Return the disposition data object
    return {
      type: label,
      count: total,
      trialTypeBreakdown: {
        bench,
        jury,
        none
      }
    };
  });

  // Filter out types with zero counts and sort by total count (descending)
  return byTypeAndTrial
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count);
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
 * Generates mock API response data that matches the database schema structure.
 * This function generates realistic test data for development and testing purposes.
 * 
 * @returns An ApiResponse object with mock data
 */
