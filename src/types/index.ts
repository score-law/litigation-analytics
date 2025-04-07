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
}

// Data types for bail decisions tab
export interface BailDecisionData {
  type: string;
  count: number;
  percentage: number; // Add this field
  averageCost: number;
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
  prosecution_id: number;
  charge_id: number;
  court_id: number;
  charge_severity: number;
  trial_category: 'jury_trial' | 'bench_trial' | 'any';
  
  // Bail-related fields
  total_bail_decisions: number;
  free_bail: number;
  cost_bail: number;
  total_bail_cost: number;
  denied_bail: number;
  
  // Case count fields
  total_case_dispositions: number;
  
  // Disposition-related fields
  aquittals: number;
  dismissals: number;
  not_responsible: number;
  nolle_prosequis: number;
  cwof: number;
  responsible: number;
  guilty_plea: number;
  guilty: number;
  other: number;
  
  // Sentence-related fields
  fee_count: number;
  total_fee: number;
  hoc_count: number;
  total_hoc_days: number;
  probation_count: number;
  probation_days: number;
  license_lost_count: number;
  license_lost_days: number;
  
  // Recent cases JSON field
  recent_cases: string; // JSON string of recent case numbers
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