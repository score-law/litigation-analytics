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
} from '@/types';


/**
 * Transforms raw disposition data from the database into the format expected by the DispositionsTab component.
 * Handles multiple specification records with different trial categories.
 * 
 * @param rawData - The raw API response data
 * @returns An array of DispositionData objects
 */
export function transformDispositionsData(rawData: ApiResponse): DispositionData[] {
  if (!rawData || !rawData.specification || rawData.specification.length === 0) {
    console.warn('No specification data available for dispositions transformation');
    return [];
  }
  
  // Get the 'any' category specification for total counts
  const anySpec = rawData.specification.find(spec => spec.trial_category === 'any');
  
  if (!anySpec) {
    console.warn('No "any" category specification found, results may be incomplete');
  }
  
  // Group specifications by trial category
  const specByCategory: Record<string, SpecificationData> = {};
  
  rawData.specification.forEach(spec => {
    specByCategory[spec.trial_category] = spec;
  });
  
  // If 'any' spec doesn't exist, take the first spec as a fallback
  const baseSpec = anySpec || rawData.specification[0];
  
  // Total charges is our denominator for calculating ratios
  const totalCharges = baseSpec.total_charges_disposed || 0;

  // Calculate total charges disposed for each trial type
  const trialTypeTotals = {
    bench: specByCategory['bench_trial']?.total_charges_disposed || 0,
    jury: specByCategory['jury_trial']?.total_charges_disposed || 0
  };
  
  console.log('Trial type totals:', trialTypeTotals);
  
  // If totalCharges is 0, we can't calculate ratios
  if (totalCharges === 0) {
    console.warn('Total charges is zero, unable to calculate disposition ratios');
    return [];
  }
  
  // Define disposition types to extract
  const dispositionTypes = [
    { key: 'aquittals', label: 'Acquittal' },
    { key: 'dismissals', label: 'Dismissal' },
    { key: 'not_responsible', label: 'Not Responsible' },
    { key: 'nolle_prosequis', label: 'Nolle Prosequi' },
    { key: 'cwof', label: 'CWOF' },
    { key: 'responsible', label: 'Responsible' },
    { key: 'guilty_plea', label: 'Guilty Plea' },
    { key: 'guilty', label: 'Guilty' },
  ];
  
  // Process each disposition type
  return dispositionTypes.map(({ key, label }) => {
    // Get total count for this disposition type
    const count = baseSpec[key] || 0;
    
    // Calculate ratio of this disposition type to total
    const ratio = totalCharges > 0 ? count / totalCharges : 0;
    
    // Calculate trial type counts and ratios
    const trialTypeCounts = {
      bench: specByCategory['bench_trial']?.[key] || 0,
      jury: specByCategory['jury_trial']?.[key] || 0,
      none: count - (specByCategory['bench_trial']?.[key] || 0) - (specByCategory['jury_trial']?.[key] || 0)
    };

    // Calculate trial type ratios
    const trialTypeBreakdown = {
      bench: trialTypeTotals.bench > 0 ? trialTypeCounts.bench / trialTypeTotals.bench : 0,
      jury: trialTypeTotals.jury > 0 ? trialTypeCounts.jury / trialTypeTotals.jury : 0,
      none: totalCharges - trialTypeTotals.bench - trialTypeTotals.jury > 0 
        ? trialTypeCounts.none / (totalCharges - trialTypeTotals.bench - trialTypeTotals.jury) 
        : 0
    };
    
    return {
      type: label,
      ratio,
      count, // Add the total count
      trialTypeBreakdown,
      trialTypeCounts // Add the trial type counts
    };
  });
}

/**
 * Transforms raw sentence data from the database into the format expected by the SentencesTab component.
 * 
 * @param rawData - The raw API response data
 * @returns An array of SentenceData objects
 */
export function transformSentencesData(rawData: ApiResponse): SentenceData[] {
  if (!rawData || !rawData.specification || rawData.specification.length === 0) {
    console.warn('No specification data available for sentences transformation');
    return [];
  }

  // Define sentence types with their corresponding database fields
  const sentenceTypes = [
    { 
      type: 'License\nSuspension',
      countField: 'license_lost_count',
      totalField: null,
      daysField: 'total_license_lost_days',
    },
    { 
      type: 'Fine',
      countField: 'fee_count',
      totalField: 'total_fee',
      daysField: null,
    },
    { 
      type: 'Probation',
      countField: 'probation_count',
      totalField: null,
      daysField: 'total_probation_days',
    },
    { 
      type: 'Incarceration',
      countField: 'hoc_count',
      totalField: null,
      daysField: 'total_hoc_days',
    },
  ];

  // Calculate the total number of cases
  const totalChargesDisposed = rawData.specification.reduce((sum, spec) => sum + spec.total_charges_disposed, 0);

  // Transform each sentence type
  return sentenceTypes.map(sentenceType => {
    // Get the specification with all data
    const spec = rawData.specification.find(s => s.trial_category === 'any') || rawData.specification[0];
    
    // Get the count for this sentence type
    const count = spec[sentenceType.countField] || 0;
    
    // Calculate percentage
    const percentage = totalChargesDisposed > 0 ? (count / totalChargesDisposed) * 100 : 0;
    
    // Calculate average days or cost
    let averageDays = 0;
    let averageCost = 0;
    
    if (sentenceType.daysField && count > 0) {
      averageDays = spec[sentenceType.daysField] / count;
    }
    
    if (sentenceType.totalField && count > 0) {
      averageCost = spec[sentenceType.totalField] / count;
    }
    
    return {
      type: sentenceType.type,
      percentage,
      averageDays,
      averageCost,
      count // Include the count in the returned object
    };
  });
}

// File: src/utils/dataTransformers.ts
export function transformBailData(rawData: ApiResponse): BailDecisionData[] {
  if (!rawData || !rawData.specification || rawData.specification.length === 0) {
    console.warn('No bail data available for sentences transformation');
    return [];
  }

  // Define bail decision types with their corresponding database fields
  const bailTypes = [
    { type: 'Personal\nRecognizance', countField: 'free_bail', costField: null },
    { type: 'Cash Bail', countField: 'cost_bail', costField: 'total_bail_cost' },
    { type: 'Denied', countField: 'denied_bail', costField: null }
  ];

  // Calculate total bail decisions for percentage calculation
  let totalBailDecisions = 0;
  rawData.specification.forEach(spec => {
    totalBailDecisions += (spec.free_bail || 0) + (spec.cost_bail || 0) + (spec.denied_bail || 0);
  });

  // Transform each bail type
  return bailTypes.map(({ type, countField, costField }) => {
    // Calculate total count and cost
    let count = 0;
    let totalCost = 0;

    rawData.specification.forEach(spec => {
      count += spec[countField] || 0;
      if (costField) {
        totalCost += spec[costField] || 0;
      }
    });

    // Calculate percentage and average cost
    const percentage = totalBailDecisions > 0 ? (count / totalBailDecisions) * 100 : 0;
    const averageCost = count > 0 && costField ? totalCost / count : 0;

    return {
      type,
      count,
      percentage,
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
  if (!rawData || !rawData.motion_data || rawData.motion_data.length === 0) {
    console.warn('No motion data available for motions transformation');
    return [];
  }
  
  // Map to store motion data grouped by motion_id
  const motionMap: Record<string, MotionData> = {};
  
  // Process each motion record
  rawData.motion_data.forEach(motion => {
    // Create a new entry in the map if it doesn't exist
    if (!motionMap[motion.motion_id]) {
      motionMap[motion.motion_id] = {
        type: motion.motion_id,
        count: 0,
        status: {
          granted: 0,
          denied: 0,
          other: 0
        },
        partyFiled: {
          granted: 0,
          denied: 0,
          other: 0
        }
      };
    }
    
    // Update total counts for status (all parties)
    motionMap[motion.motion_id].status.granted += motion.accepted || 0;
    motionMap[motion.motion_id].status.denied += motion.denied || 0;
    motionMap[motion.motion_id].status.other += 
      (motion.no_action || 0) + 
      (motion.advisement || 0) + 
      (motion.unknown || 0);
    
    // Update total count
    motionMap[motion.motion_id].count += 
      (motion.accepted || 0) + 
      (motion.denied || 0) + 
      (motion.no_action || 0) + 
      (motion.advisement || 0) + 
      (motion.unknown || 0);
    
    // Update prosecution-specific counts (commonwealth = prosecution)
    if (motion.party === 'commonwealth') {
      motionMap[motion.motion_id].partyFiled.granted += motion.accepted || 0;
      motionMap[motion.motion_id].partyFiled.denied += motion.denied || 0;
      motionMap[motion.motion_id].partyFiled.other += 
        (motion.no_action || 0) + 
        (motion.advisement || 0) + 
        (motion.unknown || 0);
    }
  });
  
  // Convert map to array
  return Object.values(motionMap);
}

/**
 * Transforms the complete API response data into the format expected by the Results page.
 * 
 * @param rawData - The raw API response data
 * @returns A SearchResultData object containing all transformed data
 */
export function transformApiResponseToSearchResultData(rawData: ApiResponse): SearchResultData {
  // Validate the raw data at the highest level
  if (!rawData || !rawData.specification || rawData.specification.length === 0) {
    console.warn('Empty or invalid API response data');
    return {
      dispositions: [],
      sentences: [],
      bailDecisions: [],
      motions: []
    };
  }

  return {
    dispositions: transformDispositionsData(rawData),
    sentences: transformSentencesData(rawData),
    bailDecisions: transformBailData(rawData),
    motions: transformMotionsData(rawData)
  };
}
