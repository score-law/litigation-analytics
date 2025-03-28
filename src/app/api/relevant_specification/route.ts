/**
 * Relevant Specification API Route
 * 
 * This endpoint finds the most specific specification with at least 100 total cases.
 * It uses a single SQL query with cascading logic to determine the appropriate level of specificity.
 * 
 * Accepts query parameters:
 * - courtId: Court identifier (0 = all courts)
 * - judgeId: Judge identifier (0 = all judges)
 * - chargeId: Charge identifier (0 = all charges)
 * - prosecutionId: Prosecution identifier (0 = all prosecutions) - not currently used in relevancy logic
 * - chargeSeverity: Charge severity level (0 = all severities) - not currently used in relevancy logic
 * - trialCategory: Trial type (0 = all trial types) - not currently used in relevancy logic
 * 
 * Returns:
 * - specification: The most specific specification with at least 100 total cases
 * - motion_data: Associated motion data for the selected specification
 * - usedParams: Information about which parameters were used in the final selection
 */

//! Deprecated: This API route is no longer used in the application. (for now...)
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/db/connection';
import { ApiMotionData, SpecificationData } from '@/types';

// Minimum number of cases required for a specification to be considered relevant
const MIN_TOTAL_CASES = 100;

export async function GET(request: NextRequest) {
  try {
    // Extract parameters from URL
    const searchParams = request.nextUrl.searchParams;
    const courtId = parseInt(searchParams.get('courtId') || '0', 10);
    const judgeId = parseInt(searchParams.get('judgeId') || '0', 10);
    const chargeId = parseInt(searchParams.get('chargeId') || '0', 10);
    const prosecutionId = parseInt(searchParams.get('prosecutionId') || '0', 10);
    const chargeSeverity = parseInt(searchParams.get('chargeSeverity') || '0', 10);
    const trialCategory = searchParams.get('trialCategory') || 'any';

    console.log('Relevant Specification API - Parameters:');
    console.log('courtId:', courtId);
    console.log('judgeId:', judgeId);
    console.log('chargeId:', chargeId);
    console.log('prosecutionId:', prosecutionId);
    console.log('chargeSeverity:', chargeSeverity);
    console.log('trialCategory:', trialCategory);

    // Query to find the most specific specification with at least MIN_TOTAL_CASES
    const specificationQuery = `
      SELECT * FROM specification 
      WHERE trial_category = 'any' AND (
        (judge_id = ? AND charge_id = ? AND court_id = 0 AND total_cases >= ${MIN_TOTAL_CASES} AND ? > 0 AND ? > 0) OR
        (court_id = ? AND charge_id = ? AND judge_id = 0 AND total_cases >= ${MIN_TOTAL_CASES} AND ? > 0 AND ? > 0) OR
        (charge_id = ? AND court_id = 0 AND judge_id = 0 AND total_cases >= ${MIN_TOTAL_CASES} AND ? > 0) OR
        (judge_id = ? AND charge_id = 0 AND court_id = 0 AND total_cases >= ${MIN_TOTAL_CASES} AND ? > 0) OR
        (court_id = ? AND charge_id = 0 AND judge_id = 0 AND total_cases >= ${MIN_TOTAL_CASES} AND ? > 0) OR
        (court_id = 0 AND charge_id = 0 AND judge_id = 0 AND total_cases >= ${MIN_TOTAL_CASES})
      )
      ORDER BY 
        CASE 
          WHEN judge_id = ? AND charge_id = ? AND court_id = 0 AND ? > 0 AND ? > 0 THEN 1
          WHEN court_id = ? AND charge_id = ? AND judge_id = 0 AND ? > 0 AND ? > 0 THEN 2
          WHEN charge_id = ? AND court_id = 0 AND judge_id = 0 AND ? > 0 THEN 3
          WHEN judge_id = ? AND charge_id = 0 AND court_id = 0 AND ? > 0 THEN 4
          WHEN court_id = ? AND charge_id = 0 AND judge_id = 0 AND ? > 0 THEN 5
          ELSE 6
        END
      LIMIT 1
    `;

    // Parameters for the query, in the order they appear in the SQL
    const specParams = [
      // WHERE conditions
      judgeId, chargeId, judgeId, chargeId,           // JudgeId & chargeId
      courtId, chargeId, courtId, chargeId,           // courtId & chargeId
      chargeId, chargeId,                             // chargeId only
      judgeId, judgeId,                               // judgeId only
      courtId, courtId,                               // courtId only
      // No parameters needed for the last condition (all zeros)
      
      // ORDER BY conditions
      judgeId, chargeId, judgeId, chargeId,           // JudgeId & chargeId
      courtId, chargeId, courtId, chargeId,           // courtId & chargeId
      chargeId, chargeId,                             // chargeId only
      judgeId, judgeId,                               // judgeId only
      courtId, courtId                                // courtId only
    ];
  
    const specificationData = await query<SpecificationData[]>(specificationQuery, specParams);
  
    if (!specificationData || specificationData.length === 0) {
      return NextResponse.json({ 
        error: "No specification with sufficient data found.",
        specification: [], 
        motion_data: [],
        usedParams: { courtId: 0, judgeId: 0, chargeId: 0 }
      }, { status: 404 });
    }
  
    // Determine which parameters were actually used in the selected specification
    const selectedSpec = specificationData[0];
    const usedParams = {
      courtId: selectedSpec.court_id,
      judgeId: selectedSpec.judge_id,
      chargeId: selectedSpec.charge_id
    };
    
    // Get motion data for the selected specification
    const specIds = [selectedSpec.specification_id];
    let motionData: ApiMotionData[] = [];
  
    if (specIds.length > 0) {
      const placeholders = specIds.map(() => '?').join(',');
      const motionQuery = `SELECT * FROM motion_data WHERE specification_id IN (${placeholders})`;
      
      motionData = await query<ApiMotionData[]>(motionQuery, specIds);
    }
  
    // Return the specification, motion data, and used parameters
    return NextResponse.json({
      specification: specificationData,
      motion_data: motionData,
      usedParams
    });
  } catch (error) {
    console.error('Error in relevantSpecification API:', error);
    return NextResponse.json({ 
      error: "Failed to fetch relevant specification data", 
      specification: [], 
      motion_data: [],
      usedParams: { courtId: 0, judgeId: 0, chargeId: 0 }
    }, { status: 500 });
  }
}