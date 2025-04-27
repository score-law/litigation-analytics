import { RowDataPacket } from 'mysql2';

export interface Court {
  id: number;
  name: string;
}

export interface Judge {
  id: number;
  name: string;
  court_id?: number;
}

export interface Charge {
  id: number;
  name: string;
  severity: number;
  description?: string;
}

export interface ChargeGroup {
  id: number;
  name: string;
  type: 'title' | 'chapter';
}

// Data types for dispositions tab
export interface DispositionData {
  type: string;
  ratio: number;
  count?: number; // Total count across all trial types
  trialTypeBreakdown: {
    bench: number;
    jury: number;
    none: number;
  };
  trialTypeCounts?: {
    bench: number;
    jury: number;
    none: number;
  };
}

// Data types for sentences tab
export interface SentenceData {
  type: string;
  percentage: number;
  averageDays: number;
  averageCost: number;
  count: number;
  sentenceBuckets?: Array<{
    label: string;
    count: number;
    percentage?: number;
  }>;
}

// Data types for bail decisions tab
export interface BailDecisionData {
  type: string;
  count: number;
  percentage: number;
  averageCost: number;
  // Add bail buckets data
  bailBuckets?: {
    amount: string;     // e.g. "$500", "$1,000", etc.
    count: number;      // Number of cases with this bail amount
    percentage?: number; // Percentage of total bail cases
  }[];
}

export interface MotionData {
  type: string;
  count: number;
  status: {
    granted: number;
    denied: number;
    other: number;
  };
  partyFiled: {
    granted: number;
    denied: number;
    other: number;
  };
  comparativeRatios?: {
    overall: number;
    prosecution: number;
    defense: number;
  };
}

export type SelectionType = 'Courts' | 'Judges' | 'Charges' | 'Charge Groups';

export interface SearchResultItem {
  id: number;
  name: string;
  total_case_dispositions: number;
  type?: SelectionType; // Optional type for charge groups
}

export interface Selection {
  value: SearchResultItem;
  type: SelectionType;
  selected?: boolean;
}

// Possible charge groupings
export type chargeGroup = 'charge' | 'chapter' | 'title'

// View mode type for toggling between objective and comparative views
export type ViewMode = 'objective' | 'comparative';

// Overall search result data type
export interface SearchResultData {
  dispositions: DispositionData[];
  sentences: SentenceData[];
  bailDecisions: BailDecisionData[];
  motions: MotionData[];
}

/**
 * API Response Types
 * These types match the database schema and are used for type-checking API responses.
 */

// Specification table data type
export interface SpecificationData extends RowDataPacket {
  specification_id: number;
  judge_id: number;
  charge_id: number;
  court_id: number;
  trial_category: 'jury_trial' | 'bench_trial' | 'any';
  
  // Case count fields
  total_case_dispositions: number;
  
  // Disposition-related fields
  aquittals: number;
  dismissals: number;
  conditional_dismissals: number;
  dismissed_lack_of_prosecution: number;
  no_probable_cause: number;
  not_responsible: number;
  nolle_prosequis: number;
  cwof: number;
  responsible: number;
  guilty_file: number;
  guilty_plea: number;
  guilty: number;
  other: number;
  
  // Sentence-related fields
  fine_count: number;
  total_fine: number;
  fine_50: number;
  fine_100: number;
  fine_200: number;
  fine_300: number;
  fine_500: number;
  fine_1000: number;
  fine_2000: number;
  fine_3000: number;
  fine_4000: number;
  fine_5000: number;
  fine_5000_plus: number;

  fee_count: number;
  total_fee: number;
  fee_50: number;
  fee_100: number;
  fee_200: number;
  fee_300: number;
  fee_500: number;
  fee_1000: number;
  fee_2000: number;
  fee_3000: number;
  fee_4000: number;
  fee_5000: number;
  fee_5000_plus: number;

  hoc_count: number;
  total_hoc_days: number;
  hoc_1: number;
  hoc_2: number;
  hoc_3: number;
  hoc_4: number;
  hoc_6: number;
  hoc_8: number;
  hoc_10: number;
  hoc_12: number;
  hoc_15: number;
  hoc_18: number;
  hoc_21: number;
  hoc_24: number;
  hoc_24_plus: number;

  probation_count: number;
  probation_days: number;
  probation_1: number;
  probation_2: number;
  probation_3: number;
  probation_4: number;
  probation_6: number;
  probation_8: number;
  probation_10: number;
  probation_12: number;
  probation_15: number;
  probation_18: number;
  probation_21: number;
  probation_24: number;
  probation_24_plus: number;

  license_lost_count: number;
  license_lost_days: number;
  license_lost_1: number;
  license_lost_2: number;
  license_lost_3: number;
  license_lost_4: number;
  license_lost_6: number;
  license_lost_8: number;
  license_lost_10: number;
  license_lost_12: number;
  license_lost_15: number;
  license_lost_18: number;
  license_lost_21: number;
  license_lost_24: number;
  license_lost_24_plus: number;
    
  // Bail-related fields
  total_bail_decisions: number;
  free_bail: number;
  cost_bail: number;
  total_bail_cost: number;
  denied_bail: number;
  bail_500: number;
  bail_1000: number;
  bail_2000: number;
  bail_3000: number;
  bail_5000: number;
  bail_10000: number;
  bail_15000: number;
  bail_20000: number;
  bail_30000: number;
  bail_40000: number;
  bail_50000: number;
  bail_50000_plus: number;
}

// Motion data table type
export interface MotionTableData {
  specification_id: number;
  motion_id: string;
  accepted: number;
  no_action: number;
  advisement: number;
  denied: number;
  unknown: number;
}

export interface ApiMotionData extends RowDataPacket {
  motion_id: string;
  party: string;
  accepted?: number;
  denied?: number;
  no_action?: number;
  advisement?: number;
  unknown?: number;
}

export interface ApiResponse {
  specification: SpecificationData[];
  motion_data: ApiMotionData[];
}