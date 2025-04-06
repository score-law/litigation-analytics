import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/db/connection';
import { ApiResponse, SpecificationData, ApiMotionData } from '@/types';

/**
 * API route to fetch specification and motion data
 * 
 * Accepts query parameters:
 * - courtId: Court identifier (0 = all courts)
 * - judgeId: Judge identifier (0 = all judges)
 * - chargeId: Comma-separated list of charge IDs (uses first one, 0 = all charges)
 * - prosecutionId: Prosecution identifier (0 = all prosecutions)
 * - chargeSeverity: Charge severity level (0 = all severities)
 * - trialCategory: Trial type (0 = all trial types)
 */
export async function GET(request: NextRequest) {
    try {
      const searchParams = request.nextUrl.searchParams;
      const courtId = parseInt(searchParams.get('courtId') || '0', 10);
      const judgeId = parseInt(searchParams.get('judgeId') || '0', 10);
      const chargeId = parseInt(searchParams.get('chargeId') || '0', 10);

      console.log('courtId:', courtId);
      console.log('judgeId:', judgeId);
      console.log('chargeId:', chargeId);

      let specificationQuery;
      let specParams;
      if (chargeId != 0) {
        specificationQuery = `
        SELECT * FROM specification
        WHERE
          court_id = ? AND
          judge_id = ? AND
          charge_id = ?
        `;
  
        specParams = [
          courtId,
          judgeId,
          chargeId,
        ];
      } else {
        specificationQuery = `
        SELECT * FROM specification
        WHERE
          court_id = ? AND
          judge_id = ? AND
          charge_id = 0
        `;
  
        specParams = [
          courtId,
          judgeId
        ];
      }

      const specificationData = await query<SpecificationData[]>(specificationQuery, specParams);

      if (!specificationData || specificationData.length === 0) {
        return NextResponse.json({ specification: [], motion_data: [] });
      }
      
      // Find the 'any' category specification for motion data
      const anySpecification = specificationData.find(spec => spec.trial_category === 'any');
      const specIds = anySpecification ? [anySpecification.specification_id] : [specificationData[0].specification_id];
      
      console.log('Using specification IDs for motion data:', specIds);
  
      let motionData: ApiMotionData[] = [];
  
      if (specIds.length > 0) {
        const placeholders = specIds.map(() => '?').join(',');
        const motionQuery = `SELECT * FROM motion_data WHERE specification_id IN (${placeholders})`;
        motionData = await query<ApiMotionData[]>(motionQuery, specIds);
      }
      
      console.log('Motion data count:', motionData.length);
      
      const apiResponse: ApiResponse = {
        specification: specificationData,
        motion_data: motionData
      };
  
      return NextResponse.json(apiResponse);
    } catch (error) {
      console.error('Error processing specification request:', error);
      return NextResponse.json(
        { error: 'Failed to fetch specification data' },
        { status: 500 }
      );
    }
}