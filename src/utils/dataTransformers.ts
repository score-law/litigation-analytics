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

  console.log('Raw specification data length:', rawData.specification.length);
  console.log('Trial categories present:', rawData.specification.map(spec => spec.trial_category));
  
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
  
  console.log('Trial categories found:', Object.keys(specByCategory));
  
  // If 'any' spec doesn't exist, take the first spec as a fallback
  const baseSpec = anySpec || rawData.specification[0];
  
  // Total charges is our denominator for calculating ratios
  const totalCharges = baseSpec.total_charges_disposed || 0;
  
  console.log('Total charges for ratio calculation:', totalCharges);

  // Calculate total charges disposed for each trial type
  const trialTypeTotals = {
    bench: specByCategory['bench_trial']?.total_charges_disposed || 0,
    jury: specByCategory['jury_trial']?.total_charges_disposed || 0,
    none: specByCategory['no_trial']?.total_charges_disposed || 0
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
  
  // Initialize disposition data array
  const dispositions: DispositionData[] = [];
  
  // Process each disposition type
  dispositionTypes.forEach(({ key, label }) => {
    // Skip if this disposition type doesn't exist in our base spec
    if (!(key in baseSpec)) {
      console.warn(`Disposition key "${key}" not found in specification data`);
      return;
    }
    
    // Calculate the overall ratio of this disposition type
    const ratio = baseSpec[key] / totalCharges;
    
    // Initialize trial type breakdown with zeros
    const trialTypeBreakdown = {
      bench: 0,
      jury: 0,
      none: 0
    };
    
    // Calculate the trial type breakdown
    if (specByCategory['bench_trial'] && specByCategory['bench_trial'][key]) {
      trialTypeBreakdown.bench = trialTypeTotals.bench > 0 ?
        specByCategory['bench_trial'][key] / trialTypeTotals.bench : 0;
    }
    
    if (specByCategory['jury_trial'] && specByCategory['jury_trial'][key]) {
      trialTypeBreakdown.jury = trialTypeTotals.jury > 0 ?
        specByCategory['jury_trial'][key] / trialTypeTotals.jury : 0;
    }
    
    if (specByCategory['no_trial'] && specByCategory['no_trial'][key]) {
      trialTypeBreakdown.none = trialTypeTotals.none > 0 ?
        specByCategory['no_trial'][key] / trialTypeTotals.none : 0;
    }
    
    console.log(`  Final trial type breakdown (normalized by trial type):`, trialTypeBreakdown);
    
    // Add to our dispositions array
    dispositions.push({
      type: label,
      ratio,
      trialTypeBreakdown
    });
  });
  
  console.log(`Generated ${dispositions.length} disposition entries`);
  
  // Sort by ratio in descending order
  return dispositions;
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
    const percentage = totalChargesDisposed > 0 ? (count / totalChargesDisposed) * 100 : 0;
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
  if (!rawData || !rawData.motion_data || rawData.motion_data.length === 0) {
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
  return {
    dispositions: transformDispositionsData(rawData),
    sentences: transformSentencesData(rawData),
    bailDecisions: transformBailData(rawData),
    motions: transformMotionsData(rawData)
  };
}
